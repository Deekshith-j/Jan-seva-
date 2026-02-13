import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OfficialLayout from '@/components/layout/OfficialLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, FileText, CheckCircle, XCircle, Loader2, ExternalLink, ArrowLeft } from 'lucide-react';
import { useVerifyDocuments } from '@/hooks/useTokens';
import { toast } from 'sonner';

const VerificationPage: React.FC = () => {
    const { tokenId } = useParams<{ tokenId: string }>();
    const navigate = useNavigate();
    const { language } = useLanguage();
    const { profile } = useAuth(); // Get official profile
    const verifyMutation = useVerifyDocuments();

    const { data: token, isLoading } = useQuery({
        queryKey: ['token', tokenId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tokens')
                .select('*, profiles:user_id(full_name, phone_number)')
                .eq('id', tokenId)
                .single();
            if (error) throw error;

            // Check Department Authorization
            if (profile?.assigned_department_id && data.department_id !== profile.assigned_department_id) {
                throw new Error("Unauthorized: Token belongs to another department");
            }

            return data;
        },
        enabled: !!tokenId && !!profile, // Wait for profile to load
        retry: false, // Don't retry if unauthorized
    });

    const handleVerify = async () => {
        if (!tokenId) return;
        try {
            await verifyMutation.mutateAsync({ tokenId, verified: true });
            navigate('/official/dashboard');
        } catch (error) {
            // Handled by hook
        }
    };

    const handleReject = () => {
        if (window.confirm("Are you sure you want to reject this check-in?")) {
            // In future: Add reason. For now just navigate back.
            navigate('/official/dashboard');
            toast.info("Check-in rejected (Mock).");
        }
    };

    if (isLoading) {
        return (
            <OfficialLayout>
                <div className="flex justify-center items-center h-full min-h-[50vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </OfficialLayout>
        );
    }

    if (!token) {
        return (
            <OfficialLayout>
                <div className="text-center py-10">
                    <h2 className="text-xl font-bold">Token not found</h2>
                    <Button onClick={() => navigate('/official/scan')} variant="outline" className="mt-4">Back to Scanner</Button>
                </div>
            </OfficialLayout>
        );
    }

    return (
        <OfficialLayout>
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate('/official/scan')}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-2xl font-bold">Document Verification</h1>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Citizen Details */}
                    <Card variant="elevated">
                        <CardHeader>
                            <CardTitle>Citizen Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-primary/10 rounded-xl">
                                <p className="text-sm text-muted-foreground uppercase">Token</p>
                                <p className="text-4xl font-bold text-primary font-mono">{token.token_number}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Name</p>
                                <p className="text-lg font-medium">{(token.profiles as any)?.full_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Phone</p>
                                <p className="text-lg font-medium">{(token.profiles as any)?.phone_number || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Service</p>
                                <p className="text-lg font-medium">{token.service_name}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card variant="elevated">
                        <CardHeader>
                            <CardTitle>Review Documents</CardTitle>
                            <CardDescription>Click to open and verify original documents.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(!token.document_urls || Object.keys(token.document_urls).length === 0) ? (
                                <div className="p-8 border border-dashed rounded-xl text-center text-muted-foreground">
                                    No documents uploaded.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(token.document_urls).map(([name, url]: [string, any]) => (
                                        <a
                                            key={name}
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center p-4 border rounded-lg hover:bg-muted transition-colors"
                                        >
                                            <FileText className="h-5 w-5 text-primary mr-3" />
                                            <span className="font-medium flex-1">{name}</span>
                                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Action Bar */}
                <Card variant="elevated" className="border-t-4 border-t-primary">
                    <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-center md:text-left">
                            <h3 className="font-semibold text-lg">Verification Decision</h3>
                            <p className="text-muted-foreground text-sm">Verify all documents before accepting to queue.</p>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <Button variant="outline" size="lg" className="flex-1 md:flex-none text-destructive hover:text-destructive" onClick={handleReject}>
                                <XCircle className="mr-2 h-5 w-5" />
                                Reject
                            </Button>
                            <Button size="lg" className="flex-1 md:flex-none bg-success hover:bg-success/90 text-white shadow-lg shadow-success/20" onClick={handleVerify} disabled={verifyMutation.isPending}>
                                {verifyMutation.isPending ? <Loader2 className="animate-spin" /> :
                                    <>
                                        <CheckCircle className="mr-2 h-5 w-5" />
                                        Verify & Add to Queue
                                    </>
                                }
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </OfficialLayout>
    );
};

export default VerificationPage;
