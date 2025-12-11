export interface Script {
  id: string;
  title: string;
  content: string;
  type: 'uploaded' | 'generated';
  createdAt: number;
}

export interface CharacterProfile {
  hostName: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  UPLOADS = 'UPLOADS',
  GENERATOR = 'GENERATOR',
  SETTINGS = 'SETTINGS'
}