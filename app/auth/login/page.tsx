import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { PageShell } from "@/components/page-shell";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function LoginPage() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();

    if (data?.claims) {
      redirect("/my");
    }
  }

  return (
    <PageShell
      eyebrow="Auth"
      title="Login"
      description="Log in with your email and password. This page is intentionally simple and only covers the base auth flow."
    >
      <AuthForm mode="login" />
    </PageShell>
  );
}
