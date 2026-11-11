"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { StatusChip } from "@/components/common/StatusChip";
import { EmptyState } from "@/components/common/EmptyState";
import type { AlertVM } from "@/lib/view/dashboard";

const STORAGE_KEY = "pp-alerts-taken";

export function AlertList({ alerts }: { alerts: AlertVM[] }) {
  const [taken, setTaken] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setTaken(parsed.filter((item): item is string => typeof item === "string"));
      }
    } catch {
      setTaken([]);
    }
  }, []);

  function toggle(id: string) {
    setTaken((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage may be unavailable in private mode; the demo state stays in memory.
      }
      return next;
    });
  }

  if (alerts.length === 0) {
    return <EmptyState text="Активных сигналов нет — все показатели в пределах нормы." />;
  }

  return (
    <Stack spacing={1.5}>
      {alerts.map((alert) => {
        const isTaken = taken.includes(alert.id);
        return (
          <Card
            key={alert.id}
            sx={{
              borderLeft: `4px solid ${alert.severity === "critical" ? "#C62828" : "#B26A00"}`,
              opacity: isTaken ? 0.72 : 1,
            }}
          >
            <Box sx={{ p: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 14.5, fontWeight: 600 }}>
                    {alert.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {alert.where}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
                  <StatusChip
                    label={alert.severityLabel}
                    tone={alert.severity === "critical" ? "error" : "warning"}
                  />
                  <StatusChip label={alert.domainLabel} tone="neutral" />
                  {isTaken && <StatusChip label="В работе" tone="info" />}
                </Stack>
              </Box>

              <Box
                className="grid grid-cols-1 md:grid-cols-2"
                sx={{ gap: 1.5, mt: 1.5 }}
              >
                <Field label="Причина" value={alert.reason} />
                <Field label="Рекомендуемое действие" value={alert.action} />
                <Field label="Ответственный" value={alert.owner} />
                <Field label="Срок" value={alert.due} />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  mt: 1.75,
                  flexWrap: "wrap",
                }}
              >
                <NextLink
                  href={alert.href}
                  style={{ color: "#1565C0", fontSize: 13, fontWeight: 500, textDecoration: "none" }}
                >
                  Открыть объект →
                </NextLink>
                <Button
                  size="small"
                  variant={isTaken ? "outlined" : "contained"}
                  onClick={() => toggle(alert.id)}
                  sx={{ minWidth: 150 }}
                >
                  {isTaken ? "В работе" : "Взять в работу"}
                </Button>
              </Box>
            </Box>
          </Card>
        );
      })}
    </Stack>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", textTransform: "uppercase", letterSpacing: "0.03em", fontSize: 10.5 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25 }}>
        {value}
      </Typography>
    </Box>
  );
}
