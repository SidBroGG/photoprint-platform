"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusChip } from "@/components/common/StatusChip";
import type { DashboardProblemVM } from "@/lib/view/dashboard";

export function DashboardProblems({
  problems,
  total,
}: {
  problems: DashboardProblemVM[];
  total: number;
}) {
  if (problems.length === 0) {
    return <EmptyState text="Открытых проблем нет — все задачи канбана решены." />;
  }

  return (
    <Stack spacing={1.25}>
      {problems.map((problem) => (
        <Paper
          key={problem.id}
          variant="outlined"
          sx={{ p: 1.75, borderColor: "#E3E6EB", borderRadius: 0.5 }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
              {problem.title}
            </Typography>
            <StatusChip
              label={problem.criticalityLabel}
              tone={problem.criticalityTone}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {problem.description}
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              mt: 1.25,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {problem.areaLabel}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {problem.statusLabel}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {problem.assigneeName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {problem.updatedAtLabel}
            </Typography>
          </Box>
        </Paper>
      ))}
      {total > problems.length && (
        <Typography variant="caption" color="text.secondary">
          Ещё {total - problems.length} открытых задач в канбане.
        </Typography>
      )}
    </Stack>
  );
}
