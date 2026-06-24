export type Consent = {
    analytics: boolean;
    marketing: boolean;
};

export const getConsent = (): Consent => {
    if (typeof window === "undefined") return { analytics: false, marketing: false };
    const stored = localStorage.getItem("gdpr_consent");
    return stored ? JSON.parse(stored) : { analytics: false, marketing: false };
};

export const setConsent = (consent: Consent) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("gdpr_consent", JSON.stringify(consent));
    }
};