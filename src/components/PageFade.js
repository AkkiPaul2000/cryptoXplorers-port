import React from "react";
import { useLocation } from "react-router-dom";

function PageFade({ children }) {
  const location = useLocation();

  return (
    <div key={location.pathname} className="page-fade">
      {children}
    </div>
  );
}

export default PageFade;
