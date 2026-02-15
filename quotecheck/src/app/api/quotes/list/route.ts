import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
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

    // Fetch user's quotes
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
      return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
    }

    // Transform data to match expected format
    const quotes = data.map((quote) => ({
      id: quote.id,
      date: quote.created_at,
      category: quote.category,
      vendor: quote.vendor,
      totalQuoted: parseFloat(quote.total_quoted),
      fairMid: parseFloat(quote.fair_mid),
      savings: parseFloat(quote.savings),
      score: quote.score,
      verdict: quote.verdict,
      itemCount: quote.quote_data?.items?.length || 0,
    }));

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error('List quotes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
