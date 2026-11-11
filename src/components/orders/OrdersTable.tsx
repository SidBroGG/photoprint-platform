"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { DataTable, type DataColumn, type DataRow } from "@/components/common/DataTable";
import type { OrderRowVM, OrdersView } from "@/lib/view/orders";
import { ORDER_STAGE_LABELS } from "@/lib/labels";
import type { OrderStage } from "@/types/domain";

const PAYMENT_OPTIONS = [
  { value: "all", label: "Все оплаты" },
  { value: "paid", label: "Оплачен" },
  { value: "pending", label: "Ожидает оплаты" },
  { value: "sync_error", label: "Ошибка синхронизации" },
];

const DELIVERY_OPTIONS = [
  { value: "all", label: "Все доставки" },
  { value: "in_transit", label: "В пути" },
  { value: "delayed", label: "Задержка" },
  { value: "delivered", label: "Доставлен" },
  { value: "pickup", label: "Самовывоз" },
  { value: "none", label: "Не передано" },
];

const STAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Все этапы" },
  ...(Object.entries(ORDER_STAGE_LABELS) as [OrderStage, string][]).map(([value, label]) => ({
    value,
    label,
  })),
];

function columnsFor(mode: OrdersView["mode"]): DataColumn[] {
  const order: DataColumn = { key: "order", label: "Заказ", width: 150 };
  const client: DataColumn = { key: "client", label: "Клиент", width: 180 };
  const product: DataColumn = { key: "product", label: "Продукт", width: 200 };
  const amount: DataColumn = { key: "amount", label: "Сумма", align: "right", width: 110 };
  const payment: DataColumn = { key: "payment", label: "Оплата", width: 160 };
  const stage: DataColumn = { key: "stage", label: "Этап", width: 150 };
  const due: DataColumn = { key: "due", label: "Срок", width: 150 };
  const assignee: DataColumn = { key: "assignee", label: "Ответственный", width: 170 };
  const delivery: DataColumn = { key: "delivery", label: "Доставка", width: 150 };
  const deliveryStatus: DataColumn = { key: "deliveryStatus", label: "Статус доставки", width: 140 };
  const tracking: DataColumn = { key: "tracking", label: "Трекинг", width: 150 };
  const eta: DataColumn = { key: "eta", label: "ETA", width: 110 };
  const tickets: DataColumn = { key: "tickets", label: "Обращения", width: 100 };
  const manager: DataColumn = { key: "manager", label: "Менеджер", width: 160 };

  switch (mode) {
    case "sales":
      return [order, client, product, amount, payment, stage, due, manager];
    case "production":
      return [order, product, stage, assignee, due];
    case "logistics":
      return [order, client, delivery, deliveryStatus, tracking, eta, tickets];
    default:
      return [
        order,
        client,
        product,
        amount,
        payment,
        stage,
        due,
        delivery,
        deliveryStatus,
        manager,
      ];
  }
}

function rowFor(row: OrderRowVM, mode: OrdersView["mode"]): DataRow {
  const cells: DataRow["cells"] = {
    order: {
      text: row.number,
      href: `/orders/${row.id}`,
      strong: true,
      secondary: row.createdAtLabel,
    },
    client: row.clientName,
    product: { text: row.productName, secondary: `${row.quantity} шт.` },
    amount: { text: row.amountLabel ?? "—", strong: true },
    payment: { text: row.paymentLabel, chip: { label: row.paymentLabel, tone: row.paymentTone } },
    stage: { text: row.stageLabel, chip: { label: row.stageLabel, tone: row.stageTone } },
    due: {
      text: row.dueLabel,
      tone: row.dueTone,
      secondary: row.overdue ? "Просрочено" : undefined,
    },
    assignee: row.assigneeName,
    delivery: { text: row.deliveryLabel, secondary: row.tracking || undefined },
    deliveryStatus: {
      text: row.deliveryStatusLabel,
      chip: { label: row.deliveryStatusLabel, tone: row.deliveryStatusTone },
    },
    tracking: { text: row.tracking || "—", mono: true },
    eta: row.etaLabel,
    tickets: {
      text: String(row.ticketsCount),
      href: row.ticketsCount > 0 && mode !== "production" ? "/service" : undefined,
    },
    manager: row.managerName,
  };

  if (mode === "production") {
    delete cells.client;
    delete cells.amount;
    delete cells.payment;
    delete cells.manager;
    delete cells.delivery;
    delete cells.deliveryStatus;
    delete cells.tracking;
    delete cells.eta;
    delete cells.tickets;
  }
  if (mode === "logistics") {
    delete cells.amount;
    delete cells.payment;
    delete cells.manager;
  }
  if (mode === "sales") {
    delete cells.delivery;
    delete cells.deliveryStatus;
    delete cells.tracking;
    delete cells.eta;
    delete cells.tickets;
  }
  return { id: row.id, cells };
}

export function OrdersTable({ data }: { data: OrdersView }) {
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState("all");
  const [stage, setStage] = useState("all");
  const [delivery, setDelivery] = useState("all");
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.rows.filter((row) => {
      if (query) {
        const haystack =
          `${row.number} ${row.clientName} ${row.productName} ${row.tracking}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (payment !== "all" && row.paymentKey !== payment) return false;
      if (stage !== "all" && row.stageKey !== stage) return false;
      if (delivery !== "all" && row.deliveryStatusKey !== delivery) return false;
      if (onlyOverdue && !row.overdue) return false;
      return true;
    });
  }, [data.rows, search, payment, stage, delivery, onlyOverdue]);

  const hasFilters =
    search !== "" || payment !== "all" || stage !== "all" || delivery !== "all" || onlyOverdue;

  function reset() {
    setSearch("");
    setPayment("all");
    setStage("all");
    setDelivery("all");
    setOnlyOverdue(false);
  }

  return (
    <Box>
      <Box
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
        sx={{ gap: 1.5, mb: 1.5 }}
      >
        <TextField
          label="Поиск"
          placeholder="Номер, клиент, продукт, трекинг"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
        />
        <TextField
          select
          label="Оплата"
          value={payment}
          onChange={(event) => setPayment(event.target.value)}
          fullWidth
        >
          {PAYMENT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Этап"
          value={stage}
          onChange={(event) => setStage(event.target.value)}
          fullWidth
        >
          {STAGE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Доставка"
          value={delivery}
          onChange={(event) => setDelivery(event.target.value)}
          fullWidth
        >
          {DELIVERY_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={onlyOverdue}
              onChange={(event) => setOnlyOverdue(event.target.checked)}
            />
          }
          label={<Typography variant="body2">Только просроченные</Typography>}
        />
        {hasFilters && (
          <Button size="small" onClick={reset}>
            Сбросить фильтры
          </Button>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
          Показано {filtered.length} из {data.rows.length}
        </Typography>
      </Box>
      <DataTable
        columns={columnsFor(data.mode)}
        rows={filtered.map((row) => rowFor(row, data.mode))}
        maxHeight={640}
        emptyText="По выбранным фильтрам заказов нет."
      />
    </Box>
  );
}
