import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Search, Trash2, Edit3, Check, X, Globe, Database,
  Gamepad2, Download, Upload, Languages, Layers, Copy, Filter as FilterIcon,
  ChevronDown,
} from 'lucide-react';
import { useGameContent, type GameContent } from '@/hooks/useGameContent';
import { useAuth } from '@/hooks/useAuth';
import { clearGameContentCache } from '@/hooks/useGameContentCached';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { seedAllGameContent } from './admin/seedGameContent';

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

interface GameDef { id: string; name: string; icon: string; types: string[]; color: string; }

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

const GAME_CATEGORIES: Record<string, string[]> = {
  bomb: ['Geografie', 'Geschichte', 'Wissenschaft', 'Sport', 'Essen & Trinken', 'Musik', 'Filme', 'Natur', 'Technik', 'Allgemeinwissen'],
  taboo: ['Sport', 'Filme', 'Tiere', 'Essen', 'Technik', 'Musik', 'Natur', 'Geschichte', 'Alltag', 'Reisen'],
  headup: ['Prominente', 'Tiere', 'Berufe', 'Filme', 'Essen', 'Sport', 'Länder', 'Marken'],
  category: ['Tiere', 'Länder', 'Städte', 'Berufe', 'Sportarten', 'Filme', 'Serien', 'Marken', 'Farben'],
  bottlespin: ['Spaß', 'Party', 'JGA', 'Erwachsene', 'Eisbrecher'],
  truthdare: ['Harmlos', 'Lustig', 'Peinlich', 'Tabu'],
  thisorthat: ['Essen', 'Reisen', 'Lifestyle', 'Unterhaltung', 'Sport'],
  whoami: ['Prominente', 'Disney', 'Superhelden', 'Historisch', 'Sportler', 'Musiker'],
  emojiguess: ['Filme', 'Songs', 'Prominente', 'Disney', 'Serien', 'Spiele'],
  quickdraw: ['Tiere', 'Objekte', 'Aktivitäten', 'Essen', 'Natur', 'Sport'],
  storybuilder: ['Allgemein'],
  sharedquiz: ['Geografie', 'Geschichte', 'Wissenschaft', 'Unterhaltung', 'Sport'],
  fakeorfact: ['Natur', 'Wissenschaft', 'Geschichte', 'Popkultur', 'Geografie'],
  splitquiz: ['Allgemein'],
  hochstapler: ['Allgemein'],
  'wo-ist-was': ['Städte', 'Natur', 'Sehenswürdigkeiten'],
};

// Categories and difficulties that are considered 18+ / adult content
const ADULT_CATEGORIES = new Set(['erwachsene', 'Erwachsene', 'tabu', 'Tabu', '18+', 'ab18', 'adult', 'Adults']);
const ADULT_DIFFICULTIES = new Set(['3']); // intensity 3 in truthdare = pikant/scharf

function isAdultContent(item: GameContent): boolean {
  if (ADULT_CATEGORIES.has(item.category)) return true;
  if (ADULT_DIFFICULTIES.has(item.difficulty) && (item.game_id === 'truthdare' || item.game_id === 'bottlespin')) return true;
  // Check content for adult category markers
  const de = item.content?.de;
  if (de && typeof de === 'object') {
    const cat = (de as Record<string, string>).category;
    if (cat && ADULT_CATEGORIES.has(cat)) return true;
  }
  return false;
}

