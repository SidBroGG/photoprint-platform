"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { MatrixCellVM } from "@/lib/view/customers";
import type { AbcClass, XyzClass } from "@/lib/analytics/customers";

const ABC_ROWS: AbcClass[] = ["A", "B", "C"];
const XYZ_COLUMNS: XyzClass[] = ["X", "Y", "Z"];

const ABC_BACKGROUND: Record<AbcClass, string> = {
  A: "#FFF8D6",
  B: "#F3F7FB",
  C: "#FAFBFC",
};

export function AbcXyzMatrix({ cells }: { cells: MatrixCellVM[] }) {
  const lookup = new Map(cells.map((cell) => [`${cell.abc}${cell.xyz}`, cell]));
  return (
    <Box>
      <Box sx={{ overflowX: "auto" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "110px repeat(3, minmax(120px, 1fr))",
            gap: 1.5,
            minWidth: 520,
          }}
        >
          <Box />
          {XYZ_COLUMNS.map((xyz) => (
            <Typography
              key={xyz}
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: "center", fontWeight: 600, letterSpacing: "0.05em" }}
            >
              XYZ · {xyz}
            </Typography>
          ))}
          {ABC_ROWS.map((abc) => (
            <Box key={abc} sx={{ display: "contents" }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "flex", alignItems: "center", fontWeight: 600 }}
              >
                ABC · {abc}
              </Typography>
              {XYZ_COLUMNS.map((xyz) => {
                const cell = lookup.get(`${abc}${xyz}`);
                const empty = !cell || cell.countLabel.startsWith("0 ");
                return (
                  <Paper
                    key={`${abc}${xyz}`}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderColor: "#E3E6EB",
                      backgroundColor: empty ? "#FCFCFD" : ABC_BACKGROUND[abc],
                      borderRadius: 1,
                    }}
                  >
                    <Typography sx={{ fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>
                      {cell?.countLabel.split(" ")[0] ?? "0"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cell?.countLabel.split(" ").slice(1).join(" ") ?? "клиентов"} ·{" "}
                      {cell?.shareLabel ?? "0%"} выручки
                    </Typography>
                  </Paper>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
        ABC: A — до 80% накопленной выручки, B — до 95%, C — остальные. XYZ: X — вариация &lt;
        0,33, Y — &lt; 0,66, Z — выше.
      </Typography>
    </Box>
  );
}
