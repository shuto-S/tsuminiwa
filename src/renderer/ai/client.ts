// レンダラー側の AI クライアント。後続のフレーバー機能(#2/#3)はここだけを使う。
// - オプトイン判定(有効・キー・同意)をまとめる
// - コスト/レート上限ガード
// - プール(数回分をまとめて生成してキャッシュ)
// - 失敗・無効時は null を返す → 呼び出し側は必ず従来テキストにフォールバック
//
// 実際の生成はメインプロセス(window.tsuminiwa.ai)に委譲する。純ロジック(ガード・
// プール)はテストできるよう、外部依存(実際の生成関数・時刻)を注入できる形にする。

import type {
  AiAuthMode,
  AiGenerateOptions,
  AiGenerateResult,
  AiProvider,
  AiToolDefinition,
} from '../../shared/ipc.ts';

// 上限のデフォルト
export const AI_LIMITS = {
  maxPerDay: 200, // 1日あたりの生成回数
  minIntervalMs: 4000, // 連続生成の最小間隔
  cooldownMs: 30 * 60 * 1000, // ハードエラー(クォータ枯渇・認証不正)後、AI をしばらく止める
};

// onNotice に渡すハードエラーの種類
export type AiFailureKind = 'quota' | 'auth';

interface AiBackend {
  hasKey(provider?: AiProvider): Promise<boolean>;
  generate(opts: AiGenerateOptions): Promise<AiGenerateResult>;
}

interface AiClientSettings {
  aiEnabled: boolean;
  aiConsent: boolean;
  aiProvider?: AiProvider;
  aiAuthMode: AiAuthMode;
  aiModel?: string; // 旧テスト/セーブ互換
  aiModels?: Partial<Record<AiProvider, string>>;
  aiAgentEnabled?: boolean;
}

interface AiClientOptions {
  now?: () => number;
  limits?: Partial<typeof AI_LIMITS>;
}

// レートとプールを管理する本体。backend/now を差し替えてテストする。
export class AiClient {
  settings: AiClientSettings;
  backend: AiBackend;
  now: () => number;
  limits: typeof AI_LIMITS;
  lastCallAt: number;
  day: number;
  countToday: number;
  pools: Map<string, string[]>;
  cooldownUntil: number; // ハードエラー後、この時刻まで AI を止める
  onNotice: ((kind: AiFailureKind) => void) | null; // ハードエラーを一度だけ知らせるフック

  // settings: 参照を渡す(aiEnabled/aiAuthMode/aiModel/aiConsent を見る)
  // backend: { generate(opts)->Promise<{ok,text}>, hasKey()->Promise<bool> }
  // now: () => ms
  constructor(
    settings: AiClientSettings,
    backend: AiBackend,
    { now = () => Date.now(), limits }: AiClientOptions = {},
  ) {
    this.settings = settings;
    this.backend = backend;
    this.now = now;
    this.limits = { ...AI_LIMITS, ...limits };
    this.lastCallAt = -Infinity;
    this.day = this.currentDay();
    this.countToday = 0;
    this.pools = new Map(); // kind -> string[]
    this.cooldownUntil = 0;
    this.onNotice = null;
  }

  currentDay(): number {
    return Math.floor(this.now() / 86400000);
  }

  // AI を使ってよいか(有効・同意・クールダウン中でない)
  available(): boolean {
    const s = this.settings;
    if (!(s.aiEnabled && s.aiConsent)) return false;
    if (this.now() < this.cooldownUntil) return false; // ハードエラー後のクールダウン中
    return true;
  }

  // 失敗の種類を見て、クォータ枯渇・認証不正などのハードエラーなら AI をしばらく止めて
  // 一度だけ通知する。タイムアウト・空応答などの一時的失敗は静かにフォールバックする。
  noteFailure(error: string): void {
    const e = String(error).toLowerCase();
    let kind: AiFailureKind | null = null;
    if (/resource_exhausted|quota|credit|billing|rate.?limit|\b429\b/.test(e)) kind = 'quota';
    else if (/unauthenticated|permission_denied|api.?key|invalid.*key|\b401\b|\b403\b/.test(e))
      kind = 'auth';
    if (!kind) return;
    this.cooldownUntil = this.now() + this.limits.cooldownMs;
    if (this.onNotice) this.onNotice(kind);
  }

