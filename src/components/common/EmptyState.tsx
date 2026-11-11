"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function EmptyState({ text }: { text: string }) {
  return (
    <Box sx={{ py: 5, textAlign: "center" }}>
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Box>
  );
}
