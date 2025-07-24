// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import AuthProvider from "./contexts/AuthProvider.jsx";
import ShopProvider from "./contexts/ShopProvider.jsx";
import WebSocketProvider from "./contexts/WebSocketProvider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                 <ShopProvider>
                     <WebSocketProvider>
                         <App />
                     </WebSocketProvider>
                 </ShopProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
