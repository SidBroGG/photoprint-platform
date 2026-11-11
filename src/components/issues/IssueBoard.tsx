"use client";

import { useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddOutlined from "@mui/icons-material/AddOutlined";
import PersonOutlineOutlined from "@mui/icons-material/PersonOutlineOutlined";
import { KpiCard } from "@/components/common/KpiCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { IssueCard } from "@/components/issues/IssueCard";
import { IssueFormDialog } from "@/components/issues/IssueFormDialog";
import {
  claimIssueAction,
  releaseIssueAction,
  setIssueStatusAction,
} from "@/app/actions/issues";
import { ISSUE_STATUSES, ISSUE_STATUS_LABELS } from "@/lib/board/labels";
import type { IssueBoardView, IssueCardVM } from "@/lib/view/issues";
import type { IssueArea, IssueActionResult, IssueStatus } from "@/types/board";

const STATUS_COLORS: Record<IssueStatus, string> = {
  new: "#1565C0",
  in_progress: "#B26A00",
  review: "#6A1B9A",
  done: "#1E8E3E",
};

type DialogState = { mode: "create" } | { mode: "edit"; issue: IssueCardVM };

export function IssueBoard({ data }: { data: IssueBoardView }) {
  const router = useRouter();
  const [areaFilter, setAreaFilter] = useState<IssueArea | "all">("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<IssueStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{
    severity: "success" | "error";
    text: string;
  } | null>(null);

  const baseIssues = mineOnly
    ? data.issues.filter((issue) => issue.isMine)
    : data.issues;
  const filteredIssues = baseIssues.filter(
    (issue) => areaFilter === "all" || issue.area === areaFilter,
  );
  const columns = ISSUE_STATUSES.map((status) => ({
    status,
    issues: filteredIssues.filter((issue) => issue.status === status),
  }));

  function countForArea(area: IssueArea): number {
    return baseIssues.filter((issue) => issue.area === area).length;
  }

  async function perform(
    action: () => Promise<IssueActionResult>,
    successMessage: string,
  ): Promise<boolean> {
    if (busy) return false;
    setBusy(true);
    try {
      const result = await action();
      if (!result.ok) {
        setNotice({
          severity: "error",
          text: result.error ?? "Не удалось выполнить действие.",
        });
        return false;
      }
      setNotice({ severity: "success", text: successMessage });
      router.refresh();
      return true;
    } catch {
      setNotice({
        severity: "error",
        text: "Не удалось выполнить действие. Повторите попытку.",
      });
      return false;
    } finally {
      setBusy(false);
    }
  }

  function handleClaim(issue: IssueCardVM) {
    void perform(() => claimIssueAction(issue.id), "Задача закреплена за вами.");
  }

  function handleRelease(issue: IssueCardVM) {
    void perform(() => releaseIssueAction(issue.id), "Задача снята с вас.");
  }

  function handleStatusChange(issue: IssueCardVM, status: IssueStatus) {
    if (status === issue.status) return;
    void perform(
      () => setIssueStatusAction(issue.id, status),
      `Статус задачи ${issue.id}: ${ISSUE_STATUS_LABELS[status].toLowerCase()}.`,
    );
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, status: IssueStatus) {
    event.preventDefault();
    const issueId = event.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    setDragOver(null);
    if (!issueId) return;
    const issue = data.issues.find((item) => item.id === issueId);
    if (!issue || issue.status === status) return;
    void perform(
      () => setIssueStatusAction(issue.id, status),
      `Статус задачи ${issue.id}: ${ISSUE_STATUS_LABELS[status].toLowerCase()}.`,
    );
  }

  return (
    <>
      <PageHeader
        description={data.note}
        meta={data.meta}
        action={
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => setDialog({ mode: "create" })}
          >
            Новая задача
          </Button>
        }
      />

      <Stack spacing={3}>
        <Box className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" sx={{ gap: 2 }}>
          {data.stats.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              hint={kpi.hint}
              tone={kpi.tone}
            />
          ))}
        </Box>

        <SectionCard
          title="Канбан проблем"
          subtitle="Перетащите карточку между колонками или смените статус внутри карточки. Критичность задаёт приоритет."
        >
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: "wrap", alignItems: "center", mb: 2 }}
          >
            {data.areas.length > 1 && (
              <>
                <Chip
                  label={`Все процессы · ${baseIssues.length}`}
                  onClick={() => setAreaFilter("all")}
                  variant={areaFilter === "all" ? "filled" : "outlined"}
                  sx={
                    areaFilter === "all"
                      ? { backgroundColor: "#FFF4C2", color: "#1A1A1A", borderColor: "#E6B000" }
                      : undefined
                  }
                />
                {data.areas.map((area) => (
                  <Chip
                    key={area.area}
                    label={`${area.label} · ${countForArea(area.area)}`}
                    onClick={() => setAreaFilter(area.area)}
                    variant={areaFilter === area.area ? "filled" : "outlined"}
                    sx={
                      areaFilter === area.area
                        ? {
                            backgroundColor: "#FFF4C2",
                            color: "#1A1A1A",
                            borderColor: "#E6B000",
                          }
                        : undefined
                    }
                  />
                ))}
              </>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Chip
              icon={<PersonOutlineOutlined />}
              label="Только мои"
              onClick={() => setMineOnly((value) => !value)}
              variant={mineOnly ? "filled" : "outlined"}
              sx={
                mineOnly
                  ? { backgroundColor: "#FFF4C2", color: "#1A1A1A", borderColor: "#E6B000" }
                  : undefined
              }
            />
          </Stack>

          {busy && <LinearProgress sx={{ mb: 1.5 }} />}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(250px, 1fr))",
              gap: 2,
              overflowX: "auto",
              pb: 1.5,
            }}
          >
            {columns.map((column) => {
              const isDropTarget = dragOver === column.status;
              return (
                <Paper
                  key={column.status}
                  variant="outlined"
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    if (dragOver !== column.status) setDragOver(column.status);
                  }}
                  onDragLeave={(event) => {
                    const next = event.relatedTarget as Node | null;
                    if (next && event.currentTarget.contains(next)) return;
                    if (dragOver === column.status) setDragOver(null);
                  }}
                  onDrop={(event) => handleDrop(event, column.status)}
                  sx={{
                    p: 1.25,
                    minHeight: 380,
                    backgroundColor: "#F7F8FA",
                    borderColor: isDropTarget ? "primary.main" : "#E3E6EB",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.25,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 0.5,
                      py: 0.25,
                    }}
                  >
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: STATUS_COLORS[column.status],
                        }}
                      />
                      <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
                        {ISSUE_STATUS_LABELS[column.status]}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {column.issues.length}
                    </Typography>
                  </Box>

                  {column.issues.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      showArea={data.showAreaChips}
                      busy={busy}
                      onOpen={(value) => setDialog({ mode: "edit", issue: value })}
                      onClaim={handleClaim}
                      onRelease={handleRelease}
                      onStatusChange={handleStatusChange}
                      onDragStart={setDraggingId}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOver(null);
                      }}
                    />
                  ))}

                  {column.issues.length === 0 && (
                    <Box
                      sx={{
                        border: "1px dashed #D5D9DF",
                        borderRadius: 1,
                        py: 3,
                        px: 1,
                        textAlign: "center",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        Перетащите задачу сюда
                      </Typography>
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Box>
        </SectionCard>
      </Stack>

      {dialog && (
        <IssueFormDialog
          key={dialog.mode === "create" ? "create" : dialog.issue.id}
          mode={dialog.mode}
          issue={dialog.mode === "edit" ? dialog.issue : undefined}
          createAreas={data.createAreas}
          defaultArea={areaFilter === "all" ? data.defaultArea : areaFilter}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            setNotice({ severity: "success", text: "Изменения сохранены." });
          }}
        />
      )}

      <Snackbar
        open={notice !== null}
        autoHideDuration={3200}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={notice?.severity ?? "info"}
          variant="filled"
          onClose={() => setNotice(null)}
          sx={{ width: "100%" }}
        >
          {notice?.text}
        </Alert>
      </Snackbar>
    </>
  );
}
