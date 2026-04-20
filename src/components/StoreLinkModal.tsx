
import { X, Copy, Share2, ExternalLink, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { useEstablishment } from '../contexts/EstablishmentContext';

interface StoreLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const StoreLinkModal = ({ isOpen, onClose }: StoreLinkModalProps) => {
    const { establishment } = useEstablishment();
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    // Construct the store link
    const urlSlug = window.location.pathname.split('/')[1];
    const slug = establishment?.slug || urlSlug || 'noia-burguer';
    const storeLink = `${window.location.protocol}//${window.location.host}/${slug}/menu`;
    const whatsappMessage = `Olá! Veja nosso cardápio digital: ${storeLink}`;
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(storeLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadQr = () => {
        const svg = document.getElementById("store-qr-code");
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                const pngFile = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.download = "qrcode-loja.png";
                downloadLink.href = pngFile;
                downloadLink.click();
            };
            img.src = "data:image/svg+xml;base64," + btoa(svgData);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-gray-100 rounded-full text-gray-500 transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Header Image / Banner */}
                <div className="bg-[#0099FF] h-32 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0099FF] to-[#0077CC]"></div>
                    <div className="relative z-10 text-center text-white p-4">
                        {/* Placeholder for phone mockup image in the design */}
                        <div className="w-16 h-28 bg-white rounded-xl mx-auto shadow-lg border-4 border-gray-800 flex items-center justify-center transform rotate-[-5deg]">
                            {establishment?.logo_url ? (
                                <img src={establishment.logo_url} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <span className="text-[8px] text-gray-400 font-bold px-1 text-center">{establishment?.name || 'Loja'}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">O link do seu Cardápio Digital</h2>
                    <p className="text-gray-500 text-sm mb-6">Copie o link e cole onde quiser para compartilhar!</p>

                    {/* Link Box */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 flex items-center gap-3">
                        <div className="flex-1 truncate text-left text-blue-600 text-sm font-medium">
                            {storeLink}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mb-6">
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#0099FF] text-[#0099FF] rounded-lg font-medium hover:bg-blue-50 transition-colors"
                        >
                            <Share2 size={18} />
                            <span>Enviar link</span>
                        </a>
                        <button
                            onClick={handleCopy}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0099FF] text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                        >
                            <Copy size={18} />
                            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                    </div>

                    {/* Open Menu Link */}
                    <a
                        href={`/${slug}/menu`}
                        target="_blank"
                        className="inline-flex items-center gap-2 text-[#0099FF] font-medium text-sm hover:underline mb-8"
                    >
                        <ExternalLink size={14} />
                        <span>Abrir cardápio</span>
                    </a>

                    {/* QR Code Section */}
                    <div className="border rounded-xl p-4 flex items-center gap-4 text-left">
                        <div className="bg-white p-2 rounded shadow-sm border border-gray-100 flex-shrink-0">
                            <QRCodeSVG
                                id="store-qr-code"
                                value={storeLink}
                                size={64}
                                level="M"
                                includeMargin={false}
                            />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-800 text-sm">CARDÁPIO DIGITAL PARA REDES SOCIAIS</h3>
                            <p className="text-xs text-gray-500 mt-1">Escaneie o QR Code ou faça o download para compartilhar.</p>
                        </div>
                        {/* Download/Print Buttons (Visual Only for now) */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleDownloadQr}
                                className="p-2 border border-gray-200 rounded hover:bg-gray-50 text-gray-500 transition-colors"
                                title="Baixar QR Code"
                            >
                                <Download size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreLinkModal;
