# AIフレーバー実装の引き継ぎ(#2 の残り)

> このファイルは作業中の handoff。**全機能が完了したら削除する**。
> 進捗は git のコミットに保存済み。以下は「まだ終わっていないこと」。

前提(すでに完成・#1 と #2-住民のつぶやき):
- メイン: `ai/main-service.js`(@google/genai、safeStorage、IPC)。
- レンダラー: `src/renderer/ai/client.js` の `AiClient`(オプトイン判定・レート上限・プール・失敗時 null)。
- プロンプト: `src/renderer/ai/flavor.js`(純ロジック、テスト `test/ai-flavor.test.mjs`)。
- 住民のつぶやき: `main.js` の `updateMutters` + `characters.speak()`。
- **鉄則: AI無効/キー無し/オフライン/失敗/レート上限のとき `ai.generate` は null → 必ず従来動作にフォールバック(回帰なし)。プロンプトは現在の言語 `getLanguage()` で。**

## 残タスク

### #4 レアに一句(poem)
- レア発生時に俳句/短歌を1句、トーストで添える。
- 対象イベントと発火元:
  - critters.js: そらクジラ(`updateWhale`)/流星群(`updateShootingStar` の showerT 開始)/金の魚(`updateFish` の golden)
  - seasonal.js: オーロラ(`updateAurora`)
  - characters.js: くろいこひつじ(`updateBirths` の variant==='black')
- 実装方針: 各システムに `this.onFlavor?.(kind)` を追加(既存の onEvent 呼び出しの隣で）。`kind` は 'whale'|'meteor'|'goldfish'|'aurora'|'blacklamb'。
- main で `critters.onFlavor / seasonal.onFlavor / characters.onFlavor` に共通ハンドラを設定 → `poemRequest(kind, {season, lang})` を生成 → 返れば showToast。
- flavor.js に `poemRequest(kind, ctx)` を追加(俳句/短歌、絵文字1つ添える指示、言語指定)。テストも。

### #5 旅人の土産話(tale)
- 旅人が去るとき、たまに「外の世界」の架空の小話(1〜2文)をトーストで。
- 発火元: characters.js の leaving 処理で `c.type === 'traveler'` の farewell を出すところ。移住しなかった旅人が対象。
- 実装: そこで `this.onFlavor?.('travelerleave')` を呼ぶ（#4 と同じフックを流用）。main 側で kind==='travelerleave' なら `taleRequest({lang})` を生成。
- flavor.js に `taleRequest(ctx)`。確率は main 側で 50% 程度に絞る。

### #3 朝のかわら版(chronicle)
- ゲーム内の朝(day が増える瞬間)に、前日のできごとを 2〜3 行の日記にしてトースト。
- できごとの収集: `showToast` は表示専用なので、**イベントの生キー/文言を別途ためる**。案: main で `logEvent(text)` を作り、各 `onEvent = showToast` を `onEvent = (s)=>{ logEvent(s); showToast(s); }` に差し替えて当日分を配列に蓄積。日付ロールオーバー(既存 `daynight.day !== lastDay`)で、配列を `chronicleRequest(events, {day, season, lang})` に渡して生成 → showToast → 配列クリア。
- 空の日は生成しない。AI 無効時は何もしない(日記は出ない)。
- flavor.js に `chronicleRequest(events, ctx)`。テスト。

### #6 AI命名(names)
- 生まれた子・移住者の名前を AI に。**同期 spawn を壊さないため pool 方式**:
  - AiClient のプール(`fill/take`)を使い、種類別(villager/sheep/chicken)に名前を数個ずつ背景生成。
  - `characters.pickName(type)` を「AI プールに在庫があればそれを使い、無ければ従来 namesFor」に。プールは main が低頻度で補充(在庫が少なく AI 有効なとき `namesRequest(type, {season, lang})` で JSON 配列生成 → `ai.fill`)。
  - CharacterManager にプール参照を渡す必要がある(コンストラクタか setter で AiClient を注入、または pickName にフックを渡す)。**セーブ済みの名前は不変**(既存仕様)。
- flavor.js に `namesRequest(type, ctx)`(JSON配列で数個、structured schema 使用可)。

## 完了の確認
- [ ] `npm test` green(各 flavor 追加の純ロジックテストを足す)
- [ ] AI 無効の既定で `npx electron .` がエラーなく起動、上記いずれも出ない(回帰なし)
- [ ] 各機能を1コミットずつ。完了後このファイルを削除。
