import React from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

function SelectButtons({ value, onChange, options }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, newValue) => newValue && onChange(newValue)}
      size="small"
      sx={{
        flexWrap: "wrap",
        gap: 1,
        "& .MuiToggleButton-root": {
          border: "1px solid rgba(238, 188, 29, 0.3)",
          color: "text.secondary",
          px: 2,
          "&.Mui-selected": {
            bgcolor: "primary.main",
            color: "#0b0e11",
            fontWeight: 700,
            "&:hover": { bgcolor: "primary.light" },
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
