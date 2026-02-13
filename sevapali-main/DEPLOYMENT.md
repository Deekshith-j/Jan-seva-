# SevaPali - Deployment Guide 🚀

This guide details how to deploy the **SevaPali** application, including the **React Frontend**, **Supabase Backend** (Database, Auth, Storage), and **Edge Functions** (AI features).

---

## 📋 Prerequisites

Ensure you have the following installed:
1.  **Node.js** (v18+) & **npm**
2.  **Supabase CLI**: `npm install -g supabase`
3.  **Git**
4.  **Vercel CLI** (Optional, for frontend): `npm install -g vercel`

---

## 🛠️ Backend Setup (Supabase)

### 1. Create a Supabase Project
1.  Go to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2.  Note your **Project Reference ID** (e.g., `awxgatacmaxonteiyyqc`).
3.  Note your **Anon Key** and **URL** from Project Settings -> API.

### 2. Link Project Locally
Run the following in your terminal:
```bash
npx supabase login
npx supabase link --project-ref <your-project-id>
# Enter your database password when prompted
```

### 3. Push Database Schema
Apply the database migrations to your remote project:
```bash
npx supabase db push
```
*This creates all tables (offices, services, tokens) and enables Row Level Security (RLS).*

### 4. Configure Storage
The app requires a public bucket named `documents` for file uploads.
1.  Go to **Storage** in Supabase Dashboard.
2.  Create a new bucket named **`documents`**.
3.  Toggle **"Public bucket"** to ON.
4.  Save.
*(Alternatively, run: `npx supabase storage create documents --public`)*

### 5. Deploy Edge Functions (AI Features)
Deploy the AI-powered functions (`chat`, `handle-voice-query`, `analyze-document`).
**Important**: We use `--no-verify-jwt` to allow the frontend to call them easily (or configured with Anon key).

```bash
npx supabase functions deploy chat --no-verify-jwt
npx supabase functions deploy handle-voice-query --no-verify-jwt
npx supabase functions deploy analyze-document --no-verify-jwt
```

### 6. Set Environment Secrets (API Keys)
The functions need your **OpenAI API Key**.
```bash
npx supabase secrets set OPENAI_API_KEY=sk-... --project-ref <your-project-id>
```

---

## 🎨 Frontend Setup (Vercel / Netlify / Static)

### 1. Environment Variables
Create a file `.env.production` (or set these in your deployment platform settings):

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

### 2. Build for Production
```bash
npm install
npm run build
```
This generates the `dist/` folder containing the static site.

### 3. Deploy to Vercel (Recommended)
1.  Install Vercel CLI: `npm i -g vercel`
2.  Run deploy:
    ```bash
    vercel
    ```
3.  Follow prompts. Select `Vite` as the framework if asked.
4.  **Add Environment Variables** in Vercel Dashboard -> Settings -> Environment Variables.

---

## ✅ Verification Checklist

- [ ] **Database**: Tables (`offices`, `services`) are populated? (Check Table Editor)
- [ ] **Storage**: Can you upload a file in "Book Token" -> Document Step?
- [ ] **AI Chat**: Does the chatbot answer "Hello"?
- [ ] **Voice**: Does the microphone icon record and transcribe?

---

## 🐞 Troubleshooting

**AI Not Working (401 / 500 Errors)?**
- Check **Edge Function Logs** in Supabase Dashboard.
- Verify `OPENAI_API_KEY` is set in Secrets.
- Ensure functions are deployed with `--no-verify-jwt` if calling from public client without strict auth session.

**Upload Failed (400 Error)?**
- Ensure `documents` bucket exists and is **Public**.
- Check RLS policies on `storage.objects`.

---
*Built with ❤️ by SevaPali Team*
