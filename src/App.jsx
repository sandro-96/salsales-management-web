// src/App.jsx
import { Routes, Route, useLocation } from "react-router-dom";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { routeConfig } from "./routes/routeConfig.jsx";
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestOnlyRoute from "./routes/GuestOnlyRoute";
import RoleBasedRoute from "./routes/RoleBasedRoute";
import ShopPermissionRoute from "./routes/ShopPermissionRoute.jsx";
import AdminPermissionRoute from "./routes/AdminPermissionRoute.jsx";
import RouteWithTitle from "./routes/RouteWithTitle";
import Loading from "./components/loading/Loading.jsx";
import ErrorBoundaryWithNavigate from "./components/ErrorBoundary";
import BranchFormModal from "./pages/branchs/BranchFormModal.jsx";
import { Toaster } from "@/components/ui/sonner";
import NetworkStatusBanner from "@/components/common/NetworkStatusBanner.jsx";
import { useGlobalJsonLd } from "@/hooks/useGlobalJsonLd.js";

function renderRoute(route) {
  let element = (
    <RouteWithTitle
      element={route.element}
      title={route.title}
      titleKey={route.titleKey}
      seoKey={route.seoKey}
      seoPath={route.seoPath}
      noIndex={Boolean(route.protected || route.seoNoIndex)}
    />
  );

  if (
    route.shopPermission ||
    route.shopPermissionAny ||
    route.shopPermissionAll
  ) {
    element = (
      <ShopPermissionRoute
        permission={route.shopPermission}
        any={route.shopPermissionAny}
        all={route.shopPermissionAll}
      >
        {element}
      </ShopPermissionRoute>
    );
  }

  if (
    route.adminPermission ||
    route.adminPermissionAny ||
    route.adminPermissionAll
  ) {
    element = (
      <AdminPermissionRoute
        permission={route.adminPermission}
        any={route.adminPermissionAny}
        all={route.adminPermissionAll}
      >
        {element}
      </AdminPermissionRoute>
    );
  }

  if (route.guestOnly) {
    element = <GuestOnlyRoute>{element}</GuestOnlyRoute>;
  }

  if (route.protected && !route.authGuardHandledByParent) {
    element = (
      <ProtectedRoute guestRedirect={route.guestRedirect}>
        {route.roles ? (
          <RoleBasedRoute allowedRoles={route.roles}>{element}</RoleBasedRoute>
        ) : (
          element
        )}
      </ProtectedRoute>
    );
  }

  if (route.children) {
    const parentHadAuthGuard = Boolean(route.protected || route.guestOnly);
    return (
      <Route key={route.path} path={route.path} element={element}>
        {route.children.map((child, i) =>
          renderRoute({
            ...child,
            path: child.path,
            key: `${route.path}-${child.path || i}`,
            protected: child.protected ?? route.protected,
            guestRedirect: child.guestRedirect ?? route.guestRedirect,
            authGuardHandledByParent: parentHadAuthGuard,
          })
        )}
      </Route>
    );
  }

  return <Route key={route.path} path={route.path} element={element} />;
}

function App() {
  const location = useLocation();
  const { t } = useTranslation();
  const state = location.state;
  useGlobalJsonLd();
  return (
    <ErrorBoundaryWithNavigate>
      <Suspense fallback={<Loading text={t("common.loadingPage")} />}>
        <Toaster />
        <NetworkStatusBanner />
        <Routes location={state?.background || location}>
          {routeConfig.map(renderRoute)}
        </Routes>
        {/* {state?.background && (
          <Routes>
            <Route path="/branches/new" element={<BranchFormModal />} />
          </Routes>
        )} */}
      </Suspense>
    </ErrorBoundaryWithNavigate>
  );
}

export default App;
