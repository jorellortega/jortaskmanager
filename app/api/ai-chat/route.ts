import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { AIMessage, AISettingsMap } from '@/types';

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

// Call OpenAI API
async function callOpenAI(messages: AIMessage[], settings: AISettingsMap): Promise<{ message: string } | null> {
  const apiKey = settings['openai_api_key']?.trim();
  const model = settings['openai_model']?.trim() || 'gpt-4o-mini';

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return null;
    }

    const data = await response.json();
    const message = data?.choices?.[0]?.message?.content?.trim();

    if (!message) {
      return null;
    }

    return { message };
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return null;
  }
}

// Call Anthropic API (fallback)
async function callAnthropic(
  messages: AIMessage[],
  settings: AISettingsMap,
  systemPrompt?: string
): Promise<{ message: string } | null> {
  const apiKey = settings['anthropic_api_key']?.trim();
  const model = settings['anthropic_model']?.trim() || 'claude-3-5-sonnet-20241022';

  if (!apiKey) {
    return null;
  }

  try {
    // Filter out system messages and prepare for Anthropic
    const conversationMessages = messages.filter((m) => m.role !== 'system');
    const system = systemPrompt || messages.find((m) => m.role === 'system')?.content || '';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        system: system,
        messages: conversationMessages.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return null;
    }

    const data = await response.json();
    const message = data?.content?.[0]?.text?.trim();

    if (!message) {
      return null;
    }

    return { message };
  } catch (error) {
    console.error('Error calling Anthropic:', error);
    return null;
  }
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

    const body = await request.json();
    const { message, conversationHistory = [] } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get AI settings
    const { data: settingsData, error: settingsError } = await supabase.rpc('get_ai_settings');
    
    if (settingsError) {
      console.error('Error fetching AI settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch AI settings' }, { status: 500 });
    }

    const settings = mapSettings(settingsData || []);
    const systemPrompt = settings['system_prompt']?.trim();

    // Build messages array
    const messages: AIMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push(...conversationHistory);
    messages.push({ role: 'user', content: message.trim() });

    // Try OpenAI first, then Anthropic as fallback
    let responsePayload = await callOpenAI(messages, settings);
    
    if (!responsePayload) {
      responsePayload = await callAnthropic(messages, settings, systemPrompt);
    }

    if (!responsePayload) {
      return NextResponse.json(
        { error: 'AI service unavailable. Please check API keys in admin settings.' },
        { status: 503 }
      );
    }

    // Remove markdown bold formatting
    const cleanedMessage = responsePayload.message.replace(/\*\*(.*?)\*\*/g, '$1');

    return NextResponse.json({ message: cleanedMessage });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

