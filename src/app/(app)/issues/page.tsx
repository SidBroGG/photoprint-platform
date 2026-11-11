import { requirePage } from "@/lib/auth/session";
import { getIssueBoardView } from "@/lib/view/issues";
import { IssueBoard } from "@/components/issues/IssueBoard";

export default async function IssuesPage() {
  const account = await requirePage("issues");
  return <IssueBoard data={getIssueBoardView(account)} />;
}
