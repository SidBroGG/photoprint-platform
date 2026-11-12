"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import { StatusChip } from "@/components/common/StatusChip";
import type { StageLoadVM } from "@/lib/view/production";

export function StageLoad({ stages }: { stages: StageLoadVM[] }) {
  return (
    <Box className="grid grid-cols-1 md:grid-cols-3" sx={{ gap: 2 }}>
      {stages.map((stage) => (
        <Card
          key={stage.stage}
          sx={{
            borderColor: stage.isBottleneck ? "#F1B8B8" : "#E3E6EB",
            backgroundColor: stage.isBottleneck ? "#FFFBFB" : "#FFFFFF",
          }}
        >
          <Box sx={{ p: 2.5 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 1,
              }}
            >
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{stage.label}</Typography>
              {stage.isBottleneck && <StatusChip label="Узкое место" tone="error" />}
            </Box>
            <Typography sx={{ fontSize: 24, fontWeight: 700, mt: 1, lineHeight: 1.1 }}>
              {stage.queue}
              <Typography
                component="span"
                sx={{ fontSize: 14, fontWeight: 500, color: "text.secondary" }}
              >
                {" "}
                / {stage.capacity} заказов
              </Typography>
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Math.round(stage.loadPct * 100))}
              color={stage.isBottleneck ? "error" : "primary"}
              sx={{ mt: 1.5 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
              Загрузка смены: {stage.loadLabel} · мощность {stage.capacity} заказов/день
            </Typography>
          </Box>
        </Card>
      ))}
    </Box>
  );
}
