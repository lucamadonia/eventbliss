/**
 * Admin: PIXELJAGD-Motive pflegen.
 *
 * Muster: src/pages/admin/OhrwurmSongs.tsx (eigene Tabelle statt game_content),
 * Upload nach dem Vorbild von useIdeaBoard.ts.
 *
 * `credit` ist Pflichtfeld — es wird im Spiel beim Auflösen angezeigt, und das
 * Impressum verspricht, Fremdinhalte zu kennzeichnen. Ohne Nachweis lässt sich
 * ein Motiv hier gar nicht erst anlegen.
 */
import { useCallback, useEffect, useState } from 'react';
import { Upload, Trash2, Eye, EyeOff, Plus, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PIXEL_CATEGORIES, type PixelCategory } from '@/games/pixeljagd/pixeljagd-content';
import { resolveImageUrl } from '@/games/pixeljagd/pixeljagd-extra';

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

export default function PixelImages() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await db()
      .select('id,image_path,answers,aliases,category,difficulty,credit,source_url,is_active,created_at')
      .order('created_at', { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const add = useCallback(async () => {
    if (!file) { setMsg('Bitte ein Bild auswählen.'); return; }
    if (!form.answerDe.trim()) { setMsg('Antwort (Deutsch) ist Pflicht.'); return; }
    if (!form.credit.trim()) { setMsg('Bildnachweis ist Pflicht — er wird im Spiel angezeigt.'); return; }

    setBusy(true);
    setMsg(null);
    try {
      const ext = (file.name.split('.').pop() || 'webp').toLowerCase();
      const path = `${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from('game-images').upload(path, file, { upsert: false });
      if (up.error) { setMsg(`Upload fehlgeschlagen: ${up.error.message}`); return; }

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
      if (error) { setMsg(`Speichern fehlgeschlagen: ${error.message ?? ''}`); return; }

      setForm({ ...EMPTY });
      setFile(null);
      await load();
      setMsg('Gespeichert.');
    } finally {
      setBusy(false);
    }
  }, [file, form, load]);

  const toggle = useCallback(async (r: Row) => {
    await db().update({ is_active: !r.is_active }).eq('id', r.id);
    await load();
  }, [load]);

  const remove = useCallback(async (r: Row) => {
    await db().delete().eq('id', r.id);
    if (!r.image_path.startsWith('/') && !r.image_path.startsWith('http')) {
      await supabase.storage.from('game-images').remove([r.image_path]);
    }
    await load();
  }, [load]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-black">PIXELJAGD — Bilder</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Motive für das Verpixel-Ratespiel. Der Bildnachweis ist Pflicht und wird den Spielern
          beim Auflösen angezeigt.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Bilder landen im Bucket <code>game-images</code> und werden über die Supabase-Domain
          ausgeliefert. Das ist Absicht: ein fremd gehostetes Bild ließe sich zwar anzeigen, aber
          nicht verpixeln — der Canvas wäre „getaint".
        </p>

        {/* Neues Motiv */}
        <div className="mt-6 rounded-2xl border border-border p-4 space-y-3">
          <h2 className="font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Neues Motiv</h2>

          <label className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border cursor-pointer">
              <Upload className="w-4 h-4" /> Bild wählen
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </span>
            <span className="text-muted-foreground">{file ? file.name : 'keine Datei'}</span>
          </label>

          <div className="grid md:grid-cols-2 gap-3">
            <input className="px-3 py-2 rounded-lg bg-muted" placeholder="Antwort (Deutsch) *"
              value={form.answerDe} onChange={(e) => setForm({ ...form, answerDe: e.target.value })} />
            <input className="px-3 py-2 rounded-lg bg-muted" placeholder="Antwort (English)"
              value={form.answerEn} onChange={(e) => setForm({ ...form, answerEn: e.target.value })} />
            <input className="px-3 py-2 rounded-lg bg-muted md:col-span-2" placeholder="Weitere gültige Schreibweisen, mit Komma getrennt"
              value={form.aliases} onChange={(e) => setForm({ ...form, aliases: e.target.value })} />
            <input className="px-3 py-2 rounded-lg bg-muted" placeholder="Bildnachweis * (z. B. Fotograf / Lizenz)"
              value={form.credit} onChange={(e) => setForm({ ...form, credit: e.target.value })} />
            <input className="px-3 py-2 rounded-lg bg-muted" placeholder="Quell-Link (optional)"
              value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} />
            <select className="px-3 py-2 rounded-lg bg-muted" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as PixelCategory })}>
              {PIXEL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="px-3 py-2 rounded-lg bg-muted" value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })}>
              <option value={1}>leicht</option>
              <option value={2}>mittel</option>
              <option value={3}>schwer</option>
            </select>
          </div>

          <button disabled={busy} onClick={() => void add()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold disabled:opacity-50">
            {busy ? 'Speichert…' : 'Hinzufügen'}
          </button>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        </div>

        {/* Liste */}
        <div className="mt-8">
          <h2 className="font-bold mb-3">{rows.length} Motive</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Lädt…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine Motive. Solange hier nichts steht, lässt sich PIXELJAGD nicht starten.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rows.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border overflow-hidden">
                  <img src={resolveImageUrl(r.image_path)} alt="" className="w-full aspect-[4/3] object-cover" />
                  <div className="p-3 space-y-1">
                    <p className="font-bold text-sm">{r.answers?.de}</p>
                    <p className="text-xs text-muted-foreground">{r.category} · Stufe {r.difficulty}</p>
                    <p className="text-xs text-muted-foreground break-words">
                      Nachweis: {r.credit}
                      {r.source_url && (
                        <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-0.5 underline">
                          Link <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </p>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => void toggle(r)} className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded border border-border">
                        {r.is_active ? <><Eye className="w-3 h-3" /> aktiv</> : <><EyeOff className="w-3 h-3" /> inaktiv</>}
                      </button>
                      <button onClick={() => void remove(r)} className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-destructive">
                        <Trash2 className="w-3 h-3" /> löschen
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
