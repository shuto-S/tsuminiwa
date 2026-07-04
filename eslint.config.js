// ESLint(flat config)。目的は「同名シャドウ・初期化前アクセス(TDZ)」の再発防止。
// 以前、翻訳関数 t がアニメーション用の局所 const t に隠され、t('...') が TDZ 例外になって
// ゲームループごと停止する事故があった。no-shadow / no-use-before-define / no-undef で
// この種のバグを CI で機械的に落とす。スタイル系は最小限にしてノイズを抑える。
const js = require('@eslint/js');
const globals = require('globals');

// 危険パターンを止めるための共通ルール
const guardRules = {
  'no-shadow': 'error', // 外側の変数(import 含む)を同名で覆い隠さない
  'no-use-before-define': ['error', { functions: false, classes: false, variables: true }],
  'no-undef': 'error',
  'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
};

module.exports = [
  js.configs.recommended,
  { ignores: ['dist/**', 'release/**', 'node_modules/**'] },

  // レンダラー(ブラウザ環境・ESM)
  {
    files: ['src/renderer/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: guardRules,
  },

  // メインプロセス・preload・AI サービス(Node・CommonJS)
  {
    files: ['main.js', 'preload.js', 'ai/**/*.js', 'scripts/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: guardRules,
  },

  // テスト(Node・ESM)
  {
    files: ['test/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: guardRules,
  },
];
