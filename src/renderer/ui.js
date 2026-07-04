import { BLOCK_TYPES } from './config.js';
import { t, setLanguage, applyDomTranslations, LOCALES } from './i18n/index.js';

export function setupUI(callbacks, state) {
  // 静的な DOM(data-i18n / data-i18n-title)にまず訳文を流し込む
  applyDomTranslations();

  // ---- パレット ----
  const palette = document.getElementById('palette');
  const swatches = new Map();

  const select = (tool) => {
    state.tool = tool;
    for (const [key, el] of swatches) el.classList.toggle('selected', key === tool);
  };

  // パレットのツールチップは言語切替で引き直せるよう関数にまとめる
  const refreshPaletteTips = () => {
    for (const [key, el] of swatches) {
      el.dataset.tip = key === 'erase' ? t('tip.erase') : t('tip.place', { name: t(`block.${key}`) });
    }
  };

  for (const [key, def] of Object.entries(BLOCK_TYPES)) {
    const el = document.createElement('div');
    el.className = 'swatch';
    el.style.background = `#${def.color.toString(16).padStart(6, '0')}`;
    el.addEventListener('click', () => select(key));
    palette.appendChild(el);
    swatches.set(key, el);
  }

  const eraser = document.createElement('div');
  eraser.className = 'swatch';
  eraser.style.background = 'rgba(255,255,255,0.15)';
  eraser.textContent = '⛏';
  eraser.addEventListener('click', () => select('erase'));
  palette.appendChild(eraser);
  swatches.set('erase', eraser);
  refreshPaletteTips();

  select(state.tool);

  // ---- トップバー ----
  document.getElementById('btn-rotate-left').addEventListener('click', () => callbacks.rotate(1));
  document.getElementById('btn-rotate-right').addEventListener('click', () => callbacks.rotate(-1));
  document.getElementById('btn-quit').addEventListener('click', () => callbacks.quit());
  // ---- スクショのプレビュー(撮る → 確認してから保存/シェア) ----
  const shotModal = document.getElementById('shot-modal');
  const shotPreview = document.getElementById('shot-preview');
  let currentShot = null;
  const closeShot = () => {
    shotModal.classList.add('hidden');
    shotPreview.src = '';
    currentShot = null;
  };
  document.getElementById('btn-shot').addEventListener('click', () => {
    currentShot = callbacks.capture();
    shotPreview.src = currentShot;
    shotModal.classList.remove('hidden');
  });
  document.getElementById('shot-close').addEventListener('click', closeShot);
  shotModal.addEventListener('click', (event) => {
    if (event.target === shotModal) closeShot(); // 背景クリックでも閉じる
  });
  document.getElementById('shot-save').addEventListener('click', async () => {
    const shot = currentShot;
    closeShot();
    await callbacks.saveShot(shot);
  });
  document.getElementById('shot-share').addEventListener('click', async () => {
    const shot = currentShot;
    closeShot();
    await callbacks.shareShot(shot);
  });

  const autoButton = document.getElementById('btn-auto');
  const syncAutoButton = () => autoButton.classList.toggle('active', state.auto);
  autoButton.addEventListener('click', () => {
    state.auto = !state.auto;
    syncAutoButton();
    callbacks.autoChanged(state.auto);
  });
  syncAutoButton();

  // ---- 設定パネル ----
  const panel = document.getElementById('settings-panel');
  const renderRoster = () => {
    if (!callbacks.getRoster) return;
    const roster = document.getElementById('roster');
    roster.textContent = '';
    for (const line of callbacks.getRoster()) {
      const el = document.createElement('div');
      el.textContent = line;
      roster.appendChild(el);
    }
    if (roster.childElementCount === 0) roster.textContent = t('roster.empty');
  };
  document.getElementById('btn-settings').addEventListener('click', () => {
    panel.classList.toggle('hidden');
    // 開くたびに「なかま」一覧を作り直す
    if (!panel.classList.contains('hidden')) renderRoster();
  });

  const gridSize = document.getElementById('grid-size');
  const gridSizeValue = document.getElementById('grid-size-value');
  const maxHeight = document.getElementById('max-height');
  const maxHeightValue = document.getElementById('max-height-value');

  gridSize.value = state.gridSize;
  maxHeight.value = state.maxHeight;
  gridSizeValue.textContent = t('unit.grid', { v: state.gridSize });
  maxHeightValue.textContent = state.maxHeight;

  gridSize.addEventListener('input', () => {
    gridSizeValue.textContent = t('unit.grid', { v: gridSize.value });
  });
  maxHeight.addEventListener('input', () => {
    maxHeightValue.textContent = maxHeight.value;
  });
  gridSize.addEventListener('change', () => {
    callbacks.regenerate(Number(gridSize.value), Number(maxHeight.value));
  });
  maxHeight.addEventListener('change', () => {
    callbacks.regenerate(Number(gridSize.value), Number(maxHeight.value));
  });

  // ---- ゲーム設定(その場で反映) ----
  const sliderRefreshers = []; // 言語切替で単位表示を引き直すため
  const bindSlider = (id, key, format) => {
    const input = document.getElementById(id);
    const value = document.getElementById(`${id}-value`);
    input.value = state.settings[key];
    const render = () => (value.textContent = format(Number(input.value)));
    render();
    sliderRefreshers.push(render);
    input.addEventListener('input', () => {
      render();
      callbacks.settingChanged(key, Number(input.value));
    });
  };
  const times = (v) => t('unit.times', { v: v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '') });
  bindSlider('char-scale', 'characterScale', times);
  bindSlider('char-speed', 'characterSpeed', times);
  bindSlider('auto-speed', 'autoSpeed', times);
  bindSlider('day-length', 'dayLength', (v) => t('unit.minutes', { v: Math.round(v / 60) }));
  bindSlider('weather-interval', 'weatherInterval', (v) => t('unit.seconds', { v }));
  bindSlider('sound-volume', 'volume', (v) => t('unit.percent', { v: Math.round(v * 100) }));

  const bindCheckbox = (id, key) => {
    const input = document.getElementById(id);
    input.checked = state.settings[key];
    input.addEventListener('change', () => callbacks.settingChanged(key, input.checked));
  };
  bindCheckbox('opt-weather', 'weather');
  bindCheckbox('opt-daynight', 'dayNight');
  bindCheckbox('opt-decay', 'decay');
  bindCheckbox('opt-sound', 'sound');
  bindCheckbox('opt-sky', 'skyShows');
  bindCheckbox('opt-shadows', 'shadows');
  bindCheckbox('opt-pinned', 'pinned');
  bindCheckbox('opt-powersave', 'powerSave');
  bindCheckbox('opt-autolaunch', 'autoLaunch');

  // ---- 言語セレクタ ----
  const langSelect = document.getElementById('opt-language');
  for (const loc of LOCALES) {
    const opt = document.createElement('option');
    opt.value = loc.code;
    opt.textContent = loc.label;
    langSelect.appendChild(opt);
  }
  langSelect.value = state.settings.language;
  langSelect.addEventListener('change', () => {
    setLanguage(langSelect.value);
    applyDomTranslations(); // 静的なテキスト・ツールチップ
    refreshPaletteTips();
    for (const r of sliderRefreshers) r();
    if (!panel.classList.contains('hidden')) renderRoster();
    callbacks.settingChanged('language', langSelect.value); // 天気・季節の引き直し+保存
  });

  document.getElementById('spawn-villager').addEventListener('click', () => callbacks.spawn('villager'));
  document.getElementById('spawn-sheep').addEventListener('click', () => callbacks.spawn('sheep'));
  document.getElementById('spawn-chicken').addEventListener('click', () => callbacks.spawn('chicken'));
  document.getElementById('btn-reset').addEventListener('click', () => {
    callbacks.regenerate(Number(gridSize.value), Number(maxHeight.value));
  });

  setupTooltips();
  setupAutoHide();
}

