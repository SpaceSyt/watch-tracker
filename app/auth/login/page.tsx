import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { PageShell } from "@/components/page-shell";
import { getServerDictionary } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function LoginPage() {
  const dictionary = await getServerDictionary();

  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();

    if (data?.claims) {
      redirect("/my");
    }
  }

  return (
    <PageShell
      eyebrow={dictionary.auth.eyebrow}
      title={dictionary.auth.loginTitle}
      description={dictionary.auth.loginDescription}
    >
      <AuthForm mode="login" />
    </PageShell>
  );
}
