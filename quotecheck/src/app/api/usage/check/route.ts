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

    // Check user quota using the database function
    const { data, error } = await supabase
      .rpc('check_user_quota', { p_user_id: user.id });

    if (error) {
      console.error('Error checking quota:', error);
      return NextResponse.json({ error: 'Failed to check quota' }, { status: 500 });
    }

    const quotaInfo = data?.[0] || {
      has_quota: false,
      quotes_used: 0,
      quotes_limit: 0,
      is_subscribed: false
    };

    return NextResponse.json({
      hasQuota: quotaInfo.has_quota,
      quotesUsed: quotaInfo.quotes_used,
      quotesLimit: quotaInfo.quotes_limit,
      isSubscribed: quotaInfo.is_subscribed,
      quotesRemaining: quotaInfo.quotes_limit - quotaInfo.quotes_used
    });
  } catch (error) {
    console.error('Check usage error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
