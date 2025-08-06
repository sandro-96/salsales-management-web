// src/pages/AlertDemo.jsx
import { useAlert } from "../hooks/useAlert";

const AlertDemo = () => {
  const { showAlert } = useAlert();

  const showAlertWithType = (type) => {
    showAlert({
      title: `Đây là thông báo ${type}`,
      description: `Mô tả cho thông báo ${type}`,
      type,
      variant: "toast",
      position: "top-right",
    });
  };

  const showToastWithPosition = (position) => {
    showAlert({
      title: `Toast tại ${position}`,
      description: "Vị trí hiện alert có thể tùy chỉnh.",
      type: "info",
      duration: 3000,
      variant: "toast",
      position,
    });
  };

  const showModalWithActions = () => {
    showAlert({
      title: "Xác nhận đăng xuất",
      description: "Bạn có chắc muốn đăng xuất khỏi hệ thống?",
      type: "warning",
      variant: "modal",
      actions: [
        {
          label: "Hủy",
          className: "bg-gray-200 text-gray-800",
          onClick: () => console.log("Hủy đăng xuất"),
        },
        {
          label: "Đăng xuất",
          className: "bg-red-500 text-white hover:bg-red-600",
          onClick: () => console.log("Đã đăng xuất"),
        },
      ],
    });
  };

  const showInfoModal = () => {
    showAlert({
      title: "Thông báo quan trọng",
      description: "Bạn đã hoàn thành 100% hồ sơ cá nhân.",
      type: "info",
      variant: "modal",
      actions: [
        {
          label: "Xem hồ sơ",
          className: "bg-blue-500 text-white hover:bg-blue-600",
          to: "/profile",
        },
      ],
    });
  };

  const showPersistentAlert = () => {
    showAlert({
      title: "Thông báo không tự đóng",
      description: "Alert này sẽ không tự biến mất, cần người dùng xử lý.",
      type: "error",
      duration: 0,
      variant: "toast",
      position: "bottom-left",
      actions: [
        {
          label: "Đóng",
          className: "bg-red-500 text-white hover:bg-red-600",
        },
      ],
    });
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-10">
      <h1 className="text-3xl font-bold mb-4">🎯 Hướng dẫn tất cả loại Alert</h1>

      <div>
        <h2 className="text-xl font-semibold mb-2">1. Các kiểu alert (type)</h2>
        <div className="flex gap-3 flex-wrap">
          {["info", "success", "error", "warning"].map((type) => (
            <button
              key={type}
              onClick={() => showAlertWithType(type)}
              className="px-4 py-2 rounded text-white bg-gray-700 hover:bg-gray-800 capitalize"
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">2. Các vị trí toast (position)</h2>
        <div className="flex gap-3 flex-wrap">
          {["top-left", "top-right", "bottom-left", "bottom-right"].map((pos) => (
            <button
              key={pos}
              onClick={() => showToastWithPosition(pos)}
              className="px-4 py-2 rounded bg-teal-600 text-white hover:bg-teal-700 capitalize"
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">3. Modal với action</h2>
        <button
          onClick={showModalWithActions}
          className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
        >
          Hiện modal xác nhận
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">4. Modal đơn giản (1 hành động)</h2>
        <button
          onClick={showInfoModal}
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
        >
          Hiện modal thông báo
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">5. Alert không tự đóng</h2>
        <button
          onClick={showPersistentAlert}
          className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
        >
          Hiện alert cố định
        </button>
      </div>
    </div>
  );
};

export default AlertDemo;
