import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { scheme, userDetails, language } = await req.json();

    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('Missing OpenAI API Key');
    }

    const systemPrompt = "You are an expert government scheme eligibility checker. Analyze the user details against the scheme criteria and determine if they are eligible. Return valid JSON only.";

    const userPrompt = `
      Scheme: ${JSON.stringify(scheme)}
      User Details: ${JSON.stringify(userDetails)}
      Language: ${language}
      
      Determine eligibility.
      Return JSON format:
      {
        "eligible": boolean,
        "reason": "Clear explanation in ${language === 'mr' ? 'Marathi' : 'English'}"
      }
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2, // Lower temperature for more deterministic results
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const result = data.choices[0].message.content;

    // Parse the JSON from the AI response
    let parsedResult;
    try {
      // Find the first '{' and last '}' to extract JSON
      const jsonStart = result.indexOf('{');
      const jsonEnd = result.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        parsedResult = JSON.parse(result.substring(jsonStart, jsonEnd + 1));
      } else {
        parsedResult = JSON.parse(result);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", result);
      parsedResult = { eligible: false, reason: "Could not refer eligibility. Please try again." };
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
