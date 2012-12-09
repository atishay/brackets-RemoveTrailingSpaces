/*
 * Copyright (c) 2012 Atishay Jain. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window, JSHINT */

define(function (require, exports, module) {
    'use strict';

    var Commands                = brackets.getModule("command/Commands"),
        CommandManager          = brackets.getModule("command/CommandManager"),
        EditorManager           = brackets.getModule("editor/EditorManager"),
        DocumentManager         = brackets.getModule("document/DocumentManager"),
        Menus                   = brackets.getModule("command/Menus"),
        PreferencesManager      = brackets.getModule("preferences/PreferencesManager"),
        defaultPreferences      = { checked: false },
        preferencesId           = "RemoveTrailingSpace",
        commandId               = "RemoveTrailingSpace.toggle";

    var _preferences, _command;

    function remove() {
        var messages, result, text, codeMirror, count, i = 0;

        var editor = EditorManager.getCurrentFullEditor();
        if (!editor) {
            return;
        }
        codeMirror = editor._codeMirror;
        count = codeMirror.lineCount();
        //Do not change lines uselessly to prevent additional render. A file level replace is slower.
        for (i = 0; i < count; i++) {
            text = codeMirror.getLine(i);
            if (text.match(/ *$/)) {
                text = text.replace(/ *$/g, "");
                codeMirror.setLine(i, text);
            }
        }
    }


    function refreshRemoval() {
        if (_preferences.getValue("checked")) {
            $(DocumentManager).on("currentDocumentChange documentSaved", remove);
            remove();
        } else {
            $(DocumentManager).off("currentDocumentChange documentSaved", null,  remove);
        }
    }

    function onCommandExecuted() {
        if (!_command.getChecked()) {
            _command.setChecked(true);
        } else {
            _command.setChecked(false);
        }
    }

    function onCheckedStateChange() {
        _preferences.setValue("checked", Boolean(_command.getChecked()));
        refreshRemoval();
    }


    function loadPreferences() {
        _preferences = PreferencesManager.getPreferenceStorage(preferencesId, defaultPreferences);
    }

    function loadCommand() {
        _command = CommandManager.get(commandId);

        if (!_command) {
            _command = CommandManager.register("X Trailing Whitespace", commandId, onCommandExecuted);
        } else {
            _command._commandFn = onCommandExecuted;
        }

        $(_command).on("checkedStateChange", onCheckedStateChange);

        // Apply preferences
        _command.setChecked(_preferences.getValue("checked"));
    }

    function unloadCommand() {
        _command.setChecked(false);
        $(_command).off("checkedStateChange", onCheckedStateChange);
        _command._commandFn = null;
    }


    function loadMenuItem() {
        Menus.getMenu("view-menu").addMenuItem(commandId, "Ctrl-Alt-X");
    }

    function unloadMenuItem() {
        // Not implemented
        // Menus.getMenu("view-menu").removeMenuItem(commandId);
    }


    // Setup the UI
    function load(nomenu) {
        if (nomenu) {
            $(DocumentManager).on("currentDocumentChange documentSaved", remove);
        } else {
            loadPreferences();
            loadCommand();
            loadMenuItem();
        }
    }

    // Tear down the UI
    function unload() {
        unloadMenuItem();
        unloadCommand();
    }


    // --- Exports ---

    exports.load = load;
    exports.unload = unload;


    // --- Initializiation ---

    load();

});