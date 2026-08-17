/**
 * Lädt die per Admin gepflegten PIXELJAGD-Motive aus `pixel_images` nach.
 * Muster: `ohrwurm-extra-songs.ts`.
 */
import { supabase } from '@/integrations/supabase/client';
import {
  setExtraPuzzles,
  type PixelPuzzleSource,
  type PixelCategory,
  PIXEL_CATEGORIES,
} from './pixeljagd-content';

interface Row {
  id: string;
  image_path: string;
  answers: Record<string, string> | null;
  aliases: string[] | null;
  category: string;
  difficulty: number | null;
  credit: string;
  source_url: string | null;
}

// Die generierten Supabase-Typen hinken frischen Migrationen hinterher —
// gleiche Umgehung wie in OhrwurmSongs.tsx.
const db = () =>
  (supabase.from as unknown as (t: string) => {
    select: (c: string) => {
      eq: (k: string, v: unknown) => Promise<{ data: Row[] | null; error: unknown }>;
    };
  })('pixel_images');

/**
 * Wandelt `image_path` in eine ladbare URL um.
 *
 * Drei erlaubte Formen — und alle drei sind bewusst same-origin oder Supabase,
 * weil ein fremdgehostetes Bild den Canvas tainten und die Verpixelung
 * unmöglich machen würde:
 *  - `/images/...`         → mitgeliefert, same-origin
 *  - `https://...supabase` → bereits aufgelöste öffentliche URL
 *  - alles andere          → Objektpfad im Bucket `game-images`
 */
export function resolveImageUrl(imagePath: string): string {
  if (imagePath.startsWith('/') || imagePath.startsWith('http')) return imagePath;
  const { data } = supabase.storage.from('game-images').getPublicUrl(imagePath);
  return data.publicUrl;
}

function isCategory(c: string): c is PixelCategory {
  return (PIXEL_CATEGORIES as readonly string[]).includes(c);
}

export async function loadExtraPuzzles(): Promise<void> {
  try {
    const { data, error } = await db()
      .select('id,image_path,answers,aliases,category,difficulty,credit,source_url')
      .eq('is_active', true);
    if (error || !data) return;

    const list: PixelPuzzleSource[] = data
      .filter((r) => isCategory(r.category) && !!r.answers?.de)
      .map((r) => ({
        id: `db-${r.id}`,
        image: resolveImageUrl(r.image_path),
        answer: r.answers as { de: string },
        aliases: r.aliases ?? [],
        category: r.category as PixelCategory,
        difficulty: ((r.difficulty ?? 2) as 1 | 2 | 3),
        credit: r.credit,
        sourceUrl: r.source_url ?? undefined,
      }));

    setExtraPuzzles(list);
  } catch {
    // Ohne Zusatzmotive läuft das Spiel mit dem Grundstock weiter.
  }
}
