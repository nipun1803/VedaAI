import { PaperClient } from "@/features/paper/PaperClient";

export default async function PaperPage({
  params
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  return <PaperClient assignmentId={assignmentId} />;
}

