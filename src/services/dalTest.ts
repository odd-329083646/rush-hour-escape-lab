// src/services/dalTest.ts
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// 1. הזרקת import.meta.env עבור הרצה ישירה מחוץ ל-Vite
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

// 2. גישור עבור window, localStorage ו-location בהרצת Node
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
  };
}

import { storageService } from "./storageService";
import { puzzleRepository } from "./puzzleRepository";
import { readDailyBest, writeDailyScore } from "./supabaseService";

const COINS_KEY = "rush_hour_coins";

async function runDalTest() {
  const rl = readline.createInterface({ input, output });
  let running = true;

  rl.on("SIGINT", () => {
    running = false;
    rl.close();
  });

  console.log("==============================================");
  console.log("   DAL Test Console - בדיקת שכבת הנתונים");
  console.log("==============================================");

  while (running) {
    console.log("\nבחר פעולה לבדיקה:");
    console.log("1. Storage: שמירה, שליפה ועדכון של מפתח כללי");
    console.log("2. Storage (Coins): קריאה ועדכון מספר מטבעות של שחקן");
    console.log("3. PuzzleRepository: שליפת קטלוג שלבים מהרשת (fetchCatalogue)");
    console.log("4. Supabase: קריאת שיא יומי לתאריך (readDailyBest)");
    console.log("5. Supabase: הוספת שיא יומי חדש (writeDailyScore)");
    console.log("6. הרצת בדיקת שפיות אוטומטית לכל השירותים (Smoke Test)");
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
          const key = (await rl.question("שם מפתח (למשל player_name): ")).trim() || "player_name";
          const val1 = await rl.question("ערך ראשון לשמירה: ");
          storageService.setItem(key, val1);
          console.log(`[Create/Read] נשמר ונקרא: ${key} = "${storageService.getItem(key)}"`);

          const val2 = await rl.question("ערך חדש לעדכון: ");
          storageService.setItem(key, val2);
          console.log(`[Update/Read] עודכן ונקרא: ${key} = "${storageService.getItem(key)}"`);
          break;
        }

        case "2": {
          const currentRaw = storageService.getItem(COINS_KEY);
          const currentCoins = currentRaw !== null ? Number(currentRaw) : 0;
          console.log(`יתרת מטבעות נוכחית ב-DAL (${COINS_KEY}): ${currentCoins}`);

          const newCoinsStr = await rl.question("הזן מספר מטבעות חדש לשמירה (למשל 250): ");
          const newCoins = Number(newCoinsStr);
          if (Number.isNaN(newCoins)) {
            console.log("ערך לא מספרי, לא בוצע עדכון.");
            break;
          }
          storageService.setItem(COINS_KEY, String(newCoins));
          console.log(
            `[Update/Read] המטבעות עודכנו בהצלחה! ערך נוכחי ב-DAL: ${storageService.getItem(COINS_KEY)}`,
          );
          break;
        }

        case "3": {
          console.log("שולף שלבים מ-GitHub...");
          const puzzles = await puzzleRepository.fetchCatalogue();
          console.log(`הצלחה! נשלפו ${puzzles.length} שלבים גולמיים (DO).`);
          if (puzzles[0]) {
            console.log("שלב לדוגמה (אינדקס 0):", JSON.stringify(puzzles[0], null, 2));
          }
          break;
        }

        case "4": {
          const date =
            (await rl.question("הזן תאריך (YYYY-MM-DD, ברירת מחדל להיום): ")).trim() ||
            new Date().toISOString().slice(0, 10);
          const best = await readDailyBest(date);
          console.log(`תוצאת readDailyBest עבור ${date}:`, best ?? "אין שיאים לתאריך זה");
          break;
        }

        case "5": {
          const date =
            (await rl.question("הזן תאריך (YYYY-MM-DD): ")).trim() ||
            new Date().toISOString().slice(0, 10);
          const player_name = (await rl.question("שם שחקן: ")).trim() || "DalTester";
          const solve_time = Number(await rl.question("זמן פתרון בשניות (למשל 35): ")) || 35;
          await writeDailyScore({ date, player_name, solve_time });
          console.log("השיא נשמר בהצלחה ב-Supabase!");
          break;
        }

        case "6": {
          console.log("\n--- מריץ בדיקת שפיות אוטומטית ---");
          storageService.setItem(COINS_KEY, "500");
          console.log("1. Storage & Coins OK:", storageService.getItem(COINS_KEY) === "500");

          const catalogue = await puzzleRepository.fetchCatalogue();
          console.log("2. PuzzleRepository OK: נשלפו", catalogue.length, "שלבים");

          const today = new Date().toISOString().slice(0, 10);
          const best = await readDailyBest(today);
          console.log("3. Supabase Read OK: שיא להיום =", best);
          console.log("--- כל הבדיקות עברו בהצלחה! ---");
          break;
        }

        case "0":
          running = false;
          break;

        default:
          console.log("בחירה לא מוכרת, נסי שוב.");
      }
    } catch (err) {
      console.error("\n[שגיאה מ-DAL]:", err);
    }
  }

  rl.close();
  console.log("יציאה מתוכנית הבדיקה.");
}

runDalTest();