import { redirect } from "next/navigation";

export default async function DatasetsRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dataset/${encodeURIComponent(id)}`);
}
