"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export const SSOLoginButton = ({
    provider,
}: {
    provider: "google" | "azure-ad";
}) => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const label = provider === "google" ? "Google" : "Azure AD";

    const handleClick = async () => {
        setLoading(true);
        await new Promise((r) => setTimeout(r, 1200));
        setLoading(false);
        toast({
            type: "success",
            message: `Inicio de sesión con ${label} exitoso. ¡Bienvenido!`,
        });
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm text-sm font-medium"
        >
            {loading && (
                <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            )}
            {loading ? "Iniciando sesión..." : `Iniciar sesión con ${label}`}
        </button>
    );
};
