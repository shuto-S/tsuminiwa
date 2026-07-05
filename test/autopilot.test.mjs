import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/renderer/world.ts';
import { Autopilot } from '../src/renderer/autopilot.ts';

function grassWorld() {
  const world = new World(7, 7, 8);
  for (const [c, r] of world.columns()) world.placeTop(c, r, 'grass');
  return world;
}

// autopilot は CharacterManager の .characters 配列しか見ない(村人の有無で家を建てる)
const noCharacters = { characters: [] };

test('autopilot: 無効なら update しても世界は変わらない', () => {
  const world = grassWorld();
  const version = world.version;
  const auto = new Autopilot(world, noCharacters, { autoSpeed: 1 });
  // enabled は既定 false
  for (let i = 0; i < 100; i++) auto.update(3);
  assert.equal(world.version, version);
});

test('autopilot: 有効なら世界が育つ(晴れ・春の平常ターンで花が咲く)', () => {
  const world = grassWorld();
  const auto = new Autopilot(world, noCharacters, { autoSpeed: 1 });
  auto.enabled = true;
  const before = world.flowers.size;
  // weather/calendar 未注入 → 'sunny'/'spring'。Math.random=0.5 の plan() は bloomFlower を選ぶ
  const originalRandom = Math.random;
  Math.random = () => 0.5;
  try {
    for (let i = 0; i < 5; i++) auto.update(3); // PLAN_INTERVAL(2.2)超え → 毎回 plan()
  } finally {
    Math.random = originalRandom;
  }
  assert.ok(world.flowers.size > before, '花が増えるはず');
});

test('autopilot: 建設キューがあるときは1ブロックずつ積む', () => {
  const world = grassWorld();
  const auto = new Autopilot(world, noCharacters, { autoSpeed: 1 });
  auto.enabled = true;
  auto.queue = [
    { col: 3, row: 3, y: 1, type: 'wood' },
    { col: 3, row: 3, y: 2, type: 'wood' },
  ];
  auto.update(1); // BUILD_INTERVAL(0.28)超え → キュー先頭を1つ積む
  assert.equal(world.stackAt(3, 3)[1], 'wood');
  assert.equal(auto.queue.length, 1, '1つだけ処理される');
});
