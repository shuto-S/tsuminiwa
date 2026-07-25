// preload ↔ main ↔ renderer をつなぐ IPC 境界の型。
// preload(実装)と renderer(window.tsuminiwa の利用側)の両方から参照して、
// メソッド名・引数・戻り値のズレを型で防ぐ。実行時コードは持たない(型のみ)。

export type AiAuthMode = 'developer' | 'vertex-express';
export type AiProvider = 'gemini' | 'openai' | 'anthropic';
export type AiErrorCode =
  | 'auth'
  | 'quota'
  | 'rate_limit'
  | 'timeout'
  | 'invalid_request'
  | 'unsupported'
  | 'unavailable'
  | 'unknown';

export interface AiToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export type AiOutputRequest =
  | { kind: 'text' }
  | { kind: 'json'; name: string; schema: Record<string, unknown> }
  | { kind: 'tool'; tools: AiToolDefinition[] };

export interface AiGenerateOptions {
  provider?: AiProvider;
  authMode?: AiAuthMode;
  model?: string;
  system?: string;
  prompt?: string;
  output?: AiOutputRequest;
  // 旧呼び出しとの互換用。Main 側で output.kind=json に正規化する。
  schema?: unknown;
  maxOutputTokens?: number;
  tools?: AiToolDefinition[];
  timeoutMs?: number;
}

export interface AiGenerateResult {
  ok: boolean;
  text?: string;
  json?: unknown;
  toolCall?: { name: string; arguments: Record<string, unknown> };
  code?: AiErrorCode;
  error?: string;
}

export interface AiTestResult {
  ok: boolean;
  code?: AiErrorCode;
  error?: string;
}

export type AiKeyStatus = Record<AiProvider, boolean>;

export interface AiBridge {
  keyStatus(): Promise<AiKeyStatus>;
  hasKey(provider?: AiProvider): Promise<boolean>;
  test(opts: { provider: AiProvider; authMode?: AiAuthMode; model: string }): Promise<AiTestResult>;
  generate(opts: AiGenerateOptions): Promise<AiGenerateResult>;
}

export interface SaveShotResult {
  ok?: boolean;
  canceled?: boolean;
  path?: string;
}

export interface WorldLoadResult {
  json: string | null;
  recovered: boolean;
  failed: boolean;
}

export interface TsuminiwaBridge {
  loadWorld(): Promise<WorldLoadResult>;
  saveWorld(json: string): Promise<boolean>;
  quit(): void;
  setPinned(pinned: boolean): void;
  saveScreenshot(dataUrl: string): Promise<SaveShotResult>;
  shareToX(dataUrl: string): Promise<boolean>;
  setAutoLaunch(enabled: boolean): void;
  ai: AiBridge;
}
