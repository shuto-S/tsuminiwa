// レンダラーからは preload が公開する window.tsuminiwa 経由でのみメインプロセスに触れる。
// その IPC 境界の型をグローバル宣言としてまとめておく。
import type { TsuminiwaBridge } from '../shared/ipc.ts';

declare global {
  interface Window {
    tsuminiwa: TsuminiwaBridge;
  }
}

export {};
