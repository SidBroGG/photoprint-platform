"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function PageHeader({
  description,
  meta,
  action,
}: {
  description?: string;
  meta?: string;
  action?: ReactNode;
}) {
  if (!description && !meta && !action) return null;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: { xs: "flex-start", md: "center" },
        justifyContent: "space-between",
        flexDirection: { xs: "column", md: "row" },
        gap: 1.5,
        mb: 2.5,
      }}
    >
      <Box>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 900 }}>
            {description}
          </Typography>
        )}
        {meta && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            {meta}
          </Typography>
        )}
      </Box>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Box>
  );
}
