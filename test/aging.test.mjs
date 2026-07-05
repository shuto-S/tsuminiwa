import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/renderer/world.ts';
import { Aging } from '../src/renderer/aging.ts';

// たきび1つだけの世界(まわりに木や家は無い = レア崩壊は起きない)
function campfireWorld() {
  const world = new World(5, 5, 8);
  world.placeTop(2, 2, 'grass');
  world.placeTop(2, 2, 'campfire');
  return world;
}

test('aging: decay オフなら時間が経っても何も変わらない', () => {
  const world = campfireWorld();
  const version = world.version;
  const aging = new Aging(world, { decay: false });
  for (let i = 0; i < 500; i++) aging.update(1);
  assert.equal(world.version, version);
  assert.equal(world.topType(2, 2), 'campfire');
});

test('aging: たきびは燃え尽きて灰になり、やがて消える', () => {
  const world = campfireWorld();
  const aging = new Aging(world, { decay: true });
  // Math.random=0 で寿命は最小(CAMPFIRE_LIFE[0]=180, ASH_LIFE[0]=120)、
  // かつレア崩壊(木・家)の判定も起きない
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    for (let i = 0; i < 200; i++) aging.update(1); // 180 で燃え尽き
    assert.equal(world.topType(2, 2), 'ash', '燃え尽きて灰になる');
    for (let i = 0; i < 200; i++) aging.update(1); // 灰も寿命(120)で消える
    assert.equal(world.topType(2, 2), 'grass', '灰が消えて下の草が出る');
  } finally {
    Math.random = originalRandom;
  }
});

test('aging: ユーザーが触った場所(種類が変わった)は分解キューが尊重する', () => {
  const world = new World(5, 5, 8);
  const aging = new Aging(world, { decay: true });
  // 実在しないブロックをキューに積んでも、現状と一致しなければ消さない
  aging.queue.push({ col: 1, row: 1, y: 0, type: 'wood' });
  world.placeTop(1, 1, 'stone'); // 別のブロックを置く
  const version = world.version;
  aging.update(2); // DECAY_STEP_INTERVAL(1.8)超え → キューを1つ処理
  assert.equal(world.stackAt(1, 1)[0], 'stone', '一致しないので消えない');
  assert.equal(world.version, version);
});
