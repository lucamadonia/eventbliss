import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Trash2, Edit3, Music2, Sparkles, Check, X, Power } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OHRWURM_GENRES } from '@/games/ohrwurm/ohrwurm-content';
import { resolveSpotifyUri } from '@/games/ohrwurm/playback';

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

interface SongRow {
  id: string;
  year: number;
  artist: string;
  title: string;
  country: string;
  genre: string;
  language: string;
  spotify_uri: string | null;
  is_active: boolean;
}

const EMPTY: Omit<SongRow, 'id'> = {
  year: 2020,
  artist: '', title: '', country: '🌍', genre: 'Pop', language: 'de', spotify_uri: '', is_active: true,
};

const db = () => (supabase.from as never as (t: string) => any)('ohrwurm_songs');

export default function OhrwurmSongs() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SongRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<SongRow, 'id'>>(EMPTY);
  const [resolving, setResolving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await db().select('*').order('created_at', { ascending: false });
    if (error) toast.error('Laden fehlgeschlagen: ' + error.message);
    setRows((data ?? []) as SongRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) =>
      (!filterLang || r.language === filterLang) &&
      (!s || r.artist.toLowerCase().includes(s) || r.title.toLowerCase().includes(s)),
    );
  }, [rows, search, filterLang]);

  const openAdd = () => { setEditId(null); setForm(EMPTY); setModal(true); };
  const openEdit = (r: SongRow) => {
    setEditId(r.id);
    setForm({ year: r.year, artist: r.artist, title: r.title, country: r.country, genre: r.genre, language: r.language, spotify_uri: r.spotify_uri ?? '', is_active: r.is_active });
    setModal(true);
  };

  const autoResolve = async () => {
    if (!form.artist.trim() || !form.title.trim()) { toast.error('Erst Interpret & Titel eingeben'); return; }
    setResolving(true);
    const uri = await resolveSpotifyUri({ artist: form.artist, title: form.title } as never);
    setResolving(false);
    if (uri) { setForm((f) => ({ ...f, spotify_uri: uri })); toast.success('Spotify-URI gefunden'); }
    else toast.error('Keine URI gefunden (Resolver evtl. nicht verfügbar)');
  };

  const save = async () => {
    if (!form.artist.trim() || !form.title.trim() || !form.year) { toast.error('Jahr, Interpret & Titel sind Pflicht'); return; }
    const payload = { ...form, spotify_uri: form.spotify_uri?.trim() || null };
    const res = editId
      ? await db().update(payload).eq('id', editId)
      : await db().insert(payload);
    if (res.error) { toast.error('Speichern fehlgeschlagen: ' + res.error.message); return; }
    toast.success(editId ? 'Aktualisiert' : 'Song hinzugefügt');
    setModal(false);
    void load();
  };

  const remove = async (r: SongRow) => {
    if (!confirm(`„${r.artist} – ${r.title}" wirklich löschen?`)) return;
    const { error } = await db().delete().eq('id', r.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Gelöscht');
    void load();
  };

  const toggleActive = async (r: SongRow) => {
    const { error } = await db().update({ is_active: !r.is_active }).eq('id', r.id);
    if (error) { toast.error(error.message); return; }
    void load();
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/games')} className="p-2 rounded-lg hover:bg-white/10 text-[#a8abb3]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Music2 className="w-6 h-6 text-[#FF2E88]" />
          <div className="flex-1">
            <h1 className="text-xl font-bold">OHRWURM — Songs</h1>
            <p className="text-xs text-[#a8abb3]">Eigene Songs pro Sprache pflegen (ergänzen die 1281 fixen Songs)</p>
          </div>
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-[#FF2E88] to-[#d779ff]">
            <Plus className="w-4 h-4" /> Song
          </button>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-[180px] px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <Search className="w-4 h-4 text-[#a8abb3]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Interpret oder Titel…"
              className="bg-transparent flex-1 text-sm focus:outline-none" />
          </div>
          <select value={filterLang} onChange={(e) => setFilterLang(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm">
            <option value="">Alle Sprachen</option>
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
          </select>
          <span className="px-3 py-2 text-xs text-[#a8abb3] self-center">{filtered.length} / {rows.length}</span>
        </div>

        {/* Liste */}
        {loading ? (
          <p className="text-center text-[#a8abb3] py-10">Lädt…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[#a8abb3] py-10">Noch keine Songs. Mit „+ Song" anlegen.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <div key={r.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${r.is_active ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-50'}`}>
                <span className="text-lg w-8 text-center">{r.country}</span>
                <span className="text-sm font-mono font-bold text-[#FFD23F] w-12">{r.year}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{r.title}</div>
                  <div className="text-xs text-[#a8abb3] truncate">{r.artist} · {r.genre} · {LANGS.find((l) => l.code === r.language)?.flag ?? r.language}</div>
                </div>
                {r.spotify_uri
                  ? <span title={r.spotify_uri} className="text-[10px] px-2 py-1 rounded-full bg-[#1DB954]/20 text-[#1DB954] font-bold">Spotify ✓</span>
                  : <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-[#a8abb3]">nur Vorschau</span>}
                <button onClick={() => toggleActive(r)} title="Aktiv/Inaktiv" className="p-1.5 rounded-lg hover:bg-white/10 text-[#a8abb3]"><Power className="w-4 h-4" /></button>
                <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-white/10 text-[#8ff5ff]"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => remove(r)} className="p-1.5 rounded-lg hover:bg-white/10 text-[#ff6e84]"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-3" onClick={() => setModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-[#16101f] border border-white/10 p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{editId ? 'Song bearbeiten' : 'Neuer Song'}</h2>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-[#a8abb3]"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs text-[#a8abb3] col-span-1">Jahr
                <input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                  className="mt-1 w-full px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white" />
              </label>
              <label className="text-xs text-[#a8abb3] col-span-1">Flagge
                <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} maxLength={4}
                  className="mt-1 w-full px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white text-center" />
              </label>
              <label className="text-xs text-[#a8abb3] col-span-1">Sprache
                <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="mt-1 w-full px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white">
                  {LANGS.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.code}</option>)}
                </select>
              </label>
            </div>

            <label className="text-xs text-[#a8abb3] block">Interpret
              <input value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white" />
            </label>
            <label className="text-xs text-[#a8abb3] block">Titel
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white" />
            </label>
            <label className="text-xs text-[#a8abb3] block">Genre
              <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white">
                {OHRWURM_GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </label>

            <label className="text-xs text-[#a8abb3] block">Spotify-URI <span className="opacity-60">(spotify:track:… — leer = nur 30s-Vorschau)</span>
              <div className="mt-1 flex gap-2">
                <input value={form.spotify_uri ?? ''} onChange={(e) => setForm({ ...form, spotify_uri: e.target.value })} placeholder="spotify:track:…"
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white font-mono" />
                <button onClick={autoResolve} disabled={resolving}
                  className="px-3 py-2 rounded-lg bg-[#1DB954]/20 text-[#1DB954] text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50">
                  <Sparkles className="w-3.5 h-3.5" /> {resolving ? '…' : 'Auto'}
                </button>
              </div>
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              Aktiv (im Spiel sichtbar)
            </label>

            <button onClick={save} className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-[#FF2E88] to-[#d779ff] inline-flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
