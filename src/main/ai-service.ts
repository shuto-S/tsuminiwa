// メインプロセス側の AI サービス。外部 API への通信とキー参照をここへ集約し、
// renderer は provider に依存しない IPC 型だけを見る。
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { AI_PROVIDER_DEFS } from '../shared/ai-config.ts';
import type {
  AiErrorCode,
  AiGenerateOptions,
  AiGenerateResult,
  AiKeyStatus,
  AiOutputRequest,
  AiProvider,
  AiTestResult,
  AiToolDefinition,
} from '../shared/ipc.ts';

type ProviderClient = GoogleGenAI | OpenAI | Anthropic;
const clients = new Map<string, ProviderClient>();

function apiKey(provider: AiProvider): string | null {
  const value = process.env[AI_PROVIDER_DEFS[provider].envKey]?.trim();
  return value || null;
}

export function keyStatus(): AiKeyStatus {
  return {
    gemini: Boolean(apiKey('gemini')),
    openai: Boolean(apiKey('openai')),
    anthropic: Boolean(apiKey('anthropic')),
  };
}

export function hasKey(provider: AiProvider = 'gemini'): boolean {
  return Boolean(apiKey(provider));
}

function getClient(provider: AiProvider, authMode = 'developer'): ProviderClient | null {
  const key = apiKey(provider);
  if (!key) return null;
  const cacheKey = `${provider}:${authMode}:${key}`;
  const cached = clients.get(cacheKey);
  if (cached) return cached;

  let client: ProviderClient;
  if (provider === 'gemini') {
    client =
      authMode === 'vertex-express'
        ? new GoogleGenAI({ vertexai: true, apiKey: key })
        : new GoogleGenAI({ apiKey: key });
  } else if (provider === 'openai') {
    client = new OpenAI({ apiKey: key, maxRetries: 0, timeout: 12_000 });
  } else {
    client = new Anthropic({ apiKey: key, maxRetries: 0, timeout: 12_000 });
  }
  clients.set(cacheKey, client);
  return client;
}

