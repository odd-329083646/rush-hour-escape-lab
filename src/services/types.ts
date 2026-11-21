// src/services/types.ts

export interface RawCarDO {
  id: string;
  row: number;
  col: number;
  dir: "h" | "v";
  len?: number;
}

export interface RawPuzzleDO {
  par: number;
  cars: RawCarDO[];
}

export interface GuestCredentialDO {
  id: string;
  token: string;
}

export interface ProfileDO {
  username: string;
  country: string;
  avatarId: string;
}

export interface MoveDO {
  id: string;
  direction: "left" | "right" | "up" | "down";
  steps: number;
}

export interface DailyScoreDO {
  date: string;
  solve_time: number;
  player_name: string;
}