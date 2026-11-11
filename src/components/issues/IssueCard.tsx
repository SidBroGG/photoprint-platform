"use client";

import type { DragEvent, MouseEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import PersonOutline from "@mui/icons-material/PersonOutlineOutlined";
import { StatusChip } from "@/components/common/StatusChip";
import { ISSUE_STATUSES, ISSUE_STATUS_LABELS } from "@/lib/board/labels";
import type { IssueCardVM } from "@/lib/view/issues";
import type { IssueCriticality, IssueStatus } from "@/types/board";

const CRITICALITY_COLORS: Record<IssueCriticality, string> = {
  low: "#9AA0A8",
  medium: "#1565C0",
  high: "#B26A00",
  critical: "#C62828",
};

export function IssueCard({
  issue,
  showArea,
  busy,
  onOpen,
  onClaim,
  onRelease,
  onStatusChange,
  onDragStart,
  onDragEnd,
}: {
  issue: IssueCardVM;
  showArea: boolean;
  busy: boolean;
  onOpen: (issue: IssueCardVM) => void;
  onClaim: (issue: IssueCardVM) => void;
  onRelease: (issue: IssueCardVM) => void;
  onStatusChange: (issue: IssueCardVM, status: IssueStatus) => void;
  onDragStart: (issueId: string) => void;
  onDragEnd: () => void;
}) {
  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    event.dataTransfer.setData("text/plain", issue.id);
    event.dataTransfer.effectAllowed = "move";
    onDragStart(issue.id);
  }

  function stop(event: MouseEvent) {
    event.stopPropagation();
  }

  return (
    <Card
      draggable
      role="button"
      tabIndex={0}
      aria-label={`Открыть задачу ${issue.id}: ${issue.title}`}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(issue)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(issue);
        }
      }}
      sx={{
        p: 1.5,
        cursor: "pointer",
        opacity: busy ? 0.6 : 1,
        borderLeft: `3px solid ${CRITICALITY_COLORS[issue.criticality]}`,
        transition: "box-shadow 120ms ease",
        "&:hover": { boxShadow: "0 2px 10px rgba(23, 24, 28, 0.10)" },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {issue.id}
        </Typography>
        <StatusChip label={issue.criticalityLabel} tone={issue.criticalityTone} />
      </Box>

      <Typography sx={{ mt: 0.75, fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>
        {issue.title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mt: 0.5,
          minHeight: 36,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {issue.description || "Без описания"}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1.25 }}>
        <PersonOutline sx={{ fontSize: 15, color: "text.secondary" }} />
        <Typography variant="caption" color="text.secondary" noWrap>
          {issue.isMine ? "Вы" : issue.assigneeName ?? "Не закреплена"}
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
        Обновлено {issue.updatedAtLabel}
      </Typography>

      {showArea && (
        <Box sx={{ mt: 0.75 }}>
          <StatusChip label={issue.areaLabel} tone="neutral" />
        </Box>
      )}

      <Box
        onClick={stop}
        onKeyDown={(event) => event.stopPropagation()}
        sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.25 }}
      >
        <FormControl size="small" sx={{ flexGrow: 1 }}>
          <Select
            value={issue.status}
            disabled={busy}
            onChange={(event) => onStatusChange(issue, event.target.value as IssueStatus)}
            aria-label={`Статус задачи ${issue.id}`}
            sx={{ height: 30, fontSize: 12.5, backgroundColor: "#FFFFFF" }}
          >
            {ISSUE_STATUSES.map((status) => (
              <MenuItem key={status} value={status} sx={{ fontSize: 13 }}>
                {ISSUE_STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {issue.canClaim && (
          <Button
            size="small"
            variant="outlined"
            disabled={busy}
            onClick={() => onClaim(issue)}
            sx={{ minWidth: 0, px: 1, fontSize: 12 }}
          >
            Взять
          </Button>
        )}
        {issue.canRelease && (
          <Button
            size="small"
            variant="text"
            disabled={busy}
            onClick={() => onRelease(issue)}
            sx={{ minWidth: 0, px: 1, fontSize: 12 }}
          >
            Открепить
          </Button>
        )}
      </Box>
    </Card>
  );
}
