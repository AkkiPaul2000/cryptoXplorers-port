import React from "react";

function Sparkline({ prices = [], width = 92, height = 32 }) {
  if (prices.length < 2) return null;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const points = prices
    .map((price, index) => {
      const x = (index / (prices.length - 1)) * width;
      const y = height - ((price - min) / span) * (height - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");
  const rising = prices[prices.length - 1] >= prices[0];

  return (
    <svg width={width} height={height} aria-hidden="true">
      <polyline
        fill="none"
        stroke={rising ? "#0ecb81" : "#f6465d"}
        strokeWidth="1.6"
        points={points}
      />
    </svg>
  );
}

export default Sparkline;
