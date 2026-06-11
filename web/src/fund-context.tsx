/**
 * One fund, picked once, followed everywhere. Lawyers think matter-first:
 * "I'm working on Fund III today", then everything follows. Every page
 * reads this context instead of keeping its own dropdown, so the app can
 * never disagree with itself about which fund you are acting on.
 */

import { createContext, useContext } from 'react';
import type { Fund } from './api.js';

export interface FundContextValue {
  fundId: string;
  setFundId: (id: string) => void;
  funds: Fund[];
  refreshFunds: () => Promise<void>;
}

export const FundContext = createContext<FundContextValue>({
  fundId: '',
  setFundId: () => {},
  funds: [],
  refreshFunds: async () => {},
});

export function useFund(): FundContextValue {
  return useContext(FundContext);
}

export function fundName(ctx: FundContextValue): string {
  return ctx.funds.find((f) => f.id === ctx.fundId)?.name ?? 'this fund';
}
