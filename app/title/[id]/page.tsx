import { PageShell } from "@/components/page-shell";

type TitleDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TitleDetailPage({
  params,
}: TitleDetailPageProps) {
  const { id } = await params;

  return (
    <PageShell
      eyebrow="Dynamic Route"
      title={`Title ${id}`}
      description="This placeholder page confirms that the dynamic title detail route is working. Later it can render title metadata, status, and watch progress."
    >
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
        <p className="text-sm text-zinc-500">Current route param</p>
        <p className="mt-2 font-mono text-lg text-zinc-900">{id}</p>
      </div>
    </PageShell>
  );
}
