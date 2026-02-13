import React, { useState } from 'react';
import OfficialLayout from '@/components/layout/OfficialLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQueueTokens, useCallNextToken, useUpdateTokenStatus } from '@/hooks/useTokens';
import { Play, SkipForward, CheckCircle, RotateCcw, Clock, AlertCircle } from 'lucide-react';
import AshokaLoader from '@/components/ui/AshokaLoader';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';

const LiveQueue: React.FC = () => {
    const { language } = useLanguage();
    const { profile } = useAuth();
    const { data: queueTokens, isLoading } = useQueueTokens(profile?.assigned_office_id || undefined, profile?.assigned_department_id || undefined);
    const callNextMutation = useCallNextToken();
    const updateStatusMutation = useUpdateTokenStatus();

    // Derived state
    const currentlyServing = queueTokens?.find(t => t.status === 'serving');
    const waitingList = queueTokens?.filter(t => t.status === 'waiting') || [];
    const skippedList = queueTokens?.filter(t => t.status === 'skipped') || [];

    const handleCallNext = async () => {
        try {
            await callNextMutation.mutateAsync();
            toast.success(language === 'mr' ? 'पुढील टोकन बोलावले' : 'Calling next token');
        } catch (error) {
            toast.error("Failed to call next token");
        }
    };

    const handleComplete = async (tokenId: string) => {
        try {
            await updateStatusMutation.mutateAsync({ tokenId, status: 'completed' });
            toast.success("Service Completed");
        } catch (error) {
            toast.error("Error completing service");
        }
    };

    const handleSkip = async (tokenId: string) => {
        try {
            await updateStatusMutation.mutateAsync({ tokenId, status: 'skipped' });
            toast.info("Token Skipped");
        } catch (error) {
            toast.error("Error skipping token");
        }
    };

    const handleRecall = async (tokenId: string) => {
        try {
            // Logic to recall: Move from skipped back to waiting (or serving directly?)
            // For now, let's move to waiting (head of line? or end? Timestamp usually sorts it)
            await updateStatusMutation.mutateAsync({ tokenId, status: 'waiting' });
            toast.info("Token Recalled to Queue");
        } catch (error) {
            toast.error("Error recalling token");
        }
    };

    return (
        <OfficialLayout>
            <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">{language === 'mr' ? 'थेट रांग नियंत्रण' : 'Live Queue Control'}</h1>
                        <p className="text-muted-foreground">Manage the flow of citizens efficiently.</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold">
                            {waitingList.length} Waiting
                        </div>
                    </div>
                </div>

                {/* CURRENTLY SERVING */}
                <Card variant="elevated" className="border-l-4 border-l-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Play className="h-5 w-5 text-primary fill-current" />
                            {language === 'mr' ? 'सध्या सेवेत' : 'Now Serving'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {currentlyServing ? (
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h2 className="text-5xl font-bold font-mono text-primary mb-2">{currentlyServing.token_number}</h2>
                                    <p className="text-lg font-medium">{currentlyServing.service_name}</p>
                                    <p className="text-muted-foreground text-sm">Started at: {new Date(currentlyServing.updated_at).toLocaleTimeString()}</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Button size="lg" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleSkip(currentlyServing.id)}>
                                        <SkipForward className="mr-2 h-5 w-5" />
                                        Skip / No Show
                                    </Button>
                                    <Button size="lg" className="bg-success hover:bg-success/90 text-white" onClick={() => handleComplete(currentlyServing.id)}>
                                        <CheckCircle className="mr-2 h-5 w-5" />
                                        Complete Service
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                    <Clock className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-medium">Counter is Idle</h3>
                                    <p className="text-muted-foreground">Ready to serve the next citizen.</p>
                                </div>
                                <Button size="lg" onClick={handleCallNext} disabled={callNextMutation.isPending} className="mt-4">
                                    {callNextMutation.isPending ? <AshokaLoader size="sm" /> : <Play className="mr-2 h-5 w-5" />}
                                    Call Next Token
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* WAITING LIST */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            Up Next <Badge variant="secondary">{waitingList.length}</Badge>
                        </h2>
                        {isLoading ? (
                            <div className="py-8 flex justify-center"><AshokaLoader size="lg" /></div>
                        ) : waitingList.length === 0 ? (
                            <Card className="bg-muted/30 border-dashed">
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    Queue is empty. Relax! ☕
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {waitingList.map((token, i) => (
                                    <Card key={token.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg font-mono">{token.token_number}</p>
                                                    <p className="text-sm text-muted-foreground">{token.service_name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Wait time</p>
                                                <p className="font-medium text-sm">~{token.estimated_wait_minutes} min</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* MISSED / SKIPPED */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                            Missed/Skipped <Badge variant="outline">{skippedList.length}</Badge>
                        </h2>
                        {skippedList.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No skipped tokens.</p>
                        ) : (
                            <div className="space-y-2">
                                {skippedList.map((token) => (
                                    <div key={token.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50/50">
                                        <div>
                                            <p className="font-medium font-mono text-muted-foreground line-through decoration-red-500">{token.token_number}</p>
                                        </div>
                                        <Button size="sm" variant="ghost" className="h-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => handleRecall(token.id)}>
                                            <RotateCcw className="h-4 w-4 mr-1" /> Recall
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </OfficialLayout>
    );
};

export default LiveQueue;
