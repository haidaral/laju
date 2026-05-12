import { getAuthReadiness } from "../../lib/laju-server-boundary";
import { getSupabaseAdminClient } from "../../lib/laju-supabase";

export async function GET() {
  const readiness = getAuthReadiness();
  const result: {
    auth: { configured: boolean; missingEnvVars: string[] };
    db: { ok: boolean; error?: string };
  } = {
    auth: {
      configured: readiness.configured,
      missingEnvVars: readiness.missingEnvVars
    },
    db: {
      ok: false
    }
  };

  if (!readiness.configured) {
    return Response.json(result, { status: 200 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("entries").select("id", { head: true, count: "exact" }).limit(1);
    if (error) {
      result.db = { ok: false, error: error.message };
    } else {
      result.db = { ok: true };
    }
  } catch (error) {
    result.db = { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }

  return Response.json(result, { status: 200 });
}