function normalizeOutput(opts: AiGenerateOptions): AiOutputRequest {
  if (opts.output) return opts.output;
  if (opts.schema) {
    return {
      kind: 'json',
      name: 'tsuminiwa_response',
      schema: opts.schema as Record<string, unknown>,
    };
  }
  if (opts.tools?.length) return { kind: 'tool', tools: opts.tools };
  return { kind: 'text' };
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseJson(text: string): unknown {
  return JSON.parse(text.trim());
}

function errorCode(error: unknown): AiErrorCode {
  const value = error as {
    status?: number;
    code?: string | number;
    name?: string;
    message?: string;
  };
  const status = Number(value?.status || value?.code);
  const text = `${value?.code || ''} ${value?.name || ''} ${value?.message || error}`.toLowerCase();
  if (
    status === 401 ||
    status === 403 ||
    /unauth|permission_denied|invalid.*key|api.?key/.test(text)
  )
    return 'auth';
  if (/quota|billing|credit|resource_exhausted/.test(text)) return 'quota';
  if (status === 429 || /rate.?limit/.test(text)) return 'rate_limit';
  if (/timeout|timed out|abort/.test(text)) return 'timeout';
  if (status === 400 || /invalid_request|bad request/.test(text)) return 'invalid_request';
  if (/unsupported|not supported/.test(text)) return 'unsupported';
  if (/fetch failed|network|offline|unavailable|econn/.test(text)) return 'unavailable';
  return 'unknown';
}

function failure(error: unknown): AiGenerateResult {
  return {
    ok: false,
    code: errorCode(error),
    error: error instanceof Error ? error.message : String(error),
  };
}

async function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function generateGemini(
  client: GoogleGenAI,
  opts: AiGenerateOptions,
  output: AiOutputRequest,
): Promise<AiGenerateResult> {
  const config: Record<string, unknown> = {
    maxOutputTokens: opts.maxOutputTokens || 256,
  };
  if (opts.system) config.systemInstruction = opts.system;
  if (output.kind === 'json') {
    config.responseMimeType = 'application/json';
    config.responseSchema = output.schema;
  } else if (output.kind === 'tool') {
    config.tools = [{ functionDeclarations: output.tools }];
    config.toolConfig = { functionCallingConfig: { mode: 'ANY' } };
  }
  const response: any = await client.models.generateContent({
    model: opts.model || AI_PROVIDER_DEFS.gemini.defaultModel,
    contents: opts.prompt || '',
    config,
  });
  if (output.kind === 'tool') {
    const call = response.functionCalls?.[0];
    if (!call?.name) throw new Error('empty-tool-call');
    return { ok: true, toolCall: { name: call.name, arguments: asObject(call.args) } };
  }
  const text = typeof response.text === 'string' ? response.text : response.text?.();
  if (!text) throw new Error('empty-response');
  return output.kind === 'json'
    ? { ok: true, text: text.trim(), json: parseJson(text) }
    : { ok: true, text: text.trim() };
}

function openAiTools(tools: AiToolDefinition[]) {
  return tools.map((tool) => ({
    type: 'function' as const,
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    strict: true,
  }));
}

async function generateOpenAi(
  client: OpenAI,
  opts: AiGenerateOptions,
  output: AiOutputRequest,
): Promise<AiGenerateResult> {
  const request: OpenAI.Responses.ResponseCreateParamsNonStreaming = {
    model: opts.model || AI_PROVIDER_DEFS.openai.defaultModel,
    instructions: opts.system,
    input: opts.prompt || '',
    max_output_tokens: opts.maxOutputTokens || 256,
    store: false,
  };
  if (output.kind === 'json') {
    request.text = {
      format: { type: 'json_schema', name: output.name, schema: output.schema, strict: true },
    };
  } else if (output.kind === 'tool') {
    request.tools = openAiTools(output.tools);
    request.tool_choice = 'required';
    request.parallel_tool_calls = false;
  }
  const response = await client.responses.create(request);
  if (output.kind === 'tool') {
    const call = response.output.find((item) => item.type === 'function_call');
    if (!call || call.type !== 'function_call') throw new Error('empty-tool-call');
    return {
      ok: true,
      toolCall: { name: call.name, arguments: asObject(parseJson(call.arguments)) },
    };
  }
  if (!response.output_text) throw new Error('empty-response');
  return output.kind === 'json'
    ? { ok: true, text: response.output_text.trim(), json: parseJson(response.output_text) }
    : { ok: true, text: response.output_text.trim() };
}

async function generateAnthropic(
  client: Anthropic,
  opts: AiGenerateOptions,
  output: AiOutputRequest,
): Promise<AiGenerateResult> {
  const request: Anthropic.MessageCreateParamsNonStreaming = {
    model: opts.model || AI_PROVIDER_DEFS.anthropic.defaultModel,
    system: opts.system,
    messages: [{ role: 'user', content: opts.prompt || '' }],
    max_tokens: opts.maxOutputTokens || 256,
  };
  if (output.kind === 'json') {
    request.output_config = { format: { type: 'json_schema', schema: output.schema } };
  } else if (output.kind === 'tool') {
    request.tools = output.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters as Anthropic.Tool.InputSchema,
      strict: true,
    }));
    request.tool_choice = { type: 'any', disable_parallel_tool_use: true };
  }
  const response = await client.messages.create(request);
  if (output.kind === 'tool') {
    const call = response.content.find((block) => block.type === 'tool_use');
    if (!call || call.type !== 'tool_use') throw new Error('empty-tool-call');
    return { ok: true, toolCall: { name: call.name, arguments: asObject(call.input) } };
  }
  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim();
  if (!text) throw new Error('empty-response');
  return output.kind === 'json' ? { ok: true, text, json: parseJson(text) } : { ok: true, text };
}

export async function generate(opts: AiGenerateOptions): Promise<AiGenerateResult> {
  const provider = opts.provider || 'gemini';
  const client = getClient(provider, opts.authMode);
  if (!client) return { ok: false, code: 'auth', error: 'no-key' };
  const output = normalizeOutput(opts);
  const timeoutMs = opts.timeoutMs || 12_000;
  try {
    const task =
      provider === 'gemini'
        ? generateGemini(client as GoogleGenAI, opts, output)
        : provider === 'openai'
          ? generateOpenAi(client as OpenAI, opts, output)
          : generateAnthropic(client as Anthropic, opts, output);
    return await withTimeout(task, timeoutMs);
  } catch (error) {
    return failure(error);
  }
}

export async function testConnection(opts: {
  provider: AiProvider;
  authMode?: AiGenerateOptions['authMode'];
  model?: string;
}): Promise<AiTestResult> {
  if (!hasKey(opts.provider)) return { ok: false, code: 'auth', error: 'no-key' };
  const result = await generate({
    provider: opts.provider,
    authMode: opts.authMode,
    model: opts.model,
    prompt: 'Reply with the single word: ok',
    maxOutputTokens: 16,
  });
  return result.ok ? { ok: true } : { ok: false, code: result.code, error: result.error };
}
