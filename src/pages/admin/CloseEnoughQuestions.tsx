/**
 * CLOSE ENOUGH — Fragenpflege.
 *
 * Zwei Dinge unterscheiden diese Seite von den bisherigen Inhaltsseiten, und
 * beide sind der Grund, warum sie überhaupt eigenständig ist:
 *
 * 1. DER FRAGETEXT EXISTIERT NICHT. Gespeichert sind nur ein Vorlagen-
 *    schlüssel und der Name des Gegenstands je Sprache; der Satz entsteht erst
 *    beim Rendern. Ohne eine Vorschau in allen zehn Sprachen pflegt man
 *    blind — man sieht nie, was der Spieler am Ende liest.
 *
 * 2. DIE TOLERANZ IST UNANSCHAULICH. „10 %" sagt niemandem etwas,
 *    „2.250.000 bis 2.750.000" schon. Besonders bei Jahreszahlen: Drei Prozent
 *    von 1889 sind ±57 Jahre, der Volltreffer-Bonus wäre damit geschenkt.
 *    Deshalb steht der Bereich immer ausgeschrieben da, und bei Jahresfragen
 *    warnt die Seite ausdrücklich.
 *
 * Übernommen aus den Schwesterseiten: seitenweises Laden gegen den
 * 1000-Zeilen-Deckel (`OhrwurmSongs`), Massenaktionen in 200er-Blöcken,
 * Flaggenraster und Lösch-Dialog (`PixelImages`).
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  Edit3,
  Target,
  Check,
  X,
  Power,
  AlertTriangle,
  Languages as LanguagesIcon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import i18n, { loadLocale } from '@/i18n';
import { formatNumber, parseNumber } from '@/games/closeenough/number-format';
import {
  formatAnswer,
  CE_CATEGORIES,
  CE_FRAMES,
  CE_UNITS,
  CE_UNIT_KEYS,
  CUSTOM_FRAME,
  FRAME_KEY_RE,
} from '@/games/closeenough/closeenough-content';

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

const CATEGORY_LABEL: Record<string, string> = {
  laender: 'Länder & Städte',
  bauwerke: 'Bauwerke',
  natur: 'Natur',
  tierwelt: 'Tierwelt',
  sport: 'Sport',
  technik: 'Technik',
  alltag: 'Alltag',
};

interface QuestionRow {
  id: string;
  name_i18n: Record<string, string> | null;
  question_i18n: Record<string, string> | null;
  frame_key: string;
  answer: number | string;
  unit_key: string;
  category: string;
  tolerance_pct: number | string;
  as_of_year: number | null;
  difficulty: number | null;
  source_label: string;
  source_url: string | null;
  languages: string[];
  is_active: boolean;
  wikidata_qid: string | null;
}

type Form = Omit<QuestionRow, 'id' | 'answer' | 'tolerance_pct'> & {
  answer: string;
  tolerance_pct: string;
};

const EMPTY: Form = {
  name_i18n: {},
  question_i18n: null,
  frame_key: 'population',
  answer: '',
  unit_key: 'people',
  category: 'laender',
  tolerance_pct: '15',
  as_of_year: null,
  difficulty: 2,
  source_label: '',
  source_url: '',
  languages: ['*'],
  is_active: true,
  wikidata_qid: null,
};

/** Wie viele Karten gleichzeitig gerendert werden. */
const PAGE = 100;

// Die generierten Supabase-Typen hinken frischen Migrationen hinterher —
// gleiche Umgehung wie in OhrwurmSongs.tsx.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => (supabase.from as never as (t: string) => any)('closeenough_questions');

/**
 * Zahleneingabe mit Tausenderpunkten, ohne dass der Cursor ans Ende springt.
 *
 * Der Kniff: Gemerkt wird die ZIFFERNPOSITION, nicht die Zeichenposition.
 * Sobald beim Tippen ein Tausenderpunkt entsteht, verschiebt sich jede
 * Zeichenposition hinter ihm um eins — setzt man den Cursor auf die alte
 * Zeichenposition zurück, wandert er sichtbar. Ohne diese Behandlung ließe
 * sich eine siebenstellige Zahl nicht mehr in der Mitte korrigieren, man
 * müsste sie neu tippen.
 */
function GroupedNumberInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  const caretRef = useRef<number | null>(null);

  // Nach jedem Rendern den Cursor auf die gemerkte Ziffernposition setzen.
  useEffect(() => {
    const el = ref.current;
    const digits = caretRef.current;
    if (!el || digits === null) return;
    caretRef.current = null;

    let seen = 0;
    let pos = el.value.length;
    if (digits === 0) {
      pos = 0;
    } else {
      for (let i = 0; i < el.value.length; i++) {
        if (/\d/.test(el.value[i])) {
          seen++;
          if (seen === digits) {
            pos = i + 1;
            break;
          }
        }
      }
    }
    el.setSelectionRange(pos, pos);
  }, [value]);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    // Wie viele Ziffern stehen VOR dem Cursor? Das ist der Anker, der eine
    // neu eingefügte Gruppierung überlebt.
    caretRef.current = el.value.slice(0, caret).replace(/\D/g, '').length;

    // Nur Ziffern, ein Minus am Anfang und ein Komma als Dezimaltrenner.
    const cleaned = el.value
      .replace(/\./g, '')
      .replace(/[^\d,-]/g, '')
      .replace(/(?!^)-/g, '')
      .replace(/,(?=[^,]*,)/g, '');
    onChange(cleaned);
  };

  // Anzeige gruppiert, der gespeicherte Wert bleibt roh.
  const shown = useMemo(() => {
    if (!value) return '';
    const negative = value.startsWith('-');
    const body = negative ? value.slice(1) : value;
    const commaAt = body.indexOf(',');
    const whole = commaAt >= 0 ? body.slice(0, commaAt) : body;
    const frac = commaAt >= 0 ? body.slice(commaAt + 1) : null;
    const n = Number(whole);
    if (!Number.isFinite(n)) return value;
    const grouped = formatNumber(n, 'de', 0);
    return (negative ? '-' : '') + grouped + (frac !== null ? ',' + frac : '');
  }, [value]);

  return (
    <input
      ref={ref}
      value={shown}
      onChange={handle}
      placeholder={placeholder}
      inputMode="decimal"
      className={className}
    />
  );
}

