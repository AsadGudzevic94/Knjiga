import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  return authHeader ? authHeader.replace("Bearer ", "") : null;
}

export async function GET(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  let query = supabase
    .from("email_analyses")
    .select(
      "id, from_email, from_name, subject, received_at, analysis_status, detected_category, detected_vendor, detected_zip, analysis_result, draft_reply, error_message, notified_at",
      { count: "exact" }
    )
    .eq("user_id", user.id)
    .order("received_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("analysis_status", status);
  }

  const { data: analyses, count, error } = await query;

  if (error) {
    console.error("[EmailAnalyses] Query error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analyses" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    analyses: analyses || [],
    total: count || 0,
    limit,
    offset,
  });
}

export async function DELETE(request: NextRequest) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("email_analyses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[EmailAnalyses] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
