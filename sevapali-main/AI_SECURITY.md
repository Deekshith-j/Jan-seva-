# 🔐 Securing AI Keys

Your AI features are designed to run securely via Supabase Edge Functions. This ensures your **OpenAI API Key** is never exposed to the frontend browser.

## 1. Set API Key in Supabase
You need to store your keys as encrypted secrets in your Supabase project.

### Option A: Using Supabase CLI (Recommended)
Run this command in your terminal:
```bash
npx supabase secrets set OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Option B: Using Supabase Dashboard
1. Go to your Supabase Project Dashboard.
2. Navigate to **Settings** -> **Edge Functions**.
3. Click **"Add new secret"**.
4. Name: `OPENAI_API_KEY`
5. Value: `sk-...` (your key).

## 2. Verify Frontend Code
We have cleaned up `src/services/ai.ts` to ensure it **never** tries to read local `.env` files for this key. It only calls:
- `supabase.functions.invoke('chat')`
- `supabase.functions.invoke('handle-voice-query')`

## 3. Deploy Functions
After setting the secrets, ensure your functions are deployed:
```bash
npx supabase functions deploy chat
npx supabase functions deploy handle-voice-query
```
