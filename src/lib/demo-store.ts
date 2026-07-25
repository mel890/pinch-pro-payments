import { useSyncExternalStore } from "react";

export type DemoState = {
  confirmedSessions: number;
  currentSplitPct: number;
  earningsCents: number;
  clientsConfidence: number;
  clientsEnergy: number;
  celebration: string | null;
  pendingSession: {
    client: string;
    plan: string;
    date: string;
    title: string;
    valueCents: number;
    win: string;
  } | null;
  lastConfirmedImpact: string | null;
  lastSupport: number | null;
};

const INITIAL: DemoState = {
  confirmedSessions: 20,
  currentSplitPct: 50,
  earningsCents: 74850,
  clientsConfidence: 4,
  clientsEnergy: 3,
  celebration: null,
  pendingSession: null,
  lastConfirmedImpact: null,
  lastSupport: null,
};

let state: DemoState = { ...INITIAL };
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const demoStore = {
  get: () => state,
  set: (patch: Partial<DemoState>) => {
    state = { ...state, ...patch };
    emit();
  },
  reset: () => {
    state = { ...INITIAL };
    emit();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useDemoState(): DemoState {
  return useSyncExternalStore(
    demoStore.subscribe,
    demoStore.get,
    demoStore.get,
  );
}

export const TIER = { pct: 60, unlockAt: 21 };

export function formatAUD(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}
