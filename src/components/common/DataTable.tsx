"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { StatusChip } from "@/components/common/StatusChip";
import type { Tone } from "@/lib/labels";

export interface TableCellValue {
  text: string;
  href?: string;
  chip?: { label: string; tone: Tone };
  strong?: boolean;
  secondary?: string;
  mono?: boolean;
  tone?: Tone;
}

export type DataCell = string | TableCellValue;

export interface DataColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  width?: number | string;
  wrap?: boolean;
}

export interface DataRow {
  id: string;
  cells: Record<string, DataCell>;
}

export function DataTable({
  columns,
  rows,
  emptyText = "Нет данных",
  maxHeight,
  dense = false,
}: {
  columns: DataColumn[];
  rows: DataRow[];
  emptyText?: string;
  maxHeight?: number;
  dense?: boolean;
}) {
  return (
    <TableContainer sx={maxHeight ? { maxHeight } : undefined}>
      <Table
        size={dense ? "small" : "medium"}
        stickyHeader={Boolean(maxHeight)}
        sx={{ minWidth: 640 }}
      >
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                align={column.align ?? "left"}
                sx={{ width: column.width }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 4, textAlign: "center" }}
                >
                  {emptyText}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} hover>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    align={column.align ?? "left"}
                    sx={{
                      whiteSpace: column.wrap ? "normal" : "nowrap",
                      verticalAlign: "middle",
                    }}
                  >
                    {renderCell(row.cells[column.key], column.wrap)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function renderCell(cell: DataCell | undefined, wrap?: boolean): ReactNode {
  if (cell === undefined) return "—";
  const value: TableCellValue = typeof cell === "string" ? { text: cell } : cell;
  if (value.chip) {
    return <StatusChip label={value.chip.label} tone={value.chip.tone} />;
  }
  const toneColor =
    value.tone === "error"
      ? "#C62828"
      : value.tone === "warning"
        ? "#B26A00"
        : value.tone === "success"
          ? "#1E8E3E"
          : value.tone === "info"
            ? "#1565C0"
            : undefined;
  const content = (
    <Box sx={{ display: "inline-flex", flexDirection: "column", gap: 0.15 }}>
      <Box
        component="span"
        sx={{
          fontWeight: value.strong ? 600 : 400,
          fontFamily: value.mono ? "monospace" : undefined,
          whiteSpace: wrap ? "normal" : "nowrap",
          color: toneColor,
        }}
      >
        {value.text}
      </Box>
      {value.secondary && (
        <Box component="span" sx={{ fontSize: 11.5, color: "text.secondary", whiteSpace: "normal" }}>
          {value.secondary}
        </Box>
      )}
    </Box>
  );
  if (value.href) {
    return (
      <NextLink
        href={value.href}
        style={{ color: "#1565C0", textDecoration: "none", fontWeight: 500 }}
      >
        {content}
      </NextLink>
    );
  }
  return content;
}
