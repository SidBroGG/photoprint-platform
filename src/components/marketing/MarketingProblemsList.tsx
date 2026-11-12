"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { StatusChip } from "@/components/common/StatusChip";
import type { MarketingProblemVM } from "@/lib/view/marketing";

export function MarketingProblemsList({
  problems,
}: {
  problems: MarketingProblemVM[];
}) {
  if (problems.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Проблемных каналов не найдено.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {problems.map((problem) => (
        <Paper
          key={problem.id}
          variant="outlined"
          sx={{ p: 2, borderColor: "#E3E6EB", borderRadius: 1 }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
              {problem.title}
            </Typography>
            <StatusChip
              label={problem.severityLabel}
              tone={problem.severity === "critical" ? "error" : "warning"}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {problem.detail}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.75 }}>
            {problem.action}
          </Typography>
        </Paper>
      ))}
    </Stack>
  );
}
