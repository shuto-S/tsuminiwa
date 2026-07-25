import { contextBridge, ipcRenderer } from 'electron';
import type { AiAuthMode, AiGenerateOptions, AiProvider, TsuminiwaBridge } from '../shared/ipc.ts';

const bridge: TsuminiwaBridge = {
  loadWorld: () => ipcRenderer.invoke('world:load'),
  saveWorld: (json: string) => ipcRenderer.invoke('world:save', json),
  quit: () => ipcRenderer.send('app:quit'),
  setPinned: (pinned: boolean) => ipcRenderer.send('window:pin', pinned),
  saveScreenshot: (dataUrl: string) => ipcRenderer.invoke('shot:save', dataUrl),
  shareToX: (dataUrl: string) => ipcRenderer.invoke('shot:share', dataUrl),
  setAutoLaunch: (enabled: boolean) => ipcRenderer.send('app:autolaunch', enabled),
  // AI。生成・接続テスト・環境変数の検出はメインプロセスで実行
  ai: {
    keyStatus: () => ipcRenderer.invoke('ai:keyStatus'),
    hasKey: (provider?: AiProvider) => ipcRenderer.invoke('ai:hasKey', provider),
    test: (opts: { provider: AiProvider; authMode?: AiAuthMode; model: string }) =>
      ipcRenderer.invoke('ai:test', opts),
    generate: (opts: AiGenerateOptions) => ipcRenderer.invoke('ai:generate', opts),
  },
};

contextBridge.exposeInMainWorld('tsuminiwa', bridge);