// フォーカスが外れてしばらくしたらUIをフェードアウトする(箱庭だけ残る)
const CHROME_HIDE_DELAY = 3000;

function setupAutoHide() {
  let timer = null;
  window.addEventListener('blur', () => {
    clearTimeout(timer);
    timer = setTimeout(() => document.body.classList.add('chrome-hidden'), CHROME_HIDE_DELAY);
  });
  window.addEventListener('focus', () => {
    clearTimeout(timer);
    document.body.classList.remove('chrome-hidden');
  });
}

// できごとを画面のすみにふわっと出す
export function showToast(text) {
  let container = document.getElementById('toasts');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toasts';
    document.getElementById('app').appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = text;
  container.appendChild(toast);
  while (container.children.length > 3) container.firstChild.remove();
  setTimeout(() => toast.classList.add('fade'), 3200);
  setTimeout(() => toast.remove(), 4000);
}

// トップバーの天気表示を更新(state は 'sunny' などのキー)
export function setWeatherDisplay(emoji, state) {
  const el = document.getElementById('weather');
  el.textContent = emoji;
  el.dataset.tip = t('tip.weather', { label: t(`weather.${state}`) });
}

// トップバーの季節・日数表示を更新
export function setSeasonDisplay(season, day) {
  const el = document.getElementById('season');
  const name = t(`season.${season.key}`);
  el.textContent = `${season.emoji}${t('unit.day', { v: day + 1 })}`;
  el.dataset.tip = t('tip.season', { name, day: day + 1 });
}

// data-i18n-title / 動的な dataset.tip をマウスオーバーで出すツールチップにする
function setupTooltips() {
  const tip = document.createElement('div');
  tip.id = 'tooltip';
  document.body.appendChild(tip);

  const show = (el) => {
    tip.textContent = el.dataset.tip;
    tip.classList.add('visible');
    const rect = el.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    // 画面の下半分なら上に、上半分なら下に出す
    const above = rect.top > window.innerHeight / 2;
    const x = Math.max(
      4,
      Math.min(window.innerWidth - tipRect.width - 4, rect.left + rect.width / 2 - tipRect.width / 2)
    );
    const y = above ? rect.top - tipRect.height - 6 : rect.bottom + 6;
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
  };

  const hide = () => tip.classList.remove('visible');

  // dataset.tip を持つ(あるいは動的に入る)要素にホバー表示をつける。
  // 訳文は applyDomTranslations / refreshPaletteTips / 各 setter が dataset.tip に入れる
  for (const el of document.querySelectorAll('[data-i18n-title], .swatch, #weather, #season')) {
    el.addEventListener('mouseenter', () => show(el));
    el.addEventListener('mouseleave', hide);
    el.addEventListener('click', hide);
  }
}
