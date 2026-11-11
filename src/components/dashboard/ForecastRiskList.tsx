"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { StatusChip } from "@/components/common/StatusChip";
import { EmptyState } from "@/components/common/EmptyState";
import type { ForecastRiskVM } from "@/lib/view/dashboard";

export function ForecastRiskList({
  risks,
  showLink = true,
}: {
  risks: ForecastRiskVM[];
  showLink?: boolean;
}) {
  if (risks.length === 0) {
    return <EmptyState text="На горизонте 1–2 недели рисков не обнаружено." />;
  }
  return (
    <Stack spacing={1.25}>
      {risks.map((risk) => (
        <Paper
          key={risk.id}
          variant="outlined"
          sx={{ p: 1.75, borderColor: "#E3E6EB", borderRadius: 0.5 }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{risk.title}</Typography>
            <StatusChip
              label={risk.severity === "critical" ? "Критично" : "Предупреждение"}
              tone={risk.severity === "critical" ? "error" : "warning"}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {risk.reason}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.75 }}>
            {risk.action}
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 1.25,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Горизонт: {risk.horizon}
            </Typography>
            {showLink && (
              <NextLink
                href="/forecast"
                style={{ color: "#1565C0", fontSize: 12.5, fontWeight: 500, textDecoration: "none" }}
              >
                Открыть прогноз →
              </NextLink>
            )}
          </Box>
        </Paper>
      ))}
    </Stack>
  );
}
