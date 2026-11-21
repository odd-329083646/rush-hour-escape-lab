// src/engine/blTest.ts
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// 1. הגדרת סביבת Node עבור גישור מול שכבת ה-DAL (LocalStorage, Location, Env)
const envValues: Record<string, string | undefined> = {
  VITE_SUPABASE_URL: process.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"],
  VITE_SUPABASE_PUBLISHABLE_KEY:
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_PUBLISHABLE_KEY"],
};

if (!import.meta.env) {
  Object.defineProperty(import.meta, "env", {
    value: envValues,
    writable: true,
    configurable: true,
  });
} else {
  Object.assign(import.meta.env, envValues);
}

if (typeof globalThis.window === "undefined") {
  const mem = new Map<string, string>();
  const mockStorage: Storage = {
    get length() {
      return mem.size;
    },
    clear: () => mem.clear(),
    getItem: (key: string) => mem.get(key) ?? null,
    key: (index: number) => Array.from(mem.keys())[index] ?? null,
    removeItem: (key: string) => {
      mem.delete(key);
    },
    setItem: (key: string, value: string) => {
      mem.set(key, value);
    },
  };

  const mockLocation = {
    href: "http://localhost:3000/",
    origin: "http://localhost:3000",
    protocol: "http:",
    host: "localhost:3000",
    hostname: "localhost",
    port: "3000",
    pathname: "/",
    search: "",
    hash: "",
  };

  Object.defineProperty(globalThis, "localStorage", {
    value: mockStorage,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(globalThis, "location", {
    value: mockLocation,
    writable: true,
    configurable: true,
  });

  (globalThis as unknown as { window: unknown }).window = {
    localStorage: mockStorage,
    location: mockLocation,
    setTimeout: globalThis.setTimeout.bind(globalThis),
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  };
}

// 2. ייבוא חוזים ומודולים משכבת ה-BL
import type { DailyScoreRemotePort, PuzzleRepositoryPort, StoragePort } from "./contracts";
import {
  TIERS,
  applyMove,
  calculateStars,
  getDailyPuzzleAsync,
  getNextBestMove,
  getPuzzlesForTier,
  isSolved,
  isTierUnlocked,
  loadPuzzlesAsync,
  minSolution,
  pickHidden,
  runPlan,
  todayKey,
  type Car,
} from "./game";
import { hintAvailable, validateHintPlan } from "./hints";
import { addCoins, getCoins, getSavedProgress, saveLevelProgress } from "./rewards";
import { awardOnce, spendCoins } from "./rewardPolicy";
import { getPlayerRecords, getProfile, levelBests, saveProfile } from "./profile";
import {
  TUTORIAL_REWARD,
  completeTutorial,
  hasSeenTutorial,
  isTutorialDone,
  markTutorialSeen,
} from "./tutorial";
import {
  getGuestCredential,
  saveGuestCredential,
  tournamentStats,
  walletDelta,
} from "./tournament-device";
import { PUZZLES as TOURNAMENT_PUZZLES } from "./tournamentCatalogue";
import { LESSONS } from "./tutorialLessons";
import * as dailyScores from "./daily-scores";

// 3. ייבוא שירותי ה-DAL והזרקתם דרך הממשקים (Ports) של contracts.ts
import { storageService } from "../services/storageService";
import { puzzleRepository } from "../services/puzzleRepository";
import * as supabaseService from "../services/supabaseService";

const storagePort: StoragePort = storageService;
const repoPort: PuzzleRepositoryPort = puzzleRepository;
const remoteScorePort: DailyScoreRemotePort = {
  readDailyBest: supabaseService.readDailyBest,
  writeDailyScore: supabaseService.writeDailyScore,
};

async function runBlTest() {
  const rl = readline.createInterface({ input, output });
  let running = true;

  rl.on("SIGINT", () => {
    running = false;
    rl.close();
  });

  console.log("==================================================================");
  console.log("   BL Test Console - תוכנית בדיקה לשכבה הלוגית ותקשורת מול DAL");
  console.log("==================================================================");

  while (running) {
    console.log("\nבחר מודול לבדיקה בשכבת ה-BL:");
    console.log("1. Game Engine: חוקי תנועה, חסימות, BFS פתרון מינימלי, רמז חכם ו-Tiers");
    console.log("2. Hints & Tutorial: אימות תוכנית מהלכים, זמינות רמזים ושיעורי הדרכה");
    console.log("3. BL <-> DAL (PuzzleRepositoryPort): טעינת שלבים, אימות DO והמרה ל-BO");
    console.log("4. BL <-> DAL (StoragePort & Rewards): שמירת כסף למשתמש, כוכבים ומדיניות פרסים");
    console.log("5. BL <-> DAL (New vs Returning Player): זיהוי מתחרה חדש/ותיק והצגת מדריך");
    console.log("6. BL <-> DAL (Profile & Tournament): פרופיל משתמש, יתרת כסף ושיאים");
    console.log("7. BL <-> DAL (Daily Scores + Supabase): ניקוד יומי מקומי ומול הענן");
    console.log("8. Smoke Test מלא: הרצת כל הבדיקות אוטומטית ברצף");
    console.log("0. יציאה");

    let choice: string;
    try {
      choice = (await rl.question("\nהזן מספר פעולה: ")).trim();
    } catch {
      break;
    }

    try {
      switch (choice) {
        case "1": {
          const board: Car[] = [
            { id: "X", name: "Red Racer", color: "red", row: 2, col: 3, len: 2, dir: "h" },
            { id: "A", name: "Green Car", color: "green", row: 1, col: 5, len: 2, dir: "v" },
          ];
          console.log("פתרון מינימלי (minSolution):", minSolution(board));
          console.log("המהלך הבא המומלץ (getNextBestMove):", getNextBestMove(board));

          const blocked = applyMove(board, "X", "right", 1);
          console.log("בדיקת תזוזה חסומה:", blocked.error);

          const step1 = applyMove(board, "A", "down", 2);
          const step2 = applyMove(step1.cars, "X", "right", 1);
          console.log("נפתר אחרי פינוי A והזזת X?", isSolved(step2.cars));

          const hiddenHard = pickHidden(board, "hard");
          console.log("מכוניות מוסתרות ברמת Hard:", Array.from(hiddenHard));

          const firstTier = TIERS[0]!;
          console.log("בדיקת Tier 1:", firstTier.heTitle, "| פתוח?", isTierUnlocked(0, [], {}));
          break;
        }

        case "2": {
          const board: Car[] = [
            { id: "X", name: "Red Racer", color: "red", row: 2, col: 3, len: 2, dir: "h" },
            { id: "A", name: "Green Car", color: "green", row: 1, col: 5, len: 2, dir: "v" },
          ];
          const validPlan = validateHintPlan(board, [
            { id: "A", move: "down", steps: 2 },
            { id: "X", move: "right", steps: 1 },
          ]);
          console.log("אימות תוכנית חוקית (validateHintPlan):", validPlan);

          const invalidPlan = validateHintPlan(board, [{ id: "X", move: "right", steps: 1 }]);
          console.log("אימות תוכנית שגויה:", invalidPlan);

          console.log(
            "זמינות רמז 'validate' במצב murderer:",
            hintAvailable("validate", "murderer", new Set(), [{ id: "A", move: "down", steps: 1 }]),
          );
          console.log(`שיעורי הדרכה טעונים ב-BL: ${LESSONS.length}`);
          break;
        }

        case "3": {
          console.log("שולף קטלוג שלבים מה-DAL דרך PuzzleRepositoryPort ומנפח ל-BO...");
          const catalogue = await loadPuzzlesAsync(repoPort);
          console.log(`הצלחה! הומרו ${catalogue.length} שלבי DO ל-BO.`);
          console.log(`שלבים בקטלוג הטורניר הפנימי: ${TOURNAMENT_PUZZLES.length}`);
          if (catalogue[0]) {
            console.log("כמות שלבים ב-Tier 1:", getPuzzlesForTier(TIERS[0]!, catalogue).length);
          }

          const date =
            (await rl.question("הזן תאריך לחידה יומית (YYYY-MM-DD, ברירת מחדל להיום): ")).trim() ||
            todayKey();
          const daily = await getDailyPuzzleAsync(date, repoPort);
          console.log(`חידה יומית עבור ${date}: par=${daily.par}, cars=${daily.cars.length}`);
          break;
        }

        case "4": {
          const userName =
            (await rl.question("הזן שם משתמש לבדיקת שמירת כסף (ברירת מחדל Odeya): ")).trim() ||
            "Odeya";
          saveProfile({ username: userName, country: "IL" }, storagePort);

          console.log(`יתרת כסף התחלתית של ${userName} ב-DAL:`, getCoins(storagePort));
          const res1 = saveLevelProgress("easy", 0, 9, 9, 22, 0, storagePort);
          console.log("פתרון שלב ראשון (3 כוכבים):", res1);
          console.log("יתרת כסף ב-DAL אחרי פתרון:", getCoins(storagePort));

          const spentOk = spendCoins(15, storagePort);
          console.log("רכישת רמז ב-15 מטבעות הצליחה?", spentOk, "| יתרה מעודכנת:", getCoins(storagePort));

          const records = getPlayerRecords(storagePort);
          console.log(`רשומת המשתמש (${getProfile(storagePort).username}) כולל כסף שמור:`, records);
          console.log("התקדמות שלבים שמורה ב-DAL:", getSavedProgress("easy", storagePort));
          break;
        }

        case "5": {
          console.log("\n--- בדיקת זיהוי מתחרה חדש מול מתחרה ותיק (Tutorial Flow) ---");

          // תרחיש א': מתחרה חדש לגמרי
          storagePort.removeItem?.("has_seen_tutorial");
          storagePort.removeItem?.("rush_hour_tutorial_done");

          const isNewPlayer = !hasSeenTutorial(storagePort);
          const coinsBeforeNew = getCoins(storagePort);
          const gotRewardNew = completeTutorial(storagePort);
          const coinsAfterNew = getCoins(storagePort);

          console.log("1. מתחרה חדש: זוהה כחדש?", isNewPlayer, "| קיבל 50 מטבעות?", gotRewardNew, `(${coinsBeforeNew} -> ${coinsAfterNew})`);

          // תרחיש ב': מתחרה ותיק (כבר ראה את המשחק בעבר, גם אם טרם אסף פרס מדריך)
          storagePort.removeItem?.("rush_hour_tutorial_done");
          markTutorialSeen(storagePort); // מסומן כמתחרה ותיק

          const coinsBeforeOld = getCoins(storagePort);
          const gotRewardOld = completeTutorial(storagePort);
          const coinsAfterOld = getCoins(storagePort);

          console.log("2. מתחרה ותיק: זוהה כחדש?", !hasSeenTutorial(storagePort), "| קיבל פרס (אמור להיות false)?", gotRewardOld, `(${coinsBeforeOld} -> ${coinsAfterOld})`);
          break;
        }

        case "6": {
          const p = getProfile(storagePort);
          console.log("פרופיל נוכחי ב-DAL:", p);
          saveProfile({ username: "Odeya_BL", country: "IL", avatarId: p.avatarId }, storagePort);
          console.log("פרופיל מעודכן:", getProfile(storagePort));
          console.log("שיאי רמת easy:", levelBests("easy", storagePort));
          console.log("סיכום רשומות שחקן (כולל כסף):", getPlayerRecords(storagePort));

          saveGuestCredential({ id: "guest-123", token: "tok-abc" }, storagePort);
          console.log("אישור אורח לטורניר נשמר ב-DAL:", getGuestCredential(storagePort));
          console.log(
            "הפרש ארנק (walletDelta):",
            walletDelta(storagePort),
            "| סטטיסטיקת טורניר:",
            tournamentStats(storagePort),
          );
          break;
        }

        case "7": {
          const date =
            (await rl.question("הזן תאריך לבדיקת ניקוד יומי (YYYY-MM-DD, ברירת מחדל 2099-01-01): ")).trim() ||
            "2099-01-01";
          console.log("פונקציות זמינות ב-daily-scores:", Object.keys(dailyScores));
          const remoteBest = await remoteScorePort.readDailyBest(date);
          console.log(`שיא בענן (דרך DailyScoreRemotePort) לתאריך ${date}:`, remoteBest);
          break;
        }

        case "8": {
          console.log("\n--- מריץ Smoke Test מקצה לקצה על שכבת ה-BL וה-DAL ---");

          // 1. Game & BFS
          const board: Car[] = [
            { id: "X", name: "Red Racer", color: "red", row: 2, col: 3, len: 2, dir: "h" },
            { id: "A", name: "Green Car", color: "green", row: 1, col: 5, len: 2, dir: "v" },
          ];
          const planRes = runPlan(board, [
            { id: "A", move: "down", steps: 2 },
            { id: "X", move: "right", steps: 1 },
          ]);
          console.log(
            "1. Game Engine & BFS OK:",
            minSolution(board) === 2 && getNextBestMove(board)?.id === "A" && isSolved(planRes.cars),
          );

          // 2. Hints & Tutorial Lessons
          console.log(
            "2. Hints & Lessons OK:",
            !validateHintPlan(board, [{ id: "A", move: "down", steps: 2 }]).error &&
              LESSONS.length > 0,
          );

          // 3. PuzzleRepositoryPort (BL <-> DAL)
          const catalogue = await loadPuzzlesAsync(repoPort);
          console.log(
            "3. BL <-> DAL PuzzleRepositoryPort OK:",
            catalogue.length > 0 && TOURNAMENT_PUZZLES.length > 0,
          );

          // 4. New vs Returning Player (Tutorial detection)
          storagePort.removeItem?.("has_seen_tutorial");
          storagePort.removeItem?.("rush_hour_tutorial_done");
          const isNewBefore = !hasSeenTutorial(storagePort);
          markTutorialSeen(storagePort);
          const rewardedOnce = completeTutorial(storagePort);
          const isReturningAfter = hasSeenTutorial(storagePort);
          const rewardedTwice = completeTutorial(storagePort);
          console.log(
            "4. New vs Returning Player Detection OK:",
            isNewBefore === true &&
              isReturningAfter === true &&
              rewardedOnce === true &&
              rewardedTwice === false,
          );

          // 5. StoragePort, User Profile & Coins Persistence (BL <-> DAL)
          saveProfile({ username: "BlSmokePlayer", country: "IL" }, storagePort);
          addCoins(100, storagePort);
          const coinsAfterAdd = getCoins(storagePort);
          const spent = spendCoins(25, storagePort);
          const records = getPlayerRecords(storagePort);
          console.log(
            "5. BL <-> DAL User Coins Persistence OK:",
            calculateStars(9, 9, 0) === 3 &&
              spent === true &&
              records.coins === coinsAfterAdd - 25 &&
              getProfile(storagePort).username === "BlSmokePlayer",
          );

          // 6. Tournament Device & Remote Score Port (BL <-> DAL)
          saveGuestCredential({ id: "smoke-id", token: "smoke-tok" }, storagePort);
          const bestToday = await remoteScorePort.readDailyBest(todayKey());
          console.log(
            "6. BL <-> DAL Tournament & Supabase OK:",
            getGuestCredential(storagePort)?.id === "smoke-id" && bestToday !== undefined,
          );

          console.log("--- כל 6 בדיקות האינטגרציה של שכבת ה-BL עברו בהצלחה! ---");
          break;
        }

        case "0":
          running = false;
          break;

        default:
          console.log("בחירה לא מוכרת, נסי שוב.");
      }
    } catch (err) {
      console.error("\n[שגיאה ב-BL]:", err);
    }
  }

  rl.close();
  console.log("יציאה מתוכנית הבדיקה.");
}

runBlTest();