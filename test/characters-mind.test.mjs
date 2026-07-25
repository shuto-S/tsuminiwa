import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CharacterManager } from '../src/renderer/characters.ts';
import { DEFAULT_SETTINGS } from '../src/renderer/config.ts';
import { World } from '../src/renderer/world.ts';

function makeWorld() {
  const world = new World(4, 4, 8);
  for (const [col, row] of world.columns()) world.placeTop(col, row, 'grass');
  return world;
}

test('目的・記憶・関係性を保存復元し、存在しない相手は除く', () => {
  const world = makeWorld();
  const manager = new CharacterManager(new THREE.Scene(), world, { ...DEFAULT_SETTINGS });
  const sora = manager.spawnAt('villager', 1, 1, {
    name: 'そら',
    job: 'farmer',
    mind: { goal: 'はたけをそだてる', memories: ['はるになった'] },
  });
  const yuzu = manager.spawnAt('villager', 2, 1, {
    name: 'ゆず',
    job: 'lumberjack',
    mind: { relationships: { ghost: 99 } },
  });
  manager.strengthenRelation(sora, yuzu, 12);

  const restored = new CharacterManager(new THREE.Scene(), world, { ...DEFAULT_SETTINGS });
  restored.deserialize(manager.serialize());
  const restoredSora = restored.characters.find((character) => character.name === 'そら');
  const restoredYuzu = restored.characters.find((character) => character.name === 'ゆず');

  assert.equal(restoredSora.mind.goal, 'はたけをそだてる');
  assert.deepEqual(restoredSora.mind.memories, ['はるになった']);
  assert.equal(restoredSora.mind.relationships['ゆず'], 12);
  assert.equal(restoredYuzu.mind.relationships['そら'], 12);
  assert.equal(restoredYuzu.mind.relationships.ghost, undefined);
});

test('AIの意図は行動と同時に短く正規化して保存する', () => {
  const manager = new CharacterManager(new THREE.Scene(), makeWorld(), { ...DEFAULT_SETTINGS });
  const villager = manager.spawnAt('villager', 1, 1, { name: 'そら' });
  const reservation = manager.reserveAgentCandidate();

  assert.equal(reservation.candidate.name, villager.name);
  assert.equal(
    manager.applyAgentAction(villager.name, 'take_it_easy', {
      goal: `  ${'み'.repeat(80)}  `,
      memory: '  ひとやすみ   した  ',
      say: '',
    }),
    true,
  );
  assert.equal(villager.mind.goal.length, 48);
  assert.deepEqual(villager.mind.memories, ['ひとやすみ した']);
});

test('AI判断が動いていない間はイベント記憶を追加しない', () => {
  const manager = new CharacterManager(new THREE.Scene(), makeWorld(), {
    ...DEFAULT_SETTINGS,
    aiEnabled: true,
    aiConsent: true,
    aiAgentEnabled: true,
  });
  const villager = manager.spawnAt('villager', 1, 1, { name: 'そら' });

  manager.rememberEvent('あめが ふった');
  assert.deepEqual(villager.mind.memories, []);

  manager.agentMindActive = true;
  manager.rememberEvent('あめが ふった');
  assert.deepEqual(villager.mind.memories, ['あめが ふった']);
});
