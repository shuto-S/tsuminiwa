import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AiClient } from '../src/renderer/ai/client.ts';
import { settingsFromSave } from '../src/renderer/config.ts';
import { AI_PROVIDER_DEFS } from '../src/shared/ai-config.ts';

function backend(result) {
  const calls = [];
  const keyChecks = [];
  return {
    calls,
    keyChecks,
    hasKey: async (provider) => {
      keyChecks.push(provider);
      return true;
    },
    generate: async (opts) => {
      calls.push(opts);
      return result;
    },
  };
}

const settings = {
  aiEnabled: true,
  aiConsent: true,
  aiProvider: 'openai',
  aiAuthMode: 'developer',
  aiModels: {
    gemini: 'gemini-test',
    openai: 'openai-test',
    anthropic: 'anthropic-test',
  },
};
const noLimit = { limits: { maxPerDay: 100, minIntervalMs: 0 } };

test('provider registry が環境変数・既定モデル・候補を一元管理する', () => {
  assert.equal(AI_PROVIDER_DEFS.openai.envKey, 'OPENAI_API_KEY');
  assert.equal(AI_PROVIDER_DEFS.anthropic.defaultModel, 'claude-sonnet-4-6');
  assert.ok(AI_PROVIDER_DEFS.gemini.models.includes('gemini-2.5-flash'));
});

test('選択した provider/model を Main 境界へ渡し、自動フォールバックしない', async () => {
  const mock = backend({ ok: true, text: 'hello' });
  const client = new AiClient(settings, mock, noLimit);
  assert.equal(await client.generateText({ prompt: 'hi' }), 'hello');
  assert.deepEqual(mock.keyChecks, ['openai']);
  assert.equal(mock.calls[0].provider, 'openai');
  assert.equal(mock.calls[0].model, 'openai-test');
  assert.equal(mock.calls.length, 1);
});

test('generateJson は provider 共通の JSON output 契約を使う', async () => {
  const mock = backend({ ok: true, json: { names: ['a'] }, text: '{"names":["a"]}' });
  const client = new AiClient(settings, mock, noLimit);
  const result = await client.generateJson({
    prompt: 'names',
    schemaName: 'names',
    schema: {
      type: 'object',
      properties: { names: { type: 'array', items: { type: 'string' } } },
      required: ['names'],
      additionalProperties: false,
    },
  });
  assert.deepEqual(result, { names: ['a'] });
  assert.equal(mock.calls[0].output.kind, 'json');
  assert.equal(mock.calls[0].output.name, 'names');
});

test('chooseAction は tool call をそのまま返す', async () => {
  const mock = backend({
    ok: true,
    toolCall: { name: 'take_it_easy', arguments: {} },
  });
  const client = new AiClient(settings, mock, noLimit);
  assert.deepEqual(
    await client.chooseAction({
      prompt: '{}',
      tools: [
        {
          name: 'take_it_easy',
          description: 'rest',
          parameters: {
            type: 'object',
            properties: {},
            required: [],
            additionalProperties: false,
          },
        },
      ],
    }),
    { name: 'take_it_easy', arguments: {} },
  );
  assert.equal(mock.calls[0].output.kind, 'tool');
});

test('旧 aiModel は Gemini に移行し、各 provider のモデルを独立保持する', () => {
  const migrated = settingsFromSave({ aiModel: 'gemini-legacy', aiEnabled: true });
  assert.equal(migrated.aiModels.gemini, 'gemini-legacy');
  assert.equal(migrated.aiModels.openai, 'gpt-5.4-mini');
  assert.equal(migrated.aiProvider, 'gemini');

  const current = settingsFromSave({
    aiProvider: 'anthropic',
    aiModels: { gemini: 'g', openai: 'o', anthropic: 'a' },
  });
  assert.deepEqual(current.aiModels, { gemini: 'g', openai: 'o', anthropic: 'a' });
  assert.equal(current.aiProvider, 'anthropic');
});
