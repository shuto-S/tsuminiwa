# CONTRIBUTING / 開発の進め方

このリポジトリを継続開発する人(人間・AIエージェント問わず)向けのガイド。
**コードの構造と設計判断は [AGENTS.md](AGENTS.md)**、**手順の詳細は [DEVELOPMENT.md](DEVELOPMENT.md)** に分かれている。
このファイルは「どう進めるか(フロー・約束事・不変条件)」をまとめる。

## 3行で

- `npm install` → `npm start`(開発起動)/ `npm test`(ユニットテスト)/ `npm run package`(.app 化)。
- レンダラー(`src/renderer/`)を変えたら **必ず `npm run build`**(`index.html` は `dist/renderer.js` を読む)。
- 変更の粒度でコミットし、CI(build + test)を緑に保つ。

## 守るべき不変条件(壊すと回帰)

1. **AI はオプトイン**。`aiEnabled`/同意/キーが無い・オフライン・失敗・レート上限のときは
   **必ず従来の決定的動作にフォールバック**する(生成関数は null / 空を返す)。AI 無効で挙動が
   1ミリも変わってはいけない。
2. **世界を変更するメソッドは `world.version++`**。レンダラーのループが version 差分で
   `view.rebuild()` と自動保存を回す。
3. **ユーザーに見える文字列は必ず `t('key')` 経由**(直書き禁止)。辞書は `src/renderer/i18n/locales/{ja,en}.js`。
4. **新要素は「自己記述層」に登録する**(下記)。イベント種やブロック名をプロンプトに直書きしない。
5. **Group を作り直す setWorld は `clearGroup()`** を使う(GPUリーク防止)。
6. メインプロセスへのアクセスは `window.tsuminiwa`(preload)→ IPC 経由のみ(CSP のため)。

## 新要素の足し方(自己記述層 = `src/renderer/ai/registry.js`)

ここが単一の真実の source。これらをすれば、フレーバー(一句)/世界生成/(将来の)エージェントが
**追加コードなしで**対応する:

- **新ブロック**: `config.js` の `BLOCK_TYPES` に追加 + i18n `block.<key>` + `registry.js` の `BLOCK_DESC` に英語1行。
- **新イベント/レア**: 発火点で `this.onFlavor?.('<kind>')` を呼び、`registry.js` で `registerEvent('<kind>', { subject })`。
- **新アクション(エージェント用)**: `registerAction({ key, description, params, execute })`。
- **新設定**: `config.js` DEFAULT_SETTINGS → `index.html` → `ui.js` の bind → 必要なら `main.js` の settingChanged(手順は AGENTS.md)。

## テスト

- `node:test` で純ロジックを検証(`test/*.test.mjs`)。**AI は実 API を叩かず、モック backend で**
  テストする(`test/ai-generate.test.mjs` / `test/ai-worldgen.test.mjs` のパターン: `mockBackend(reply)`)。
- world / terrain / water / registry / observe / flavor / client / generate をカバー済み。
- ロジックを変えたら対応テストを足す。描画・実挙動は `npx electron .` で目視。
- CI(`.github/workflows/ci.yml`)が push/PR で `npm run build` と `npm test` を回す。

## コミット / PR

- **粒度**: 1つの意味あるまとまりで1コミット(機能・修正・リファクタを混ぜない)。
- コミットメッセージは日本語1行サマリ + 箇条書き。末尾に
  `Co-Authored-By: Claude <noreply@anthropic.com>` を付ける運用。
- **レア/隠し要素の具体(種類・確率)はユーザーが読むもの(README/リリースノート)に書かない**
  (発見の楽しみを守る方針。AGENTS.md 参照)。
- 破壊的・外向きの操作(リリース公開、リポジトリ変更)は確認してから。

## 中断・引き継ぎ(エージェント運用)

- 大きめの作業は **機能ごとに細かくコミット**して進捗を git に残す。
- 途中で引き継ぐ可能性があるときは、`docs/*-plan.md` に「残タスクをファイル単位で」書いて
  コミットしておき、**完了したら削除**する(過去の handoff の運用)。
- 実装の全体像・依存は GitHub の Issues / Milestones を参照(オープンな作業は #4 のエージェント化)。

## よくハマる所

- レンダラー変更後に `npm run build` を忘れる → 反映されない。
- Electron の zip 展開失敗、allow-scripts 制の postinstall → DEVELOPMENT.md のトラブルシュート。
- 透明ウィンドウの合成バグ(半透明の全面レイヤーが描画されない)→ `transform: translateZ(0)` で回避済み。