const FIELD_CONFIGS: Record<string, { label: string; fields: { key: string; label: string; desc: string; type: 'text' | 'textarea' | 'select' | 'number'; options?: string[] }[] }> = {
  question:        { label: 'Quiz-Frage', fields: [
    { key: 'question', label: 'Frage', desc: 'Die Frage die dem Spieler angezeigt wird', type: 'text' },
    { key: 'answer1', label: 'Antwort 1', desc: 'Erste Antwortmöglichkeit', type: 'text' },
    { key: 'answer2', label: 'Antwort 2', desc: 'Zweite Antwortmöglichkeit', type: 'text' },
    { key: 'answer3', label: 'Antwort 3', desc: 'Dritte Antwortmöglichkeit', type: 'text' },
    { key: 'answer4', label: 'Antwort 4', desc: 'Vierte Antwortmöglichkeit', type: 'text' },
    { key: 'correctIndex', label: 'Richtige Antwort', desc: 'Welche Antwort ist korrekt?', type: 'select', options: ['Antwort 1', 'Antwort 2', 'Antwort 3', 'Antwort 4'] },
  ]},
  category: { label: 'Kategorie', fields: [
    { key: 'name', label: 'Kategorie-Name', desc: 'z.B. "Tiere", "Länder", "Berufe"', type: 'text' },
    { key: 'terms', label: 'Begriffe', desc: 'Kommagetrennte Begriffe die in diese Kategorie passen', type: 'textarea' },
  ]},
  taboo_card: { label: 'Tabu-Karte', fields: [
    { key: 'term', label: 'Zu erratender Begriff', desc: 'Das Wort das erklärt werden muss', type: 'text' },
    { key: 'forbidden1', label: 'Tabu-Wort 1', desc: 'Darf beim Erklären nicht gesagt werden', type: 'text' },
    { key: 'forbidden2', label: 'Tabu-Wort 2', desc: 'Darf beim Erklären nicht gesagt werden', type: 'text' },
    { key: 'forbidden3', label: 'Tabu-Wort 3', desc: 'Darf beim Erklären nicht gesagt werden', type: 'text' },
    { key: 'forbidden4', label: 'Tabu-Wort 4', desc: 'Darf beim Erklären nicht gesagt werden', type: 'text' },
    { key: 'forbidden5', label: 'Tabu-Wort 5', desc: 'Darf beim Erklären nicht gesagt werden', type: 'text' },
  ]},
  headup_word: { label: 'Stirnraten-Kategorie', fields: [
    { key: 'word', label: 'Kategorie', desc: 'z.B. "Prominente", "Tiere"', type: 'text' },
    { key: 'words', label: 'Wörter', desc: 'Kommagetrennte Begriffe für diese Kategorie', type: 'textarea' },
  ]},
  emoji_puzzle: { label: 'Emoji-Rätsel', fields: [
    { key: 'emojis', label: 'Emojis', desc: 'Die Emoji-Kombination z.B. "🧙‍♂️⚡📖"', type: 'text' },
    { key: 'answer', label: 'Lösung', desc: 'Die richtige Antwort z.B. "Harry Potter"', type: 'text' },
  ]},
  fact: { label: 'Fakt', fields: [
    { key: 'statement', label: 'Aussage', desc: 'Eine Behauptung — wahr oder falsch?', type: 'textarea' },
    { key: 'isTrue', label: 'Wahr oder Falsch?', desc: 'Ist die Aussage korrekt?', type: 'select', options: ['Wahr', 'Falsch'] },
    { key: 'explanation', label: 'Erklärung', desc: 'Kurze Erklärung warum wahr/falsch', type: 'textarea' },
  ]},
  truth: { label: 'Wahrheit-Frage', fields: [
    { key: 'text', label: 'Frage', desc: 'Eine persönliche Frage die ehrlich beantwortet werden muss', type: 'textarea' },
    { key: 'intensity', label: 'Intensität', desc: '1 = harmlos, 2 = mittel, 3 = pikant', type: 'select', options: ['Harmlos', 'Mittel', 'Pikant'] },
  ]},
  dare: { label: 'Pflicht-Aufgabe', fields: [
    { key: 'text', label: 'Aufgabe', desc: 'Eine lustige oder herausfordernde Aufgabe', type: 'textarea' },
    { key: 'intensity', label: 'Intensität', desc: '1 = harmlos, 2 = mittel, 3 = wild', type: 'select', options: ['Harmlos', 'Mittel', 'Wild'] },
  ]},
  pair: { label: 'This or That', fields: [
    { key: 'optionA', label: 'Option A', desc: 'Erste Auswahlmöglichkeit', type: 'text' },
    { key: 'optionB', label: 'Option B', desc: 'Zweite Auswahlmöglichkeit', type: 'text' },
  ]},
  character: { label: 'Charakter', fields: [
    { key: 'name', label: 'Name', desc: 'Name der Person/Figur z.B. "Albert Einstein"', type: 'text' },
  ]},
  bottle_card: { label: 'Flaschen-Karte', fields: [
    { key: 'text', label: 'Text', desc: 'Die Frage oder Aufgabe auf der Karte', type: 'textarea' },
    { key: 'type', label: 'Typ', desc: 'Art der Karte', type: 'select', options: ['Frage', 'Aufgabe', 'Trinkspiel', 'Lustig'] },
  ]},
  prompt: { label: 'Story-Prompt', fields: [{ key: 'text', label: 'Prompt', desc: 'Eine kreative Aufforderung für die Geschichte', type: 'textarea' }] },
  starter: { label: 'Story-Starter', fields: [{ key: 'text', label: 'Starter-Satz', desc: 'Der erste Satz einer Geschichte z.B. "Es war einmal..."', type: 'textarea' }] },
  shared_question: { label: 'Geteilte Frage', fields: [
    { key: 'question', label: 'Frage', desc: 'Die Quiz-Frage', type: 'text' },
    { key: 'answer1', label: 'Antwort 1', desc: 'Erste Antwort', type: 'text' },
    { key: 'answer2', label: 'Antwort 2', desc: 'Zweite Antwort', type: 'text' },
    { key: 'answer3', label: 'Antwort 3', desc: 'Dritte Antwort', type: 'text' },
    { key: 'answer4', label: 'Antwort 4', desc: 'Vierte Antwort', type: 'text' },
    { key: 'correctIndex', label: 'Richtige Antwort', desc: 'Welche ist korrekt?', type: 'select', options: ['1', '2', '3', '4'] },
    { key: 'hint', label: 'Hinweis', desc: 'Optionaler Tipp für die Spieler', type: 'text' },
  ]},
  draw_word: { label: 'Zeichenwort', fields: [{ key: 'word', label: 'Wort', desc: 'Das zu zeichnende Wort', type: 'text' }] },
  word_set: { label: 'Wort-Set', fields: [
    { key: 'word', label: 'Wort', desc: 'Das geheime Wort', type: 'text' },
    { key: 'category', label: 'Kategorie', desc: 'Kategorie-Hinweis für Spieler', type: 'text' },
  ]},
  location: { label: 'Ort', fields: [
    { key: 'name', label: 'Name', desc: 'Name des Ortes', type: 'text' },
    { key: 'lat', label: 'Breitengrad', desc: 'GPS Latitude z.B. 48.1351', type: 'number' },
    { key: 'lng', label: 'Längengrad', desc: 'GPS Longitude z.B. 11.5820', type: 'number' },
    { key: 'type', label: 'Typ', desc: 'z.B. Stadt, Natur, Sehenswürdigkeit', type: 'text' },
  ]},
};

