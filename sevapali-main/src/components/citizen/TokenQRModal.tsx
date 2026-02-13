
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Token } from '@/hooks/useTokens';
import { Download, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TokenQRModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: Token | null;
}

const TokenQRModal: React.FC<TokenQRModalProps> = ({ isOpen, onClose, token }) => {
    if (!token) return null;

    const qrValue = JSON.stringify({
        id: token.id,
        token_number: token.token_number,
        type: 'token_verification'
    });

    const downloadQR = () => {
        const svg = document.getElementById('token-qr-code');
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                const pngFile = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.download = `token-${token.token_number}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold">
                        {token.token_number}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Scan this QR code at the counter for verification
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center p-6 space-y-6">
                    <div className="bg-white p-4 rounded-xl shadow-inner border">
                        <QRCodeSVG
                            id="token-qr-code"
                            value={qrValue}
                            size={200}
                            level="H"
                            includeMargin
                        />
                    </div>

                    <div className="w-full space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Service</span>
                            <span className="font-medium">{token.service_name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Office</span>
                            <span className="font-medium">{token.office_name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Date & Time</span>
                            <span className="font-medium">
                                {format(parseISO(token.appointment_date), 'dd MMM')} • {token.appointment_time}
                            </span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-muted-foreground">Status</span>
                            <span className="font-medium capitalize">{token.status}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full">
                        <Button className="flex-1" variant="outline" onClick={onClose}>
                            Close
                        </Button>
                        {/* Download functionality is complex with SVG in React, keeping it simple or omitting if not strictly asked */}
                        {/* <Button className="flex-1" onClick={downloadQR}>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button> */}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TokenQRModal;
