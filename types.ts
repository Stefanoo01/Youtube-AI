
export interface Script {
  id: string;
  title: string;
  content: string;
  type: 'uploaded' | 'generated';
  createdAt: number;
}

export interface CharacterProfile {
  hostName: string;
  language?: string;
  selectedModel?: string;
}

export interface ScriptSection {
  id: string;
  content: string;
  isRegenerating: boolean;
  isEditing: boolean;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  UPLOADS = 'UPLOADS',
  GENERATOR = 'GENERATOR',
  SETTINGS = 'SETTINGS'
}
