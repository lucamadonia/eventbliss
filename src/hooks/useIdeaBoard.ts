/**
 * useIdeaBoard — data layer for the collaborative per-event Ideenboard.
 * Fetches (or lazily creates) the event's board, loads pins with reaction &
 * comment counts, subscribes to realtime changes, and exposes mutations
 * (add/delete pin, toggle reaction, add comment, update board settings).
 * Free-tier pin limit is enforced here; RLS is the hard membership boundary.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";

export const FREE_PIN_LIMIT = 5;

export const PIN_CATEGORIES = [
  "deko", "outfit", "food", "drinks", "activity", "location", "gift", "playlist", "other",
] as const;
export type PinCategory = (typeof PIN_CATEGORIES)[number];
export type PinKind = "image" | "link" | "note" | "embed";
export type ContributeMode = "contribute" | "view" | "private";

export interface EventBoard {
  id: string;
  event_id: string;
  title: string;
  cover_pin_id: string | null;
  contribute_mode: ContributeMode;
  guests_can_view: boolean;
  guests_can_pin: boolean;
  created_by: string | null;
}

export interface BoardPin {
  id: string;
  board_id: string;
  event_id: string;
  kind: PinKind;
  category: PinCategory;
  title: string | null;
  note: string | null;
  url: string | null;
  image_path: string | null;
  embed_html: string | null;
  source: "user" | "seed" | "ai";
  created_by: string | null;
  created_at: string;
  // derived
  imageUrl?: string;
  reactionCount: number;
  myReaction: boolean;
  commentCount: number;
}

export interface AddPinInput {
  kind: PinKind;
  category: PinCategory;
  title?: string;
  note?: string;
  url?: string;
  embed_html?: string;
  imageFile?: File | Blob;
  source?: "user" | "seed" | "ai";
}

// Loosely-typed client for the new Ideenboard tables (event_boards / board_pins /
// board_pin_*): the generated Supabase types don't include them until they're
// regenerated post-migration. Scoped to this hook; RLS is the real boundary.
const db = supabase as any;

function publicImageUrl(path: string | null): string | undefined {
  if (!path) return undefined;
  return supabase.storage.from("board-pins").getPublicUrl(path).data.publicUrl;
}

export function useIdeaBoard(eventId: string | undefined) {
  const { user } = useAuth();
  const userId = user?.id;
  const { isPremium } = usePremium();

  const [board, setBoard] = useState<EventBoard | null>(null);
  const [pins, setPins] = useState<BoardPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const boardIdRef = useRef<string | null>(null);
  // Monotonic request id: only the newest load() is allowed to write state, so
  // a slow in-flight load can't resolve late and overwrite a fresh list with a
  // stale (pin-less) snapshot — the "pin appears then vanishes" race.
  const loadSeqRef = useRef(0);
  // Single-flight guard for get-or-create so two concurrent mount loads don't
  // both INSERT and create duplicate boards for the same event.
  const boardPromiseRef = useRef<Promise<EventBoard> | null>(null);

  const myPinCount = pins.filter((p) => p.created_by === userId && p.source !== "seed").length;
  const canAddPin = isPremium || myPinCount < FREE_PIN_LIMIT;

  /** Get-or-create the single board for this event, de-duplicated. */
  const getOrCreateBoard = useCallback(async (): Promise<EventBoard> => {
    if (boardPromiseRef.current) return boardPromiseRef.current;
    const p = (async () => {
      let { data: b } = await db
        .from("event_boards")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!b) {
        const { data: created, error: cErr } = await db
          .from("event_boards")
          .insert({ event_id: eventId, created_by: userId })
          .select("*")
          .single();
        if (cErr) throw cErr;
        b = created;
      }
      return b as EventBoard;
    })();
    boardPromiseRef.current = p;
    try {
      return await p;
    } finally {
      boardPromiseRef.current = null;
    }
  }, [eventId, userId]);

  /** Load the board (create it lazily on first open) + all pins with counts. */
  const load = useCallback(async () => {
    if (!eventId) return;
    const seq = ++loadSeqRef.current;
    const isCurrent = () => seq === loadSeqRef.current;
    setLoading(true);
    setError(null);
    try {
      const b = await getOrCreateBoard();
      if (!isCurrent()) return;
      setBoard(b);
      boardIdRef.current = b.id;

      // pins
      const { data: pinRows, error: pErr } = await db
        .from("board_pins")
        .select("*")
        .eq("board_id", b.id)
        .order("created_at", { ascending: false });
      if (pErr) throw pErr;

      const ids = (pinRows ?? []).map((p) => p.id);
      // reactions + comment counts (bounded by board size)
      const [{ data: reacts }, { data: comments }] = await Promise.all([
        ids.length
          ? db.from("board_pin_reactions").select("pin_id,user_id").in("pin_id", ids)
          : Promise.resolve({ data: [] as { pin_id: string; user_id: string }[] }),
        ids.length
          ? db.from("board_pin_comments").select("pin_id").in("pin_id", ids)
          : Promise.resolve({ data: [] as { pin_id: string }[] }),
      ]);

      const rCount = new Map<string, number>();
      const rMine = new Set<string>();
      (reacts ?? []).forEach((r) => {
        rCount.set(r.pin_id, (rCount.get(r.pin_id) ?? 0) + 1);
        if (r.user_id === userId) rMine.add(r.pin_id);
      });
      const cCount = new Map<string, number>();
      (comments ?? []).forEach((c) => cCount.set(c.pin_id, (cCount.get(c.pin_id) ?? 0) + 1));

      // A newer load started while we were fetching → discard this stale result.
      if (!isCurrent()) return;
      setPins(
        (pinRows ?? []).map((p) => ({
          ...(p as BoardPin),
          imageUrl: publicImageUrl(p.image_path),
          reactionCount: rCount.get(p.id) ?? 0,
          myReaction: rMine.has(p.id),
          commentCount: cCount.get(p.id) ?? 0,
        })),
      );
    } catch (e) {
      if (isCurrent()) setError((e as Error).message);
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [eventId, userId, getOrCreateBoard]);

  useEffect(() => {
    load();
  }, [load]);

  // realtime — any change to this event's pins/reactions/comments → reload
  useEffect(() => {
    if (!eventId) return;
    const ch = supabase
      .channel(`ideaboard:${eventId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "board_pins", filter: `event_id=eq.${eventId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "board_pin_reactions" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "board_pin_comments" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [eventId, load]);

  const addPin = useCallback(
    async (input: AddPinInput) => {
      if (!board || !eventId) throw new Error("no-board");
      if (!isPremium && input.source !== "seed" && myPinCount >= FREE_PIN_LIMIT) {
        throw new Error("free-limit");
      }
      let image_path: string | null = null;
      if (input.imageFile) {
        const ext = (input.imageFile as File).name?.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${eventId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await db.storage.from("board-pins").upload(path, input.imageFile, { upsert: false });
        if (upErr) throw upErr;
        image_path = path;
      }
      const { data: inserted, error: insErr } = await db
        .from("board_pins")
        .insert({
          board_id: board.id,
          event_id: eventId,
          kind: input.kind,
          category: input.category,
          title: input.title ?? null,
          note: input.note ?? null,
          url: input.url ?? null,
          embed_html: input.embed_html ?? null,
          image_path,
          source: input.source ?? "user",
          created_by: userId,
        })
        .select("*")
        .single();
      if (insErr) throw insErr;
      // Optimistic: show the new pin immediately (guarded load() reconciles
      // counts; the concurrency guard prevents a stale load from removing it).
      if (inserted) {
        setPins((prev) =>
          prev.some((p) => p.id === inserted.id)
            ? prev
            : [
                {
                  ...(inserted as BoardPin),
                  imageUrl: publicImageUrl(inserted.image_path),
                  reactionCount: 0,
                  myReaction: false,
                  commentCount: 0,
                },
                ...prev,
              ],
        );
      }
      await load();
    },
    [board, eventId, isPremium, myPinCount, userId, load],
  );

  const deletePin = useCallback(
    async (pinId: string) => {
      const pin = pins.find((p) => p.id === pinId);
      const { error: delErr } = await db.from("board_pins").delete().eq("id", pinId);
      if (delErr) throw delErr;
      if (pin?.image_path) supabase.storage.from("board-pins").remove([pin.image_path]);
      await load();
    },
    [pins, load],
  );

  const toggleReaction = useCallback(
    async (pinId: string, emoji = "❤️") => {
      if (!userId) return;
      const pin = pins.find((p) => p.id === pinId);
      if (pin?.myReaction) {
        await db.from("board_pin_reactions").delete().match({ pin_id: pinId, user_id: userId, emoji });
      } else {
        await db.from("board_pin_reactions").insert({ pin_id: pinId, user_id: userId, emoji });
      }
      await load();
    },
    [pins, userId, load],
  );

  const addComment = useCallback(
    async (pinId: string, body: string) => {
      if (!userId || !body.trim()) return;
      await db.from("board_pin_comments").insert({ pin_id: pinId, user_id: userId, body: body.trim() });
      await load();
    },
    [userId, load],
  );

  const loadComments = useCallback(async (pinId: string) => {
    const { data } = await db
      .from("board_pin_comments")
      .select("id,body,user_id,created_at")
      .eq("pin_id", pinId)
      .order("created_at", { ascending: true });
    return data ?? [];
  }, []);

  const updateBoardSettings = useCallback(
    async (patch: Partial<Pick<EventBoard, "title" | "contribute_mode" | "guests_can_view" | "guests_can_pin" | "cover_pin_id">>) => {
      if (!board) return;
      const { error: uErr } = await db.from("event_boards").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", board.id);
      if (uErr) throw uErr;
      await load();
    },
    [board, load],
  );

  return {
    board, pins, loading, error,
    isPremium, myPinCount, canAddPin, freePinLimit: FREE_PIN_LIMIT,
    reload: load,
    addPin, deletePin, toggleReaction, addComment, loadComments, updateBoardSettings,
  };
}
