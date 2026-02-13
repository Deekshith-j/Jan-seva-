import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Start of Selection
serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { audio, language } = await req.json();

        if (!audio) {
            throw new Error('No audio data provided');
        }

        // Use the provided key from secrets
        const openAIKey = Deno.env.get('OPENAI_API_KEY');

        if (!openAIKey) {
            throw new Error('Server Configuration Error: Missing OpenAI API Key in Secrets.');
        }

        // 1. Convert Base64 to Blob
        const binaryString = atob(audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const file = new Blob([bytes], { type: "audio/webm" });

        // 2. Prepare FormData for Whisper
        const formData = new FormData();
        formData.append("file", file, "recording.webm");
        formData.append("model", "whisper-1");
        if (language === 'mr') {
            formData.append("language", "mr");
        }

        // 3. Call Whisper API
        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAIKey}`,
            },
            body: formData,
        });

        if (!whisperResponse.ok) {
            const err = await whisperResponse.json();
            console.error('Whisper Error:', err);
            throw new Error(`Whisper API Error: ${err.error?.message}`);
        }

        const whisperData = await whisperResponse.json();
        const transcribedText = whisperData.text;

        console.log("Transcribed Text:", transcribedText);

        // 4. Call Chat API with the transcribed text
        const systemPrompt = language === 'mr'
            ? "You are a helpful AI assistant for the Government of Maharashtra SEVA PALI portal. Answer concisely in Marathi."
            : "You are a helpful AI assistant for the Government of Maharashtra SEVA PALI portal. Answer concisely.";

        const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAIKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                max_tokens: 800, // User specified limit: 500-1000
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: transcribedText }
                ],
            }),
        });

        if (!chatResponse.ok) {
            const err = await chatResponse.json();
            throw new Error(`Chat API Error: ${err.error?.message}`);
        }

        const chatData = await chatResponse.json();
        const replyText = chatData.choices[0].message.content;

        return new Response(JSON.stringify({
            query: transcribedText,
            response: replyText
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
