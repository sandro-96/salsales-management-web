import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Loading from "@/components/loading/Loading.jsx";

/**
 * Suspense quanh Outlet: lazy route chỉ loading trong vùng nội dung, giữ sidebar/header.
 */
const RouteOutletSuspense = () => (
  <Suspense fallback={<Loading />}>
    <Outlet />
  </Suspense>
);

export default RouteOutletSuspense;
