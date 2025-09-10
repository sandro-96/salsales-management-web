// src/routes/RouteWithTitle.jsx
import { useEffect } from "react";

const RouteWithTitle = ({ element, title }) => {
  console.log("RouteWithTitle rendered with title:", title);
  useEffect(() => {
    if (title) {
      console.log("Setting document title to:", `${title} | Sales System`);
      document.title = `${title} | Sales System`;
    }
  }, [title]);

  return <>{element}</>;
};

export default RouteWithTitle;
