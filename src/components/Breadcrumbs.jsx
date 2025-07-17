// src/components/Breadcrumbs.jsx
import { Link } from "react-router-dom";
import { useBreadcrumbs } from "../hooks/useBreadcrumbs";

const Breadcrumbs = () => {
    const breadcrumbs = useBreadcrumbs();

    if (breadcrumbs.length <= 1) return null; // Ẩn nếu chỉ có 1 cấp

    return (
        <nav className="text-sm text-gray-600 mb-4">
            {breadcrumbs.map((bc, i) => (
                <span key={bc.path}>
          {i > 0 && <span className="mx-1">/</span>}
                    <Link to={bc.path} className="hover:underline text-blue-600">
            {bc.title}
          </Link>
        </span>
            ))}
        </nav>
    );
};

export default Breadcrumbs;
