// src/components/LoadingOverlay.jsx
import { FaSpinner } from "react-icons/fa";

const LoadingOverlay = ({ text = "Đang xử lý..." }) => {
  return (
    <div className="absolute inset-0 bg-black opacity-10 flex flex-col items-center justify-center z-50 lg:rounded-lg">
      <FaSpinner className="animate-spin text-blue-950 text-4xl mb-3" />
      <p className="text-blue-950 font-medium">{text}</p>
    </div>
  );
};

export default LoadingOverlay;
