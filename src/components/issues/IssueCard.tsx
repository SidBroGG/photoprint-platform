"use client";

import { useState, type DragEvent, type MouseEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import PersonAddOutlined from "@mui/icons-material/PersonAddOutlined";
import PersonOutline from "@mui/icons-material/PersonOutlineOutlined";
import { StatusChip } from "@/components/common/StatusChip";
import type { IssueAssigneeVM, IssueCardVM } from "@/lib/view/issues";
import type { IssueCriticality } from "@/types/board";

const CRITICALITY_COLORS: Record<IssueCriticality, string> = {
  low: "#9AA0A8",
  medium: "#1565C0",
  high: "#B26A00",
  critical: "#C62828",
};

export function IssueCard({
  issue,
  assignees,
  busy,
  onOpen,
  onClaim,
  onRelease,
  onAssign,
  onDragStart,
  onDragEnd,
}: {
  issue: IssueCardVM;
  assignees: IssueAssigneeVM[];
  busy: boolean;
  onOpen: (issue: IssueCardVM) => void;
  onClaim: (issue: IssueCardVM) => void;
  onRelease: (issue: IssueCardVM) => void;
  onAssign: (issue: IssueCardVM, employeeId: string) => void;
  onDragStart: (issueId: string) => void;
  onDragEnd: () => void;
}) {
  const [assignAnchor, setAssignAnchor] = useState<HTMLElement | null>(null);

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    event.dataTransfer.setData("text/plain", issue.id);
    event.dataTransfer.effectAllowed = "move";
    onDragStart(issue.id);
  }

  function stop(event: MouseEvent) {
    event.stopPropagation();
  }

  function openAssignMenu(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setAssignAnchor(event.currentTarget);
  }

  function handleAssign(employeeId: string) {
    setAssignAnchor(null);
    onAssign(issue, employeeId);
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
      <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>
        {issue.title}
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1 }}>
        <StatusChip label={issue.criticalityLabel} tone={issue.criticalityTone} />
        <PersonOutline sx={{ fontSize: 15, color: "text.secondary" }} />
        <Typography variant="caption" color="text.secondary" noWrap>
          {issue.isMine ? "Вы" : issue.assigneeName ?? "Не закреплена"}
        </Typography>
      </Box>

      <Box
        onClick={stop}
        onKeyDown={(event) => event.stopPropagation()}
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 0.5,
          flexWrap: "wrap",
          mt: 1.25,
        }}
      >
        {issue.status !== "done" && assignees.length > 0 && (
          <Button
            size="small"
            variant="text"
            disabled={busy}
            onClick={openAssignMenu}
            startIcon={<PersonAddOutlined />}
            sx={{ minWidth: 0, px: 1, fontSize: 12 }}
          >
            Назначить
          </Button>
        )}
        {issue.canClaim && (
          <Button
            size="small"
            variant="outlined"
            disabled={busy}
            onClick={() => onClaim(issue)}
            sx={{ minWidth: 0, px: 1, fontSize: 12 }}
          >
            Закрепить
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

      <Menu
        anchorEl={assignAnchor}
        open={assignAnchor !== null}
        onClose={() => setAssignAnchor(null)}
        onClick={(event) => event.stopPropagation()}
        slotProps={{ paper: { sx: { maxHeight: 360 } } }}
      >
        {assignees.map((assignee) => (
          <MenuItem
            key={assignee.id}
            selected={assignee.id === issue.assigneeId}
            onClick={() => handleAssign(assignee.id)}
          >
            <Box>
              <Typography sx={{ fontSize: 13.5, fontWeight: 500 }}>
                {assignee.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {assignee.role} · {assignee.departmentLabel}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Card>
  );
}
