// src/routes/RouteWithTitle.jsx
import { useEffect } from "react";

const RouteWithTitle = ({ element, title }) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} | Sales System`;
    }
  }, [title]);

  return <>{element}</>;
};

export default RouteWithTitle;
