"use client";

import { useState, useEffect } from "react";
import { getConsent, setConsent } from "../lib/consent";
import { useToast } from "@/components/ui/Toast";

export const ConsentBanner = () => {
    const [visible, setVisible] = useState(false);
    const [consent, setLocalConsent] = useState(getConsent());
    const { toast } = useToast();

    useEffect(() => {
        const stored = localStorage.getItem("gdpr_consent");
        if (!stored) setVisible(true);
    }, []);

    const accept = () => {
        const newConsent = { analytics: true, marketing: true };
        setConsent(newConsent);
        setLocalConsent(newConsent);
        setVisible(false);
        toast({ type: "success", message: "Cookies aceptadas. Gracias por tu consentimiento." });
    };

    const reject = () => {
        const newConsent = { analytics: false, marketing: false };
        setConsent(newConsent);
        setLocalConsent(newConsent);
        setVisible(false);
        toast({ type: "info", message: "Has rechazado las cookies opcionales. Solo usaremos cookies esenciales." });
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm text-white p-4 md:p-5 shadow-2xl">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm md:text-base leading-relaxed text-gray-200">
                    Usamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico y mostrarte contenido personalizado.
                </p>
                <div className="flex gap-3 shrink-0">
                    <button
                        onClick={reject}
                        className="px-5 py-2 text-sm font-medium text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Rechazar
                    </button>
                    <button
                        onClick={accept}
                        className="px-5 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        Aceptar todas
                    </button>
                </div>
            </div>
        </div>
    );
};
