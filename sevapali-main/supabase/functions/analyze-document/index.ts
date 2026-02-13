
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
        const { documentUrl, documentType } = await req.json();

        if (!documentUrl || !documentType) {
            throw new Error('Missing documentUrl or documentType');
        }

        const openAIKey = Deno.env.get('OPENAI_API_KEY');

        if (!openAIKey) {
            throw new Error('Missing OpenAI API Key');
        }

        const systemPrompt = `You are a strict document verification AI for the Government of Maharashtra.
    You will be given an image URL and a document type (e.g., "Aadhaar Card", "PAN Card", "Driving License").
    Your job is to analyze the image and determine if it appears to be a valid document of that type.

    Return a JSON object with:
    - "valid": boolean (true of false)
    - "confidence": number (0-100 score of how sure you are)
    - "issues": string[] (list of specific problems like "Blurry", "Cut off", "Wrong document type")
    - "suggestions": string[] (tips to fix, e.g., "Retake photo in better light")

    Do not read strict PII details, just verify the document *structure* and *visual identity* matches the type.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAIKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // or gpt-4o if available and affordable, mini is good for speed/cost
                max_tokens: 300,
                messages: [
                    { role: 'system', content: systemPrompt },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: `Verify if this image is a valid ${documentType}.` },
                            { type: 'image_url', image_url: { url: documentUrl } }
                        ]
                    }
                ],
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API error');
        }

        const data = await response.json();
        let content = data.choices[0].message.content;

        // Clean up markdown block if present
        if (content.startsWith('```json')) {
            content = content.replace('```json', '').replace('```', '');
        }

        const result = JSON.parse(content);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("Verification Error:", error);
        return new Response(JSON.stringify({ valid: false, reason: `Error: ${error.message}` }), {
            status: 200, // Return 200 so frontend can handle logic gracefully
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
