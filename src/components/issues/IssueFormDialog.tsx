"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { createIssueAction, updateIssueAction } from "@/app/actions/issues";
import {
  ISSUE_CRITICALITIES,
  ISSUE_CRITICALITY_LABELS,
  ISSUE_STATUSES,
  ISSUE_STATUS_LABELS,
} from "@/lib/board/labels";
import type { IssueAreaVM, IssueCardVM } from "@/lib/view/issues";
import type { IssueArea, IssueCriticality, IssueStatus } from "@/types/board";

export function IssueFormDialog({
  mode,
  issue,
  createAreas,
  defaultArea,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  issue?: IssueCardVM;
  createAreas: IssueAreaVM[];
  defaultArea: IssueArea;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [area, setArea] = useState<IssueArea>(issue?.area ?? defaultArea);
  const [title, setTitle] = useState(issue?.title ?? "");
  const [description, setDescription] = useState(issue?.description ?? "");
  const [criticality, setCriticality] = useState<IssueCriticality>(
    issue?.criticality ?? "medium",
  );
  const [status, setStatus] = useState<IssueStatus>(issue?.status ?? "new");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      setError("Название задачи должно содержать минимум 3 символа.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result =
        mode === "create"
          ? await createIssueAction({ area, title: trimmedTitle, description, criticality })
          : await updateIssueAction(issue!.id, {
              title: trimmedTitle,
              description,
              criticality,
              status,
            });
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить задачу.");
        return;
      }
      onSaved();
      router.refresh();
    } catch {
      setError("Не удалось сохранить задачу. Повторите попытку.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open
      onClose={submitting ? () => undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === "create" ? "Новая задача" : `Задача ${issue?.id}`}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {mode === "edit" && issue && (
              <Typography variant="caption" color="text.secondary">
                Категория: {issue.areaLabel} · создана: {issue.createdByName}
              </Typography>
            )}
            {mode === "create" && createAreas.length > 1 && (
              <TextField
                select
                label="Категория"
                value={area}
                onChange={(event) => setArea(event.target.value as IssueArea)}
                fullWidth
              >
                {createAreas.map((option) => (
                  <MenuItem key={option.area} value={option.area}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {mode === "create" && createAreas.length === 1 && (
              <Typography variant="caption" color="text.secondary">
                Категория: {createAreas[0]?.label}
              </Typography>
            )}
            <TextField
              label="Кратко о проблеме"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              fullWidth
              autoFocus
              slotProps={{ htmlInput: { maxLength: 120 } }}
              helperText={`${title.length}/120`}
            />
            <TextField
              label="Краткое описание"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              multiline
              minRows={3}
              fullWidth
              slotProps={{ htmlInput: { maxLength: 600 } }}
              helperText={`${description.length}/600`}
            />
            <Box className="grid grid-cols-1 sm:grid-cols-2" sx={{ gap: 2 }}>
              <TextField
                select
                label="Критичность"
                value={criticality}
                onChange={(event) =>
                  setCriticality(event.target.value as IssueCriticality)
                }
                fullWidth
              >
                {ISSUE_CRITICALITIES.map((value) => (
                  <MenuItem key={value} value={value}>
                    {ISSUE_CRITICALITY_LABELS[value]}
                  </MenuItem>
                ))}
              </TextField>
              {mode === "edit" && (
                <TextField
                  select
                  label="Статус"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as IssueStatus)}
                  fullWidth
                >
                  {ISSUE_STATUSES.map((value) => (
                    <MenuItem key={value} value={value}>
                      {ISSUE_STATUS_LABELS[value]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={submitting}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || title.trim().length < 3}
          >
            {mode === "create" ? "Создать" : "Сохранить"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
