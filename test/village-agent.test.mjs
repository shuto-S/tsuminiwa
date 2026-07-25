import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AiClient } from '../src/renderer/ai/client.ts';
import { VillageAgent } from '../src/renderer/ai/village-agent.ts';
import { World } from '../src/renderer/world.ts';

function makeWorld() {
  const world = new World(5, 5, 8);
  for (const [col, row] of world.columns()) world.placeTop(col, row, 'grass');
  return world;
}

function makeCharacters() {
  const candidate = {
    name: 'ゆず',
    type: 'villager',
    job: 'villager',
    trait: { key: 'relaxed' },
    col: 2,
    row: 2,
    goal: '',
    memories: [],
    relationships: {},
  };
  const manager = {
    applied: [],
    released: [],
    reserveAgentCandidate: () => ({ candidate, index: 0 }),
    releaseAgentCandidate: (name) => void manager.released.push(name),
    agentActionKeys: () => ['work_farmer', 'take_it_easy'],
    agentSummary: () => ({
      jobs: { lumberjack: 1, farmer: 0, fisher: 1, villager: 1 },
      resources: { trees: 6, farms: 1, ripeCrops: 0, fishingSpots: 2 },
    }),
    agentCharacters: () => [candidate],
    applyAgentAction: (name, action, intent) => {
      manager.applied.push([name, action, intent]);
      return true;
    },
  };
  return manager;
}

const settings = {
  aiEnabled: true,
  aiConsent: true,
  aiAgentEnabled: true,
  aiProvider: 'anthropic',
  aiAuthMode: 'developer',
  aiModels: { anthropic: 'claude-test' },
};
const context = {
  weather: () => 'sunny',
  season: () => 'spring',
  timeOfDay: () => 'day',
  recentEvents: () => [],
  language: () => 'ja',
};

test('実行可能なアクションだけを渡して、選択結果を既存タスク側へ適用する', async () => {
  const calls = [];
  const client = new AiClient(
    settings,
    {
      hasKey: async () => true,
      generate: async (opts) => {
        calls.push(opts);
        return {
          ok: true,
          toolCall: {
            name: 'work_farmer',
            arguments: { goal: 'grow food', memory: 'spring field', say: '畑へいこう' },
          },
        };
      },
    },
    { limits: { maxPerDay: 200, minIntervalMs: 0 } },
  );
  const characters = makeCharacters();
  const agent = new VillageAgent(client, characters, makeWorld(), context, {
    minIntervalSeconds: 0,
    maxIntervalSeconds: 0,
  });

  assert.equal(await agent.runOnce(), true);
  assert.deepEqual(characters.applied, [
    ['ゆず', 'work_farmer', { goal: 'grow food', memory: 'spring field', say: '畑へいこう' }],
  ]);
  assert.deepEqual(
    calls[0].output.tools.map((tool) => tool.name),
    ['work_farmer', 'take_it_easy'],
  );
  const sent = JSON.parse(calls[0].prompt);
  assert.equal(sent.villager.name, 'ゆず');
  assert.equal('col' in sent.villager, false, '座標はモデルへ渡さない');
  assert.equal(calls[0].output.tools[0].parameters.required.length, 3);
  assert.equal(characters.agentMindActive, true);
  assert.deepEqual(characters.released, ['ゆず']);
});

test('世界再生成中に戻った古い応答は適用しない', async () => {
  let resolve;
  const response = new Promise((done) => {
    resolve = done;
  });
  const client = new AiClient(
    settings,
    { hasKey: async () => true, generate: () => response },
    { limits: { maxPerDay: 200, minIntervalMs: 0 } },
  );
  const characters = makeCharacters();
  const agent = new VillageAgent(client, characters, makeWorld(), context);
  const pending = agent.runOnce();
  await Promise.resolve();
  agent.setWorld(makeWorld());
  resolve({ ok: true, toolCall: { name: 'take_it_easy', arguments: {} } });

  assert.equal(await pending, false);
  assert.deepEqual(characters.applied, []);
  assert.deepEqual(characters.released, ['ゆず']);
});

test('村人エージェント独自の日次上限を超えない', async () => {
  const client = new AiClient(
    settings,
    {
      hasKey: async () => true,
      generate: async () => ({
        ok: true,
        toolCall: { name: 'take_it_easy', arguments: {} },
      }),
    },
    { limits: { maxPerDay: 200, minIntervalMs: 0 } },
  );
  const characters = makeCharacters();
  const agent = new VillageAgent(client, characters, makeWorld(), context, { maxPerDay: 1 });
  assert.equal(await agent.runOnce(), true);
  assert.equal(await agent.runOnce(), false);
  assert.equal(characters.applied.length, 1);
  assert.equal(characters.agentMindActive, false);
});
