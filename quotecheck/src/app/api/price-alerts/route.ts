import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  return authHeader ? authHeader.replace("Bearer ", "") : null;
}

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: alerts, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch alerts error:", error);
      return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
    }

    return NextResponse.json(alerts || []);
  } catch (error) {
    console.error("Price alerts GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { serviceCategory, zipCode } = body;

    if (!serviceCategory || !zipCode) {
      return NextResponse.json({ error: "Category and zip code required" }, { status: 400 });
    }

    const { data: alert, error } = await supabase
      .from("price_alerts")
      .upsert(
        {
          user_id: user.id,
          service_category: serviceCategory,
          zip_code: zipCode,
          email: user.email || "",
          is_active: true,
        },
        { onConflict: "user_id,service_category,zip_code" }
      )
      .select()
      .single();

    if (error) {
      console.error("Create alert error:", error);
      return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Price alerts POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const alertId = searchParams.get("id");

    if (!alertId) {
      return NextResponse.json({ error: "Alert ID required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("price_alerts")
      .delete()
      .eq("id", alertId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete alert error:", error);
      return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Price alerts DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
