"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { PipelineVM } from "@/lib/view/dashboard";

export function OrderPipeline({ stages }: { stages: PipelineVM[] }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 1.25,
      }}
    >
      {stages.map((stage) => (
        <Paper
          key={stage.key}
          variant="outlined"
          sx={{ px: 1.5, py: 1.4, borderColor: "#E3E6EB", borderRadius: 2.5 }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", lineHeight: 1.25, minHeight: 30 }}
          >
            {stage.label}
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700, mt: 0.5, lineHeight: 1.1 }}>
            {stage.count}
          </Typography>
          {stage.amount && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.4 }}>
              {stage.amount}
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
}
