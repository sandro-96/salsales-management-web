// src/components/LoadingOverlay.jsx
import { FaSpinner } from "react-icons/fa";

const LoadingOverlay = ({ text = "Đang xử lý..." }) => {
    return (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center z-50">
            <FaSpinner className="animate-spin text-white text-4xl mb-3" />
            <p className="text-white font-medium">{text}</p>
        </div>
    );
};

export default LoadingOverlay;
