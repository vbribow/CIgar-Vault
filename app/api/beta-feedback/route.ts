import { NextResponse } from "next/server";
import { BetaFeedbackInput } from "@/lib/beta-feedback";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Account service is not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view beta feedback" }, { status: 401 });
  const { data, error } = await supabase
    .from("beta_feedback")
    .select("id,mode,category,severity,page_url,summary,details,device,task_outcome,experience_score,trust_score,learning_depth_score,recommendation_score,expected_result,observed_result,language_context,regional_perspective,heard_pronunciation,spelling_from_audio,name_associations,cultural_fit,status,founder_note,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ data: data || [] });
}

export async function POST(request: Request) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "Account service is not configured" }, { status: 503 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to send beta feedback" }, { status: 401 });
  try {
    const input = BetaFeedbackInput.parse(await request.json());
    const { data, error } = await supabase.from("beta_feedback").insert({
      user_id: user.id,
      mode: input.mode,
      category: input.category,
      severity: input.severity,
      page_url: input.pageUrl || null,
      summary: input.summary,
      details: input.details,
      device: input.device || null,
      task_outcome: input.taskOutcome || null,
      experience_score: input.experienceScore ?? null,
      trust_score: input.trustScore ?? null,
      learning_depth_score: input.learningDepthScore ?? null,
      recommendation_score: input.recommendationScore ?? null,
      expected_result: input.expectedResult || null,
      observed_result: input.observedResult || null,
      language_context: input.languageContext || null,
      regional_perspective: input.regionalPerspective || null,
      heard_pronunciation: input.heardPronunciation || null,
      spelling_from_audio: input.spellingFromAudio || null,
      name_associations: input.nameAssociations || null,
      cultural_fit: input.culturalFit || null,
      user_agent: request.headers.get("user-agent"),
    }).select("*").single();
    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid beta feedback" }, { status: 422 });
  }
}
