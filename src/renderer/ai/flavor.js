// AI フレーバー生成のプロンプトを1か所にまとめる(純ロジック=テスト可能)。
// 生成そのものは AiClient(=メインプロセス)に委譲する。ここは「何を頼むか」だけ。

const LANG_NAME = { ja: 'Japanese', en: 'English' };

// 住民のひとりごと。ctx: { season, weather, timeOfDay, name, job, trait, lang }
export function mutterRequest(ctx) {
  const lang = LANG_NAME[ctx.lang] || 'Japanese';
  const system =
    `You write a single, very short line of dialogue (an idle mutter) for a villager ` +
    `in a cozy, wholesome hex-block garden game. ` +
    `Rules: reply in ${lang}; one line only, at most about 20 characters/6 words; ` +
    `in-character and gentle; no quotation marks, no emoji, no explanation. Output only the line.`;
  const parts = [
    `Season: ${ctx.season}`,
    `Weather: ${ctx.weather}`,
    `Time: ${ctx.timeOfDay}`,
    `Villager: ${ctx.name}`,
  ];
  if (ctx.job) parts.push(`Job: ${ctx.job}`);
  if (ctx.trait) parts.push(`Personality: ${ctx.trait}`);
  const prompt = `${parts.join(', ')}. What does this villager mutter to themselves right now?`;
  return { system, prompt, maxOutputTokens: 40 };
}

// レアなできごとに添える一句(俳句/短歌)。kind と季節・言語で内容が変わる。
const RARE_SUBJECT = {
  whale: 'a giant whale drifting slowly across the sky',
  meteor: 'a meteor shower streaking across the night',
  goldfish: 'a golden fish leaping from the pond',
  aurora: 'the aurora shimmering over the winter night',
  blacklamb: 'a rare black lamb born in the village',
};
export function poemRequest(kind, ctx) {
  const lang = LANG_NAME[ctx.lang] || 'Japanese';
  const subject = RARE_SUBJECT[kind] || 'a quiet, wondrous moment';
  const system =
    `You are a gentle poet for a cozy hex-block garden game. ` +
    `Write ONE short poem (a haiku- or tanka-like single line, evoking the season) about the given moment. ` +
    `Reply in ${lang}. Prefix it with one fitting emoji. ` +
    `At most ~25 characters/8 words. No quotation marks, no explanation. Output only the poem.`;
  const prompt = `Season: ${ctx.season}. Moment: ${subject}. Compose the poem.`;
  return { system, prompt, maxOutputTokens: 60 };
}

// 旅人が去るときに置いていく、外の世界の小話(1〜2文)。
export function taleRequest(ctx) {
  const lang = LANG_NAME[ctx.lang] || 'Japanese';
  const system =
    `A wandering traveler is leaving a cozy garden village. ` +
    `Write a tiny tale (1 short sentence, at most 2) about somewhere in the outside world they saw. ` +
    `Reply in ${lang}. Prefix with 🚶. Gentle and evocative. ` +
    `No quotation marks, no explanation. Output only the tale.`;
  const prompt = `Season: ${ctx.season}. What does the traveler recount before leaving?`;
  return { system, prompt, maxOutputTokens: 80 };
}

// 朝のかわら版: 前日のできごと(文字列配列)を短い日記にまとめる。
export function chronicleRequest(events, ctx) {
  const lang = LANG_NAME[ctx.lang] || 'Japanese';
  const system =
    `You are the quiet chronicler of a cozy garden village. ` +
    `Given yesterday's happenings, write a short diary entry of 1-2 gentle lines. ` +
    `Reply in ${lang}. Prefix with 📖. Summarize warmly, do not just list. ` +
    `At most ~60 characters/16 words. No quotation marks, no explanation. Output only the entry.`;
  const list = events.slice(0, 20).join(' / ');
  const prompt = `Day ${ctx.day}, season ${ctx.season}. Yesterday: ${list}. Write the diary entry.`;
  return { system, prompt, maxOutputTokens: 120 };
}

// 名前プールの補充: 種類ごとに、季節にちなんだ名前を数個 JSON 配列で。
export function namesRequest(type, ctx) {
  const lang = LANG_NAME[ctx.lang] || 'Japanese';
  const kindWord = { villager: 'villagers (people)', sheep: 'sheep', chicken: 'chickens' }[type] || type;
  const script = ctx.lang === 'en' ? 'short romanized names' : 'short cute Japanese names (kana)';
  const system =
    `You name characters for a cozy garden game. ` +
    `Output ONLY a JSON array of 6 ${script} for ${kindWord}, each 1 short word, gentle and varied. ` +
    `No duplicates, no explanation.`;
  const prompt = `Season: ${ctx.season}. Give 6 names.`;
  const schema = { type: 'array', items: { type: 'string' } };
  return { system, prompt, schema, maxOutputTokens: 120 };
}

// JSON 配列テキストを安全に配列へ(失敗時は空配列)
export function parseNameList(text) {
  if (!text) return [];
  try {
    const v = JSON.parse(text);
    return Array.isArray(v) ? v.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim()) : [];
  } catch {
    return [];
  }
}

// 生成テキストを吹き出し用に整える(引用符除去・改行を潰す・長すぎたら切る)
export function cleanLine(text, maxLen = 28) {
  if (!text) return null;
  let s = String(text).trim().split('\n')[0].trim();
  s = s.replace(/^["'“”「」『』]+/, '').replace(/["'“”「」『』]+$/, '').trim();
  if (!s) return null;
  if (s.length > maxLen) s = s.slice(0, maxLen).trim() + '…';
  return s;
}
