"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { StatusChip } from "@/components/common/StatusChip";
import type { MarketingBottleneckVM } from "@/lib/view/marketing";

export function MarketingBottleneckCard({
  bottleneck,
}: {
  bottleneck: MarketingBottleneckVM | null;
}) {
  if (!bottleneck) {
    return (
      <Typography variant="body2" color="text.secondary">
        В воронке нет выраженного узкого места.
      </Typography>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderColor: "#E8B4B4",
        backgroundColor: "#FFF8F7",
        borderRadius: 0.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          Где теряем клиентов
        </Typography>
        <StatusChip label="Требует действия" tone="warning" />
      </Box>
      <Typography sx={{ fontSize: 22, fontWeight: 700, mt: 0.75 }}>
        {bottleneck.stageLabel}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Отвал {bottleneck.dropOffLabel} · {bottleneck.lostLabel}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1.25 }}>
        {bottleneck.recommendation}
      </Typography>
    </Paper>
  );
}
