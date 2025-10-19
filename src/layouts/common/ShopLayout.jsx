import { Outlet } from "react-router-dom";

const ShopLayout = () => {
  return (
    <div className="flex flex-col gap-4">
      <Outlet />
    </div>
  );
};

export default ShopLayout;
