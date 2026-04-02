import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { PageShell } from "@/components/page-shell";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function SignupPage() {
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
      title="Sign Up"
      description="Create an account with an email address and password. No profile setup or business data is added at this stage."
    >
      <AuthForm mode="signup" />
    </PageShell>
  );
}
