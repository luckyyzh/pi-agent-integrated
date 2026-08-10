// Frontend-only subset of the pi type surface. The full AgentSessionLike
// contract (which references pi-coding-agent classes) lives in the backend
// (server/src/lib/pi-types.ts); the UI only renders session stats reported
// over HTTP, so this file must not import the pi packages.

export interface ContextUsage {
  percent: number | null;
  contextWindow: number;
  tokens: number | null;
}

export interface SessionStatsInfo {
  sessionFile?: string;
  sessionId: string;
  sessionName?: string;
  userMessages: number;
  assistantMessages: number;
  toolCalls: number;
  toolResults: number;
  totalMessages: number;
  tokens: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };
  cost: number;
  contextUsage?: ContextUsage;
}
