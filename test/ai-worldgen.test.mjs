import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLDGEN_PARAMS, worldgenSchema, clampParams } from '../src/renderer/worldgen-schema.js';
import { AiClient } from '../src/renderer/ai/client.js';
import { generateWorldParams } from '../src/renderer/ai/generate.js';

function mockBackend(reply) {
  const calls = [];
  return {
    calls,
    hasKey: async () => true,
    generate: async (opts) => {
      calls.push(opts);
      return reply == null ? { ok: false, error: 'fail' } : { ok: true, text: reply };
    },
  };
}
const enabled = { aiEnabled: true, aiConsent: true, aiAuthMode: 'developer', aiModel: 'm' };
const noLimit = { limits: { maxPerDay: 1e9, minIntervalMs: 0 } };

test('clampParams: 範囲外はクランプ、欠損は既定', () => {
  const out = clampParams({ waterLevel: 99, hilliness: -5, treeDensity: 1.5 });
  assert.equal(out.waterLevel, WORLDGEN_PARAMS.waterLevel.max);
  assert.equal(out.hilliness, WORLDGEN_PARAMS.hilliness.min);
  assert.equal(out.treeDensity, 1.5);
  assert.equal(out.snow, WORLDGEN_PARAMS.snow.default); // 欠損→既定
});

test('clampParams: null や不正型でも既定で埋まる', () => {
  const out = clampParams(null);
  for (const key of Object.keys(WORLDGEN_PARAMS)) {
    assert.equal(out[key], WORLDGEN_PARAMS[key].default);
  }
  const bad = clampParams({ waterLevel: 'x', snow: NaN });
  assert.equal(bad.waterLevel, WORLDGEN_PARAMS.waterLevel.default);
  assert.equal(bad.snow, WORLDGEN_PARAMS.snow.default);
});

test('worldgenSchema: 全パラメータが number プロパティ', () => {
  const s = worldgenSchema();
  assert.equal(s.type, 'object');
  for (const key of Object.keys(WORLDGEN_PARAMS)) {
    assert.equal(s.properties[key].type, 'number');
  }
});

test('generateWorldParams: モック応答をパース&クランプ、指示がプロンプトに乗る', async () => {
  const c = new AiClient(enabled, mockBackend('{"waterLevel":0.9,"snow":0.5}'), noLimit);
  const p = await generateWorldParams(c, '雪深い漁村にして', { lang: 'ja' });
  assert.equal(p.waterLevel, WORLDGEN_PARAMS.waterLevel.max); // 0.9→クランプ
  assert.equal(p.snow, 0.5);
});

test('generateWorldParams: 壊れた応答や失敗は null', async () => {
  const c1 = new AiClient(enabled, mockBackend('not json'), noLimit);
  assert.equal(await generateWorldParams(c1, 'x', { lang: 'ja' }), null);
  const c2 = new AiClient(enabled, mockBackend(null), noLimit); // 生成失敗
  assert.equal(await generateWorldParams(c2, 'x', { lang: 'ja' }), null);
});

test('generateWorldParams: AI無効なら null(生成しない)', async () => {
  const backend = mockBackend('{"waterLevel":0.3}');
  const c = new AiClient({ ...enabled, aiEnabled: false }, backend, noLimit);
  assert.equal(await generateWorldParams(c, 'x', { lang: 'ja' }), null);
  assert.equal(backend.calls.length, 0);
});
