import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { tokens } from "../theme/theme";
import { timeAgo } from "../utils/formatters";

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function ChangePill({ value, soft = true, sx }) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return (
      <Box component="span" sx={{ color: "text.secondary", ...sx }}>
        —
      </Box>
    );
  }
  const up = value >= 0;
  const color = up ? tokens.up : tokens.down;
  const Arrow = up ? ArrowDropUpIcon : ArrowDropDownIcon;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        color,
        fontWeight: 700,
        whiteSpace: "nowrap",
        ...(soft && { pl: 0.25, pr: 0.9, py: 0.2, borderRadius: 99, bgcolor: alpha(color, 0.14) }),
        ...sx,
      }}
    >
      <Arrow sx={{ fontSize: "1.45em", my: "-0.3em" }} />
      {Math.abs(Number(value)).toFixed(2)}%
    </Box>
  );
}

export function IconBadge({ color = tokens.gold, size = 38, children }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "12px",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        color,
        bgcolor: alpha(color, 0.12),
        border: `1px solid ${alpha(color, 0.25)}`,
        "& svg": { fontSize: size * 0.52 },
      }}
    >
      {children}
    </Box>
  );
}

export function SectionTitle({ eyebrow, title, subtitle, action }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: { xs: "flex-start", sm: "flex-end" },
        justifyContent: "space-between",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        mb: 2.5,
      }}
    >
      <Box>
        {eyebrow && (
          <Typography variant="overline" sx={{ color: "primary.main", display: "block" }}>
            {eyebrow}
          </Typography>
        )}
        <Typography variant="h4" sx={{ fontSize: { xs: "1.6rem", md: "2rem" } }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 620 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
  );
}

export function CardTitle({ icon, color = tokens.gold, title, info, action }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1.25, mb: 2 }}>
      <IconBadge color={color} size={32}>
        {icon}
      </IconBadge>
      <Typography variant="h6" sx={{ flex: "1 1 auto", fontSize: "1.1rem" }}>
        {title}
      </Typography>
      {action}
      {info && <InfoTip heading={title} title={info} />}
    </Box>
  );
}

export const LiveDot = () => <span className="live-dot" aria-hidden="true" />;

export function TimeAgo({ date, prefix = "" }) {
  const [, rerender] = useState(0);
  useEffect(() => {
    const id = setInterval(() => rerender((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, []);
  if (!date) return null;
  return (
    <span title={new Date(date).toLocaleString()}>
      {prefix}
      {timeAgo(date)}
    </span>
  );
}

// "i" button that explains a metric on hover, keyboard focus or tap.
export function InfoTip({ title, heading }) {
  const body = heading ? (
    <Box sx={{ maxWidth: 260 }}>
      <Typography variant="subtitle2" sx={{ color: "primary.main", mb: 0.5 }}>
        {heading}
      </Typography>
      <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
        {title}
      </Typography>
    </Box>
  ) : (
    title
  );
  return (
    <Tooltip title={body} placement="top" enterTouchDelay={0} leaveTouchDelay={4000}>
      <Box
        component="button"
        type="button"
        aria-label={heading || (typeof title === "string" ? title : "More info")}
        onClick={(event) => event.stopPropagation()}
        sx={{
          display: "inline-grid",
          placeItems: "center",
          position: "relative",
          zIndex: 1,
          width: 26,
          height: 26,
          p: 0,
          border: 0,
          borderRadius: "50%",
          cursor: "help",
          color: "text.secondary",
          bgcolor: "transparent",
          transition: "color 0.2s, background-color 0.2s, transform 0.2s",
          "&:hover, &:focus-visible": {
            color: "primary.main",
            bgcolor: "rgba(238, 188, 29, 0.12)",
            transform: "scale(1.1)",
            outline: "none",
          },
        }}
      >
        <InfoOutlinedIcon sx={{ fontSize: 16 }} />
      </Box>
    </Tooltip>
  );
}

export function Reveal({ children, delay = 0, sx, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (shown || !ref.current) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <Box
      ref={ref}
      className={`reveal${shown ? " is-visible" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
      sx={sx}
      {...rest}
    >
      {children}
    </Box>
  );
}

// Counts from the previous value to the new one, so refreshes and currency switches glide.
export function AnimatedNumber({ value, format = String, duration = 1000 }) {
  const [display, setDisplay] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    if (value === undefined || value === null || Number.isNaN(Number(value))) return undefined;
    if (reducedMotion()) {
      current.current = value;
      setDisplay(value);
      return undefined;
    }
    const from = current.current;
    const start = performance.now();
    let frame;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      current.current = from + (value - from) * (1 - Math.pow(1 - t, 3));
      setDisplay(current.current);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  if (value === undefined || value === null || Number.isNaN(Number(value))) return "—";
  return format(display);
}

// Two stacked fields with a swap button between them. On swap each field glides into the other's
// place on the page's entry ease, dimming where they cross so their text never clashes.
export function SwapStack({ first, second, label, sx }) {
  const [turns, setTurns] = useState(0);
  const stack = useRef(null);
  const flipped = turns % 2 === 1;

  useLayoutEffect(() => {
    if (!turns || reducedMotion()) return;
    const [top, , bottom] = stack.current.children;
    // ponytail: assumes both fields are the same height (a converter pair is); measure each if they ever differ.
    const gap = bottom.offsetTop - top.offsetTop;
    const slide = (from) => [
      { transform: `translateY(${from}px)`, opacity: 1 },
      { transform: `translateY(${from / 2}px)`, opacity: 0.35 },
      { transform: "none", opacity: 1 },
    ];
    const timing = { duration: 500, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" };
    top.animate?.(slide(gap), timing);
    bottom.animate?.(slide(-gap), timing);
  }, [turns]);

  return (
    <Box ref={stack} sx={sx}>
      {flipped ? second : first}
      <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
        <Tooltip title={label}>
          <IconButton onClick={() => setTurns((count) => count + 1)} sx={{ border: `1px solid ${tokens.line}` }}>
            <SwapVertIcon
              sx={{ transform: `rotate(${turns * 180}deg)`, transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            />
          </IconButton>
        </Tooltip>
      </Box>
      {flipped ? first : second}
    </Box>
  );
}
