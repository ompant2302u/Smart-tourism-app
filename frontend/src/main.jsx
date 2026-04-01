import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// StrictMode is intentionally removed: the ElevenLabs SDK uses WebSocket refs
// that are incompatible with StrictMode's double-effect behaviour in dev mode.

// Patch WebSocket.prototype.send to silently drop sends on CLOSING/CLOSED sockets.
// The ElevenLabs SDK calls sendMessage() after endSession() (e.g. client tool results
// arriving in-flight), which causes "WebSocket is already in CLOSING or CLOSED state".
const _nativeSend = WebSocket.prototype.send;
WebSocket.prototype.send = function (data) {
  if (this.readyState === WebSocket.OPEN) {
    _nativeSend.call(this, data);
  }
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
