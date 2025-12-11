
export interface TestResult {
  id: string;
  timestamp: number;
  latencyMs: number;
  status: 'success' | 'error';
  isColdStart: boolean;
  message?: string;
}

export interface LatencyStats {
  average: number;
  min: number;
  max: number;
  count: number;
}
