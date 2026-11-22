// src/engine/blApi.ts
import type {
  DailyScoreRemotePort,
  PuzzleRepositoryPort,
  StoragePort,
} from "./contracts";
import {
  DEFAULT_PUZZLES,
  TIERS,
  applyMove,
  calculateStars,
  getDailyPuzzleAsync,
  getNextBestMove,
  getPuzzlesForTier,
  getSolvesCountInTier,
  isOutOfMoves,
  isSolved,
  isTierUnlocked,
  loadPuzzlesAsync,
  minSolution,
  pickHidden,
  runPlan,
  todayKey,
  type Car,
  type Level,
  type Move,
} from "./game";
import {
  HINT_COSTS,
  hintAvailable,
  peekBoardCars,
  validateHintPlan,
  type HintType,
} from "./hints";
import {
  addCoins,
  getCoins,
  getSavedProgress,
  saveLevelProgress,
} from "./rewards";
import { awardOnce, spendCoins } from "./rewardPolicy";
import {
  COUNTRIES,
  flag,
  getPlayerRecords,
  getProfile,
  levelBests,
  saveProfile,
  type PlayerRecords,
  type Profile,
} from "./profile";
import {
  TUTORIAL_REWARD,
  completeTutorial,
  hasSeenTutorial,
  isTutorialDone,
  markTutorialSeen,
} from "./tutorial";
import {
  ENTRY_FEE,
  WIN_REWARD,
  advanceRace,
  fallbackRacePuzzles,
  formatRoomCode,
  normalizeRoomCode,
  pickRacePuzzleIndices,
  raceIntroPhase,
  raceWaitRemaining,
  resolveRacePuzzles,
  type GuestCredential,
  type RaceMatch,
  type RacePuzzle,
  type RaceSnapshot,
  type RaceState,
} from "./tournament";
import {
  applyTournamentSnapshot,
  getGuestCredential,
  saveGuestCredential,
  tournamentStats,
  walletDelta,
} from "./tournament-device";
import { PUZZLES as TOURNAMENT_PUZZLES } from "./tournamentCatalogue";
import { LESSONS, type Lesson } from "./tutorialLessons";
import { findNextMove, generatePuzzle } from "./puzzleAnalysis";
import * as dailyScores from "./daily-scores";
import { storageService } from "@/services/storageService";
import { puzzleRepository } from "@/services/puzzleRepository";
import * as supabaseService from "@/services/supabaseService";

export type PuzzleItem = (typeof DEFAULT_PUZZLES)[number];
export type TierItem = (typeof TIERS)[number];
export type TierPuzzlesResult = ReturnType<typeof getPuzzlesForTier>;
export type LevelProgressMap = ReturnType<typeof getSavedProgress>;
export type SaveProgressResult = ReturnType<typeof saveLevelProgress>;
export type ProfileInput = Parameters<typeof saveProfile>[0];
export type SubmitDailyScoreParams = Parameters<typeof dailyScores.submitScore>[0];
export type SubmitDailyScoreResult = Awaited<ReturnType<typeof dailyScores.submitScore>>;

