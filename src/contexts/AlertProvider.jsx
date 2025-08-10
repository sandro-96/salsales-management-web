// src/contexts/AlertProvider.jsx
import { useCallback, useRef, useState } from "react";
import AlertContext from "./AlertContext";
import Alert from "../components/common/Alert";

const AlertProvider = ({ children }) => {
    const [alert, setAlert] = useState(null);
    const timeoutRef = useRef(null);

    const showAlert = useCallback(
        ({
            title,
            description,
            type = "info",
            duration = 3000,
            children = null,
            actions = [],
            variant = "toast",
            icon = null,
            position = "bottom-right",
        }) => {
            clearTimeout(timeoutRef.current);

            setAlert({ title, description, type, actions, children, variant, icon, position });

            if (variant === "toast" && duration !== 0) {
                timeoutRef.current = setTimeout(() => {
                    setAlert(null);
                }, duration);
            }
        },
        []
    );

    const hideAlert = useCallback(() => {
        clearTimeout(timeoutRef.current);
        setAlert(null);
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {alert && <Alert {...alert} onClose={hideAlert} />}
        </AlertContext.Provider>
    );
};

export default AlertProvider;
