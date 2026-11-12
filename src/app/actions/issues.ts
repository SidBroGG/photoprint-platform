"use server";

import { revalidatePath } from "next/cache";
import type { DemoAccount } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { getDataset } from "@/lib/data/store";
import {
  assignIssue,
  claimIssue,
  createIssue,
  getIssueStore,
  releaseIssue,
  setIssueStatus,
  updateIssue,
  type IssueActor,
} from "@/lib/board/store";
import type {
  CreateIssueInput,
  IssueActionResult,
  IssueStatus,
  UpdateIssueInput,
} from "@/types/board";

function actorOf(account: DemoAccount): IssueActor {
  return {
    id: account.id,
    name: account.name,
    role: account.role,
    employeeId: account.employeeId,
  };
}

export async function createIssueAction(
  input: CreateIssueInput,
): Promise<IssueActionResult> {
  const account = await requireSession();
  const result = createIssue(getIssueStore(), actorOf(account), input);
  if (result.ok) {
    revalidatePath("/issues");
    revalidatePath("/dashboard");
    revalidatePath("/forecast");
    revalidatePath("/metrics");
  }
  return result;
}

export async function updateIssueAction(
  issueId: string,
  input: UpdateIssueInput,
): Promise<IssueActionResult> {
  const account = await requireSession();
  const result = updateIssue(getIssueStore(), actorOf(account), issueId, input);
  if (result.ok) revalidatePath("/issues");
  return result;
}

export async function setIssueStatusAction(
  issueId: string,
  status: IssueStatus,
): Promise<IssueActionResult> {
  const account = await requireSession();
  const result = setIssueStatus(getIssueStore(), actorOf(account), issueId, status);
  if (result.ok) revalidatePath("/issues");
  return result;
}

export async function claimIssueAction(issueId: string): Promise<IssueActionResult> {
  const account = await requireSession();
  const result = claimIssue(getIssueStore(), actorOf(account), issueId);
  if (result.ok) revalidatePath("/issues");
  return result;
}

export async function releaseIssueAction(issueId: string): Promise<IssueActionResult> {
  const account = await requireSession();
  const result = releaseIssue(getIssueStore(), actorOf(account), issueId);
  if (result.ok) revalidatePath("/issues");
  return result;
}

export async function assignIssueAction(
  issueId: string,
  employeeId: string,
): Promise<IssueActionResult> {
  const account = await requireSession();
  const employee = getDataset().employees.find((item) => item.id === employeeId);
  if (!employee) {
    return { ok: false, error: "Сотрудник не найден." };
  }
  const result = assignIssue(getIssueStore(), actorOf(account), issueId, {
    id: employee.id,
    name: employee.name,
    department: employee.department,
  });
  if (result.ok) {
    revalidatePath("/issues");
    revalidatePath("/dashboard");
  }
  return result;
}
