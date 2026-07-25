import type { AiProvider } from './ipc.ts';

export interface AiProviderDefinition {
  envKey: string;
  defaultModel: string;
  models: string[];
}

export const AI_PROVIDER_DEFS: Record<AiProvider, AiProviderDefinition> = {
  gemini: {
    envKey: 'GEMINI_API_KEY',
    defaultModel: 'gemini-2.5-flash',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
  },
  openai: {
    envKey: 'OPENAI_API_KEY',
    defaultModel: 'gpt-5.4-mini',
    models: ['gpt-5.4-nano', 'gpt-5.4-mini', 'gpt-5.4'],
  },
  anthropic: {
    envKey: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-sonnet-4-6',
    models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-8'],
  },
};

export const AI_PROVIDERS = Object.keys(AI_PROVIDER_DEFS) as AiProvider[];
export const AI_MODELS = Object.fromEntries(
  AI_PROVIDERS.map((provider) => [provider, AI_PROVIDER_DEFS[provider].models]),
) as Record<AiProvider, string[]>;

export function defaultAiModels(): Record<AiProvider, string> {
  return Object.fromEntries(
    AI_PROVIDERS.map((provider) => [provider, AI_PROVIDER_DEFS[provider].defaultModel]),
  ) as Record<AiProvider, string>;
}
