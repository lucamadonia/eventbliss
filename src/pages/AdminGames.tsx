import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Trash2, Edit3, Check, X, Globe, Database, Gamepad2, Filter } from 'lucide-react';
import { useGameContent, type GameContent } from '@/hooks/useGameContent';
import { useAuth } from '@/hooks/useAuth';

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

const GAMES = [
  { id: 'bomb', name: 'Tickende Bombe', icon: '💣', types: ['question', 'category'] },
  { id: 'taboo', name: 'Wortverbot', icon: '🚫', types: ['taboo_card'] },
  { id: 'headup', name: 'Stirnraten', icon: '🧠', types: ['headup_word'] },
  { id: 'category', name: 'Zeit-Kategorie', icon: '⏱️', types: ['category'] },
  { id: 'emojiguess', name: 'Emoji-Raten', icon: '😀', types: ['emoji_puzzle'] },
  { id: 'fakeorfact', name: 'Fake or Fact', icon: '🎲', types: ['fact'] },
  { id: 'truthdare', name: 'Wahrheit/Pflicht', icon: '❤️', types: ['truth', 'dare'] },
  { id: 'thisorthat', name: 'This or That', icon: '↔️', types: ['pair'] },
  { id: 'whoami', name: 'Wer bin ich?', icon: '❓', types: ['character'] },
  { id: 'bottlespin', name: 'Flaschendrehen', icon: '🍾', types: ['bottle_card'] },
  { id: 'storybuilder', name: 'Story Builder', icon: '📖', types: ['prompt', 'starter'] },
  { id: 'sharedquiz', name: 'Geteilt & Gequizzt', icon: '🔗', types: ['shared_question'] },
  { id: 'quickdraw', name: 'Schnellzeichner', icon: '🎨', types: ['draw_word'] },
  { id: 'splitquiz', name: 'Split Quiz', icon: '🧩', types: ['question'] },
  { id: 'hochstapler', name: 'Hochstapler', icon: '🎭', types: ['word_set'] },
  { id: 'wo-ist-was', name: 'Wo ist was?', icon: '🗺️', types: ['location'] },
  { id: 'flaschendrehen', name: 'Flaschendrehen', icon: '🍾', types: ['bottle_card'] },
];

const FIELD_CONFIGS: Record<string, { label: string; fields: string[] }> = {
  question: { label: 'Quiz-Frage', fields: ['question', 'answer1', 'answer2', 'answer3', 'answer4', 'correctIndex'] },
  category: { label: 'Kategorie', fields: ['name', 'terms'] },
  taboo_card: { label: 'Tabu-Karte', fields: ['term', 'forbidden1', 'forbidden2', 'forbidden3', 'forbidden4', 'forbidden5'] },
  headup_word: { label: 'Stirnraten-Wort', fields: ['word', 'category'] },
  emoji_puzzle: { label: 'Emoji-Rätsel', fields: ['emojis', 'answer'] },
  fact: { label: 'Fakt', fields: ['statement', 'isTrue', 'explanation'] },
  truth: { label: 'Wahrheit', fields: ['text', 'intensity'] },
  dare: { label: 'Pflicht', fields: ['text', 'intensity'] },
  pair: { label: 'This or That', fields: ['optionA', 'optionB'] },
  character: { label: 'Charakter', fields: ['name'] },
  bottle_card: { label: 'Flaschen-Karte', fields: ['text', 'type'] },
  prompt: { label: 'Story-Prompt', fields: ['text'] },
  starter: { label: 'Story-Starter', fields: ['text'] },
  shared_question: { label: 'Geteilte Frage', fields: ['question', 'answer1', 'answer2', 'answer3', 'answer4', 'correctIndex', 'hint'] },
  draw_word: { label: 'Zeichenwort', fields: ['word'] },
  word_set: { label: 'Wort-Set', fields: ['word', 'category'] },
  location: { label: 'Ort', fields: ['name', 'lat', 'lng', 'type'] },
};

const EP = { bg: '#0a0e14', s1: '#151a21', s2: '#1b2028', s3: '#20262f', purple: '#df8eff', pink: '#ff6b98', cyan: '#8ff5ff', text: '#f1f3fc', muted: '#a8abb3' };

