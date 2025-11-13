import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { endpoint, credits, requestData } = await request.json();
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Get user from Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 });
    }

    if (!endpoint || !credits || credits <= 0) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    // Check if user has enough credits
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (creditsError || !userCredits) {
      return NextResponse.json({ error: 'Failed to fetch user credits' }, { status: 500 });
    }

    if (userCredits.balance < credits) {
      return NextResponse.json({ 
        error: 'Insufficient credits',
        credits: userCredits.balance,
        required: credits 
      }, { status: 402 });
    }

    // Deduct credits and record usage
    const { error: deductError } = await supabase.rpc('deduct_user_credits', {
      user_id: user.id,
      credits: credits,
      description: `API usage: ${endpoint}`
    });

    if (deductError) {
      console.error('Error deducting credits:', deductError);
      return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 });
    }

    // Record API usage
    const { error: usageError } = await supabase
      .from('api_usage')
      .insert({
        user_id: user.id,
        endpoint: endpoint,
        credits_used: credits,
        request_data: requestData,
        response_status: 200,
      });

    if (usageError) {
      console.error('Error recording API usage:', usageError);
    }

    return NextResponse.json({ 
      success: true, 
      remaining_credits: userCredits.balance - credits 
    });
  } catch (error) {
    console.error('Error using credits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
