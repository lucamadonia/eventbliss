/**
 * Admin: PIXELJAGD-Motive pflegen.
 *
 * Aufbau: links das Anlegen (sticky), rechts die Sammlung. Auf schmalen
 * Geräten gestapelt.
 *
 * Die Besonderheit gegenüber einem üblichen CRUD-Formular ist die
 * Live-Vorschau: das gewählte Bild wird sofort in der Startstufe der
 * Verpixelung gezeigt. Ohne die müsste man raten, ob ein Motiv als Rätsel
 * überhaupt taugt — ein Bild mit sehr markanter Silhouette ist schon in der
 * ersten Sekunde erkennbar und damit langweilig.
 *
 * `credit` ist Pflichtfeld — es wird im Spiel beim Auflösen angezeigt, und das
 * Impressum verspricht, Fremdinhalte zu kennzeichnen.
 *
 * Farbwelt bewusst die des übrigen Adminbereichs (siehe AdminGames), damit die
 * Seite dazugehört; Aktionen im PIXELJAGD-Akzent.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, Trash2, Eye, EyeOff, ExternalLink, ImagePlus,
  AlertCircle, CheckCircle2, Loader2, Search, X, ImageOff,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PIXEL_CATEGORIES, type PixelCategory } from '@/games/pixeljagd/pixeljagd-content';
import { resolveImageUrl } from '@/games/pixeljagd/pixeljagd-extra';
import { PixelCanvas } from '@/games/pixeljagd/PixelCanvas';

const CATEGORY_LABEL: Record<PixelCategory, string> = {
  tiere: 'Tiere',
  stars: 'Stars',
  filme: 'Filme & Serien',
  essen: 'Essen & Trinken',
  orte: 'Orte',
  marken: 'Marken',
};

const DIFFICULTY_LABEL: Record<number, string> = { 1: 'Leicht', 2: 'Mittel', 3: 'Schwer' };

const MAX_BYTES = 10 * 1024 * 1024; // Bucket-Limit
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

interface Row {
  id: string;
  image_path: string;
  answers: Record<string, string>;
  aliases: string[];
  category: PixelCategory;
  difficulty: number;
  credit: string;
  source_url: string | null;
  is_active: boolean;
  created_at: string;
}

// Generierte Supabase-Typen hinken frischen Migrationen hinterher.
type AnyTable = {
  select: (c: string) => { order: (k: string, o: { ascending: boolean }) => Promise<{ data: Row[] | null; error: unknown }> };
  insert: (v: Record<string, unknown>) => Promise<{ error: { message?: string } | null }>;
  update: (v: Record<string, unknown>) => { eq: (k: string, val: unknown) => Promise<{ error: unknown }> };
  delete: () => { eq: (k: string, val: unknown) => Promise<{ error: unknown }> };
};
const db = () => (supabase.from as unknown as (t: string) => AnyTable)('pixel_images');

const EMPTY = {
  answerDe: '', answerEn: '', aliases: '', credit: '', sourceUrl: '',
  category: 'tiere' as PixelCategory, difficulty: 2,
};

type Banner = { kind: 'ok' | 'err'; text: string } | null;

export default function PixelImages() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState(false);
  const [filter, setFilter] = useState<PixelCategory | 'alle'>('alle');
  const [query, setQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- Daten ---------------------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db()
      .select('id,image_path,answers,aliases,category,difficulty,credit,source_url,is_active,created_at')
      .order('created_at', { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Object-URL sauber freigeben, sonst leckt jeder Dateiwechsel Speicher.
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // --- Validierung ---------------------------------------------------------
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!file) e.file = 'Bitte ein Bild auswählen.';
    if (!form.answerDe.trim()) e.answerDe = 'Die deutsche Antwort wird zum Raten gebraucht.';
    if (!form.credit.trim()) e.credit = 'Ohne Nachweis geht es nicht — er wird im Spiel angezeigt.';
    return e;
  }, [file, form.answerDe, form.credit]);

  const valid = Object.keys(errors).length === 0;

  const acceptFile = useCallback((f: File | null) => {
    setBanner(null);
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setBanner({ kind: 'err', text: 'Nur JPG, PNG oder WebP.' });
      return;
    }
    if (f.size > MAX_BYTES) {
      setBanner({ kind: 'err', text: `Datei ist ${(f.size / 1024 / 1024).toFixed(1)} MB groß — erlaubt sind 10 MB.` });
      return;
    }
    setFile(f);
  }, []);

  // --- Aktionen ------------------------------------------------------------
  const add = useCallback(async () => {
    setTouched(true);
    if (!valid || !file) return;
    setBusy(true);
    setBanner(null);
    try {
      const ext = (file.name.split('.').pop() || 'webp').toLowerCase();
      const path = `${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from('game-images').upload(path, file, { upsert: false });
      if (up.error) { setBanner({ kind: 'err', text: `Upload fehlgeschlagen: ${up.error.message}` }); return; }

      const answers: Record<string, string> = { de: form.answerDe.trim() };
      if (form.answerEn.trim()) answers.en = form.answerEn.trim();

      const { error } = await db().insert({
        image_path: path,
        answers,
        aliases: form.aliases.split(',').map((s) => s.trim()).filter(Boolean),
        category: form.category,
        difficulty: form.difficulty,
        credit: form.credit.trim(),
        source_url: form.sourceUrl.trim() || null,
        is_active: true,
      });
      if (error) {
        // Verwaiste Datei wieder entfernen, sonst sammelt sich Müll im Bucket.
        await supabase.storage.from('game-images').remove([path]).catch(() => {});
        setBanner({ kind: 'err', text: `Speichern fehlgeschlagen: ${error.message ?? ''}` });
        return;
      }

      // Kategorie beibehalten — man pflegt meist mehrere Motive am Stück.
      setForm({ ...EMPTY, category: form.category });
      setFile(null);
      setTouched(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await load();
      setBanner({ kind: 'ok', text: 'Motiv gespeichert.' });
    } finally {
      setBusy(false);
    }
  }, [valid, file, form, load]);

  const toggle = useCallback(async (r: Row) => {
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_active: !x.is_active } : x)));
    const { error } = await db().update({ is_active: !r.is_active }).eq('id', r.id);
    if (error) { setBanner({ kind: 'err', text: 'Umschalten fehlgeschlagen.' }); await load(); }
  }, [load]);

  const remove = useCallback(async (r: Row) => {
    setPendingDelete(null);
    setRows((prev) => prev.filter((x) => x.id !== r.id));
    await db().delete().eq('id', r.id);
    if (!r.image_path.startsWith('/') && !r.image_path.startsWith('http')) {
      await supabase.storage.from('game-images').remove([r.image_path]);
    }
    await load();
  }, [load]);

  // --- Abgeleitetes --------------------------------------------------------
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) c[r.category] = (c[r.category] ?? 0) + 1;
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== 'alle' && r.category !== filter) return false;
      if (!q) return true;
      return (
        (r.answers?.de ?? '').toLowerCase().includes(q) ||
        (r.answers?.en ?? '').toLowerCase().includes(q) ||
        r.credit.toLowerCase().includes(q)
      );
    });
  }, [rows, filter, query]);

  const activeCount = rows.filter((r) => r.is_active).length;

  const fieldBase =
    'w-full px-3 py-2.5 rounded-xl bg-[#12161d] border text-sm text-[#f1f3fc] placeholder:text-[#5c6270] ' +
    'outline-none transition-colors duration-200 focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/25';

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#f1f3fc]">
      {/* Kopf */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#0a0e14]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/games')}
            aria-label="Zurück zum Games Content Manager"
            className="p-2 rounded-xl hover:bg-white/5 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
          >
            <ArrowLeft className="w-5 h-5 text-[#a8abb3]" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-[#38BDF8] to-[#A78BFA] bg-clip-text text-transparent">
              PIXELJAGD — Bilder
            </h1>
            <p className="text-[11px] sm:text-xs text-[#a8abb3] mt-0.5">
              {rows.length} Motive · {activeCount} aktiv · {PIXEL_CATEGORIES.length} Kategorien
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] gap-6 items-start">

        {/* ---------------- Anlegen ---------------- */}
        <section className="lg:sticky lg:top-24 rounded-2xl border border-white/5 bg-[#131820] overflow-hidden w-full">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="font-bold flex items-center gap-2 text-sm">
              <ImagePlus className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" /> Neues Motiv
            </h2>
            <p className="text-xs text-[#a8abb3] mt-1 leading-relaxed">
              Das Bild wird hochgeladen, nicht verlinkt — nur so lässt es sich verpixeln.
            </p>
          </div>

          <div className="p-5 space-y-5">
            {/* Ablagefläche */}
            <div>
              <label htmlFor="pj-file" className="block text-xs font-semibold text-[#a8abb3] mb-2">
                Bild <span className="text-[#ff6b98]" aria-hidden="true">*</span>
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); acceptFile(e.dataTransfer.files?.[0] ?? null); }}
                className={`relative rounded-xl border-2 border-dashed transition-colors duration-200 ${
                  dragging ? 'border-[#38BDF8] bg-[#38BDF8]/10' : 'border-white/10 bg-[#12161d] hover:border-white/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="pj-file"
                  type="file"
                  accept={ACCEPTED.join(',')}
                  onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-describedby={touched && errors.file ? 'pj-file-err' : undefined}
                />
                {preview ? (
                  <div className="p-3">
                    {/* Live-Vorschau: exakt die Startstufe, die Spieler sehen. */}
                    <div className="grid grid-cols-2 gap-2">
                      <figure className="space-y-1">
                        <PixelCanvas src={preview} step={8} width={320} height={240}
                          className="w-full h-auto rounded-lg block" />
                        <figcaption className="text-[10px] text-[#a8abb3] text-center">So startet die Runde</figcaption>
                      </figure>
                      <figure className="space-y-1">
                        <img src={preview} alt="Vorschau des gewählten Motivs"
                          className="w-full aspect-[4/3] object-cover rounded-lg" />
                        <figcaption className="text-[10px] text-[#a8abb3] text-center">Auflösung</figcaption>
                      </figure>
                    </div>
                    <p className="text-[11px] text-[#a8abb3] mt-2 truncate">{file?.name}</p>
                  </div>
                ) : (
                  <div className="py-9 px-4 text-center pointer-events-none">
                    <Upload className="w-6 h-6 mx-auto text-[#5c6270]" aria-hidden="true" />
                    <p className="text-sm mt-2 font-medium">Bild hierher ziehen</p>
                    <p className="text-[11px] text-[#a8abb3] mt-0.5">oder klicken · JPG, PNG, WebP · max. 10 MB</p>
                  </div>
                )}
              </div>
              {touched && errors.file && (
                <p id="pj-file-err" role="alert" className="text-[11px] text-[#ff6b98] mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" aria-hidden="true" /> {errors.file}
                </p>
              )}
            </div>

            {/* Antworten */}
            <div className="space-y-3">
              <div>
                <label htmlFor="pj-de" className="block text-xs font-semibold text-[#a8abb3] mb-1.5">
                  Antwort — Deutsch <span className="text-[#ff6b98]" aria-hidden="true">*</span>
                </label>
                <input id="pj-de" className={`${fieldBase} ${touched && errors.answerDe ? 'border-[#ff6b98]' : 'border-white/10'}`}
                  placeholder="z. B. Löwe" value={form.answerDe}
                  aria-describedby={touched && errors.answerDe ? 'pj-de-err' : undefined}
                  onChange={(e) => setForm({ ...form, answerDe: e.target.value })} />
                {touched && errors.answerDe && (
                  <p id="pj-de-err" role="alert" className="text-[11px] text-[#ff6b98] mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" aria-hidden="true" /> {errors.answerDe}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="pj-en" className="block text-xs font-semibold text-[#a8abb3] mb-1.5">
                  Antwort — Englisch
                </label>
                <input id="pj-en" className={`${fieldBase} border-white/10`} placeholder="z. B. Lion"
                  value={form.answerEn} onChange={(e) => setForm({ ...form, answerEn: e.target.value })} />
              </div>

              <div>
                <label htmlFor="pj-alias" className="block text-xs font-semibold text-[#a8abb3] mb-1.5">
                  Weitere gültige Schreibweisen
                </label>
                <input id="pj-alias" className={`${fieldBase} border-white/10`} placeholder="Panthera leo, Königslöwe"
                  value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} />
                <p className="text-[11px] text-[#5c6270] mt-1">Mit Komma trennen. Tippfehler verzeiht das Spiel von allein.</p>
              </div>
            </div>

            {/* Nachweis */}
            <div className="rounded-xl border border-[#FDE047]/20 bg-[#FDE047]/5 p-3 space-y-3">
              <div>
                <label htmlFor="pj-credit" className="block text-xs font-semibold text-[#a8abb3] mb-1.5">
                  Bildnachweis <span className="text-[#ff6b98]" aria-hidden="true">*</span>
                </label>
                <input id="pj-credit" className={`${fieldBase} ${touched && errors.credit ? 'border-[#ff6b98]' : 'border-white/10'}`}
                  placeholder="z. B. Jane Doe / CC BY 4.0" value={form.credit}
                  aria-describedby={touched && errors.credit ? 'pj-credit-err' : 'pj-credit-hint'}
                  onChange={(e) => setForm({ ...form, credit: e.target.value })} />
                {touched && errors.credit ? (
                  <p id="pj-credit-err" role="alert" className="text-[11px] text-[#ff6b98] mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" aria-hidden="true" /> {errors.credit}
                  </p>
                ) : (
                  <p id="pj-credit-hint" className="text-[11px] text-[#a8abb3] mt-1">
                    Wird den Spielern beim Auflösen angezeigt.
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="pj-src" className="block text-xs font-semibold text-[#a8abb3] mb-1.5">Quell-Link</label>
                <input id="pj-src" type="url" className={`${fieldBase} border-white/10`} placeholder="https://…"
                  value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} />
              </div>
            </div>

            {/* Kategorie */}
            <div>
              <span className="block text-xs font-semibold text-[#a8abb3] mb-2">Kategorie</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Kategorie wählen">
                {PIXEL_CATEGORIES.map((c) => {
                  const on = form.category === c;
                  return (
                    <button key={c} type="button" onClick={() => setForm({ ...form, category: c })}
                      aria-pressed={on}
                      className={`px-3 min-h-[36px] rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#38BDF8] ${
                        on ? 'bg-[#38BDF8] text-[#0a0e14]' : 'bg-[#12161d] text-[#a8abb3] hover:text-[#f1f3fc] border border-white/10'
                      }`}>
                      {CATEGORY_LABEL[c]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schwierigkeit */}
            <div>
              <span className="block text-xs font-semibold text-[#a8abb3] mb-2">Schwierigkeit</span>
              <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Schwierigkeit wählen">
                {[1, 2, 3].map((d) => {
                  const on = form.difficulty === d;
                  return (
                    <button key={d} type="button" onClick={() => setForm({ ...form, difficulty: d })}
                      aria-pressed={on}
                      className={`min-h-[40px] rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#38BDF8] ${
                        on ? 'bg-[#A78BFA] text-[#0a0e14]' : 'bg-[#12161d] text-[#a8abb3] hover:text-[#f1f3fc] border border-white/10'
                      }`}>
                      {DIFFICULTY_LABEL[d]}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={() => void add()} disabled={busy}
              className="w-full min-h-[48px] rounded-xl font-bold text-sm bg-gradient-to-r from-[#38BDF8] to-[#A78BFA] text-[#0a0e14] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-opacity duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#38BDF8] focus:ring-offset-2 focus:ring-offset-[#131820]">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Wird gespeichert…</> : 'Motiv hinzufügen'}
            </button>

            <AnimatePresence>
              {banner && (
                <motion.p
                  role={banner.kind === 'err' ? 'alert' : 'status'}
                  initial={reduce ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-xs flex items-center gap-1.5 ${banner.kind === 'ok' ? 'text-[#4ade80]' : 'text-[#ff6b98]'}`}
                >
                  {banner.kind === 'ok'
                    ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    : <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                  {banner.text}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ---------------- Sammlung ---------------- */}
        <section className="min-w-0">
          {/* Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5c6270] pointer-events-none" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nach Antwort oder Nachweis suchen…"
                aria-label="Motive durchsuchen"
                className={`${fieldBase} border-white/10 pl-9`}
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mb-1">
              <button onClick={() => setFilter('alle')} aria-pressed={filter === 'alle'}
                className={`px-3 min-h-[36px] shrink-0 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#38BDF8] ${
                  filter === 'alle' ? 'bg-white/10 text-[#f1f3fc]' : 'text-[#a8abb3] hover:text-[#f1f3fc]'
                }`}>
                Alle {rows.length > 0 && <span className="opacity-60">({rows.length})</span>}
              </button>
              {PIXEL_CATEGORIES.map((c) => (
                <button key={c} onClick={() => setFilter(c)} aria-pressed={filter === c}
                  className={`px-3 min-h-[36px] shrink-0 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#38BDF8] ${
                    filter === c ? 'bg-white/10 text-[#f1f3fc]' : 'text-[#a8abb3] hover:text-[#f1f3fc]'
                  }`}>
                  {CATEGORY_LABEL[c]} <span className="opacity-60">({counts[c] ?? 0})</span>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3" aria-busy="true" aria-label="Motive werden geladen">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-2xl border border-white/5 bg-[#131820] overflow-hidden">
                  <div className="aspect-[4/3] bg-white/5 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3.5 w-2/3 bg-white/5 rounded animate-pulse" />
                    <div className="h-3 w-1/3 bg-white/5 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#131820] py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#38BDF8]/20 to-[#A78BFA]/20 flex items-center justify-center mx-auto">
                <ImageOff className="w-7 h-7 text-[#38BDF8]" aria-hidden="true" />
              </div>
              <h3 className="font-bold mt-4">Noch keine Motive</h3>
              <p className="text-sm text-[#a8abb3] mt-1.5 max-w-sm mx-auto leading-relaxed">
                Pixeljagd lässt sich erst starten, wenn hier mindestens ein Bild liegt.
                Lade links das erste hoch — die Vorschau zeigt dir sofort, wie schwer es zu erraten sein wird.
              </p>
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#131820] py-14 px-6 text-center">
              <p className="text-sm text-[#a8abb3]">Kein Motiv passt zu dieser Suche.</p>
              <button onClick={() => { setQuery(''); setFilter('alle'); }}
                className="mt-3 text-xs font-semibold text-[#38BDF8] hover:underline cursor-pointer">
                Filter zurücksetzen
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {visible.map((r) => (
                  <motion.article
                    key={r.id}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-2xl border overflow-hidden bg-[#131820] transition-colors duration-200 ${
                      r.is_active ? 'border-white/5' : 'border-white/5 opacity-55'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={resolveImageUrl(r.image_path)}
                        alt={`Motiv: ${r.answers?.de ?? 'ohne Antwort'}`}
                        loading="lazy"
                        className="w-full aspect-[4/3] object-cover"
                      />
                      <span className="absolute top-2 left-2 px-2 py-1 rounded-lg text-[10px] font-bold bg-[#0a0e14]/80 backdrop-blur-sm text-[#38BDF8]">
                        {CATEGORY_LABEL[r.category]}
                      </span>
                      {!r.is_active && (
                        <span className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[10px] font-bold bg-[#0a0e14]/80 backdrop-blur-sm text-[#a8abb3]">
                          Inaktiv
                        </span>
                      )}
                    </div>

                    <div className="p-3">
                      <h3 className="font-bold text-sm truncate">{r.answers?.de}</h3>
                      <p className="text-[11px] text-[#a8abb3] mt-0.5">
                        {DIFFICULTY_LABEL[r.difficulty] ?? '—'}
                        {r.answers?.en && <> · {r.answers.en}</>}
                      </p>
                      <p className="text-[11px] text-[#a8abb3] mt-2 break-words leading-snug">
                        <span className="text-[#5c6270]">Nachweis:</span> {r.credit}
                        {r.source_url && (
                          <a href={r.source_url} target="_blank" rel="noopener noreferrer"
                            className="ml-1 inline-flex items-center gap-0.5 text-[#38BDF8] hover:underline cursor-pointer">
                            Quelle <ExternalLink className="w-3 h-3" aria-hidden="true" />
                          </a>
                        )}
                      </p>

                      <div className="flex gap-1.5 mt-3">
                        <button onClick={() => void toggle(r)}
                          aria-label={r.is_active ? `${r.answers?.de} deaktivieren` : `${r.answers?.de} aktivieren`}
                          className="flex-1 min-h-[36px] inline-flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold bg-[#12161d] border border-white/10 text-[#a8abb3] hover:text-[#f1f3fc] hover:border-white/20 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#38BDF8]">
                          {r.is_active
                            ? <><Eye className="w-3.5 h-3.5" aria-hidden="true" /> Aktiv</>
                            : <><EyeOff className="w-3.5 h-3.5" aria-hidden="true" /> Inaktiv</>}
                        </button>
                        <button onClick={() => setPendingDelete(r)}
                          aria-label={`${r.answers?.de} löschen`}
                          className="min-h-[36px] px-3 inline-flex items-center justify-center rounded-lg bg-[#12161d] border border-white/10 text-[#ff6b98] hover:border-[#ff6b98]/40 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ff6b98]">
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>

      {/* Löschbestätigung — window.confirm blockiert und sieht auf Mobil grausam aus. */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
            role="dialog" aria-modal="true" aria-labelledby="pj-del-title"
            onClick={() => setPendingDelete(null)}
          >
            <motion.div
              initial={reduce ? false : { scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-[#131820] border border-white/10 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 id="pj-del-title" className="font-bold">Motiv löschen?</h2>
                <button onClick={() => setPendingDelete(null)} aria-label="Abbrechen"
                  className="p-1 rounded-lg hover:bg-white/5 cursor-pointer">
                  <X className="w-4 h-4 text-[#a8abb3]" aria-hidden="true" />
                </button>
              </div>
              <p className="text-sm text-[#a8abb3] mt-2 leading-relaxed">
                „{pendingDelete.answers?.de}" wird samt Bilddatei entfernt. Das lässt sich nicht rückgängig machen.
                Wenn du es nur vorübergehend aus dem Spiel nehmen willst, stelle es stattdessen auf <em>inaktiv</em>.
              </p>
              <div className="flex gap-2 mt-4">
                <button onClick={() => setPendingDelete(null)}
                  className="flex-1 min-h-[44px] rounded-xl text-sm font-semibold bg-[#12161d] border border-white/10 text-[#f1f3fc] hover:border-white/20 transition-colors duration-200 cursor-pointer">
                  Abbrechen
                </button>
                <button onClick={() => void remove(pendingDelete)}
                  className="flex-1 min-h-[44px] rounded-xl text-sm font-bold bg-[#ff6b98] text-[#0a0e14] hover:opacity-90 transition-opacity duration-200 cursor-pointer">
                  Löschen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
