import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

function PageFade({ children }) {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return undefined;
    }
    // Wait a beat so the target section has mounted after a route change.
    const id = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 80);
    return () => clearTimeout(id);
  }, [pathname, hash, key]);

  return (
    <div key={pathname} className="page-fade">
      {children}
    </div>
  );
}

export default PageFade;
