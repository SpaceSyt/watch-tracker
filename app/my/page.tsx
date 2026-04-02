import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function MyListPage() {
  if (!hasSupabaseEnv()) {
    return (
      <PageShell
        eyebrow="Library"
        title="My List"
        description="Supabase environment variables are not configured yet. Add them before testing the protected page."
      />
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userEmail = user?.email ?? "Signed-in user";

  return (
    <PageShell
      eyebrow="Library"
      title="My List"
      description="This page is now login-protected. It is still only a placeholder shell for future personal watch-list features."
    >
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
        <p className="text-sm text-zinc-500">Authenticated user</p>
        <p className="mt-2 text-base font-medium text-zinc-900">{userEmail}</p>
      </div>
    </PageShell>
  );
}
