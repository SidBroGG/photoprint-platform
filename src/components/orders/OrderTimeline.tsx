"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { OrderTimelineStep } from "@/lib/view/orders";

const STATE_COLOR: Record<OrderTimelineStep["state"], string> = {
  done: "#1E8E3E",
  current: "#1565C0",
  pending: "#B9BEC7",
  error: "#C62828",
};

export function OrderTimeline({ steps }: { steps: OrderTimelineStep[] }) {
  return (
    <Box>
      {steps.map((step, index) => {
        const color = STATE_COLOR[step.state];
        const isLast = index === steps.length - 1;
        return (
          <Box key={step.key} sx={{ display: "flex", gap: 1.5 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 16,
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: step.state === "pending" ? "#FFFFFF" : color,
                  border: `2px solid ${color}`,
                  mt: 0.4,
                  flexShrink: 0,
                }}
              />
              {!isLast && (
                <Box
                  sx={{
                    width: 2,
                    flexGrow: 1,
                    minHeight: 26,
                    backgroundColor: "#E3E6EB",
                    my: 0.35,
                  }}
                />
              )}
            </Box>
            <Box sx={{ pb: isLast ? 0 : 1.5, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 13.5,
                  fontWeight: step.state === "current" ? 600 : 500,
                  color: step.state === "pending" ? "text.secondary" : "text.primary",
                }}
              >
                {step.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {step.dateLabel ?? "Ожидает"}
              </Typography>
              {step.note && (
                <Typography
                  variant="caption"
                  sx={{ display: "block", color: step.state === "error" ? "error.main" : "text.secondary" }}
                >
                  {step.note}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
