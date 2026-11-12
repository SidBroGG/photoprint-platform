"use client";

import type { ReactNode } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function SectionCard({
  title,
  subtitle,
  action,
  fill = false,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  fill?: boolean;
  children: ReactNode;
}) {
  return (
    <Card
      sx={
        fill
          ? { height: "100%", display: "flex", flexDirection: "column" }
          : undefined
      }
    >
      {(title || action) && (
        <Box
          sx={{
            px: 2.5,
            pt: 2.25,
            pb: title && subtitle ? 1.25 : 1.5,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            flexShrink: 0,
          }}
        >
          <Box>
            {title && (
              <Typography variant="h6" component="h2">
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
        </Box>
      )}
      <CardContent
        sx={{
          px: 2.5,
          pt: title ? 1.5 : 2.5,
          pb: 2.5,
          ...(fill
            ? { flexGrow: 1, display: "flex", flexDirection: "column" }
            : {}),
        }}
      >
        {children}
      </CardContent>
    </Card>
  );
}
