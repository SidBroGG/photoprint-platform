"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddOutlined from "@mui/icons-material/AddOutlined";
import { StatusChip } from "@/components/common/StatusChip";
import { EmptyState } from "@/components/common/EmptyState";
import { createIssueAction } from "@/app/actions/issues";
import type { ForecastRiskVM } from "@/lib/view/dashboard";

export function ForecastRiskList({
  risks,
  showLink = true,
}: {
  risks: ForecastRiskVM[];
  showLink?: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createdIds, setCreatedIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<{
    severity: "success" | "error";
    text: string;
  } | null>(null);

  async function addToKanban(risk: ForecastRiskVM) {
    if (busyId) return;
    setBusyId(risk.id);
    try {
      const result = await createIssueAction({
        area: risk.area,
        title: risk.title,
        description: `${risk.reason} ${risk.action} Горизонт: ${risk.horizon}.`,
        criticality: risk.severity === "critical" ? "critical" : "high",
      });
      if (!result.ok) {
        setNotice({
          severity: "error",
          text: result.error ?? "Не удалось добавить проблему в канбан.",
        });
        return;
      }
      setCreatedIds((previous) => new Set(previous).add(risk.id));
      setNotice({ severity: "success", text: "Проблема добавлена в канбан." });
      router.refresh();
    } catch {
      setNotice({
        severity: "error",
        text: "Не удалось добавить проблему в канбан. Повторите попытку.",
      });
    } finally {
      setBusyId(null);
    }
  }

  if (risks.length === 0) {
    return <EmptyState text="На горизонте 1–2 недели рисков не обнаружено." />;
  }

  return (
    <>
      <Stack spacing={1.5}>
        {risks.map((risk) => {
          const created = createdIds.has(risk.id);
          return (
            <Paper
              key={risk.id}
              variant="outlined"
              sx={{ p: 2, borderColor: "#E3E6EB", borderRadius: 1 }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                  {risk.title}
                </Typography>
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
                  gap: 1.5,
                  flexWrap: "wrap",
                  mt: 1.5,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Горизонт: {risk.horizon}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddOutlined />}
                    disabled={busyId === risk.id || created}
                    onClick={() => void addToKanban(risk)}
                    aria-label={`Добавить проблему в канбан: ${risk.title}`}
                    sx={{ fontSize: 12, py: 0.25 }}
                  >
                    {created ? "Добавлено" : "Добавить в канбан"}
                  </Button>
                  {showLink && (
                    <NextLink
                      href="/forecast"
                      style={{
                        color: "#1565C0",
                        fontSize: 12.5,
                        fontWeight: 500,
                        textDecoration: "none",
                      }}
                    >
                      Открыть прогноз →
                    </NextLink>
                  )}
                </Box>
              </Box>
            </Paper>
          );
        })}
      </Stack>
      {notice && (
        <Snackbar
          open
          autoHideDuration={4000}
          onClose={() => setNotice(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={notice.severity}
            variant="filled"
            onClose={() => setNotice(null)}
          >
            {notice.text}
          </Alert>
        </Snackbar>
      )}
    </>
  );
}
