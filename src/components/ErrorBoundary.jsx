// src/components/ErrorBoundary.jsx
import { Component } from "react";
import { useNavigate } from "react-router-dom";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error) {
        // Chuyển hướng đến trang lỗi
        const navigate = this.props.navigate;
        navigate("/error", {
            state: {
                error: {
                    status: "Lỗi",
                    message: error.message || "Đã xảy ra lỗi không mong muốn",
                },
            },
        });
    }

    render() {
        if (this.state.hasError) {
            return null; // Navigate sẽ xử lý chuyển hướng
        }
        return this.props.children;
    }
}

// Component wrapper để sử dụng hook useNavigate
const ErrorBoundaryWithNavigate = (props) => {
    const navigate = useNavigate();
    return <ErrorBoundary {...props} navigate={navigate} />;
};

export default ErrorBoundaryWithNavigate;