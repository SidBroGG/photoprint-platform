"use client";

import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { StatusChip } from "@/components/common/StatusChip";
import type { MarketingFunnelStageVM } from "@/lib/view/marketing";

export function MarketingFunnel({ stages }: { stages: MarketingFunnelStageVM[] }) {
  const maxCount = stages[0]?.count ?? 0;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {stages.map((stage) => (
        <Paper
          key={stage.key}
          variant="outlined"
          sx={{
            p: 1.5,
            borderColor: stage.isBottleneck ? "#E8B4B4" : "#E3E6EB",
            backgroundColor: stage.isBottleneck ? "#FFF8F7" : "#FFFFFF",
            borderRadius: 0.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              mb: 0.75,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>
                {stage.label}
              </Typography>
              {stage.isBottleneck && <StatusChip label="Узкое место" tone="warning" />}
            </Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
              {stage.countLabel}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={maxCount > 0 ? (stage.count / maxCount) * 100 : 0}
            sx={{
              height: 14,
              borderRadius: 2,
              backgroundColor: "#EEF0F3",
              "& .MuiLinearProgress-bar": {
                backgroundColor: stage.isBottleneck ? "#C62828" : "#FFC400",
                borderRadius: 2,
              },
            }}
          />
          <Box sx={{ display: "flex", gap: 2, mt: 0.75, flexWrap: "wrap" }}>
            <Typography variant="caption" color="text.secondary">
              Конверсия: {stage.conversionLabel}
            </Typography>
            {stage.dropOffLabel !== "—" && (
              <Typography
                variant="caption"
                color={stage.isBottleneck ? "error" : "text.secondary"}
              >
                Отвал: {stage.dropOffLabel}
              </Typography>
            )}
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