export interface BlApi {
  readonly ports: {
    readonly storage: StoragePort;
    readonly puzzleRepo: PuzzleRepositoryPort;
    readonly remoteScore: DailyScoreRemotePort;
  };
  readonly constants: {
    readonly defaultPuzzles: readonly PuzzleItem[];
    readonly tiers: readonly TierItem[];
    readonly hintCosts: Record<HintType, number>;
    readonly tutorialReward: number;
    readonly entryFee: number;
    readonly winReward: number;
    readonly lessons: readonly Lesson[];
    readonly tournamentPuzzles: readonly PuzzleItem[];
  };
  game: {
    applyMove(cars: Car[], id: string, move: Move, steps: number): { cars: Car[]; error?: string };
    isSolved(cars: Car[]): boolean;
    isOutOfMoves(moves: number, par: number): boolean;
    minSolution(cars: Car[]): number | null;
    getNextBestMove(cars: Car[]): { id: string; move: Move; steps: number } | null;
    pickHidden(cars: Car[], level: Level): Set<string>;
    runPlan(
      cars: Car[],
      plan: { id: string; move: Move; steps: number }[],
    ): { cars: Car[]; failedAt?: number | undefined; error?: string | undefined };
    calculateStars(moves: number, par: number, bumps?: number): number;
    todayKey(date?: Date): string;
    loadPuzzles(repo?: PuzzleRepositoryPort): Promise<PuzzleItem[]>;
    getDailyPuzzle(dateKey: string, repo?: PuzzleRepositoryPort): Promise<PuzzleItem>;
    getPuzzlesForTier(tier: TierItem, puzzles: readonly PuzzleItem[]): TierPuzzlesResult;
    getSolvesCountInTier(tier: TierItem, puzzles: readonly PuzzleItem[], progress: LevelProgressMap): number;
    isTierUnlocked(tierIndex: number, puzzles: readonly PuzzleItem[], progress: LevelProgressMap): boolean;
    generatePuzzle(): Promise<PuzzleItem>;
    findNextMove(cars: Car[]): Promise<{ id: string; move: Move; steps: number } | null>;
  };
  hints: {
    available(
      type: HintType,
      level: Level,
      hidden: Set<string>,
      plan: { id: string; move: Move; steps: number }[],
    ): boolean;
    peekBoardCars(initialCars: Car[], currentCars: Car[], peeking: boolean): Car[];
    validatePlan(
      cars: Car[],
      plan: { id: string; move: Move; steps: number }[],
    ): { failedAt?: number | undefined; error?: string | undefined };
  };
  tutorial: {
    isDone(storage?: StoragePort): boolean;
    hasSeen(storage?: StoragePort): boolean;
    markSeen(storage?: StoragePort): void;
    complete(storage?: StoragePort): boolean;
  };
  rewards: {
    getCoins(storage?: StoragePort): number;
    addCoins(amount: number, storage?: StoragePort): number;
    spendCoins(amount: number, storage?: StoragePort): boolean;
    awardOnce(flagKey: string, amount: number, storage?: StoragePort): boolean;
    getSavedProgress(level: Level, storage?: StoragePort): LevelProgressMap;
    saveLevelProgress(
      level: Level,
      index: number,
      moves: number,
      par: number,
      elapsedSeconds: number,
      bumps?: number,
      storage?: StoragePort,
    ): SaveProgressResult;
  };
  profile: {
    countries: readonly { code: string; en: string; he: string }[];
    flag(code: string): string;
    getProfile(storage?: StoragePort): Profile;
    saveProfile(profile: ProfileInput, storage?: StoragePort): void;
    levelBests(
      level: Level,
      storage?: StoragePort,
    ): { bestTime: number | null; bestMoves: number | null };
    getPlayerRecords(storage?: StoragePort): PlayerRecords;
  };
  tournament: {
    raceWaitRemaining(match: Pick<RaceMatch, "private" | "created_at">, now: number): number;
    raceIntroPhase(startedAt: string | null, now: number): "vs" | "countdown" | "playing";
    resolveRacePuzzles(match: Pick<RaceMatch, "puzzle_indices" | "puzzles">): RacePuzzle[];
    pickRacePuzzleIndices(random?: () => number): number[];
    fallbackRacePuzzles(): RacePuzzle[];
    normalizeRoomCode(code: string): string | null;
    formatRoomCode(code: string): string;
    advanceRace(
      puzzles: RacePuzzle[],
      state: RaceState,
      id: string,
      move: Move,
      steps: number,
      elapsed: number,
    ): { state: RaceState; error?: string };
    getGuestCredential(storage?: StoragePort): GuestCredential | null;
    saveGuestCredential(cred: GuestCredential, storage?: StoragePort): void;
    ensureGuestCredential(
      register: (args: {
        data: { username: string; country: string; avatarId: string; coins: number };
      }) => Promise<unknown>,
      storage?: StoragePort,
    ): Promise<GuestCredential>;
    applySnapshot(snapshot: RaceSnapshot, balanceBefore: number, storage?: StoragePort): void;
    walletDelta(storage?: StoragePort): number;
    stats(storage?: StoragePort): { wins: number; losses: number };
  };
  dailyScores: {
    fmtTime(seconds: number): string;
    isSolvedOn(date: string, storage?: StoragePort): boolean;
    getBestTime(date: string, remote?: DailyScoreRemotePort): Promise<number | null>;
    isRecord(time: number, best: number | null): boolean;
    getWorldRecordCount(storage?: StoragePort): number;
    getMySolves(storage?: StoragePort): Record<string, number>;
    submitScore(
      params: SubmitDailyScoreParams,
      storage?: StoragePort,
      remote?: DailyScoreRemotePort,
    ): Promise<SubmitDailyScoreResult>;
  };
}

