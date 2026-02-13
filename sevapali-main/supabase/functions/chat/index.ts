import { serve } from "https://deno.land/std@0.168.0/http/server.ts";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, language, tools, tool_choice } = await req.json();

    const systemPrompt = language === 'mr'
      ? "You are a helpful AI assistant for 'JanSeva', the Government of Maharashtra's unified service portal. Answer questions about schemes, offices, and services in Marathi. Be concise and polite."
      : "You are a helpful AI assistant for 'JanSeva', the Government of Maharashtra's unified service portal. Answer questions about schemes, offices, and services. Be concise and polite.";

    // Securely get API Key from Supabase Secrets
    const openAIKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIKey) {
      throw new Error('Server Configuration Error: Missing OpenAI API Key in Secrets.');
    }

    const body: any = {
      model: 'gpt-4o-mini',
      max_tokens: 800, // User specified limit: 500-1000
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      stream: false,
    };

    if (tools) body.tools = tools;
    if (tool_choice) body.tool_choice = tool_choice;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();

    // Return the full message object to allow client to handle tool_calls and content
    return new Response(JSON.stringify({
      message: data.choices[0].message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Critical Error:", error);
    return new Response(JSON.stringify({ reply: `System Error: ${error.message}` }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
