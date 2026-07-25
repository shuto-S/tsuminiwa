import { packager } from '@electron/packager';
import process from 'node:process';

const archArgument = process.argv.slice(2).find((argument) => argument.startsWith('--arch='));
const arch = archArgument?.slice('--arch='.length) || process.env.npm_config_arch || 'arm64';
const signingIdentity = process.env.CI_SIGNING_IDENTITY?.trim();
const signingKeychain = process.env.CI_SIGNING_KEYCHAIN?.trim();

if (!['arm64', 'x64'].includes(arch)) {
  throw new Error(`未対応のmacOSアーキテクチャです: ${arch}`);
}

if (Boolean(signingIdentity) !== Boolean(signingKeychain)) {
  throw new Error('CI署名では CI_SIGNING_IDENTITY と CI_SIGNING_KEYCHAIN の両方が必要です。');
}

const appPaths = await packager({
  dir: '.',
  name: 'つみにわ',
  platform: 'darwin',
  arch,
  out: 'release',
  overwrite: true,
  asar: true,
  icon: 'build/icon.icns',
  appBundleId: 'dev.amusphere.tsuminiwa',
  ignore: [
    /^\/src/,
    /^\/tsconfig\.json$/,
    /^\/eslint\.config\.js$/,
    /^\/release/,
    /^\/build/,
    /^\/test/,
    /^\/scripts/,
    /^\/docs/,
    /^\/\./,
    /^\/AGENTS\.md/,
    /^\/README/,
    /^\/DEVELOPMENT\.md/,
    /^\/LICENSE/,
  ],
  osxSign: signingIdentity
    ? {
        identity: signingIdentity,
        keychain: signingKeychain,
        hardenedRuntime: true,
        strictVerify: true,
        continueOnError: false,
      }
    : undefined,
});

process.stdout.write(`Packaged ${arch}: ${appPaths.join(', ')}\n`);
