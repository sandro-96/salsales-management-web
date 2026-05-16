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
    const navigate = this.props.navigate;
    navigate("/error", {
      replace: true,
      state: {
        error: {
          kind: "boundary",
          message: error?.message || undefined,
          stack: import.meta.env.DEV ? error?.stack : undefined,
        },
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

const ErrorBoundaryWithNavigate = (props) => {
  const navigate = useNavigate();
  return <ErrorBoundary {...props} navigate={navigate} />;
};

export default ErrorBoundaryWithNavigate;
