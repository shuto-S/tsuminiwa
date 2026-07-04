# #5/#2/#3 実装の引き継ぎ(完了後に削除)

進捗は git に保存。以下は「まだ終わっていないこと」。鉄則: **AI無効/失敗時は従来動作(回帰なし)**。

## #5 ケイパビリティ層(先に)
- `src/renderer/ai/registry.js`: describeBlocks() / イベント descriptor(registerEvent/describeEvent, レア5種を登録) /
  アクションレジストリ(registerAction/listActions/actionFunctionDeclarations) / worldManifest()。純ロジック+テスト。
- `src/renderer/ai/observe.js`: observeWorld(world, character, ctx) 汎用シリアライザ(近傍ブロックを自動列挙)。テスト。
- `ai/main-service.js` の generate に `tools`(functionDeclarations)を渡せるよう配線(#4 用の器)。
- テスト `test/ai-registry.test.mjs`。

## #2 descriptor 移行
- `flavor.js` の poemRequest を `{subject, season, lang}` に。RARE_SUBJECT を削除。
- `generate.js` の generatePoem が `describeEvent(kind).subject` を引いて渡す。
- 既存テスト(poemRequest/ai-generate)を新シグネチャに更新。「新イベントを registerEvent すれば一句が出る」テストを足す。

## #3 ことばで世界生成
- `terrain.js` の generateWorld を `generateWorld(cols, rows, maxHeight, params)` に拡張(params 無しは従来挙動)。
  params: waterLevel, hilliness, treeDensity, flowerDensity, snow, sand 比率 等。範囲外はクランプ。schema は1か所(worldgen-schema.js)。
- `flavor.js` に worldgenRequest(instruction, {blocks, lang})(structured schema, describeBlocks を渡す)。
- `generate.js` に generateWorldParams(client, instruction, ctx)。
- 設定パネルに「ことばで世界をつくる」入力+ボタン(AI有効時のみ)。main で regenerate 経路に流す。
- テスト: パラメータ化 generateWorld(全マス埋まる・高さ上限・クランプ)。

## 完了確認
- [ ] `npm test` green、AI無効の既定で `npx electron .` エラーなし
- [ ] 各まとまりを1コミットずつ。完了後このファイル削除。