export function createBlApi(deps: {
  storage: StoragePort;
  puzzleRepo: PuzzleRepositoryPort;
  remoteScore: DailyScoreRemotePort;
}): BlApi {
  const { storage, puzzleRepo, remoteScore } = deps;

  return {
    ports: {
      storage,
      puzzleRepo,
      remoteScore,
    },
    constants: {
      defaultPuzzles: DEFAULT_PUZZLES,
      tiers: TIERS,
      hintCosts: HINT_COSTS,
      tutorialReward: TUTORIAL_REWARD,
      entryFee: ENTRY_FEE,
      winReward: WIN_REWARD,
      lessons: LESSONS,
      tournamentPuzzles: TOURNAMENT_PUZZLES,
    },
    game: {
      applyMove,
      isSolved,
      isOutOfMoves,
      minSolution,
      getNextBestMove,
      pickHidden,
      runPlan,
      calculateStars,
      todayKey,
      loadPuzzles: (repo = puzzleRepo) => loadPuzzlesAsync(repo),
      getDailyPuzzle: (dateKey, repo = puzzleRepo) => getDailyPuzzleAsync(dateKey, repo),
      getPuzzlesForTier: (tier, puzzles) => getPuzzlesForTier(tier, [...puzzles]),
      getSolvesCountInTier: (tier, puzzles, progress) =>
        getSolvesCountInTier(tier, [...puzzles], progress),
      isTierUnlocked: (tierIndex, puzzles, progress) =>
        isTierUnlocked(tierIndex, [...puzzles], progress),
      generatePuzzle,
      findNextMove,
    },
    hints: {
      available: hintAvailable,
      peekBoardCars,
      validatePlan: validateHintPlan,
    },
    tutorial: {
      isDone: (s = storage) => isTutorialDone(s),
      hasSeen: (s = storage) => hasSeenTutorial(s),
      markSeen: (s = storage) => markTutorialSeen(s),
      complete: (s = storage) => completeTutorial(s),
    },
    rewards: {
      getCoins: (s = storage) => getCoins(s),
      addCoins: (amount, s = storage) => addCoins(amount, s),
      spendCoins: (amount, s = storage) => spendCoins(amount, s),
      awardOnce: (flagKey, amount, s = storage) => awardOnce(flagKey, amount, s),
      getSavedProgress: (level, s = storage) => getSavedProgress(level, s),
      saveLevelProgress: (level, index, moves, par, elapsedSeconds, bumps = 0, s = storage) =>
        saveLevelProgress(level, index, moves, par, elapsedSeconds, bumps, s),
    },
    profile: {
      countries: COUNTRIES,
      flag,
      getProfile: (s = storage) => getProfile(s),
      saveProfile: (profileData, s = storage) => saveProfile(profileData, s),
      levelBests: (level, s = storage) => levelBests(level, s),
      getPlayerRecords: (s = storage) => getPlayerRecords(s),
    },
    tournament: {
      raceWaitRemaining,
      raceIntroPhase,
      resolveRacePuzzles,
      pickRacePuzzleIndices,
      fallbackRacePuzzles,
      normalizeRoomCode,
      formatRoomCode,
      advanceRace,
      getGuestCredential: (s = storage) => getGuestCredential(s),
      saveGuestCredential: (cred, s = storage) => saveGuestCredential(cred, s),
      ensureGuestCredential: async (register, s = storage) => {
        const existing = getGuestCredential(s);
        if (existing) return existing;
        const currentProfile = getProfile(s);
        const currentCoins = getCoins(s);
        const created = (await register({
          data: {
            username: currentProfile.username,
            country: currentProfile.country,
            avatarId: currentProfile.avatarId ?? "car",
            coins: currentCoins,
          },
        })) as GuestCredential;
        saveGuestCredential(created, s);
        return created;
      },
      applySnapshot: (snapshot, balanceBefore, s = storage) =>
        applyTournamentSnapshot(snapshot, balanceBefore, s),
      walletDelta: (s = storage) => walletDelta(s),
      stats: (s = storage) => tournamentStats(s),
    },
    dailyScores: {
      fmtTime: dailyScores.fmtTime,
      isSolvedOn: (date, s = storage) => dailyScores.isSolvedOn(date, s),
      getBestTime: (date, r = remoteScore) => dailyScores.getBestTime(date, r),
      isRecord: dailyScores.isRecord,
      getWorldRecordCount: (s = storage) => dailyScores.getWorldRecordCount(s),
      getMySolves: (s = storage) => dailyScores.getMySolves(s),
      submitScore: (params, s = storage, r = remoteScore) =>
        dailyScores.submitScore(params, s, r),
    },
  };
}

export const defaultRemoteScorePort: DailyScoreRemotePort = {
  readDailyBest: supabaseService.readDailyBest,
  writeDailyScore: supabaseService.writeDailyScore,
};

export const blApi: BlApi = createBlApi({
  storage: storageService,
  puzzleRepo: puzzleRepository,
  remoteScore: defaultRemoteScorePort,
});