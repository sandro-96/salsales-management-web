// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./global.css";
import AuthProvider from "./contexts/AuthProvider.jsx";
import ShopProvider from "./contexts/ShopProvider.jsx";
import WebSocketProvider from "./contexts/WebSocketProvider.jsx";
import AlertDialogProvider from "./contexts/AlertDialogProvider";
import { ThemeProvider } from "./components/theme-provider.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ShopProvider>
            <WebSocketProvider>
              <AlertDialogProvider>
                <App />
              </AlertDialogProvider>
            </WebSocketProvider>
          </ShopProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
