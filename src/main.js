// Vite entry point that emulates the legacy script load order.
// This keeps side effects deterministic while we transition modules to React.
import "./error-handling-basic.js";
import "./theme.js";
import "./test-news.js";

import "../lib/jquery-3.4.1.min.js";
import "../lib/gif.js/gif.js";
import "../lib/pako-2.0.3.min.js";
import "../lib/UPNG.js";
import "../lib/UTIF.js";
import "../lib/bmp.js";
import "./legacy/load-pdfjs.js";
import "./legacy/load-anypalette.js";
import "./legacy/load-filesaver.js";
import "../lib/font-detective.js";
import "../lib/libtess.min.js";
import "../lib/tracky-mouse/core/tracky-mouse.js";
import "../lib/os-gui/parse-theme.js";
import "../lib/os-gui/$Window.js";
import "../lib/os-gui/MenuBar.js";
import "../lib/imagetracer_v1.2.5.js";

import "./app-localization.js";
import "./msgbox.js";
import "./functions.js";
import "./helpers.js";
import "./storage.js";
import "./$Component.js";
import "./$ToolWindow.js";
import "./error-handling-enhanced.js";
import "./$ToolBox.js";
import "./$ColorBox.js";
import "./$FontBox.js";
import "./Handles.js";
import "./OnCanvasObject.js";
import "./OnCanvasSelection.js";
import "./OnCanvasTextBox.js";
import "./OnCanvasHelperLayer.js";
import "./image-manipulation.js";
import "./tool-options.js";
import "./tools.js";
// import "./extra-tools.js"; // legacy optional module retained for reference
import "./color-data.js";
import "./edit-colors.js";
import "./file-format-data.js";
import "./manage-storage.js";
import "./imgur.js";
import "./help.js";
import "./simulate-random-gestures.js";
import "./menus.js";
import "./speech-recognition.js";
import "./eye-gaze-mode.js";
import "./app-state.js";
import "./app.js";
import "./sessions.js";
import "./konami.js";
import "./vaporwave-fun.js";

import "./react/bootstrap-react-root.js";
