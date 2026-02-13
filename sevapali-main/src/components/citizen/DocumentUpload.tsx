
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Upload, FileText, Loader2, AlertTriangle, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AIAnalysisResult {
    valid: boolean;
    confidence: number;
    issues: string[];
    suggestions: string[];
}

interface DocumentUploadProps {
    label: string;
    docType: string;
    onUploadComplete: (url: string, isValid: boolean) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ label, docType, onUploadComplete }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setAnalysis(null); // Reset previous analysis

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            setUploadedUrl(publicUrl);
            toast.success("Uploaded! Analyzing...");

            // 2. Trigger AI Analysis
            await analyzeDocument(publicUrl);

        } catch (error: any) {
            toast.error('Upload failed: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const analyzeDocument = async (url: string) => {
        setIsAnalyzing(true);
        try {
            const { data, error } = await supabase.functions.invoke('analyze-document', {
                body: { documentUrl: url, documentType: docType }
            });

            if (error) throw error;

            setAnalysis(data);
            onUploadComplete(url, data.valid);

            if (data.valid) {
                toast.success("Document Verified by AI!");
                if (data.confidence < 80) toast.warning(`Confidence low (${data.confidence}%). Please check details.`);
            } else {
                toast.error("Document analysis failed. See details.");
            }

        } catch (error: any) {
            console.error("AI Analysis Error:", error);
            toast.error("AI Analysis failed. Manual verification required.");
            // Fallback: Assume uploaded but unverified
            onUploadComplete(url, true);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <Card className={cn("border-2 border-dashed transition-all",
            analysis?.valid === true ? "border-green-500 bg-green-50/20" :
                analysis?.valid === false ? "border-red-300 bg-red-50/20" : "border-gray-200"
        )}>
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                    <FileText className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="font-semibold">{label}</h3>
                    <p className="text-xs text-muted-foreground">Upload clear photo of {docType}</p>
                </div>

                {!uploadedUrl ? (
                    <div className="w-full">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id={`upload-${docType}`}
                            disabled={isUploading}
                        />
                        <label htmlFor={`upload-${docType}`}>
                            <Button variant="outline" className="w-full cursor-pointer" asChild disabled={isUploading}>
                                <span>
                                    {isUploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {isUploading ? "Uploading..." : "Select File"}
                                </span>
                            </Button>
                        </label>
                    </div>
                ) : (
                    <div className="w-full space-y-3">
                        <div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg">
                            <span className="truncate max-w-[150px] text-muted-foreground">Document Uploaded</span>
                            <Button variant="ghost" size="sm" onClick={() => { setUploadedUrl(null); setAnalysis(null); }}>
                                Change
                            </Button>
                        </div>

                        {isAnalyzing && (
                            <div className="flex items-center justify-center p-4 text-sm text-blue-600 animate-pulse">
                                <BrainIcon className="mr-2 h-4 w-4" />
                                Analyzing Document Structure...
                            </div>
                        )}

                        {analysis && (
                            <div className="animate-in fade-in slide-in-from-top-2 text-left">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant={analysis.valid ? "default" : "destructive"}
                                        className={cn(analysis.valid ? "bg-green-600" : "bg-red-600")}>
                                        {analysis.valid ? "VALID DOCUMENT" : "INVALID / UNCLEAR"}
                                    </Badge>
                                    <span className={cn("text-xs font-bold",
                                        analysis.confidence > 80 ? "text-green-600" : "text-orange-500")}>
                                        {analysis.confidence}% Confidence
                                    </span>
                                </div>

                                {analysis.issues && analysis.issues.length > 0 && (
                                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-xs text-red-700 space-y-1">
                                        <p className="font-semibold flex items-center"><AlertTriangle className="h-3 w-3 mr-1" /> Issues Detected:</p>
                                        <ul className="list-disc list-inside pl-1">
                                            {analysis.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                                        </ul>
                                    </div>
                                )}

                                {analysis.suggestions && analysis.suggestions.length > 0 && (
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700 space-y-1 mt-2">
                                        <p className="font-semibold flex items-center"><Lightbulb className="h-3 w-3 mr-1" /> Suggestion:</p>
                                        <ul className="list-disc list-inside pl-1">
                                            {analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const BrainIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
);
