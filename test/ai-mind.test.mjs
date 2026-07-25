import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_INTENT_PARAMS,
  addMemory,
  cleanSpeech,
  normalizeMind,
  updateMind,
} from '../src/renderer/ai/mind.ts';

test('mind: 保存値を正規化し、長さ・件数・関係値を安全な範囲に収める', () => {
  const mind = normalizeMind({
    goal: `  ${'g'.repeat(80)}  `,
    memories: ['a', 'b', 'c', 'd', 'e'],
    relationships: { そら: 120, うみ: -4, bad: 'x' },
  });
  assert.equal(mind.goal.length, 48);
  assert.deepEqual(mind.memories, ['b', 'c', 'd', 'e']);
  assert.deepEqual(mind.relationships, { そら: 100, うみ: 0 });
});

test('mind: 目的更新と記憶リングは重複を避けて最新4件を保つ', () => {
  const mind = normalizeMind(null);
  assert.equal(updateMind(mind, { goal: '森を守る', memory: '木を植えた' }), true);
  assert.equal(addMemory(mind, '木を植えた'), false);
  for (const item of ['a', 'b', 'c', 'd']) addMemory(mind, item);
  assert.equal(mind.goal, '森を守る');
  assert.deepEqual(mind.memories, ['a', 'b', 'c', 'd']);
});

test('mind: 発話を短く整え、tool schema は3項目を必須にする', () => {
  assert.equal(cleanSpeech(`  hello\n ${'x'.repeat(80)}`).length, 40);
  assert.deepEqual(AGENT_INTENT_PARAMS.required, ['goal', 'memory', 'say']);
  assert.equal(AGENT_INTENT_PARAMS.additionalProperties, false);
});
