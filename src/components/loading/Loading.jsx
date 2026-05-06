// src/components/Loading.jsx
import { FaSpinner } from "react-icons/fa";

const Loading = ({ text = "Đang tải...", fullScreen = false }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center h-full ${
        fullScreen ? "min-h-screen" : "py-6"
      }`}
    >
      <FaSpinner className="animate-spin text-blue-500 dark:text-blue-400 text-4xl mb-3" />
      <p className="text-foreground font-medium">{text}</p>
    </div>
  );
};

export default Loading;
