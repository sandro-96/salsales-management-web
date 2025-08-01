// src/App.jsx
import { Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { routeConfig } from "./routes/routeConfig.jsx";
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestOnlyRoute from "./routes/GuestOnlyRoute";
import RoleBasedRoute from "./routes/RoleBasedRoute";
import RouteWithTitle from "./routes/RouteWithTitle";

function renderRoute(route) {
    let element = <RouteWithTitle element={route.element} title={route.title} />;

    if (route.guestOnly) {
        element = <GuestOnlyRoute>{element}</GuestOnlyRoute>;
    }

    if (route.protected) {
        element = (
            <ProtectedRoute>
                {route.roles ? (
                    <RoleBasedRoute allowedRoles={route.roles}>
                        {element}
                    </RoleBasedRoute>
                ) : (
                    element
                )}
            </ProtectedRoute>
        );
    }

    if (route.children) {
        return (
            <Route key={route.path} path={route.path} element={element}>
                {route.children.map((child, i) =>
                    renderRoute({
                        ...child,
                        path: child.path,
                        key: `${route.path}-${child.path || i}`,
                    })
                )}
            </Route>
        );
    }

    return <Route key={route.path} path={route.path} element={element} />;
}

function App() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Đang tải trang...</div>}>
            <Routes>{routeConfig.map(renderRoute)}</Routes>
        </Suspense>
    );
}

export default App;

