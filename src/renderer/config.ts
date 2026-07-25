import type { AiAuthMode, AiProvider } from '../shared/ipc.ts';
import { AI_PROVIDERS, defaultAiModels } from '../shared/ai-config.ts';
export { AI_MODELS, AI_PROVIDERS } from '../shared/ai-config.ts';

// アプリ内言語
export type Language = 'ja' | 'en';

// 六角柱の寸法(外接円半径と1段の高さ)
export const HEX_RADIUS = 0.5;
export const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS; // 平坦な辺どうしの距離
export const BLOCK_HEIGHT = 0.5;

export const DEFAULT_COLS = 15;
export const DEFAULT_MAX_HEIGHT = 8;
export const MAX_CHARACTERS = 12;

// 表示名は i18n の block.<key> で引く(ここには持たない)
export interface BlockDef {
  color: number;
  water?: boolean;
  fire?: boolean;
}
export const BLOCK_TYPES: Record<string, BlockDef> = {
  grass: { color: 0x6cc75a },
  dirt: { color: 0x9a6a44 },
  stone: { color: 0xa9a9b0 },
  sand: { color: 0xe8d79a },
  wood: { color: 0x7d5638 },
  leaves: { color: 0x3f9c46 },
  brick: { color: 0xc06045 },
  snow: { color: 0xf1f5f8 },
  water: { color: 0x4aa8e8, water: true },
  campfire: { color: 0x6b4a2f, fire: true },
  ash: { color: 0x6e6a66 },
  farm: { color: 0x7a5a38 },
};

export const FLOWER_COLORS = [0xf27ea9, 0xf2d54e, 0xffffff, 0xb98aef];

// 季節。name は i18n の season.<key> で引く。weights は天気の出やすさ、
// leaves/grass は葉と草の色
export const DAYS_PER_SEASON = 3;

export type WeatherState = 'sunny' | 'cloudy' | 'rain' | 'snow';
export type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter';
export interface Season {
  key: SeasonKey;
  emoji: string;
  leaves: number;
  grass: number;
  weights: Record<WeatherState, number>;
}

export const SEASONS: Season[] = [
  {
    key: 'spring',
    emoji: '🌸',
    leaves: 0x5fbf63,
    grass: 0x6cc75a,
    weights: { sunny: 0.42, cloudy: 0.28, rain: 0.26, snow: 0.04 },
  },
  {
    key: 'summer',
    emoji: '🌻',
    leaves: 0x2f8f3c,
    grass: 0x58bb4a,
    weights: { sunny: 0.55, cloudy: 0.23, rain: 0.2, snow: 0.02 },
  },
  {
    key: 'autumn',
    emoji: '🍁',
    leaves: 0xd07a2e,
    grass: 0x9db04e,
    weights: { sunny: 0.4, cloudy: 0.3, rain: 0.22, snow: 0.08 },
  },
  {
    key: 'winter',
    emoji: '⛄',
    leaves: 0x8a7a52,
    grass: 0xb9c4b4,
    weights: { sunny: 0.3, cloudy: 0.3, rain: 0.06, snow: 0.34 },
  },
];

// 設定パネルからユーザーが変えられる値
export interface Settings {
  language: Language;
  characterScale: number;
  characterSpeed: number;
  autoSpeed: number;
  shadows: boolean;
  pinned: boolean;
  powerSave: boolean;
  autoLaunch: boolean;
  sound: boolean;
  volume: number;
  skyShows: boolean;
  decay: boolean;
  weather: boolean;
  weatherInterval: number;
  dayNight: boolean;
  dayLength: number;
  aiEnabled: boolean;
  aiProvider: AiProvider;
  aiAuthMode: AiAuthMode;
  aiModels: Record<AiProvider, string>;
  aiConsent: boolean;
  aiAgentEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'ja', // アプリ内言語(ja / en)
  characterScale: 1.45, // キャラクターの見た目の大きさ
  characterSpeed: 1, // キャラクターの歩く・動き出すはやさ(倍率)
  autoSpeed: 1, // 自動発展のはやさ(倍率)
  shadows: true, // デスクトップに影を落とす
  pinned: true, // 常に最前面に表示
  powerSave: true, // 非アクティブ時はフレームレートを落とす
  autoLaunch: false, // ログイン時に自動起動(パッケージ版のみ有効)
  sound: true, // 環境音
  volume: 0.5, // 音量(0〜1)
  skyShows: true, // 空の演出(虹・ながれぼし)
  decay: true, // 時のうつろい(燃え尽き・枯れ・崩れ)
  weather: true, // 天気がうつりかわる
  weatherInterval: 60, // 天気が変わる間隔(秒)
  dayNight: true, // 昼夜サイクル
  dayLength: 360, // 1日の長さ(秒)
  // ---- AI。既定オフ・完全オプトイン。キーは Main が環境変数からだけ読む ----
  aiEnabled: false, // AI フレーバー生成を使う
  aiProvider: 'gemini',
  aiAuthMode: 'developer', // 'developer'(AI Studio) / 'vertex-express'(Vertex Express)
  aiModels: defaultAiModels(),
  aiConsent: false, // 世界の状態を外部APIに送ることへの同意
  aiAgentEnabled: false, // 村人のしごと選びにも AI を使う
};

// 旧セーブの aiModel は Gemini の選択値として引き継ぐ。
export function settingsFromSave(saved: unknown): Settings {
  const source = saved && typeof saved === 'object' ? (saved as Record<string, unknown>) : {};
  const savedModels =
    source.aiModels && typeof source.aiModels === 'object'
      ? (source.aiModels as Partial<Record<AiProvider, unknown>>)
      : {};
  const legacyGemini = typeof source.aiModel === 'string' ? source.aiModel : undefined;
  const migrated = { ...source };
  delete migrated.aiModel;
  delete migrated.aiModels;
  return {
    ...DEFAULT_SETTINGS,
    ...migrated,
    aiProvider: AI_PROVIDERS.includes(source.aiProvider as AiProvider)
      ? (source.aiProvider as AiProvider)
      : DEFAULT_SETTINGS.aiProvider,
    aiModels: {
      gemini:
        (typeof savedModels.gemini === 'string' && savedModels.gemini) ||
        legacyGemini ||
        DEFAULT_SETTINGS.aiModels.gemini,
      openai:
        (typeof savedModels.openai === 'string' && savedModels.openai) ||
        DEFAULT_SETTINGS.aiModels.openai,
      anthropic:
        (typeof savedModels.anthropic === 'string' && savedModels.anthropic) ||
        DEFAULT_SETTINGS.aiModels.anthropic,
    },
  };
}
