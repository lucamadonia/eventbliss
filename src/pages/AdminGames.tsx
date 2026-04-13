import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Search, Trash2, Edit3, Check, X, Globe, Database,
  Gamepad2, Filter, Download, Upload, BarChart3, Languages, Layers,
  ChevronRight, Zap, Copy, AlertTriangle, Star,
} from 'lucide-react';
import { useGameContent, type GameContent } from '@/hooks/useGameContent';
import { useAuth } from '@/hooks/useAuth';
import { clearGameContentCache } from '@/hooks/useGameContentCached';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ─── Config ──────────────────────────────────────────────────────

const LANGS = [
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano' },
  { code: 'nl', flag: '🇳🇱', name: 'Nederlands' },
  { code: 'pl', flag: '🇵🇱', name: 'Polski' },
  { code: 'pt', flag: '🇵🇹', name: 'Português' },
  { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
  { code: 'ar', flag: '🇸🇦', name: 'العربية' },
];

interface GameDef {
  id: string;
  name: string;
  icon: string;
  types: string[];
  color: string;
}

const GAMES: GameDef[] = [
  { id: 'bomb', name: 'Tickende Bombe', icon: '💣', types: ['question', 'category'], color: 'from-red-500 to-orange-500' },
  { id: 'taboo', name: 'Wortverbot', icon: '🚫', types: ['taboo_card'], color: 'from-violet-500 to-purple-500' },
  { id: 'headup', name: 'Stirnraten', icon: '🧠', types: ['headup_word'], color: 'from-cyan-500 to-blue-500' },
  { id: 'category', name: 'Zeit-Kategorie', icon: '⏱️', types: ['category'], color: 'from-amber-500 to-yellow-500' },
  { id: 'emojiguess', name: 'Emoji-Raten', icon: '😀', types: ['emoji_puzzle'], color: 'from-emerald-500 to-teal-500' },
  { id: 'fakeorfact', name: 'Fake or Fact', icon: '🎲', types: ['fact'], color: 'from-blue-500 to-indigo-500' },
  { id: 'truthdare', name: 'Wahrheit/Pflicht', icon: '❤️', types: ['truth', 'dare'], color: 'from-pink-500 to-rose-500' },
  { id: 'thisorthat', name: 'This or That', icon: '↔️', types: ['pair'], color: 'from-sky-500 to-cyan-500' },
  { id: 'whoami', name: 'Wer bin ich?', icon: '❓', types: ['character'], color: 'from-fuchsia-500 to-pink-500' },
  { id: 'bottlespin', name: 'Flaschendrehen', icon: '🍾', types: ['bottle_card'], color: 'from-green-500 to-emerald-500' },
  { id: 'storybuilder', name: 'Story Builder', icon: '📖', types: ['prompt', 'starter'], color: 'from-indigo-500 to-violet-500' },
  { id: 'sharedquiz', name: 'Geteilt & Gequizzt', icon: '🔗', types: ['shared_question'], color: 'from-teal-500 to-green-500' },
  { id: 'quickdraw', name: 'Schnellzeichner', icon: '🎨', types: ['draw_word'], color: 'from-orange-500 to-red-500' },
  { id: 'splitquiz', name: 'Split Quiz', icon: '🧩', types: ['question'], color: 'from-purple-500 to-indigo-500' },
  { id: 'hochstapler', name: 'Hochstapler', icon: '🎭', types: ['word_set'], color: 'from-slate-500 to-zinc-500' },
  { id: 'wo-ist-was', name: 'Wo ist was?', icon: '🗺️', types: ['location'], color: 'from-lime-500 to-green-500' },
];

const FIELD_CONFIGS: Record<string, { label: string; fields: { key: string; label: string; type: 'text' | 'textarea' | 'select' | 'number'; options?: string[] }[] }> = {
  question:        { label: 'Quiz-Frage',        fields: [{ key: 'question', label: 'Frage', type: 'text' }, { key: 'answer1', label: 'Antwort 1', type: 'text' }, { key: 'answer2', label: 'Antwort 2', type: 'text' }, { key: 'answer3', label: 'Antwort 3', type: 'text' }, { key: 'answer4', label: 'Antwort 4', type: 'text' }, { key: 'correctIndex', label: 'Richtige Antwort', type: 'select', options: ['Antwort 1', 'Antwort 2', 'Antwort 3', 'Antwort 4'] }] },
  category:        { label: 'Kategorie',          fields: [{ key: 'name', label: 'Name', type: 'text' }, { key: 'terms', label: 'Begriffe (kommagetrennt)', type: 'textarea' }] },
  taboo_card:      { label: 'Tabu-Karte',         fields: [{ key: 'term', label: 'Begriff', type: 'text' }, { key: 'forbidden1', label: 'Tabu 1', type: 'text' }, { key: 'forbidden2', label: 'Tabu 2', type: 'text' }, { key: 'forbidden3', label: 'Tabu 3', type: 'text' }, { key: 'forbidden4', label: 'Tabu 4', type: 'text' }, { key: 'forbidden5', label: 'Tabu 5', type: 'text' }] },
  headup_word:     { label: 'Stirnraten-Wort',    fields: [{ key: 'word', label: 'Wort', type: 'text' }, { key: 'category', label: 'Kategorie', type: 'text' }] },
  emoji_puzzle:    { label: 'Emoji-Rätsel',        fields: [{ key: 'emojis', label: 'Emojis', type: 'text' }, { key: 'answer', label: 'Lösung', type: 'text' }] },
  fact:            { label: 'Fakt',                fields: [{ key: 'statement', label: 'Aussage', type: 'textarea' }, { key: 'isTrue', label: 'Wahr oder Falsch', type: 'select', options: ['Wahr', 'Falsch'] }, { key: 'explanation', label: 'Erklärung', type: 'textarea' }] },
  truth:           { label: 'Wahrheit',            fields: [{ key: 'text', label: 'Frage', type: 'textarea' }, { key: 'intensity', label: 'Intensität', type: 'select', options: ['Leicht', 'Mittel', 'Scharf'] }] },
  dare:            { label: 'Pflicht',             fields: [{ key: 'text', label: 'Aufgabe', type: 'textarea' }, { key: 'intensity', label: 'Intensität', type: 'select', options: ['Leicht', 'Mittel', 'Scharf'] }] },
  pair:            { label: 'This or That',        fields: [{ key: 'optionA', label: 'Option A', type: 'text' }, { key: 'optionB', label: 'Option B', type: 'text' }] },
  character:       { label: 'Charakter',           fields: [{ key: 'name', label: 'Name', type: 'text' }] },
  bottle_card:     { label: 'Flaschen-Karte',      fields: [{ key: 'text', label: 'Text', type: 'textarea' }, { key: 'type', label: 'Typ', type: 'select', options: ['Wahrheit', 'Pflicht', 'Trinkspiel', 'Lustig'] }] },
  prompt:          { label: 'Story-Prompt',        fields: [{ key: 'text', label: 'Prompt', type: 'textarea' }] },
  starter:         { label: 'Story-Starter',       fields: [{ key: 'text', label: 'Starter', type: 'textarea' }] },
  shared_question: { label: 'Geteilte Frage',     fields: [{ key: 'question', label: 'Frage', type: 'text' }, { key: 'answer1', label: 'Antwort 1', type: 'text' }, { key: 'answer2', label: 'Antwort 2', type: 'text' }, { key: 'answer3', label: 'Antwort 3', type: 'text' }, { key: 'answer4', label: 'Antwort 4', type: 'text' }, { key: 'correctIndex', label: 'Richtig', type: 'select', options: ['1', '2', '3', '4'] }, { key: 'hint', label: 'Hinweis', type: 'text' }] },
  draw_word:       { label: 'Zeichenwort',         fields: [{ key: 'word', label: 'Wort', type: 'text' }] },
  word_set:        { label: 'Wort-Set',            fields: [{ key: 'word', label: 'Wort', type: 'text' }, { key: 'category', label: 'Kategorie', type: 'text' }] },
  location:        { label: 'Ort',                 fields: [{ key: 'name', label: 'Name', type: 'text' }, { key: 'lat', label: 'Breitengrad', type: 'number' }, { key: 'lng', label: 'Längengrad', type: 'number' }, { key: 'type', label: 'Typ', type: 'text' }] },
};

const DIFFICULTIES = [
  { value: 'easy', label: 'Leicht', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  { value: 'medium', label: 'Mittel', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
  { value: 'hard', label: 'Schwer', color: 'text-red-400 bg-red-500/15 border-red-500/30' },
];

// ─── Main Component ──────────────────────────────────────────────

export default function AdminGames() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const gc = useGameContent();
  const [selectedGame, setSelectedGame] = useState<GameDef>(GAMES[0]);
  const [selectedType, setSelectedType] = useState(GAMES[0].types[0]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<GameContent | null>(null);
  const [activeLang, setActiveLang] = useState('de');
  const [formContent, setFormContent] = useState<Record<string, Record<string, string>>>({});
  const [formDifficulty, setFormDifficulty] = useState('medium');
  const [formCategory, setFormCategory] = useState('general');
  const [gameStats, setGameStats] = useState<Record<string, number>>({});
  const [seeding, setSeeding] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  // Fetch items when selection changes
  useEffect(() => {
    gc.fetchItems(selectedGame.id, selectedType, search, page);
  }, [selectedGame.id, selectedType, search, page, gc.fetchItems]);

  // Fetch per-game stats
  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from as any)('game_content')
        .select('game_id')
        .eq('is_active', true);
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((r: any) => { counts[r.game_id] = (counts[r.game_id] || 0) + 1; });
        setGameStats(counts);
      }
    })();
  }, [gc.total]);

  const totalItems = useMemo(() => Object.values(gameStats).reduce((a, b) => a + b, 0), [gameStats]);

  // Form handlers
  const openAdd = () => {
    setEditItem(null);
    const empty: Record<string, Record<string, string>> = {};
    LANGS.forEach(l => { empty[l.code] = {}; });
    setFormContent(empty);
    setFormDifficulty('medium');
    setFormCategory('general');
    setActiveLang('de');
    setShowModal(true);
  };

  const openEdit = (item: GameContent) => {
    setEditItem(item);
    const content: Record<string, Record<string, string>> = {};
    LANGS.forEach(l => { content[l.code] = item.content[l.code] || {}; });
    setFormContent(content);
    setFormDifficulty(item.difficulty);
    setFormCategory(item.category);
    setActiveLang('de');
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {
      game_id: selectedGame.id,
      content_type: selectedType,
      content: formContent,
      difficulty: formDifficulty,
      category: formCategory,
      tags: [],
      is_active: true,
    };
    if (editItem) await gc.updateItem(editItem.id, payload);
    else await gc.addItem(payload);
    setShowModal(false);
    gc.fetchItems(selectedGame.id, selectedType, search, page);
    toast.success(editItem ? 'Gespeichert!' : 'Erstellt!');
  };

  const handleDuplicate = async (item: GameContent) => {
    await gc.addItem({
      game_id: item.game_id,
      content_type: item.content_type,
      content: item.content,
      difficulty: item.difficulty,
      category: item.category,
      tags: item.tags,
      is_active: true,
    });
    gc.fetchItems(selectedGame.id, selectedType, search, page);
    toast.success('Dupliziert!');
  };

  const updateField = (field: string, value: string) => {
    setFormContent(prev => ({ ...prev, [activeLang]: { ...prev[activeLang], [field]: value } }));
  };

  // Seed from ALL static files (10 languages)
  const handleSeed = async () => {
    if (!confirm('Statische Inhalte (alle 10 Sprachen) in die Datenbank importieren?')) return;
    setSeeding(true);
    try {
      const langCodes = ['de', 'en', 'es', 'fr', 'it', 'nl', 'pl', 'pt', 'tr', 'ar'];

      // Load all question files
      const questionMods = await Promise.all(langCodes.map(l =>
        import(`../games/content/questions-${l}.ts`).catch(() => null)
      ));
      const tabooMods = await Promise.all(langCodes.map(l =>
        import(`../games/content/taboo-words-${l}.ts`).catch(() => null)
      ));
      const headupMods = await Promise.all(langCodes.map(l =>
        import(`../games/content/headup-words-${l}.ts`).catch(() => null)
      ));

      // Helper: get array from module
      const getArr = (mod: any, prefix: string) => {
        if (!mod) return [];
        const key = Object.keys(mod).find(k => k.startsWith(prefix));
        return key ? mod[key] : [];
      };

      const items: any[] = [];

      // Questions — index-based merge across languages
      const deQuestions = getArr(questionMods[0], 'QUIZ_QUESTIONS_');
      for (let idx = 0; idx < deQuestions.length; idx++) {
        const content: Record<string, any> = {};
        for (let li = 0; li < langCodes.length; li++) {
          const qs = getArr(questionMods[li], 'QUIZ_QUESTIONS_');
          const q = qs[idx];
          if (q) {
            content[langCodes[li]] = {
              question: q.question,
              answer1: q.answers[0], answer2: q.answers[1],
              answer3: q.answers[2], answer4: q.answers[3],
              correctIndex: String(q.correctIndex),
            };
          }
        }
        items.push({
          game_id: 'bomb', content_type: 'question', content,
          difficulty: deQuestions[idx].difficulty, category: deQuestions[idx].category,
          tags: [], is_active: true,
        });
      }

      // Taboo — index-based merge
      const deTaboo = getArr(tabooMods[0], 'TABOO_CARDS_');
      for (let idx = 0; idx < deTaboo.length; idx++) {
        const content: Record<string, any> = {};
        for (let li = 0; li < langCodes.length; li++) {
          const cards = getArr(tabooMods[li], 'TABOO_CARDS_');
          const c = cards[idx];
          if (c) {
            content[langCodes[li]] = {
              term: c.term,
              forbidden1: c.forbidden[0], forbidden2: c.forbidden[1],
              forbidden3: c.forbidden[2], forbidden4: c.forbidden[3],
              forbidden5: c.forbidden[4],
            };
          }
        }
        items.push({
          game_id: 'taboo', content_type: 'taboo_card', content,
          difficulty: deTaboo[idx].difficulty, category: deTaboo[idx].category,
          tags: [], is_active: true,
        });
      }

      // HeadUp — index-based merge
      const deHeadup = getArr(headupMods[0], 'HEADUP_CATEGORIES_');
      for (let idx = 0; idx < deHeadup.length; idx++) {
        const content: Record<string, any> = {};
        for (let li = 0; li < langCodes.length; li++) {
          const cats = getArr(headupMods[li], 'HEADUP_CATEGORIES_');
          const cat = cats[idx];
          if (cat) {
            content[langCodes[li]] = {
              word: cat.name, category: cat.name,
              words: cat.words.join(', '),
            };
          }
        }
        items.push({
          game_id: 'headup', content_type: 'headup_word', content,
          difficulty: 'medium', category: deHeadup[idx].name,
          tags: [], is_active: true,
        });
      }

      toast.info(`${items.length} Einträge werden importiert...`);

      // Insert in batches
      const BATCH = 50;
      let ok = 0;
      for (let i = 0; i < items.length; i += BATCH) {
        const batch = items.slice(i, i + BATCH);
        const { error } = await (supabase.from as any)('game_content').insert(batch);
        if (!error) ok += batch.length;
        else console.warn('Batch error:', error.message);
      }

      clearGameContentCache();
      gc.fetchItems(selectedGame.id, selectedType, search, page);
      toast.success(`${ok} Einträge mit ${langCodes.length} Sprachen importiert!`);
    } catch (e: any) {
      toast.error(`Import fehlgeschlagen: ${e.message}`);
    }
    setSeeding(false);
  };

  // File import (CSV, JSON, TXT, XLSX)
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset input

    const ext = file.name.split('.').pop()?.toLowerCase();
    const text = await file.text();
    let rows: Record<string, string>[] = [];

    try {
      if (ext === 'json') {
        const parsed = JSON.parse(text);
        rows = Array.isArray(parsed) ? parsed : [parsed];
      } else if (ext === 'csv' || ext === 'txt') {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) { toast.error('CSV muss mindestens Header + 1 Zeile haben.'); return; }
        const headers = lines[0].split(/[,;\t]/).map(h => h.replace(/^["']|["']$/g, '').trim());
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(/[,;\t]/).map(v => v.replace(/^["']|["']$/g, '').trim());
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => { if (vals[idx]) row[h] = vals[idx]; });
          if (Object.keys(row).length > 0) rows.push(row);
        }
      } else if (ext === 'xlsx') {
        toast.error('XLSX wird bald unterstützt. Bitte als CSV exportieren.');
        return;
      } else {
        toast.error(`Format .${ext} nicht unterstützt. Nutze CSV, JSON oder TXT.`);
        return;
      }

      if (rows.length === 0) { toast.error('Keine Daten in der Datei gefunden.'); return; }

      // Detect language from field names or default to DE
      const fieldNames = FIELD_CONFIGS[selectedType]?.fields.map(f => f.key) || ['text'];
      const items: any[] = [];

      for (const row of rows) {
        // Build multi-lang content: check if row has lang keys (de, en, etc.) or flat fields
        const content: Record<string, Record<string, string>> = {};
        const hasLangKeys = LANGS.some(l => row[l.code]);

        if (hasLangKeys) {
          // Row format: { de: "text", en: "text", ... } — single-field import
          for (const l of LANGS) {
            if (row[l.code]) content[l.code] = { [fieldNames[0]]: row[l.code] };
          }
        } else {
          // Row format: { question: "...", answer1: "...", ... } — single-language
          const lang = row.lang || row.language || 'de';
          const fieldData: Record<string, string> = {};
          for (const fn of fieldNames) {
            if (row[fn]) fieldData[fn] = row[fn];
          }
          if (Object.keys(fieldData).length > 0) content[lang] = fieldData;
        }

        if (Object.keys(content).length > 0) {
          items.push({
            game_id: selectedGame.id,
            content_type: selectedType,
            content,
            difficulty: row.difficulty || 'medium',
            category: row.category || 'general',
            tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
            is_active: true,
          });
        }
      }

      if (items.length === 0) { toast.error('Keine gültigen Einträge gefunden.'); return; }

      toast.info(`${items.length} Einträge werden importiert...`);

      const BATCH = 50;
      let ok = 0;
      for (let i = 0; i < items.length; i += BATCH) {
        const batch = items.slice(i, i + BATCH);
        const { error } = await (supabase.from as any)('game_content').insert(batch);
        if (!error) ok += batch.length;
      }

      clearGameContentCache();
      gc.fetchItems(selectedGame.id, selectedType, search, page);
      toast.success(`${ok} Einträge aus ${file.name} importiert!`);
    } catch (err: any) {
      toast.error(`Import fehlgeschlagen: ${err.message}`);
    }
  };

  const fields = FIELD_CONFIGS[selectedType]?.fields || [{ key: 'text', label: 'Text', type: 'text' as const }];
  const preview = (item: GameContent) => {
    const de = item.content.de || item.content.en || {};
    return de[fields[0].key] || de.text || de.question || de.name || de.word || de.term || JSON.stringify(de).slice(0, 60);
  };
  const langCount = (item: GameContent) => LANGS.filter(l => item.content[l.code] && Object.values(item.content[l.code]).some(v => v && String(v).length > 0)).length;

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#f1f3fc] font-['Plus_Jakarta_Sans']">
      {/* ── Header ── */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#a8abb3]" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-[#df8eff] via-[#ff6b98] to-[#8ff5ff] bg-clip-text text-transparent">
              Games Content Manager
            </h1>
            <p className="text-xs text-[#a8abb3] mt-0.5">{totalItems} Einträge · {GAMES.length} Spiele · {LANGS.length} Sprachen</p>
          </div>
          <div className="flex items-center gap-2">
            {/* File import */}
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-[#1b2028] border border-white/5 text-[#ff6b98] hover:border-[#ff6b98]/30 transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> CSV / JSON
              <input type="file" accept=".csv,.json,.txt,.xlsx" onChange={handleFileImport} className="hidden" />
            </label>
            {/* Static seed */}
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleSeed} disabled={seeding}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-[#1b2028] border border-white/5 text-[#8ff5ff] hover:border-[#8ff5ff]/30 transition-all disabled:opacity-50">
              {seeding ? <div className="w-3.5 h-3.5 border-2 border-[#8ff5ff] border-t-transparent rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {seeding ? 'Importiere...' : 'Alle Sprachen importieren'}
            </motion.button>
            {/* Manual add */}
            <motion.button whileTap={{ scale: 0.95 }} onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#df8eff] to-[#ff6b98] text-white shadow-[0_0_15px_rgba(223,142,255,0.3)]">
              <Plus className="w-4 h-4" /> Hinzufügen
            </motion.button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 mt-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151a21] border border-white/5">
            <Database className="w-3.5 h-3.5 text-[#df8eff]" />
            <span className="text-xs font-bold text-[#df8eff]">{totalItems}</span>
            <span className="text-[10px] text-[#a8abb3]">Einträge</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151a21] border border-white/5">
            <Gamepad2 className="w-3.5 h-3.5 text-[#8ff5ff]" />
            <span className="text-xs font-bold text-[#8ff5ff]">{Object.keys(gameStats).length}/{GAMES.length}</span>
            <span className="text-[10px] text-[#a8abb3]">aktive Spiele</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151a21] border border-white/5">
            <Languages className="w-3.5 h-3.5 text-[#ff6b98]" />
            <span className="text-xs font-bold text-[#ff6b98]">{LANGS.length}</span>
            <span className="text-[10px] text-[#a8abb3]">Sprachen</span>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* ── Sidebar — Game selector ── */}
        <div className="w-72 border-r border-white/5 p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-130px)] bg-[#151a21]">
          {GAMES.map(g => {
            const count = gameStats[g.id] || 0;
            const isActive = selectedGame.id === g.id;
            return (
              <motion.button
                key={g.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setSelectedGame(g); setSelectedType(g.types[0]); setPage(0); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm group ${isActive ? 'font-bold' : ''}`}
                style={{
                  background: isActive ? 'rgba(223,142,255,0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(223,142,255,0.2)' : '1px solid transparent',
                }}
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center text-lg shadow-sm`}>
                  {g.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${isActive ? 'text-[#df8eff]' : 'text-[#a8abb3] group-hover:text-white'} transition-colors`}>
                    {g.name}
                  </p>
                  <p className="text-[10px] text-[#a8abb3]/60">
                    {count > 0 ? `${count} Einträge` : 'Leer'} · {g.types.length} Typ{g.types.length > 1 ? 'en' : ''}
                  </p>
                </div>
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#df8eff]/10 text-[#df8eff]">
                    {count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-130px)]">
          {/* Game header */}
          <div className="flex items-center gap-4 mb-2">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedGame.color} flex items-center justify-center text-2xl shadow-lg`}>
              {selectedGame.icon}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">{selectedGame.name}</h2>
              <p className="text-xs text-[#a8abb3]">
                {gameStats[selectedGame.id] || 0} Einträge · {selectedGame.types.map(t => FIELD_CONFIGS[t]?.label || t).join(', ')}
              </p>
            </div>
          </div>

          {/* Type tabs + Search + Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {selectedGame.types.map(t => {
              const cfg = FIELD_CONFIGS[t];
              return (
                <button key={t} onClick={() => { setSelectedType(t); setPage(0); }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedType === t
                      ? 'bg-[#8ff5ff]/15 text-[#8ff5ff] border-[#8ff5ff]/30'
                      : 'bg-[#1b2028] text-[#a8abb3] border-transparent hover:border-white/10'
                  }`}>
                  {cfg?.label || t}
                </button>
              );
            })}
            <div className="flex-1" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8abb3]" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Suchen..."
                className="pl-9 pr-4 py-2 rounded-xl text-sm border bg-[#1b2028] border-[#df8eff]/10 text-white focus:outline-none focus:border-[#df8eff]/40 w-52 transition-colors"
              />
            </div>
          </div>

          {/* Content list */}
          {gc.loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-2 border-[#df8eff] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : gc.items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 space-y-4"
            >
              <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br ${selectedGame.color} flex items-center justify-center text-4xl shadow-lg opacity-50`}>
                {selectedGame.icon}
              </div>
              <div>
                <p className="text-lg font-bold text-[#a8abb3]">Keine Einträge</p>
                <p className="text-sm text-[#a8abb3]/60 max-w-xs mx-auto mt-1">
                  Klicke "Hinzufügen" um Content zu erstellen, oder importiere die statischen Inhalte.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <motion.button whileTap={{ scale: 0.95 }} onClick={openAdd}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#df8eff] to-[#ff6b98] text-white">
                  <Plus className="w-4 h-4 inline mr-1.5" />Manuell erstellen
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleSeed} disabled={seeding}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-[#1b2028] border border-[#8ff5ff]/20 text-[#8ff5ff]">
                  <Download className="w-4 h-4 inline mr-1.5" />Statische importieren
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {gc.items.map((item, idx) => {
                const langs = langCount(item);
                const diffCfg = DIFFICULTIES.find(d => d.value === item.difficulty) || DIFFICULTIES[1];
                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="group flex items-center gap-4 px-4 py-3 rounded-xl bg-[#1b2028] border border-white/[0.03] hover:border-[#df8eff]/15 transition-all"
                  >
                    {/* Index */}
                    <span className="text-xs font-bold text-[#a8abb3]/30 w-6 text-right tabular-nums">
                      {page * 20 + idx + 1}
                    </span>

                    {/* Content preview */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{preview(item)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${diffCfg.color}`}>
                          {diffCfg.label}
                        </span>
                        <span className="text-[10px] text-[#a8abb3]">{item.category}</span>
                      </div>
                    </div>

                    {/* Language coverage */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {LANGS.slice(0, 5).map(l => {
                          const filled = item.content[l.code] && Object.values(item.content[l.code]).some(v => v && String(v).length > 0);
                          return (
                            <span key={l.code} className={`text-[11px] ${filled ? '' : 'opacity-15'}`} title={l.name}>
                              {l.flag}
                            </span>
                          );
                        })}
                      </div>
                      <span className={`text-xs font-bold ${langs >= 8 ? 'text-emerald-400' : langs >= 5 ? 'text-[#8ff5ff]' : langs >= 2 ? 'text-amber-400' : 'text-[#ff6b98]'}`}>
                        {langs}/{LANGS.length}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDuplicate(item)} className="p-1.5 rounded-lg hover:bg-white/5" title="Duplizieren">
                        <Copy className="w-3.5 h-3.5 text-[#8ff5ff]" />
                      </button>
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-white/5" title="Bearbeiten">
                        <Edit3 className="w-3.5 h-3.5 text-[#df8eff]" />
                      </button>
                      <button onClick={() => { if (confirm('Wirklich löschen?')) gc.deleteItem(item.id); }} className="p-1.5 rounded-lg hover:bg-white/5" title="Löschen">
                        <Trash2 className="w-3.5 h-3.5 text-[#ff6b98]" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              {/* Pagination */}
              {gc.total > 20 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-[#1b2028] text-[#a8abb3] disabled:opacity-30 border border-white/5">
                    Zurück
                  </button>
                  <span className="text-xs text-[#a8abb3] tabular-nums">
                    Seite {page + 1} / {Math.ceil(gc.total / 20)}
                  </span>
                  <button disabled={(page + 1) * 20 >= gc.total} onClick={() => setPage(p => p + 1)}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-[#1b2028] text-[#a8abb3] disabled:opacity-30 border border-white/5">
                    Weiter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowModal(false)} />
            <motion.div
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#151a21] border border-[#df8eff]/15 shadow-[0_0_60px_rgba(223,142,255,0.1)]"
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
            >
              {/* Modal header */}
              <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/5 bg-[#151a21]/95 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${selectedGame.color} flex items-center justify-center text-base`}>
                    {selectedGame.icon}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#df8eff]">
                      {editItem ? 'Bearbeiten' : 'Neu erstellen'}
                    </h2>
                    <p className="text-[10px] text-[#a8abb3]">{selectedGame.name} · {FIELD_CONFIGS[selectedType]?.label}</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-white/5">
                  <X className="w-5 h-5 text-[#a8abb3]" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Language tabs */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#a8abb3] mb-2">Sprache wählen</p>
                  <div className="flex flex-wrap gap-1.5">
                    {LANGS.map(l => {
                      const filled = formContent[l.code] && Object.values(formContent[l.code]).some(v => v && v.length > 0);
                      return (
                        <button key={l.code} onClick={() => setActiveLang(l.code)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            activeLang === l.code
                              ? 'bg-[#df8eff]/15 text-[#df8eff] border-[#df8eff]/30'
                              : filled
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-[#20262f] text-[#a8abb3] border-transparent'
                          }`}>
                          {l.flag} {l.code.toUpperCase()}
                          {filled && activeLang !== l.code && <Check className="w-3 h-3 inline ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content fields */}
                <div className="space-y-3">
                  {fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-bold text-[#a8abb3] mb-1.5">{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={formContent[activeLang]?.[field.key] || ''}
                          onChange={e => updateField(field.key, e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl text-sm bg-[#20262f] border border-[#df8eff]/10 text-white focus:outline-none focus:border-[#df8eff]/40 transition-colors resize-none"
                          placeholder={`${field.label} (${activeLang.toUpperCase()})`}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={formContent[activeLang]?.[field.key] || '0'}
                          onChange={e => updateField(field.key, e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl text-sm bg-[#20262f] border border-[#df8eff]/10 text-white focus:outline-none appearance-none"
                        >
                          {(field.options || []).map((opt, i) => (
                            <option key={i} value={String(i)}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={formContent[activeLang]?.[field.key] || ''}
                          onChange={e => updateField(field.key, e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl text-sm bg-[#20262f] border border-[#df8eff]/10 text-white focus:outline-none focus:border-[#df8eff]/40 transition-colors"
                          placeholder={`${field.label} (${activeLang.toUpperCase()})`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Difficulty + Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#a8abb3] mb-1.5">Schwierigkeit</label>
                    <div className="flex gap-2">
                      {DIFFICULTIES.map(d => (
                        <button key={d.value} onClick={() => setFormDifficulty(d.value)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                            formDifficulty === d.value ? d.color : 'bg-[#20262f] text-[#a8abb3] border-transparent'
                          }`}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#a8abb3] mb-1.5">Kategorie</label>
                    <input
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-[#20262f] border border-[#df8eff]/10 text-white focus:outline-none"
                      placeholder="z.B. Sport, Geografie..."
                    />
                  </div>
                </div>

                {/* Language coverage indicator */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0a0e14] border border-white/5">
                  <Globe className="w-4 h-4 text-[#a8abb3]" />
                  <span className="text-xs text-[#a8abb3]">Ausgefüllt:</span>
                  <div className="flex gap-1">
                    {LANGS.map(l => {
                      const filled = formContent[l.code] && Object.values(formContent[l.code]).some(v => v && v.length > 0);
                      return (
                        <span key={l.code} className={`text-sm transition-opacity ${filled ? '' : 'opacity-15'}`} title={l.name}>
                          {l.flag}
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-xs font-bold text-[#8ff5ff] ml-auto">
                    {LANGS.filter(l => formContent[l.code] && Object.values(formContent[l.code]).some(v => v && v.length > 0)).length}/{LANGS.length}
                  </span>
                </div>

                {/* Save button */}
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
                  className="w-full py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#df8eff] to-[#ff6b98] text-white shadow-[0_0_20px_rgba(223,142,255,0.3)] flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  {editItem ? 'Änderungen speichern' : 'Erstellen'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
