export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export interface LeaderboardEntry {
  name: string;
  score: number;
  time: number; // in seconds
  car: string;
  track: string;
  date: string;
}

export interface CarConfig {
  id: string;
  name: string;
  color: string;
  secondaryColor: string;
  speed: number;        // max speed multiplier
  acceleration: number; // steering responsiveness/accel
  handling: number;     // drift traction
  nitro: number;        // nitro duration/power
  price: number;        // cost if unlocked
  unlocked: boolean;
  description: string;
}

export interface TrackConfig {
  id: string;
  name: string;
  color: string;         // ground/road theme color
  skyColor: string;
  fogColor: string;
  length: number;        // track length in meters (e.g. 2000)
  difficulty: 'Oson' | "O'rtacha" | 'Qiyin';
  lanes: number;         // number of lanes
  curveIntensity: number;// amount of track turn
  description: string;
}

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  autoGas: boolean;
  graphics: 'low' | 'high';
}