export default function CloseEnoughQuestions() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [filterFrame, setFilterFrame] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [bulkBusy, setBulkBusy] = useState(false);

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [probe, setProbe] = useState('');

  /** Alle Sprachfassungen geladen? Sonst zeigt die Vorschau still Englisch. */
  const [localesReady, setLocalesReady] = useState(false);

  useEffect(() => {
    void Promise.all(LANGS.map((l) => loadLocale(l.code))).then(() => setLocalesReady(true));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    // Seitenweise. `.limit()` reicht NICHT: Supabase deckelt die REST-API
    // projektweit bei 1000 Zeilen, von 864 Fragen fehlten sonst still welche.
    const CHUNK = 1000;
    const all: QuestionRow[] = [];
    for (let from = 0; ; from += CHUNK) {
      const { data, error } = await db()
        .select('*')
        .order('category', { ascending: true })
        .range(from, from + CHUNK - 1);
      if (error) {
        toast.error('Laden fehlgeschlagen: ' + error.message);
        break;
      }
      const chunk = (data ?? []) as QuestionRow[];
      all.push(...chunk);
      if (chunk.length < CHUNK) break;
    }
    setRows(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterCategory && r.category !== filterCategory) return false;
      if (filterFrame && r.frame_key !== filterFrame) return false;
      if (filterState === 'active' && !r.is_active) return false;
      if (filterState === 'inactive' && r.is_active) return false;
      if (filterLang) {
        const langs = r.languages?.length ? r.languages : ['*'];
        if (filterLang === '*') {
          if (!langs.includes('*')) return false;
        } else if (!langs.includes(filterLang) && !langs.includes('*')) return false;
      }
      if (!s) return true;
      const name = (r.name_i18n?.de ?? '').toLowerCase();
      const question = (r.question_i18n?.de ?? '').toLowerCase();
      return name.includes(s) || question.includes(s) || r.source_label.toLowerCase().includes(s);
    });
  }, [rows, search, filterCategory, filterFrame, filterLang, filterState]);

  const visible = useMemo(() => filtered.slice(0, page * PAGE), [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search, filterCategory, filterFrame, filterLang, filterState]);

  /** Den fertigen Fragesatz in einer bestimmten Sprache erzeugen. */
  const renderQuestion = useCallback(
    (
      row: Pick<QuestionRow, 'frame_key' | 'name_i18n' | 'question_i18n' | 'as_of_year'>,
      code: string,
    ) => {
      const fixed = i18n.getFixedT(code);
      if (row.frame_key === CUSTOM_FRAME) {
        return row.question_i18n?.[code] ?? row.question_i18n?.de ?? '—';
      }
      const name = row.name_i18n?.[code] ?? row.name_i18n?.de ?? '';
      if (!name) return '—';
      const base = fixed(`games.closeenough.frames.${row.frame_key}`, { name }) as string;
      if (!row.as_of_year) return base;
      return `${base} ${fixed('games.closeenough.asOf', { year: row.as_of_year })}`;
    },
    [],
  );

  // --- Formular -------------------------------------------------------------
  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY });
    setProbe('');
    setModal(true);
  };

  const openEdit = (r: QuestionRow) => {
    setEditId(r.id);
    setForm({
      name_i18n: r.name_i18n ?? {},
      question_i18n: r.question_i18n,
      frame_key: r.frame_key,
      answer: String(r.answer).replace('.', ','),
      unit_key: r.unit_key,
      category: r.category,
      tolerance_pct: String(r.tolerance_pct).replace('.', ','),
      as_of_year: r.as_of_year,
      difficulty: r.difficulty ?? 2,
      source_label: r.source_label,
      source_url: r.source_url ?? '',
      languages: r.languages?.length ? r.languages : ['*'],
      is_active: r.is_active,
      wikidata_qid: r.wikidata_qid,
    });
    setProbe('');
    setModal(true);
  };

  const isCustom = form.frame_key === CUSTOM_FRAME;
  const answerNum = parseNumber(form.answer, 'de');
  const toleranceNum = parseNumber(form.tolerance_pct, 'de');
  const probeNum = parseNumber(probe, 'de');

  /** Der Bereich, in dem es den Volltreffer-Bonus gibt. */
  const band = useMemo(() => {
    if (answerNum === null || toleranceNum === null) return null;
    const delta = Math.abs(answerNum) * (toleranceNum / 100);
    return { from: answerNum - delta, to: answerNum + delta, delta };
  }, [answerNum, toleranceNum]);

  const yearWarning = form.unit_key === 'year' && band !== null && band.delta > 5;

  /** Vorlagenwechsel füllt Einheit, Toleranz und Kategorie vor. */
  const pickFrame = (key: string) => {
    if (key === CUSTOM_FRAME) {
      setForm((f) => ({
        ...f,
        frame_key: CUSTOM_FRAME,
        question_i18n: f.question_i18n ?? {},
        category: 'alltag',
      }));
      return;
    }
    const def = CE_FRAMES[key];
    setForm((f) => ({
      ...f,
      frame_key: key,
      question_i18n: null,
      unit_key: def?.unit ?? f.unit_key,
      tolerance_pct: def ? String(def.tol).replace('.', ',') : f.tolerance_pct,
      category: def?.category ?? f.category,
    }));
  };

  const save = async () => {
    if (form.frame_key !== CUSTOM_FRAME && !FRAME_KEY_RE.test(form.frame_key)) {
      toast.error('Ungültiger Vorlagenschlüssel');
      return;
    }
    if (answerNum === null) {
      toast.error('Die Antwort fehlt');
      return;
    }
    if (toleranceNum === null || toleranceNum <= 0 || toleranceNum > 100) {
      toast.error('Die Toleranz muss zwischen 0 und 100 liegen');
      return;
    }
    if (!form.source_label.trim()) {
      toast.error('Der Beleg ist Pflicht');
      return;
    }
    if (!form.languages.length) {
      toast.error('Mindestens eine Sprachfassung wählen');
      return;
    }
    if (isCustom) {
      if (!form.question_i18n?.de?.trim()) {
        toast.error('Der deutsche Fragesatz fehlt');
        return;
      }
    } else if (!form.name_i18n?.de?.trim()) {
      toast.error('Der deutsche Name fehlt');
      return;
    }
    // Spiegelt closeenough_answer_sign_check — sonst lehnt die Datenbank das
    // INSERT mit einer Meldung ab, die niemand versteht.
    if (answerNum <= 0 && form.unit_key !== 'year') {
      toast.error('Nur Jahreszahlen dürfen null oder negativ sein');
      return;
    }

    const payload = {
      name_i18n: isCustom ? {} : form.name_i18n,
      question_i18n: isCustom ? form.question_i18n : null,
      frame_key: form.frame_key,
      answer: answerNum,
      unit_key: form.unit_key,
      category: form.category,
      tolerance_pct: toleranceNum,
      as_of_year: form.as_of_year,
      difficulty: form.difficulty ?? 2,
      source_label: form.source_label.trim(),
      source_url: form.source_url?.trim() || null,
      languages: form.languages,
      is_active: form.is_active,
    };

    const { error } = editId
      ? await db().update(payload).eq('id', editId)
      : await db().insert(payload);

    if (error) {
      toast.error('Speichern fehlgeschlagen: ' + error.message);
      return;
    }
    toast.success(editId ? 'Gespeichert' : 'Angelegt');
    setModal(false);
    void load();
  };

  const remove = async () => {
    if (!deleteId) return;
    const { error } = await db().delete().eq('id', deleteId);
    if (error) {
      toast.error('Löschen fehlgeschlagen: ' + error.message);
      return;
    }
    toast.success('Gelöscht');
    setDeleteId(null);
    void load();
  };

  const toggleActive = async (r: QuestionRow) => {
    const { error } = await db().update({ is_active: !r.is_active }).eq('id', r.id);
    if (error) {
      toast.error('Fehlgeschlagen: ' + error.message);
      return;
    }
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_active: !x.is_active } : x)));
  };

  /** Alle GEFILTERTEN Fragen auf einmal schalten — der eigentliche Arbeitsschritt. */
  const bulkSetActive = async (active: boolean) => {
    const ids = filtered.filter((r) => r.is_active !== active).map((r) => r.id);
    if (ids.length === 0) {
      toast.info('Nichts zu ändern');
      return;
    }
    if (!confirm(`${ids.length} Fragen ${active ? 'aktivieren' : 'deaktivieren'}?`)) return;
    setBulkBusy(true);
    // In Blöcken, damit die URL-Länge des IN-Filters nicht überläuft.
    for (let i = 0; i < ids.length; i += 200) {
      const { error } = await db().update({ is_active: active }).in('id', ids.slice(i, i + 200));
      if (error) {
        toast.error('Fehlgeschlagen: ' + error.message);
        break;
      }
    }
    setBulkBusy(false);
    void load();
  };

  const inputCls =
    'w-full px-3 py-2 rounded-xl bg-[#151a21] border border-white/10 text-sm text-[#f1f3fc] outline-none focus:border-[#FBBF24]/50';

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#f1f3fc] font-game">
      {/* Kopf */}
      <div className="border-b border-white/5 px-6 py-4 sticky top-0 z-20 bg-[#0a0e14]/95 backdrop-blur">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/games')}
            className="p-2 rounded-xl hover:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5 text-[#a8abb3]" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold flex items-center gap-2">
              <Target className="w-5 h-5 text-[#FBBF24]" />
              <span className="bg-gradient-to-r from-[#FBBF24] to-[#34D399] bg-clip-text text-transparent">
                NAH DRAN — Schätzfragen
              </span>
            </h1>
            <p className="text-xs text-[#a8abb3] mt-0.5">
              {rows.length} Fragen · {filtered.length} gefiltert ·{' '}
              {rows.filter((r) => r.is_active).length} aktiv
            </p>
          </div>
          <button
            onClick={() => void bulkSetActive(true)}
            disabled={bulkBusy}
            className="px-3 py-2 rounded-xl text-[11px] font-bold bg-[#1b2028] border border-white/5 text-[#34D399] disabled:opacity-50"
          >
            Alle gefilterten an
          </button>
          <button
            onClick={() => void bulkSetActive(false)}
            disabled={bulkBusy}
            className="px-3 py-2 rounded-xl text-[11px] font-bold bg-[#1b2028] border border-white/5 text-[#FB7185] disabled:opacity-50"
          >
            Alle gefilterten aus
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#FBBF24] to-[#34D399] text-[#0B1120]"
          >
            <Plus className="w-4 h-4" /> Frage anlegen
          </button>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#a8abb3]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, Frage oder Beleg …"
              className="pl-9 pr-3 py-2 rounded-xl bg-[#151a21] border border-white/10 text-xs w-64 outline-none"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#151a21] border border-white/10 text-xs"
          >
            <option value="">Alle Kategorien</option>
            {CE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <select
            value={filterFrame}
            onChange={(e) => setFilterFrame(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#151a21] border border-white/10 text-xs"
          >
            <option value="">Alle Vorlagen</option>
            <option value={CUSTOM_FRAME}>Freitext (Alltag)</option>
            {Object.keys(CE_FRAMES).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <select
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#151a21] border border-white/10 text-xs"
          >
            <option value="">Alle Sprachen</option>
            <option value="*">Nur „überall"</option>
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value as typeof filterState)}
            className="px-3 py-2 rounded-xl bg-[#151a21] border border-white/10 text-xs"
          >
            <option value="all">Alle</option>
            <option value="active">Nur aktive</option>
            <option value="inactive">Nur inaktive</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#FBBF24] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              {visible.map((r) => {
                const answer = Number(r.answer);
                const langs = r.languages?.length ? r.languages : ['*'];
                return (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-white/5 bg-[#111720] px-4 py-3 flex items-center gap-4"
                    style={{ opacity: r.is_active ? 1 : 0.45 }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{renderQuestion(r, 'de')}</p>
                      <p className="text-[11px] text-[#a8abb3] mt-0.5">
                        {CATEGORY_LABEL[r.category] ?? r.category} · {r.frame_key} · Toleranz{' '}
                        {String(r.tolerance_pct)} % · {r.source_label}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black tabular-nums text-[#34D399]">
                        {formatAnswer(answer, r.unit_key, 'de')}
                      </p>
                      <p className="text-[10px] text-[#a8abb3]">{r.unit_key}</p>
                    </div>
                    <div className="text-[10px] text-[#a8abb3] w-24 text-center shrink-0">
                      {langs.includes('*')
                        ? '🌍 alle'
                        : langs.map((c) => LANGS.find((l) => l.code === c)?.flag ?? c).join('')}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => void toggleActive(r)}
                        className="p-2 rounded-lg hover:bg-white/5"
                        title={r.is_active ? 'Deaktivieren' : 'Aktivieren'}
                      >
                        <Power
                          className="w-4 h-4"
                          style={{ color: r.is_active ? '#34D399' : '#a8abb3' }}
                        />
                      </button>
                      <button
                        onClick={() => openEdit(r)}
                        className="p-2 rounded-lg hover:bg-white/5"
                        title="Bearbeiten"
                      >
                        <Edit3 className="w-4 h-4 text-[#a8abb3]" />
                      </button>
                      <button
                        onClick={() => setDeleteId(r.id)}
                        className="p-2 rounded-lg hover:bg-white/5"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4 text-[#FB7185]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {visible.length < filtered.length && (
              <button
                onClick={() => setPage((p) => p + 1)}
                className="mt-4 w-full py-3 rounded-2xl bg-[#151a21] border border-white/5 text-sm font-bold text-[#a8abb3]"
              >
                Weitere {Math.min(PAGE, filtered.length - visible.length)} anzeigen
              </button>
            )}
          </>
        )}
      </div>

      {/* Bearbeiten */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto p-6">
          <div className="w-full max-w-3xl rounded-3xl bg-[#111720] border border-white/10 p-6 my-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black">{editId ? 'Frage bearbeiten' : 'Neue Frage'}</h2>
              <button onClick={() => setModal(false)} className="p-2 rounded-lg hover:bg-white/5">
                <X className="w-5 h-5 text-[#a8abb3]" />
              </button>
            </div>

            {/* Vorlage oder Freitext */}
            <label className="block text-[11px] font-bold text-[#a8abb3] mb-1">Vorlage</label>
            <select
              value={form.frame_key}
              onChange={(e) => pickFrame(e.target.value)}
              className={inputCls}
            >
              <option value={CUSTOM_FRAME}>
                Freitext — ganzer Satz je Sprache (für „Alltag")
              </option>
              {Object.entries(CE_FRAMES).map(([k, def]) => (
                <option key={k} value={k}>
                  {k} — {def.unit}, {def.tol} %
                </option>
              ))}
            </select>
            {isCustom && (
              <p className="text-[11px] text-[#FBBF24] mt-1">
                Wikidata kann die Kategorie „Alltag" nicht liefern — diese Fragen entstehen
                ausschließlich hier.
              </p>
            )}

            {/* Namen bzw. Sätze je Sprache */}
            <div className="mt-4">
              <label className="block text-[11px] font-bold text-[#a8abb3] mb-1">
                {isCustom ? 'Fragesatz je Sprache' : 'Name des Gegenstands je Sprache'}
                <span className="text-[#FB7185]"> · Deutsch ist Pflicht</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LANGS.map((l) => {
                  const store = isCustom ? (form.question_i18n ?? {}) : (form.name_i18n ?? {});
                  return (
                    <div key={l.code} className="flex items-center gap-2">
                      <span className="w-6 text-center">{l.flag}</span>
                      <input
                        value={store[l.code] ?? ''}
                        onChange={(e) => {
                          const next = { ...store, [l.code]: e.target.value };
                          if (!e.target.value) delete next[l.code];
                          setForm((f) =>
                            isCustom ? { ...f, question_i18n: next } : { ...f, name_i18n: next },
                          );
                        }}
                        placeholder={l.name}
                        className={inputCls}
                        dir={l.code === 'ar' ? 'rtl' : 'ltr'}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Antwort, Einheit, Toleranz */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-[#a8abb3] mb-1">Antwort</label>
                <GroupedNumberInput
                  value={form.answer}
                  onChange={(v) => setForm((f) => ({ ...f, answer: v }))}
                  placeholder="2.500.000"
                  className={inputCls + ' tabular-nums'}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#a8abb3] mb-1">Einheit</label>
                <select
                  value={form.unit_key}
                  onChange={(e) => setForm((f) => ({ ...f, unit_key: e.target.value }))}
                  className={inputCls}
                >
                  {CE_UNIT_KEYS.map((u) => (
                    <option key={u} value={u}>
                      {u} ({CE_UNITS[u]})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#a8abb3] mb-1">
                  Toleranz in %
                </label>
                <input
                  value={form.tolerance_pct}
                  onChange={(e) => setForm((f) => ({ ...f, tolerance_pct: e.target.value }))}
                  className={inputCls + ' tabular-nums'}
                  inputMode="decimal"
                />
              </div>
            </div>

            {/*
              Toleranz-Vorschau. „10 %" ist eine Zahl ohne Anschauung; der
              ausgeschriebene Bereich ist eine Aussage. Der Testtipp beantwortet
              die Frage, die man sich beim Pflegen tatsächlich stellt: „wäre
              2.000.000 noch drin?"
            */}
            {band && (
              <div className="mt-3 rounded-2xl border border-white/5 bg-[#151a21] p-3">
                <p className="text-[11px] font-bold text-[#a8abb3] mb-1">
                  Volltreffer-Bonus gibt es zwischen
                </p>
                <p className="text-sm font-black tabular-nums text-[#34D399]">
                  {formatNumber(band.from, 'de', 2)} — {formatNumber(band.to, 'de', 2)}
                  <span className="text-[#a8abb3] font-normal">
                    {' '}
                    (±{formatNumber(band.delta, 'de', 2)})
                  </span>
                </p>

                {yearWarning && (
                  <p className="mt-2 text-[11px] text-[#FB7185] flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Bei Jahreszahlen ist ein Prozentsatz riesig: Das sind ±
                    {Math.round(band.delta)} Jahre. Der Bonus wäre praktisch geschenkt — 0,15 %
                    entsprechen rund ±3 Jahren.
                  </p>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[11px] text-[#a8abb3]">Testtipp:</span>
                  <GroupedNumberInput
                    value={probe}
                    onChange={setProbe}
                    placeholder="2.000.000"
                    className="px-3 py-1.5 rounded-lg bg-[#0a0e14] border border-white/10 text-xs w-40 tabular-nums outline-none"
                  />
                  {probeNum !== null && answerNum !== null && (
                    <span
                      className="text-xs font-bold"
                      style={{
                        color: probeNum >= band.from && probeNum <= band.to ? '#FDE047' : '#a8abb3',
                      }}
                    >
                      {probeNum >= band.from && probeNum <= band.to
                        ? '✓ im Bonus'
                        : `${formatNumber(
                            (Math.abs(probeNum - answerNum) / Math.max(Math.abs(answerNum), 1)) *
                              100,
                            'de',
                            1,
                          )} % daneben`}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Kategorie, Bezugsjahr, Schwierigkeit */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-[#a8abb3] mb-1">Kategorie</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className={inputCls}
                >
                  {CE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#a8abb3] mb-1">
                  Bezugsjahr (optional)
                </label>
                <input
                  value={form.as_of_year ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      as_of_year: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  placeholder="2024"
                  inputMode="numeric"
                  className={inputCls + ' tabular-nums'}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#a8abb3] mb-1">
                  Schwierigkeit
                </label>
                <select
                  value={form.difficulty ?? 2}
                  onChange={(e) => setForm((f) => ({ ...f, difficulty: Number(e.target.value) }))}
                  className={inputCls}
                >
                  <option value={1}>1 — leicht</option>
                  <option value={2}>2 — mittel</option>
                  <option value={3}>3 — schwer</option>
                </select>
              </div>
            </div>

            {/* Beleg */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-[#a8abb3] mb-1">
                  Beleg <span className="text-[#FB7185]">· Pflicht</span>
                </label>
                <input
                  value={form.source_label}
                  onChange={(e) => setForm((f) => ({ ...f, source_label: e.target.value }))}
                  placeholder="Statistisches Bundesamt"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#a8abb3] mb-1">
                  Quell-Adresse (optional)
                </label>
                <input
                  value={form.source_url ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))}
                  placeholder="https://…"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Sprachfassungen */}
            <div className="mt-4">
              <label className="block text-[11px] font-bold text-[#a8abb3] mb-1">
                <LanguagesIcon className="w-3.5 h-3.5 inline mr-1" />
                In welchen Sprachfassungen erscheint die Frage?
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setForm((f) => ({ ...f, languages: ['*'] }))}
                  className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{
                    background: form.languages.includes('*') ? '#34D399' : '#151a21',
                    color: form.languages.includes('*') ? '#0B1120' : '#a8abb3',
                  }}
                >
                  🌍 überall
                </button>
                {LANGS.map((l) => {
                  const on = form.languages.includes(l.code);
                  return (
                    <button
                      key={l.code}
                      onClick={() =>
                        setForm((f) => {
                          const without = f.languages.filter((c) => c !== '*' && c !== l.code);
                          return { ...f, languages: on ? without : [...without, l.code] };
                        })
                      }
                      className="px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{
                        background: on ? '#FBBF24' : '#151a21',
                        color: on ? '#0B1120' : '#a8abb3',
                      }}
                    >
                      {l.flag} {l.code}
                    </button>
                  );
                })}
              </div>
            </div>

            {/*
              Live-Vorschau in allen zehn Sprachen. Ohne sie pflegt man blind:
              Gespeichert sind Vorlagenschlüssel und Name, der Satz entsteht
              erst im Spiel.
            */}
            <div className="mt-5 rounded-2xl border border-white/5 bg-[#151a21] p-3">
              <p className="text-[11px] font-bold text-[#a8abb3] mb-2">
                So liest der Spieler die Frage
                {!localesReady && <span className="text-[#FBBF24]"> · Sprachen laden …</span>}
              </p>
              <div className="grid gap-1">
                {LANGS.map((l) => (
                  <div key={l.code} className="flex items-start gap-2 text-xs">
                    <span className="w-6 shrink-0">{l.flag}</span>
                    <span className="flex-1" dir={l.code === 'ar' ? 'rtl' : 'ltr'}>
                      {renderQuestion(
                        {
                          frame_key: form.frame_key,
                          name_i18n: form.name_i18n,
                          question_i18n: form.question_i18n,
                          as_of_year: form.as_of_year,
                        },
                        l.code,
                      )}
                    </span>
                    {answerNum !== null && (
                      <span className="tabular-nums text-[#34D399] shrink-0">
                        {formatAnswer(answerNum, form.unit_key, l.code)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <label className="flex items-center gap-2 text-xs font-bold text-[#a8abb3]">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                Aktiv
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-[#151a21] border border-white/5 text-[#a8abb3]"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => void save()}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#FBBF24] to-[#34D399] text-[#0B1120]"
                >
                  <Check className="w-4 h-4" /> Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Löschen bestätigen */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-3xl bg-[#111720] border border-white/10 p-6">
            <p className="text-lg font-black">Frage löschen?</p>
            <p className="mt-2 text-sm text-[#a8abb3]">
              Das lässt sich nicht rückgängig machen. Zum Ausblenden reicht auch der
              Aus-Schalter.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="h-11 rounded-xl font-bold text-sm bg-[#151a21] border border-white/5 text-[#a8abb3]"
              >
                Abbrechen
              </button>
              <button
                onClick={() => void remove()}
                className="h-11 rounded-xl font-bold text-sm bg-[#FB7185] text-[#0B1120]"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