export default function AdminGames() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, loading, total, fetchItems, addItem, updateItem, deleteItem } = useGameContent();
  const [selectedGame, setSelectedGame] = useState(GAMES[0]);
  const [selectedType, setSelectedType] = useState(GAMES[0].types[0]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<GameContent | null>(null);
  const [activeLang, setActiveLang] = useState('de');
  const [formContent, setFormContent] = useState<Record<string, Record<string, string>>>({});
  const [formDifficulty, setFormDifficulty] = useState('medium');
  const [formCategory, setFormCategory] = useState('general');

  useEffect(() => { fetchItems(selectedGame.id, selectedType, search, page); }, [selectedGame.id, selectedType, search, page, fetchItems]);

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
    const payload = { game_id: selectedGame.id, content_type: selectedType, content: formContent, difficulty: formDifficulty, category: formCategory, tags: [], is_active: true };
    if (editItem) { await updateItem(editItem.id, payload); }
    else { await addItem(payload); }
    setShowModal(false);
    fetchItems(selectedGame.id, selectedType, search, page);
  };

  const updateField = (field: string, value: string) => {
    setFormContent(prev => ({ ...prev, [activeLang]: { ...prev[activeLang], [field]: value } }));
  };

  const fields = FIELD_CONFIGS[selectedType]?.fields || ['text'];
  const preview = (item: GameContent) => {
    const de = item.content.de || item.content.en || {};
    return de[fields[0]] || de.text || de.question || de.name || de.word || de.term || JSON.stringify(de).slice(0, 60);
  };
  const langCount = (item: GameContent) => LANGS.filter(l => item.content[l.code] && Object.keys(item.content[l.code]).length > 0).length;

  return (
    <div className="min-h-screen" style={{ background: EP.bg, color: EP.text, fontFamily: "'Plus Jakarta Sans', system-ui" }}>
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="p-2 rounded-lg hover:bg-white/5"><ArrowLeft className="w-5 h-5" style={{ color: EP.muted }} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold" style={{ color: EP.purple }}>Games Content Manager</h1>
          <p className="text-xs" style={{ color: EP.muted }}>{total} Eintraege | {GAMES.length} Spiele | {LANGS.length} Sprachen</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
          style={{ background: `linear-gradient(135deg, ${EP.purple}, ${EP.pink})`, color: '#fff' }}>
          <Plus className="w-4 h-4" /> Hinzufuegen
        </motion.button>
      </div>

      <div className="flex">
        {/* Sidebar — Game selector */}
        <div className="w-64 border-r border-white/5 p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]" style={{ background: EP.s1 }}>
          {GAMES.map(g => (
            <button key={g.id} onClick={() => { setSelectedGame(g); setSelectedType(g.types[0]); setPage(0); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm ${selectedGame.id === g.id ? 'font-bold' : ''}`}
              style={{ background: selectedGame.id === g.id ? `${EP.purple}15` : 'transparent', color: selectedGame.id === g.id ? EP.purple : EP.muted, border: selectedGame.id === g.id ? `1px solid ${EP.purple}30` : '1px solid transparent' }}>
              <span className="text-lg">{g.icon}</span>
              <span className="truncate">{g.name}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          {/* Type tabs + Search */}
          <div className="flex items-center gap-3 flex-wrap">
            {selectedGame.types.map(t => (
              <button key={t} onClick={() => { setSelectedType(t); setPage(0); }}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{ background: selectedType === t ? `${EP.cyan}20` : EP.s2, color: selectedType === t ? EP.cyan : EP.muted, border: `1px solid ${selectedType === t ? `${EP.cyan}40` : 'transparent'}` }}>
                {FIELD_CONFIGS[t]?.label || t}
              </button>
            ))}
            <div className="flex-1" />
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: EP.muted }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="Suchen..."
                className="pl-9 pr-4 py-2 rounded-xl text-sm border focus:outline-none focus:ring-1"
                style={{ background: EP.s2, borderColor: `${EP.purple}20`, color: EP.text, width: 200 }} />
            </div>
          </div>

          {/* Content list */}
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${EP.purple} transparent ${EP.purple} ${EP.purple}` }} /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <Database className="w-12 h-12 mx-auto mb-4" style={{ color: EP.muted }} />
              <p className="text-lg font-bold" style={{ color: EP.muted }}>Keine Eintraege</p>
              <p className="text-sm" style={{ color: `${EP.muted}80` }}>Klicke "Hinzufuegen" um Content zu erstellen</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <motion.div key={item.id} layout className="flex items-center gap-4 px-4 py-3 rounded-xl border" style={{ background: EP.s2, borderColor: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: EP.text }}>{preview(item)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${EP.cyan}15`, color: EP.cyan }}>{item.difficulty}</span>
                      <span className="text-[10px]" style={{ color: EP.muted }}>{item.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3" style={{ color: EP.muted }} />
                    <span className="text-xs font-bold" style={{ color: langCount(item) >= 5 ? EP.cyan : EP.pink }}>{langCount(item)}/{LANGS.length}</span>
                  </div>
                  <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-white/5"><Edit3 className="w-4 h-4" style={{ color: EP.purple }} /></button>
                  <button onClick={() => { if (confirm('Wirklich loeschen?')) deleteItem(item.id); }} className="p-2 rounded-lg hover:bg-white/5"><Trash2 className="w-4 h-4" style={{ color: EP.pink }} /></button>
                </motion.div>
              ))}
              {/* Pagination */}
              {total > 20 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg text-sm disabled:opacity-30" style={{ background: EP.s3, color: EP.muted }}>Zurueck</button>
                  <span className="text-xs" style={{ color: EP.muted }}>Seite {page + 1} / {Math.ceil(total / 20)}</span>
                  <button disabled={(page + 1) * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg text-sm disabled:opacity-30" style={{ background: EP.s3, color: EP.muted }}>Weiter</button>
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border" style={{ background: EP.s1, borderColor: `${EP.purple}20` }}
              initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}>
              {/* Modal header */}
              <div className="sticky top-0 z-10 px-6 py-4 border-b border-white/5 flex items-center justify-between" style={{ background: EP.s1 }}>
                <h2 className="text-lg font-bold" style={{ color: EP.purple }}>{editItem ? 'Bearbeiten' : 'Neu hinzufuegen'}: {FIELD_CONFIGS[selectedType]?.label}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5" style={{ color: EP.muted }} /></button>
              </div>

              <div className="p-6 space-y-5">
                {/* Language tabs */}
                <div className="flex flex-wrap gap-1.5">
                  {LANGS.map(l => (
                    <button key={l.code} onClick={() => setActiveLang(l.code)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                      style={{
                        background: activeLang === l.code ? `${EP.purple}20` : EP.s3,
                        color: activeLang === l.code ? EP.purple : EP.muted,
                        border: `1px solid ${activeLang === l.code ? `${EP.purple}40` : 'transparent'}`,
                      }}>
                      {l.flag} {l.code.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Content fields */}
                <div className="space-y-3">
                  {fields.map(field => (
                    <div key={field}>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: EP.muted }}>{field}</label>
                      {field === 'terms' || field === 'explanation' ? (
                        <textarea value={formContent[activeLang]?.[field] || ''} onChange={e => updateField(field, e.target.value)} rows={3}
                          className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1"
                          style={{ background: EP.s3, borderColor: `${EP.purple}15`, color: EP.text }} placeholder={`${field} (${activeLang.toUpperCase()})`} />
                      ) : field === 'isTrue' ? (
                        <select value={formContent[activeLang]?.[field] || 'true'} onChange={e => updateField(field, e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl text-sm border" style={{ background: EP.s3, borderColor: `${EP.purple}15`, color: EP.text }}>
                          <option value="true">Wahr</option>
                          <option value="false">Falsch</option>
                        </select>
                      ) : field === 'correctIndex' || field === 'intensity' ? (
                        <select value={formContent[activeLang]?.[field] || '0'} onChange={e => updateField(field, e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl text-sm border" style={{ background: EP.s3, borderColor: `${EP.purple}15`, color: EP.text }}>
                          {field === 'correctIndex' ? [0,1,2,3].map(i => <option key={i} value={String(i)}>Antwort {i+1}</option>) :
                            [1,2,3].map(i => <option key={i} value={String(i)}>Stufe {i}</option>)}
                        </select>
                      ) : (
                        <input type={field === 'lat' || field === 'lng' ? 'number' : 'text'}
                          value={formContent[activeLang]?.[field] || ''} onChange={e => updateField(field, e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1"
                          style={{ background: EP.s3, borderColor: `${EP.purple}15`, color: EP.text }} placeholder={`${field} (${activeLang.toUpperCase()})`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Difficulty + Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: EP.muted }}>Schwierigkeit</label>
                    <select value={formDifficulty} onChange={e => setFormDifficulty(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm border" style={{ background: EP.s3, borderColor: `${EP.purple}15`, color: EP.text }}>
                      <option value="easy">Leicht</option>
                      <option value="medium">Mittel</option>
                      <option value="hard">Schwer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: EP.muted }}>Kategorie</label>
                    <input value={formCategory} onChange={e => setFormCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none" placeholder="z.B. Sport, Natur..."
                      style={{ background: EP.s3, borderColor: `${EP.purple}15`, color: EP.text }} />
                  </div>
                </div>

                {/* Filled languages indicator */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs" style={{ color: EP.muted }}>Ausgefuellt:</span>
                  {LANGS.map(l => {
                    const filled = formContent[l.code] && Object.values(formContent[l.code]).some(v => v && v.length > 0);
                    return <span key={l.code} className={`text-sm ${filled ? '' : 'opacity-20'}`}>{l.flag}</span>;
                  })}
                </div>

                {/* Save button */}
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave}
                  className="w-full py-3 rounded-xl text-sm font-bold"
                  style={{ background: `linear-gradient(135deg, ${EP.purple}, ${EP.pink})`, color: '#fff' }}>
                  <span className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    {editItem ? 'Speichern' : 'Erstellen'}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
