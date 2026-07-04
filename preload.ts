import { contextBridge, ipcRenderer } from 'electron';
import type { AiAuthMode, AiGenerateOptions, TsuminiwaBridge } from './src/shared/ipc.ts';

const bridge: TsuminiwaBridge = {
  loadWorld: () => ipcRenderer.invoke('world:load'),
  saveWorld: (json: string) => ipcRenderer.invoke('world:save', json),
  quit: () => ipcRenderer.send('app:quit'),
  setPinned: (pinned: boolean) => ipcRenderer.send('window:pin', pinned),
  saveScreenshot: (dataUrl: string) => ipcRenderer.invoke('shot:save', dataUrl),
  shareToX: (dataUrl: string) => ipcRenderer.invoke('shot:share', dataUrl),
  setAutoLaunch: (enabled: boolean) => ipcRenderer.send('app:autolaunch', enabled),
  // AI(Gemini)。生成・接続テスト・キー管理はメインプロセスで実行
  ai: {
    setKey: (key: string) => ipcRenderer.invoke('ai:setKey', key),
    clearKey: () => ipcRenderer.invoke('ai:clearKey'),
    hasKey: () => ipcRenderer.invoke('ai:hasKey'),
    test: (opts: { authMode: AiAuthMode; model: string }) => ipcRenderer.invoke('ai:test', opts),
    generate: (opts: AiGenerateOptions) => ipcRenderer.invoke('ai:generate', opts),
  },
};

contextBridge.exposeInMainWorld('tsuminiwa', bridge);
