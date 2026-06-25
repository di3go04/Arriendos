"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type DemoPhase = "onboarding" | "dashboard";

type DemoUser = {
  name: string;
  initials: string;
  provider: string;
};

type Period = "7d" | "30d";

type DemoContextType = {
  phase: DemoPhase;
  completeOnboarding: () => void;
  resetDemo: () => void;
  isDemoAuthenticated: boolean;
  demoUser: DemoUser | null;
  authenticateSimulation: (provider: string) => void;
  logoutSimulation: () => void;
  selectedPeriod: Period;
  setSelectedPeriod: (p: Period) => void;
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<DemoPhase>("onboarding");
  const [isDemoAuthenticated, setIsDemoAuthenticated] = useState(false);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("7d");

  const completeOnboarding = useCallback(() => {
    setPhase("dashboard");
  }, []);

  const resetDemo = useCallback(() => {
    setPhase("onboarding");
    setIsDemoAuthenticated(false);
    setDemoUser(null);
    setSelectedPeriod("7d");
  }, []);

  const authenticateSimulation = useCallback((provider: string) => {
    const users: Record<string, DemoUser> = {
      google: { name: "Ana García López", initials: "AG", provider: "Google" },
      "azure-ad": { name: "Carlos Martínez Ruiz", initials: "CM", provider: "Azure AD" },
    };
    setDemoUser(users[provider] || { name: "Usuario Demo", initials: "UD", provider });
    setIsDemoAuthenticated(true);
  }, []);

  const logoutSimulation = useCallback(() => {
    setIsDemoAuthenticated(false);
    setDemoUser(null);
  }, []);

  return (
    <DemoContext.Provider
      value={{
        phase, completeOnboarding, resetDemo,
        isDemoAuthenticated, demoUser,
        authenticateSimulation, logoutSimulation,
        selectedPeriod, setSelectedPeriod,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}
