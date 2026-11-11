"use client";

import type { ReactNode } from "react";
import Chip from "@mui/material/Chip";
import type { Tone } from "@/lib/labels";

const TONE_STYLES: Record<Tone, { backgroundColor: string; color: string }> = {
  success: { backgroundColor: "#E8F5E9", color: "#1E8E3E" },
  warning: { backgroundColor: "#FFF3E0", color: "#B26A00" },
  error: { backgroundColor: "#FDECEA", color: "#C62828" },
  info: { backgroundColor: "#E8F1FB", color: "#1565C0" },
  neutral: { backgroundColor: "#F1F2F4", color: "#5F6570" },
};

export function StatusChip({
  label,
  tone = "neutral",
  size = "small",
}: {
  label: ReactNode;
  tone?: Tone;
  size?: "small" | "medium";
}) {
  return (
    <Chip
      label={label}
      size={size}
      sx={{
        ...TONE_STYLES[tone],
        height: size === "small" ? 24 : 30,
        fontSize: size === "small" ? 12 : 13,
      }}
    />
  );
}
