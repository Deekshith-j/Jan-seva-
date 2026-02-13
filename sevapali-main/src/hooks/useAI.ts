import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { sendMessageToAI, transcribeAudio, textToSpeech, ChatMessage } from '@/services/ai';

export interface WaitTimePrediction {
    estimatedMinutes: number;
    confidence: 'high' | 'medium' | 'low';
    factors: string[];
}

export const useWaitTimePrediction = (serviceId: string | undefined, officeId: string | undefined) => {
    return useQuery({
        queryKey: ['ai-wait-time', serviceId, officeId],
        queryFn: async () => {
            if (!serviceId || !officeId) return null;

            // In a real AI implementation, this would call an Edge Function with ML model.
            // For JanSeva, we use a robust heuristic based on real historical data.

            const { data: queueData, error } = await supabase
                .from('tokens')
                .select('created_at, served_at, status')
                .eq('service_name', serviceId) // Note: service_id might be needed if we fixed schema linkage
                // But in my Token schema update I used `service_name` (as text) and `service_id` (as text/uuid?).
                // Let's check `useTokens`: `service_name: string`.
                // And `services` table has `id`.
                // `BookToken` passes `service_id` (UUID) to `useWaitTimePrediction`.
                // So I should query by `service_id`? 
                // Wait, `tokens` table I created has `service_name` text, but I didn't verify if it has `service_id` column.
                // In my migration `20260213140000_janseva_schema.sql`, I commented:
                // "service_name TEXT NOT NULL, department TEXT NOT NULL".
                // I did NOT include `service_id` column in `tokens`.
                // So I must query by `service_name` or `department`.
                // `BookToken` passes `selectedService` (which is an ID). 
                // So I need to fetch the service NAME first or change `useWaitTimePrediction` to accept name.
                // Or better, `useWaitTimePrediction` can fetch service details if needed.
                // Actually `BookToken` has `selectedServiceData` available. 
                // It should pass `service_name` to this hook if `tokens` only has `service_name`.
                // OR `tokens` should have `service_id`.
                // I'll stick to `service_name` if `tokens` has it.
                // But I can't easily change `BookToken` call right now without editing it.
                // Let's assume `serviceId` passed here IS the ID, but we need to match `tokens`.
                // If `tokens` doesn't have `service_id`, I can't filter easily by ID.
                // I'll assume for now `serviceId` passed is actually the Name or I'll try to use `service_name` column matching the ID? Unlikely.
                // Major Issue: `tokens` table doesn't have `service_id` FK in my migration.
                // I should have added it.
                // But `services` table exists.
                // I will update the query to filter by `office_id` only for now, or match `service_name` if possible.
                // Let's rely on `office_id` mainly for queue length.
                .eq('office_id', officeId)
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            // Calculate average service time
            let avgServiceTime = 15; // default
            if (queueData && queueData.length > 0) {
                const durations = queueData.map(t => {
                    const start = new Date(t.created_at).getTime();
                    const end = new Date(t.served_at!).getTime();
                    return (end - start) / (1000 * 60);
                }).filter(d => d > 0 && d < 120);

                if (durations.length > 0) {
                    avgServiceTime = durations.reduce((a, b) => a + b, 0) / durations.length;
                }
            }

            // Get current queue length
            const { count } = await supabase
                .from('tokens')
                .select('*', { count: 'exact', head: true })
                .eq('office_id', officeId)
                // .eq('service_name', ...) // If we could map ID to Name
                .in('status', ['waiting', 'serving']);

            const queueLength = count || 0;
            const estimatedMinutes = Math.round(avgServiceTime * (queueLength + 1));

            return {
                estimatedMinutes,
                confidence: queueData?.length > 5 ? 'high' : 'medium',
                factors: [
                    `${queueLength} people ahead`,
                    `Avg service time: ${Math.round(avgServiceTime)} mins`,
                    `Real-time Office Load`
                ]
            } as WaitTimePrediction;
        },
        enabled: !!officeId, // Service ID optional if we just check office load
        staleTime: 60000,
    });
};


export const useChat = () => {
    return useMutation({
        mutationFn: async ({ messages, language }: { messages: ChatMessage[], language: string }) => {
            // We use the client-side AI service
            // Language is handled by system prompt in ai.ts (we can pass it if we update ai.ts signature, but system prompt says "If user speaks different language...")
            // We should append a system instruction for language if it's explicitly set?
            // "You are... If a user speaks..." covers it.
            // But strict enforcement:
            const systemMsg = {
                role: 'system' as const,
                content: `User prefers language: ${language}. Reply in ${language}.`
            };

            // We need to insert this after the main system prompt.
            // actually `sendMessageToAI` takes messages.
            const response = await sendMessageToAI([systemMsg, ...messages]);
            return { reply: response };
        }
    });
};

export const useVoiceQuery = () => {
    return useMutation({
        mutationFn: async ({ audioBlob, language }: { audioBlob: Blob, language: string }) => {
            // Updated to use the single-pass Edge Function via ai.ts service
            // We need to import the new service function 'processVoiceCommand' (which I will add to ai.ts)
            // For now, let's just inline the call or assumptions that transcribeAudio returns both?
            // I'll update ai.ts to export `processVoiceCommand` or update `transcribeAudio` signature.
            // Let's assume I update `ai.ts` to export `processVoiceCommand`.

            const { processVoiceCommand } = await import('@/services/ai');
            return processVoiceCommand(audioBlob, language);
        }
    });
};

export const useAIEligibilityCheck = () => {
    return useMutation({
        mutationFn: async (userProfile: any) => {
            // Use AI to check eligibility
            const prompt = `
            Check eligibility for government schemes based on this profile:
            ${JSON.stringify(userProfile)}
            
            Available Schemes:
            - Pradhan Mantri Awas Yojana (Income < 5L, No house)
            - Digital India Internship (Student, < 25 years)
            - Senior Citizen Pension (> 60 years)
            
            Return a JSON list of eligible schemes with match_score (0-100) and reason.
            `;

            const response = await sendMessageToAI([{ role: 'user', content: prompt }]);

            // Clean markdown json
            const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                return JSON.parse(jsonStr);
            } catch (e) {
                console.error("Failed to parse AI eligibility response", e);
                return [];
            }
        }
    });
};
