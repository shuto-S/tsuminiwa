// アプリ内の多言語対応。言語を増やすときは locales/ に辞書ファイルを足して
// LOCALES に登録するだけでよい(キーは ja を基準にする)。
import { ja } from './locales/ja.js';
import { en } from './locales/en.js';

// 表示順にならべる。ここに足せば設定の言語セレクタにも自動で出る
export const LOCALES = [
  { code: 'ja', label: '日本語', dict: ja },
  { code: 'en', label: 'English', dict: en },
];

const DICTS = Object.fromEntries(LOCALES.map((l) => [l.code, l.dict]));
const FALLBACK = 'ja';

let current = FALLBACK;

export function setLanguage(code) {
  if (DICTS[code]) current = code;
}

export function getLanguage() {
  return current;
}

// キーから訳文を引く。{name} のようなプレースホルダを params で差し替える。
// 見つからなければ ja → キー文字列の順にフォールバックする
export function t(key, params) {
  const dict = DICTS[current] || DICTS[FALLBACK];
  let s = dict[key];
  if (s === undefined) s = DICTS[FALLBACK][key];
  if (s === undefined) return key;
  if (params) {
    for (const k of Object.keys(params)) s = s.split(`{${k}}`).join(params[k]);
  }
  return s;
}

// キャラクターの名前プール(言語ごとに用意。無ければ ja)
export function namesFor(type) {
  const dict = DICTS[current] || DICTS[FALLBACK];
  return (dict.names && dict.names[type]) || DICTS[FALLBACK].names[type];
}

// data-i18n / data-i18n-title を持つ DOM に訳文を流し込む。
// data-i18n はテキスト、data-i18n-title はツールチップ(dataset.tip)に入れる
export function applyDomTranslations(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of root.querySelectorAll('[data-i18n-title]')) {
    el.dataset.tip = t(el.dataset.i18nTitle);
  }
}
