// レアなできごとの一元定義。
// 表示メッセージ(i18n キー)と AI フレーバーの種類を1か所にまとめ、各コンポーネントは
// 意味キー(例: 'whale')だけを emit する。翻訳と AI 連携は main の emitRare に集約する。
//
// このしくみの狙いのひとつは事故防止。critters / seasonal のようにアニメーション用の
// 局所変数(const t など)を多用するモジュールが、翻訳関数 t を import せずに済むように
// することで、「局所 t が関数スコープ全体に巻き上がり、翻訳 t を呼ぶ行が TDZ(初期化前
// アクセス)で例外になる」たぐいの事故を、構造的に起こせなくする。
//
// 新しいレア演出を足すときは、ここに1行足して、発火側で this.emitRare('key') を呼ぶだけ。
export const RARE_EVENTS = {
  whale: { message: 'event.rareWhale', flavor: 'whale' },
  meteor: { message: 'event.rareMeteor', flavor: 'meteor' },
  goldfish: { message: 'event.rareGoldFish', flavor: 'goldfish' },
  aurora: { message: 'event.rareAurora', flavor: 'aurora' },
};

// 意味キーからレア定義を引く(未知キーは null)。
export function rareEvent(key) {
  return RARE_EVENTS[key] || null;
}
