import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quoteData = await request.json();

    // Insert quote into database
    const { data, error } = await supabase
      .from('quotes')
      .insert({
        user_id: user.id,
        category: quoteData.category,
        vendor: quoteData.vendor,
        total_quoted: quoteData.totalQuoted,
        fair_mid: quoteData.fairMid,
        savings: quoteData.savings,
        score: quoteData.score,
        verdict: quoteData.verdict,
        quote_data: quoteData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving quote:', error);
      return NextResponse.json({ error: 'Failed to save quote' }, { status: 500 });
    }

    return NextResponse.json({ success: true, quote: data });
  } catch (error) {
    console.error('Save quote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
