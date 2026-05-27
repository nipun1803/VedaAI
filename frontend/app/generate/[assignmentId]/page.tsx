import { GenerationClient } from "@/features/generation/GenerationClient";

export default async function GeneratePage({
  params
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  return <GenerationClient assignmentId={assignmentId} />;
}

