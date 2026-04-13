/**
 * seed-game-content.ts — Seeds the game_content Supabase table with all static content.
 *
 * Run: npx tsx scripts/seed-game-content.ts
 *
 * This reads all static content files and inserts them into the game_content table
 * with multi-language JSONB content. Existing items with the same game_id+content_type
 * are preserved (upsert by checking existence first).
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY env variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const LANGUAGES = ["de", "en", "es", "fr", "it", "nl", "pl", "pt", "tr", "ar"] as const;

interface SeedItem {
  game_id: string;
  content_type: string;
  content: Record<string, unknown>;
  difficulty: string;
  category: string;
  tags: string[];
}

async function loadQuestions(): Promise<SeedItem[]> {
  const items: SeedItem[] = [];
  for (const lang of LANGUAGES) {
    try {
      const mod = await import(`../src/games/content/questions-${lang}.ts`);
      const key = Object.keys(mod).find((k) => k.startsWith("QUIZ_QUESTIONS_"));
      const questions = key ? mod[key] : [];
      for (const q of questions) {
        // Find existing item by id or create new
        const existing = items.find((i) => (i.content.de as any)?.id === q.id || (i.content.en as any)?.id === q.id);
        if (existing) {
          existing.content[lang] = { question: q.question, answers: q.answers, correctIndex: q.correctIndex };
        } else if (lang === "de") {
          items.push({
            game_id: "bomb",
            content_type: "question",
            content: { [lang]: { id: q.id, question: q.question, answers: q.answers, correctIndex: q.correctIndex } },
            difficulty: q.difficulty || "medium",
            category: q.category || "general",
            tags: [],
          });
        }
      }
    } catch {
      console.log(`  Skip questions-${lang} (not found)`);
    }
  }
  return items;
}

async function loadTabooCards(): Promise<SeedItem[]> {
  const items: SeedItem[] = [];
  for (const lang of LANGUAGES) {
    try {
      const mod = await import(`../src/games/content/taboo-words-${lang}.ts`);
      const key = Object.keys(mod).find((k) => k.startsWith("TABOO_CARDS_"));
      const cards = key ? mod[key] : [];
      for (let idx = 0; idx < cards.length; idx++) {
        const c = cards[idx];
        if (lang === "de") {
          items.push({
            game_id: "taboo",
            content_type: "taboo_card",
            content: { [lang]: { term: c.term, forbidden: c.forbidden } },
            difficulty: c.difficulty || "medium",
            category: c.category || "general",
            tags: [],
          });
        } else if (items[idx]) {
          items[idx].content[lang] = { term: c.term, forbidden: c.forbidden };
        }
      }
    } catch {
      console.log(`  Skip taboo-words-${lang} (not found)`);
    }
  }
  return items;
}

async function loadHeadUpWords(): Promise<SeedItem[]> {
  const items: SeedItem[] = [];
  for (const lang of LANGUAGES) {
    try {
      const mod = await import(`../src/games/content/headup-words-${lang}.ts`);
      const key = Object.keys(mod).find((k) => k.startsWith("HEADUP_CATEGORIES_"));
      const cats = key ? mod[key] : [];
      for (let idx = 0; idx < cats.length; idx++) {
        const cat = cats[idx];
        if (lang === "de") {
          items.push({
            game_id: "headup",
            content_type: "headup_word",
            content: { [lang]: { id: cat.id, name: cat.name, emoji: cat.emoji, words: cat.words } },
            difficulty: "medium",
            category: cat.name,
            tags: [],
          });
        } else if (items[idx]) {
          items[idx].content[lang] = { id: cat.id, name: cat.name, emoji: cat.emoji, words: cat.words };
        }
      }
    } catch {
      console.log(`  Skip headup-words-${lang} (not found)`);
    }
  }
  return items;
}

async function seed() {
  console.log("🎮 Seeding game content...\n");

  // Check existing count
  const { count: existingCount } = await supabase
    .from("game_content")
    .select("id", { count: "exact", head: true });

  console.log(`  Existing items in DB: ${existingCount || 0}`);

  if ((existingCount || 0) > 50) {
    console.log("  ⚠️  DB already has content. Skipping seed to avoid duplicates.");
    console.log("  To reseed, delete existing content first.");
    return;
  }

  // Load all content
  console.log("\n📝 Loading questions...");
  const questions = await loadQuestions();
  console.log(`  ${questions.length} questions loaded`);

  console.log("📝 Loading taboo cards...");
  const taboo = await loadTabooCards();
  console.log(`  ${taboo.length} taboo cards loaded`);

  console.log("📝 Loading headup words...");
  const headup = await loadHeadUpWords();
  console.log(`  ${headup.length} headup categories loaded`);

  const allItems = [...questions, ...taboo, ...headup];
  console.log(`\n📦 Total: ${allItems.length} items to insert`);

  // Insert in batches of 50
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < allItems.length; i += BATCH) {
    const batch = allItems.slice(i, i + BATCH).map((item) => ({
      game_id: item.game_id,
      content_type: item.content_type,
      content: item.content,
      difficulty: item.difficulty,
      category: item.category,
      tags: item.tags,
      is_active: true,
    }));

    const { error } = await supabase.from("game_content").insert(batch);
    if (error) {
      console.error(`  ❌ Batch ${i / BATCH + 1} failed:`, error.message);
    } else {
      inserted += batch.length;
      process.stdout.write(`  ✅ ${inserted}/${allItems.length}\r`);
    }
  }

  console.log(`\n\n🎉 Done! ${inserted} items seeded.`);
}

seed().catch(console.error);
