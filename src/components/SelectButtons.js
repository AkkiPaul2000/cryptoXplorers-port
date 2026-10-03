import React from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { goldGradient, tokens } from "../theme/theme";

function SelectButtons({ value, onChange, options, label = "Options" }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      aria-label={label}
      onChange={(_, next) => next !== null && onChange(next)}
      size="small"
      sx={{
        p: 0.5,
        gap: 0.5,
        // Always one line: scroll sideways on very narrow screens instead of wrapping.
        flexWrap: "nowrap",
        maxWidth: "100%",
        overflowX: "auto",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
        borderRadius: 99,
        bgcolor: "rgba(148, 163, 184, 0.07)",
        border: `1px solid ${tokens.line}`,
        "& .MuiToggleButtonGroup-grouped": {
          m: 0,
          border: 0,
          borderRadius: "99px !important",
          px: { xs: 1.25, sm: 1.75 },
          py: 0.5,
          flexShrink: 0,
          whiteSpace: "nowrap",
          color: "text.secondary",
          fontWeight: 600,
          transition: "color 0.25s, background 0.25s, box-shadow 0.25s",
          "&:hover": { color: "text.primary", bgcolor: "rgba(148, 163, 184, 0.1)" },
          "&.Mui-selected, &.Mui-selected:hover": {
            color: tokens.ink,
            background: goldGradient,
            boxShadow: "0 6px 16px -8px rgba(238, 188, 29, 0.8)",
          },
        },
      }}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

export default SelectButtons;