const DIFFICULTIES = [
  { value: 'easy', label: 'Leicht', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  { value: 'medium', label: 'Mittel', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
  { value: 'hard', label: 'Schwer', color: 'text-red-400 bg-red-500/15 border-red-500/30' },
];

// ─── Component ───────────────────────────────────────────────────

export default function AdminGames() {
  const navigate = useNavigate();
  const gc = useGameContent();
  const [selectedGame, setSelectedGame] = useState<GameDef>(GAMES[0]);
  const [selectedType, setSelectedType] = useState(GAMES[0].types[0]);
  const [search, setSearch] = useState('');
  const [filterDiff, setFilterDiff] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [filterAdult, setFilterAdult] = useState<'' | 'only' | 'exclude'>('');
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<GameContent | null>(null);
  const [activeLang, setActiveLang] = useState('de');
  const [formContent, setFormContent] = useState<Record<string, Record<string, string>>>({});
  const [formDifficulty, setFormDifficulty] = useState('medium');
  const [formCategory, setFormCategory] = useState('general');
  const [gameStats, setGameStats] = useState<Record<string, number>>({});
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { gc.fetchItems(selectedGame.id, selectedType, search, page); }, [selectedGame.id, selectedType, search, page, gc.fetchItems]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from as any)('game_content').select('game_id').eq('is_active', true);
      if (data) {
        const c: Record<string, number> = {};
        data.forEach((r: any) => { c[r.game_id] = (c[r.game_id] || 0) + 1; });
        setGameStats(c);
      }
    })();
  }, [gc.total]);

  const totalItems = useMemo(() => Object.values(gameStats).reduce((a, b) => a + b, 0), [gameStats]);
  const categories = GAME_CATEGORIES[selectedGame.id] || ['Allgemein'];

  // Filtered items (client-side post-filter for difficulty, category, language)
  const filteredItems = useMemo(() => {
    let items = gc.items;
    if (filterDiff) items = items.filter(i => i.difficulty === filterDiff);
    if (filterCat) items = items.filter(i => i.category === filterCat);
    if (filterLang) items = items.filter(i => {
      const has = i.content[filterLang] && Object.values(i.content[filterLang]).some(v => v && String(v).length > 0);
      return filterLang.startsWith('!') ? !has : has;
    });
    if (filterAdult === 'only') items = items.filter(i => isAdultContent(i));
    if (filterAdult === 'exclude') items = items.filter(i => !isAdultContent(i));
    return items;
  }, [gc.items, filterDiff, filterCat, filterLang, filterAdult]);

  const openAdd = () => {
    setEditItem(null);
    const empty: Record<string, Record<string, string>> = {};
    LANGS.forEach(l => { empty[l.code] = {}; });
    setFormContent(empty);
    setFormDifficulty('medium');
    setFormCategory(categories[0] || 'general');
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
    const payload = { game_id: selectedGame.id, content_type: selectedType, content: formContent, difficulty: formDifficulty, category: formCategory, tags: [], is_active: true };
    if (editItem) await gc.updateItem(editItem.id, payload);
    else await gc.addItem(payload);
    setShowModal(false);
    gc.fetchItems(selectedGame.id, selectedType, search, page);
    toast.success(editItem ? 'Gespeichert!' : 'Erstellt!');
  };

  const handleSeed = async () => {
    const deleteFirst = confirm('Bestehende Einträge VORHER löschen?\n\n→ OK = Löschen & neu importieren (empfohlen)\n→ Abbrechen = Nur hinzufügen (Duplikate möglich)');

    setSeeding(true);
    try {
      if (deleteFirst) {
        setSeedProgress('Lösche alte Einträge...');
        await (supabase.from as any)('game_content').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        toast.info('Alte Einträge gelöscht.');
      }
      const ok = await seedAllGameContent((msg) => setSeedProgress(msg));
      gc.fetchItems(selectedGame.id, selectedType, search, page);
      toast.success(`${ok} Einträge importiert!`);
    } catch (e: any) {
      toast.error(`Import fehlgeschlagen: ${e.message}`);
    }
    setSeeding(false);
    setSeedProgress('');
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = '';
    const ext = file.name.split('.').pop()?.toLowerCase();
    const text = await file.text();
    let rows: Record<string, string>[] = [];
    try {
      if (ext === 'json') { const p = JSON.parse(text); rows = Array.isArray(p) ? p : [p]; }
      else if (ext === 'csv' || ext === 'txt') {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) { toast.error('CSV braucht Header + Zeilen.'); return; }
        const hdrs = lines[0].split(/[,;\t]/).map(h => h.replace(/^["']|["']$/g, '').trim());
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(/[,;\t]/).map(v => v.replace(/^["']|["']$/g, '').trim());
          const row: Record<string, string> = {};
          hdrs.forEach((h, idx) => { if (vals[idx]) row[h] = vals[idx]; });
          if (Object.keys(row).length > 0) rows.push(row);
        }
      } else { toast.error(`Format .${ext} nicht unterstützt.`); return; }
      if (rows.length === 0) { toast.error('Keine Daten gefunden.'); return; }
      const flds = FIELD_CONFIGS[selectedType]?.fields.map(f => f.key) || ['text'];
      const items: any[] = [];
      for (const row of rows) {
        const content: Record<string, Record<string, string>> = {};
        const fd: Record<string, string> = {};
        for (const fn of flds) { if (row[fn]) fd[fn] = row[fn]; }
        if (Object.keys(fd).length > 0) content[row.lang || 'de'] = fd;
        if (Object.keys(content).length > 0) {
          items.push({ game_id: selectedGame.id, content_type: selectedType, content, difficulty: row.difficulty || 'medium', category: row.category || 'general', tags: [], is_active: true });
        }
      }
      if (items.length === 0) { toast.error('Keine gültigen Einträge.'); return; }
      let ok = 0;
      for (let i = 0; i < items.length; i += 50) {
        const { error } = await (supabase.from as any)('game_content').insert(items.slice(i, i + 50));
        if (!error) ok += Math.min(50, items.length - i);
      }
      clearGameContentCache();
      gc.fetchItems(selectedGame.id, selectedType, search, page);
      toast.success(`${ok} Einträge aus ${file.name} importiert!`);
    } catch (err: any) { toast.error(`Import: ${err.message}`); }
  };

  const handleDownloadTemplate = () => {
    const cfg = FIELD_CONFIGS[selectedType]; if (!cfg) return;
    const hdrs = [...cfg.fields.map(f => f.key), 'difficulty', 'category'].join(';');
    const ex = cfg.fields.map(f => f.type === 'number' ? '0' : `Beispiel`).join(';') + ';medium;' + (categories[0] || 'general');
    const blob = new Blob(['\uFEFF' + hdrs + '\n' + ex + '\n'], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${selectedGame.id}_${selectedType}_vorlage.csv`; a.click();
    toast.success('Vorlage heruntergeladen!');
  };

  const updateField = (field: string, value: string) => {
    setFormContent(prev => ({ ...prev, [activeLang]: { ...prev[activeLang], [field]: value } }));
  };

  const fields = FIELD_CONFIGS[selectedType]?.fields || [{ key: 'text', label: 'Text', desc: '', type: 'text' as const }];
  const preview = (item: GameContent) => {
    // Show content in the filtered language, or fall back to DE → EN
    const lang = filterLang && !filterLang.startsWith('!') ? filterLang : 'de';
    const data = item.content[lang] || item.content.de || item.content.en || {};
    return data[fields[0].key] || data.text || data.question || data.name || data.word || data.term || JSON.stringify(data).slice(0, 60);
  };
  const langCount = (item: GameContent) => LANGS.filter(l => item.content[l.code] && Object.values(item.content[l.code]).some(v => v && String(v).length > 0)).length;

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#f1f3fc] font-game">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="p-2 rounded-xl hover:bg-white/5"><ArrowLeft className="w-5 h-5 text-[#a8abb3]" /></button>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-[#df8eff] via-[#ff6b98] to-[#8ff5ff] bg-clip-text text-transparent">Games Content Manager</h1>
            <p className="text-xs text-[#a8abb3] mt-0.5">{totalItems} Einträge · {GAMES.length} Spiele · {LANGS.length} Sprachen</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-[#1b2028] border border-white/5 text-[#a8abb3] hover:border-white/10">
              <Layers className="w-3.5 h-3.5" /> Vorlage
            </motion.button>
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-[#1b2028] border border-white/5 text-[#ff6b98] hover:border-[#ff6b98]/30 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Import
              <input type="file" accept=".csv,.json,.txt" onChange={handleFileImport} className="hidden" />
            </label>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleSeed} disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-[#1b2028] border border-white/5 text-[#8ff5ff] hover:border-[#8ff5ff]/30 disabled:opacity-50">
              {seeding ? <div className="w-3 h-3 border-2 border-[#8ff5ff] border-t-transparent rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {seeding ? seedProgress || 'Importiere...' : 'Alle importieren'}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={openAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#df8eff] to-[#ff6b98] text-white shadow-[0_0_15px_rgba(223,142,255,0.3)]">
              <Plus className="w-4 h-4" /> Hinzufügen
            </motion.button>
          </div>
        </div>
        {/* Stats */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151a21] border border-white/5">
            <Database className="w-3.5 h-3.5 text-[#df8eff]" /><span className="text-xs font-bold text-[#df8eff]">{totalItems}</span><span className="text-[10px] text-[#a8abb3]">Einträge</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151a21] border border-white/5">
            <Gamepad2 className="w-3.5 h-3.5 text-[#8ff5ff]" /><span className="text-xs font-bold text-[#8ff5ff]">{Object.keys(gameStats).length}/{GAMES.length}</span><span className="text-[10px] text-[#a8abb3]">aktiv</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151a21] border border-white/5">
            <Languages className="w-3.5 h-3.5 text-[#ff6b98]" /><span className="text-xs font-bold text-[#ff6b98]">{LANGS.length}</span><span className="text-[10px] text-[#a8abb3]">Sprachen</span>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-72 border-r border-white/5 p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] bg-[#151a21]">
          {GAMES.map(g => {
            const cnt = gameStats[g.id] || 0;
            const active = selectedGame.id === g.id;
            return (
              <button key={g.id} onClick={() => { setSelectedGame(g); setSelectedType(g.types[0]); setPage(0); setFilterDiff(''); setFilterCat(''); setFilterLang(''); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all ${active ? 'font-bold bg-[#df8eff]/10 border border-[#df8eff]/20' : 'border border-transparent hover:bg-white/[0.03]'}`}>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center text-lg shrink-0`}>{g.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`truncate ${active ? 'text-[#df8eff]' : 'text-[#a8abb3]'}`}>{g.name}</p>
                  <p className="text-[10px] text-[#a8abb3]/50">{cnt > 0 ? `${cnt} Einträge` : 'Leer'}</p>
                </div>
                {cnt > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#df8eff]/10 text-[#df8eff]">{cnt}</span>}
              </button>
            );
          })}
        </div>

        {/* Main */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          {/* Game header */}
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedGame.color} flex items-center justify-center text-2xl shadow-lg`}>{selectedGame.icon}</div>
            <div>
              <h2 className="text-lg font-extrabold text-white">{selectedGame.name}</h2>
              <p className="text-xs text-[#a8abb3]">{gameStats[selectedGame.id] || 0} Einträge · {selectedGame.types.map(t => FIELD_CONFIGS[t]?.label || t).join(', ')}</p>
            </div>
          </div>

          {/* Type tabs + Search + Filter toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            {selectedGame.types.map(t => (
              <button key={t} onClick={() => { setSelectedType(t); setPage(0); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${selectedType === t ? 'bg-[#8ff5ff]/15 text-[#8ff5ff] border-[#8ff5ff]/30' : 'bg-[#1b2028] text-[#a8abb3] border-transparent'}`}>
                {FIELD_CONFIGS[t]?.label || t}
              </button>
            ))}
            <div className="flex-1" />
            <button onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${showFilters ? 'bg-[#df8eff]/15 text-[#df8eff] border-[#df8eff]/30' : 'bg-[#1b2028] text-[#a8abb3] border-transparent'}`}>
              <FilterIcon className="w-3.5 h-3.5" /> Filter
              {(filterDiff || filterCat || filterLang || filterAdult) && <span className="w-4 h-4 rounded-full bg-[#df8eff] text-[10px] text-white flex items-center justify-center">!</span>}
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8abb3]" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Suchen..."
                className="pl-9 pr-4 py-2 rounded-xl text-sm border bg-[#1b2028] border-[#df8eff]/10 text-white focus:outline-none focus:border-[#df8eff]/40 w-48" />
            </div>
          </div>

          {/* Filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 py-3 px-4 rounded-xl bg-[#151a21] border border-white/5">
                  {/* Difficulty */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#a8abb3] font-bold uppercase">Schwierigkeit:</span>
                    <button onClick={() => setFilterDiff('')} className={`px-2 py-1 rounded-lg text-[10px] font-bold ${!filterDiff ? 'bg-white/10 text-white' : 'text-[#a8abb3]'}`}>Alle</button>
                    {DIFFICULTIES.map(d => (
                      <button key={d.value} onClick={() => setFilterDiff(filterDiff === d.value ? '' : d.value)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${filterDiff === d.value ? d.color : 'text-[#a8abb3] border-transparent'}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>

                  <div className="w-px h-5 bg-white/10" />

                  {/* Category */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#a8abb3] font-bold uppercase">Kategorie:</span>
                    <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#1b2028] border border-white/10 text-white appearance-none pr-6">
                      <option value="">Alle</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="w-px h-5 bg-white/10" />

                  {/* Language */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#a8abb3] font-bold uppercase">Sprache:</span>
                    <select value={filterLang} onChange={e => setFilterLang(e.target.value)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#1b2028] border border-white/10 text-white appearance-none pr-6">
                      <option value="">Alle</option>
                      {LANGS.map(l => <option key={l.code} value={l.code}>{l.flag} hat {l.code.toUpperCase()}</option>)}
                      {LANGS.map(l => <option key={'!' + l.code} value={'!' + l.code}>❌ fehlt {l.code.toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div className="w-px h-5 bg-white/10" />

                  {/* Ab18 Filter */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#a8abb3] font-bold uppercase">Ab 18:</span>
                    <button onClick={() => setFilterAdult('')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${!filterAdult ? 'bg-white/10 text-white' : 'text-[#a8abb3]'}`}>Alle</button>
                    <button onClick={() => setFilterAdult(filterAdult === 'only' ? '' : 'only')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${filterAdult === 'only' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'text-[#a8abb3] border-transparent'}`}>
                      🔞 Nur Ab18
                    </button>
                    <button onClick={() => setFilterAdult(filterAdult === 'exclude' ? '' : 'exclude')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${filterAdult === 'exclude' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'text-[#a8abb3] border-transparent'}`}>
                      ✅ Ohne Ab18
                    </button>
                  </div>

                  {(filterDiff || filterCat || filterLang || filterAdult) && (
                    <button onClick={() => { setFilterDiff(''); setFilterCat(''); setFilterLang(''); setFilterAdult(''); }}
                      className="ml-auto text-[10px] text-[#ff6b98] underline">Zurücksetzen</button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content list */}
          {gc.loading ? (
            <div className="flex justify-center py-16"><div className="w-10 h-10 border-2 border-[#df8eff] border-t-transparent rounded-full animate-spin" /></div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${selectedGame.color} flex items-center justify-center text-3xl shadow-lg opacity-40 mb-4`}>{selectedGame.icon}</div>
              <p className="text-base font-bold text-[#a8abb3]">Keine Einträge</p>
              <p className="text-xs text-[#a8abb3]/50 mt-1 max-w-xs mx-auto">Klicke "Hinzufügen" oder importiere Inhalte.</p>
              {/* Format hint */}
              <div className="mt-4 mx-auto max-w-sm px-4 py-3 rounded-xl bg-[#151a21] border border-white/5 text-left">
                <p className="text-[10px] font-bold text-[#8ff5ff] uppercase mb-1">CSV-Format: {FIELD_CONFIGS[selectedType]?.label}</p>
                <p className="text-[10px] text-[#a8abb3] font-mono">{fields.map(f => f.key).join('; ')}; difficulty; category</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-[#a8abb3]">{filteredItems.length} von {gc.total} Einträgen{filterDiff || filterCat || filterLang || filterAdult ? ' (gefiltert)' : ''}</p>
              {filteredItems.map((item, idx) => {
                const langs = langCount(item);
                const diffCfg = DIFFICULTIES.find(d => d.value === item.difficulty) || DIFFICULTIES[1];
                return (
                  <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.01 }}
                    className="group flex items-center gap-4 px-4 py-3 rounded-xl bg-[#1b2028] border border-white/[0.03] hover:border-[#df8eff]/15 transition-all">
                    <span className="text-[10px] font-bold text-[#a8abb3]/30 w-6 text-right tabular-nums">{page * 20 + idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{preview(item)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${diffCfg.color}`}>{diffCfg.label}</span>
                        <span className="text-[10px] text-[#a8abb3]">{item.category}</span>
                        {isAdultContent(item) && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-500/20 text-red-400 border border-red-500/30">🔞 Ab 18</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-0.5">{LANGS.map(l => {
                      const filled = item.content[l.code] && Object.values(item.content[l.code]).some(v => v && String(v).length > 0);
                      return <span key={l.code} className={`text-[10px] ${filled ? '' : 'opacity-15'}`} title={`${l.name}: ${filled ? '✓' : '✗'}`}>{l.flag}</span>;
                    })}</div>
                    <span className={`text-xs font-bold ${langs >= 8 ? 'text-emerald-400' : langs >= 5 ? 'text-[#8ff5ff]' : 'text-[#ff6b98]'}`}>{langs}/{LANGS.length}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { gc.addItem({ game_id: item.game_id, content_type: item.content_type, content: item.content, difficulty: item.difficulty, category: item.category, tags: item.tags, is_active: true }); gc.fetchItems(selectedGame.id, selectedType, search, page); toast.success('Dupliziert!'); }}
                        className="p-1.5 rounded-lg hover:bg-white/5" title="Duplizieren"><Copy className="w-3.5 h-3.5 text-[#8ff5ff]" /></button>
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-white/5" title="Bearbeiten"><Edit3 className="w-3.5 h-3.5 text-[#df8eff]" /></button>
                      <button onClick={() => { if (confirm('Löschen?')) gc.deleteItem(item.id); }} className="p-1.5 rounded-lg hover:bg-white/5" title="Löschen"><Trash2 className="w-3.5 h-3.5 text-[#ff6b98]" /></button>
                    </div>
                  </motion.div>
                );
              })}
              {gc.total > 20 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl text-sm font-bold bg-[#1b2028] text-[#a8abb3] disabled:opacity-30 border border-white/5">Zurück</button>
                  <span className="text-xs text-[#a8abb3]">Seite {page + 1}/{Math.ceil(gc.total / 20)}</span>
                  <button disabled={(page + 1) * 20 >= gc.total} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl text-sm font-bold bg-[#1b2028] text-[#a8abb3] disabled:opacity-30 border border-white/5">Weiter</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowModal(false)} />
            <motion.div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#151a21] border border-[#df8eff]/15 shadow-[0_0_60px_rgba(223,142,255,0.1)]"
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}>
              <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/5 bg-[#151a21]/95 backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${selectedGame.color} flex items-center justify-center text-base`}>{selectedGame.icon}</div>
                  <div>
                    <h2 className="text-base font-bold text-[#df8eff]">{editItem ? 'Bearbeiten' : 'Neu erstellen'}</h2>
                    <p className="text-[10px] text-[#a8abb3]">{selectedGame.name} · {FIELD_CONFIGS[selectedType]?.label}</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-white/5"><X className="w-5 h-5 text-[#a8abb3]" /></button>
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
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${activeLang === l.code ? 'bg-[#df8eff]/15 text-[#df8eff] border-[#df8eff]/30' : filled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-[#20262f] text-[#a8abb3] border-transparent'}`}>
                          {l.flag} {l.code.toUpperCase()} {filled && activeLang !== l.code && <Check className="w-3 h-3 inline ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fields with descriptions */}
                <div className="space-y-4">
                  {fields.map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-bold text-white mb-0.5">{field.label}</label>
                      <p className="text-[10px] text-[#a8abb3]/70 mb-1.5">{field.desc}</p>
                      {field.type === 'textarea' ? (
                        <textarea value={formContent[activeLang]?.[field.key] || ''} onChange={e => updateField(field.key, e.target.value)} rows={3}
                          className="w-full px-4 py-2.5 rounded-xl text-sm bg-[#20262f] border border-[#df8eff]/10 text-white focus:outline-none focus:border-[#df8eff]/40 resize-none"
                          placeholder={`${field.label} (${activeLang.toUpperCase()})`} />
                      ) : field.type === 'select' ? (
                        <select value={formContent[activeLang]?.[field.key] || '0'} onChange={e => updateField(field.key, e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl text-sm bg-[#20262f] border border-[#df8eff]/10 text-white focus:outline-none appearance-none">
                          {(field.options || []).map((opt, i) => <option key={i} value={String(i)}>{opt}</option>)}
                        </select>
                      ) : (
                        <input type={field.type === 'number' ? 'number' : 'text'}
                          value={formContent[activeLang]?.[field.key] || ''} onChange={e => updateField(field.key, e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl text-sm bg-[#20262f] border border-[#df8eff]/10 text-white focus:outline-none focus:border-[#df8eff]/40"
                          placeholder={`${field.label} (${activeLang.toUpperCase()})`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Difficulty + Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white mb-0.5">Schwierigkeit</label>
                    <p className="text-[10px] text-[#a8abb3]/70 mb-1.5">Wie schwer ist dieser Inhalt?</p>
                    <div className="flex gap-2">
                      {DIFFICULTIES.map(d => (
                        <button key={d.value} onClick={() => setFormDifficulty(d.value)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${formDifficulty === d.value ? d.color : 'bg-[#20262f] text-[#a8abb3] border-transparent'}`}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white mb-0.5">Kategorie</label>
                    <p className="text-[10px] text-[#a8abb3]/70 mb-1.5">Thematische Einordnung</p>
                    <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm bg-[#20262f] border border-[#df8eff]/10 text-white focus:outline-none appearance-none">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="custom">+ Neue Kategorie...</option>
                    </select>
                    {formCategory === 'custom' && (
                      <input className="w-full mt-2 px-4 py-2 rounded-xl text-sm bg-[#20262f] border border-[#df8eff]/10 text-white focus:outline-none"
                        placeholder="Neue Kategorie eingeben..." onChange={e => setFormCategory(e.target.value)} autoFocus />
                    )}
                  </div>
                </div>

                {/* Coverage */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0a0e14] border border-white/5">
                  <Globe className="w-4 h-4 text-[#a8abb3]" />
                  <span className="text-xs text-[#a8abb3]">Ausgefüllt:</span>
                  <div className="flex gap-1">{LANGS.map(l => {
                    const f = formContent[l.code] && Object.values(formContent[l.code]).some(v => v && v.length > 0);
                    return <span key={l.code} className={`text-sm ${f ? '' : 'opacity-15'}`} title={l.name}>{l.flag}</span>;
                  })}</div>
                  <span className="text-xs font-bold text-[#8ff5ff] ml-auto">
                    {LANGS.filter(l => formContent[l.code] && Object.values(formContent[l.code]).some(v => v && v.length > 0)).length}/{LANGS.length}
                  </span>
                </div>

                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
                  className="w-full py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#df8eff] to-[#ff6b98] text-white shadow-[0_0_20px_rgba(223,142,255,0.3)] flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> {editItem ? 'Speichern' : 'Erstellen'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
