// 日本語(基準ロケール)。新しい文字列はまずここに足す。
export const ja = {
  // ---- タイトル・ヒント ----
  'ui.title': 'つみにわ',
  'ui.hint': '左クリック: 置く ／ 右クリック: こわす ／ ホイール: ズーム',

  // ---- トップバーのツールチップ ----
  'tip.rotateLeft': '視点を左に60度回す',
  'tip.rotateRight': '視点を右に60度回す',
  'tip.auto': '自動発展モード(世界がひとりでに育つ)',
  'tip.shot': 'スクリーンショットを撮る',
  'tip.settings': '設定を開く',
  'tip.quit': 'アプリを終了',
  'tip.weather': 'いまの天気: {label}',
  'tip.season': '{name}・{day}日め',
  'tip.place': '{name}を置く',
  'tip.erase': 'ブロックをこわす(右クリックでも可)',
  'tip.spawnVillager': 'ひとを追加',
  'tip.spawnSheep': 'ひつじを追加',
  'tip.spawnChicken': 'にわとりを追加',

  // ---- 設定パネル ----
  'settings.header': '設定',
  'settings.language': 'ことば',
  'settings.gridSize': 'マス数',
  'settings.maxHeight': '高さ上限',
  'settings.charScale': 'キャラの大きさ',
  'settings.charSpeed': 'キャラのはやさ',
  'settings.autoSpeed': '自動発展のはやさ',
  'settings.dayLength': '1日の長さ',
  'settings.weatherInterval': '天気の変わる間隔',
  'settings.weather': '天気のうつりかわり',
  'settings.dayNight': '昼夜サイクル',
  'settings.decay': '時のうつろい(燃え尽き・枯れ)',
  'settings.sound': '環境音',
  'settings.volume': '音量',
  'settings.sky': '空の演出(虹・ながれぼし)',
  'settings.shadows': '影を落とす',
  'settings.pinned': '常に最前面',
  'settings.powerSave': '省電力(非アクティブ時)',
  'settings.autoLaunch': 'ログイン時に自動起動',
  'settings.spawn': 'なかまを増やす',
  'settings.roster': 'むらの なかまたち',
  'settings.reset': '世界をつくりなおす',
  'settings.resetNote': 'マス数・高さ上限を変えると世界がつくりなおされます',

  // ---- スクショのプレビュー ----
  'shot.save': '💾 保存',
  'shot.share': '𝕏 シェア',
  'shot.close': 'とじる',
  'shot.saved': '📷 ピクチャの「つみにわ」に保存した',
  'shot.saveFail': '📷 保存できなかった…',
  'shot.shared': '🖼 画像をコピーした! Xの投稿に ⌘V で貼ってね',
  'shot.shareFail': 'シェアできなかった…',

  // ---- 単位の表示 ----
  'unit.times': '×{v}',
  'unit.minutes': '{v}分',
  'unit.seconds': '{v}秒',
  'unit.percent': '{v}%',
  'unit.grid': '{v}×{v}',
  'unit.day': '{v}日',

  // ---- ブロック ----
  'block.grass': 'くさ',
  'block.dirt': 'つち',
  'block.stone': 'いし',
  'block.sand': 'すな',
  'block.wood': 'き',
  'block.leaves': 'はっぱ',
  'block.brick': 'レンガ',
  'block.snow': 'ゆき',
  'block.water': 'みず',
  'block.campfire': 'たきび',
  'block.ash': 'はい',
  'block.farm': 'はたけ',

  // ---- 季節・天気 ----
  'season.spring': 'はる',
  'season.summer': 'なつ',
  'season.autumn': 'あき',
  'season.winter': 'ふゆ',
  'weather.sunny': 'はれ',
  'weather.cloudy': 'くもり',
  'weather.rain': 'あめ',
  'weather.snow': 'ゆき',

  // ---- せいかく・しごと ----
  'trait.relaxed': 'のんびり',
  'trait.hasty': 'せっかち',
  'trait.lively': 'げんき',
  'trait.mypace': 'まいぺーす',
  'trait.timid': 'おくびょう',
  'job.lumberjack': 'きこり',
  'job.farmer': 'のうふ',
  'job.fisher': 'つりびと',
  'job.villager': 'むらびと',

  // ---- なかま一覧 ----
  'roster.empty': 'まだ だれもいない',
  'roster.line': '{emoji} {name}({tags})',
  'roster.sep': '・',
  'tag.baby': 'こども',
  'tag.black': 'くろ',

  // ---- 季節・天気のできごと ----
  'event.weatherChanged': '{emoji} {label}になった',
  'event.seasonChanged': '{emoji} {name}になった',

  // ---- 訪問者 ----
  'event.visitorTraveler': '🚶 たびびとが やってきた',
  'event.visitorDeer': '🦌 しかが あそびに きた',
  'event.visitorCat': '🐈 ねこが ふらりと あらわれた',
  'event.farewellTraveler': '🚶 たびびとは さっていった',
  'event.farewellDeer': '🦌 しかは もりへ かえっていった',
  'event.farewellCat': '🐈 ねこは きまぐれに さっていった',
  'event.settle': '🏡 たびびとが「{name}」として むらに すみついた',

  // ---- 世代・おまつり ----
  'event.hatch': '🐣 ひよこの「{name}」が かえった',
  'event.lambBlack': '🐑 めずらしい くろい こひつじ、「{name}」が うまれた!',
  'event.lamb': '🐑 こひつじの「{name}」が うまれた',
  'event.festivalAnimals': '🎉 たきびのまわりで どうぶつもいっしょに おまつり!',
  'event.festival': '🎉 たきびのまわりで おまつりが はじまった!',

  // ---- しごと ----
  'event.jobChop': '🪓 {name}が きをきって、あたらしい なえを うえた',
  'event.jobTill': '🧑‍🌾 {name}が はたけを たがやした',
  'event.jobHarvest': '🌾 {name}が こむぎを しゅうかくした',
  'event.jobGoldFish': '✨ {name}が きんいろの さかなを つりあげた!!',
  'event.jobFish': '🐟 {name}が さかなを つりあげた',

  // ---- 時のうつろい・自動発展 ----
  'event.agingCampfire': '🔥 たきびが燃えつきた',
  'event.agingTree': '🍂 ふるい木がかれた',
  'event.agingHut': '🏚️ ふるい家がくずれた',
  'event.autopilotHut': '🏠 ちいさな家がたった',

  // ---- レア(ネタバレ注意・ドキュメントには書かない) ----
  'event.rareAurora': '🌌 よぞらが ゆらめいている…',
  'event.rareWhale': '🐋 そらクジラが ゆっくりと およいでいく…',
  'event.rareMeteor': '🌠 りゅうせいぐん!',
  'event.rareGoldFish': '✨ きんいろの さかなが はねた!',

  // ---- キャラクターの名前プール ----
  names: {
    villager: ['そら', 'うみ', 'はな', 'ゆず', 'こはる', 'もも', 'りん', 'たろう', 'あおい', 'つむぎ', 'さくら', 'ふうた'],
    sheep: ['モコ', 'フワ', 'メエ', 'ポワ', 'ユキ', 'マシュ', 'ワタ'],
    chicken: ['ピヨ', 'コッコ', 'トサカ', 'マメ', 'ココ', 'チャボ'],
    deer: ['モミジ', 'シカノスケ', 'バンビ'],
    cat: ['タマ', 'クロ', 'ミケ', 'トラ'],
    traveler: ['たびびと'],
  },

  // 名前が枯れたときの接尾辞(二世 → -II など)
  'name.suffix': '{name}二世',
};