  provider(): AiProvider {
    return this.settings.aiProvider || 'gemini';
  }

  model(): string {
    const provider = this.provider();
    return this.settings.aiModels?.[provider] || this.settings.aiModel || '';
  }

  underRate(): boolean {
    const d = this.currentDay();
    if (d !== this.day) {
      this.day = d;
      this.countToday = 0;
    }
    if (this.countToday >= this.limits.maxPerDay) return false;
    if (this.now() - this.lastCallAt < this.limits.minIntervalMs) return false;
    return true;
  }

  noteCall(): void {
    this.lastCallAt = this.now();
    this.countToday += 1;
  }

  // 1件だけ生成。使えない/失敗時は null(呼び出し側でフォールバック)
  private async request(opts: AiGenerateOptions): Promise<AiGenerateResult | null> {
    if (!this.available() || !this.underRate()) return null;
    // レート枠は await の前に同期で確保する。そうしないと、同じフレームで並行して
    // 走る別種の生成(つぶやき/かわら版/命名補充)が古い lastCallAt を見て、
    // 最小間隔・日次上限をすり抜けてしまう(TOCTOU)
    this.noteCall();
    const provider = this.provider();
    let res: AiGenerateResult;
    try {
      if (!(await this.backend.hasKey(provider))) return null;
      res = await this.backend.generate({
        ...opts,
        provider,
        authMode: this.settings.aiAuthMode,
        model: this.model(),
      });
    } catch {
      // IPC切断やネットワーク層の例外でもゲーム本体へ例外を漏らさない。
      return null;
    }
    if (res?.ok) return res;
    if (res?.code === 'quota' || res?.code === 'rate_limit') this.noteFailure('quota');
    else if (res?.code === 'auth') this.noteFailure('auth');
    else if (res?.error) this.noteFailure(res.error);
    return null;
  }

  async generateText(opts: AiGenerateOptions = {}): Promise<string | null | undefined> {
    const res = await this.request({ ...opts, output: { kind: 'text' } });
    return res?.text ?? null;
  }

  async generateJson<T = unknown>(
    opts: AiGenerateOptions & { schema: Record<string, unknown>; schemaName?: string },
  ): Promise<T | null> {
    const res = await this.request({
      ...opts,
      output: {
        kind: 'json',
        name: opts.schemaName || 'tsuminiwa_response',
        schema: opts.schema,
      },
    });
    if (!res) return null;
    if (res.json !== undefined) return res.json as T;
    try {
      return JSON.parse(res.text || '') as T;
    } catch {
      return null;
    }
  }

  async chooseAction(
    opts: Omit<AiGenerateOptions, 'tools'> & { tools: AiToolDefinition[] },
  ): Promise<{ name: string; arguments: Record<string, unknown> } | null> {
    const res = await this.request({
      ...opts,
      output: { kind: 'tool', tools: opts.tools },
    });
    return res?.toolCall ?? null;
  }

  // 既存フレーバー呼び出し用の互換メソッド。
  async generate(opts: AiGenerateOptions = {}): Promise<string | null | undefined> {
    if (opts.schema) {
      const value = await this.generateJson({
        ...opts,
        schema: opts.schema as Record<string, unknown>,
      });
      return value === null ? null : JSON.stringify(value);
    }
    return this.generateText(opts);
  }

  // プールから1件取り出す。空なら null を返し、必要なら refill() で補充する運用。
  take(kind: string): string | null | undefined {
    const pool = this.pools.get(kind);
    if (pool && pool.length > 0) return pool.shift();
    return null;
  }

  size(kind: string): number {
    const pool = this.pools.get(kind);
    return pool ? pool.length : 0;
  }

  // まとめて生成した配列でプールを補充する(呼び出し側が JSON 配列を生成して渡す)
  fill(kind: string, items: string[]): void {
    if (!Array.isArray(items) || items.length === 0) return;
    const pool = this.pools.get(kind) || [];
    pool.push(...items.filter((s) => typeof s === 'string' && s.trim()));
    this.pools.set(kind, pool);
  }
}
