"use client";

import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const TONE_COLOR: Record<string, string> = {
  default: "#17181C",
  success: "#1E8E3E",
  warning: "#B26A00",
  error: "#C62828",
  info: "#1565C0",
  accent: "#A67C00",
};

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: keyof typeof TONE_COLOR;
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <Box sx={{ px: 2.25, py: 2 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontSize: 12.5, fontWeight: 500, minHeight: 18 }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            mt: 0.75,
            fontSize: 26,
            lineHeight: 1.15,
            fontWeight: 700,
            color: TONE_COLOR[tone],
            letterSpacing: "-0.01em",
          }}
        >
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
            {hint}
          </Typography>
        )}
      </Box>
    </Card>
  );
}
