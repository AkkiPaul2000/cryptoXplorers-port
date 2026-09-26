import React, { useEffect, useState } from "react";
import { subscribeLoading } from "../api/client";

function BrandLoader() {
  const [active, setActive] = useState(false);

  useEffect(() => subscribeLoading((show) => setActive(show)), []);

  return (
    <div
      className={`app-loader${active ? " app-loader--active" : ""}`}
      role="status"
      aria-live="polite"
      aria-hidden={!active}
    />
  );
}

export default BrandLoader;
