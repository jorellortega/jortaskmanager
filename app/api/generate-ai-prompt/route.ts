import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { AISettingsMap } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to map settings array to object
function mapSettings(settings: any[]): AISettingsMap {
  const map: AISettingsMap = {};
  if (settings) {
    settings.forEach((s) => {
      map[s.setting_key] = s.setting_value;
    });
  }
  return map;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Get user from Supabase
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 });
    }

    // Check if user is admin from public.users table
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const userRole = userData?.role || user.user_metadata?.role || 'user';
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get AI settings for OpenAI key
    const { data: settingsData, error: settingsError } = await supabase.rpc('get_ai_settings');
    
    if (settingsError) {
      console.error('Error fetching AI settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch AI settings' }, { status: 500 });
    }

    const settings = mapSettings(settingsData || []);
    const openaiKey = settings['openai_api_key']?.trim();

    if (!openaiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 400 }
      );
    }

    // Call OpenAI to improve the prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: settings['openai_model']?.trim() || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing clear, effective system prompts for AI assistants. Improve the given prompt while maintaining its core intent and structure.',
          },
          {
            role: 'user',
            content: `Please improve the following system prompt while keeping its structure and main purpose:\n\n${prompt}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate improved prompt' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const improvedPrompt = data?.choices?.[0]?.message?.content?.trim();

    if (!improvedPrompt) {
      return NextResponse.json(
        { error: 'No improved prompt generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({ prompt: improvedPrompt });
  } catch (error) {
    console.error('Error generating AI prompt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

