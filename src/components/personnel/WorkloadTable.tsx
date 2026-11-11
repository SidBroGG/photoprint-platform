"use client";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import { StatusChip } from "@/components/common/StatusChip";
import type { PersonnelRowVM } from "@/lib/view/personnel";

export function WorkloadTable({ rows }: { rows: PersonnelRowVM[] }) {
  return (
    <TableContainer sx={{ maxHeight: 600 }}>
      <Table stickyHeader size="small" sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            <TableCell>Сотрудник</TableCell>
            <TableCell>Отдел</TableCell>
            <TableCell>Роль</TableCell>
            <TableCell align="right">Задачи / норма</TableCell>
            <TableCell sx={{ minWidth: 190 }}>Загрузка</TableCell>
            <TableCell align="center">Просрочено</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  Сотрудников в выбранном срезе нет.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                hover
                sx={{ backgroundColor: row.isOverloaded ? "#FFF8EC" : undefined }}
              >
                <TableCell>
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Box component="span" sx={{ fontWeight: 600 }}>
                      {row.name}
                    </Box>
                    <Box component="span" sx={{ fontSize: 11.5, color: "text.secondary" }}>
                      {row.isOverloaded ? "Перегрузка" : "В норме"}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{row.departmentLabel}</TableCell>
                <TableCell>{row.role}</TableCell>
                <TableCell align="right">
                  {row.activeTasks} / {row.norm}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, Math.round(row.loadPct * 100))}
                      color={row.isOverloaded ? "error" : row.loadPct >= 0.8 ? "warning" : "primary"}
                      sx={{ flexGrow: 1 }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ minWidth: 40, textAlign: "right", fontWeight: 600 }}
                    >
                      {row.loadLabel}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  {row.overdueTasks > 0 ? (
                    <StatusChip label={String(row.overdueTasks)} tone="error" />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      0
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
