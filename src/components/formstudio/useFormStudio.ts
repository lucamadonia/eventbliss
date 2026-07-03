/**
 * useFormStudio — draft state + debounced autosave engine for the Form Studio.
 *
 * Owns a FormStudioState reducer and persists the studio-owned settings keys
 * to the update-event-settings edge function (same transport as the legacy
 * FormBuilderTab.handleSave). Only the keys the Studio actually edits are sent
 * — form_locked/locked_block are never touched.
 *
 * Save discipline:
 *  - any dirty state schedules a save 1200ms after the last edit (debounce)
 *  - single-flight: never two concurrent saves; a dirty edit that lands during
 *    a save re-fires immediately once the in-flight save settles
 *  - hard flush() on sheet close, when the tab deactivates, on tab-hide and
 *    beforeunload
 *  - on failure: keep the draft, retry twice with backoff, then surface error
 *    and expose retry()
 *  - RESYNC only when idle/saved AND the incoming settings differ from what we
 *    last saved — never clobbers a dirty draft, never loops on our own echo
 */
import { useCallback, useEffect, useReducer, useRef } from "react";
import { type EventSettings, mergeWithDefaults, sanitizeSettingsForSave } from "@/lib/survey-config";
import {
  formStudioReducer,
  makeInitialState,
  type FormStudioState,
  type FormStudioAction,
} from "./formStudioReducer";

interface StudioEvent {
  id: string;
  settings: Partial<EventSettings> | null;
}

/** The exact set of keys the Studio persists (never form_locked/locked_block). */
function buildStudioPayload(raw: EventSettings) {
  const s = sanitizeSettingsForSave(raw);
  return {
    attendance_options: s.attendance_options,
    duration_options: s.duration_options,
    budget_options: s.budget_options,
    destination_options: s.destination_options,
    travel_options: s.travel_options,
    fitness_options: s.fitness_options,
    alcohol_options: s.alcohol_options,
    activity_options: s.activity_options,
    question_config: s.question_config,
    question_order: s.question_order,
    date_blocks: s.date_blocks,
    date_warnings: s.date_warnings,
    date_ranges: s.date_ranges,
    custom_questions: s.custom_questions,
    no_gos: s.no_gos,
    focus_points: s.focus_points,
    branding: s.branding,
  };
}

const DEBOUNCE_MS = 1200;
const MAX_RETRIES = 2;

export interface UseFormStudioResult {
  state: FormStudioState;
  dispatch: React.Dispatch<FormStudioAction>;
  /** Persist the current draft now (used on sheet close / drag drop). */
  flush: () => void;
  /** Re-attempt a save after an error. */
  retry: () => void;
}

export function useFormStudio(
  event: StudioEvent,
  onUpdate: () => void,
  isActive: boolean,
): UseFormStudioResult {
  const [state, dispatch] = useReducer(
    formStudioReducer,
    event.settings,
    makeInitialState,
  );

  // Latest state for save closures (avoids stale reads in timers/listeners).
  const stateRef = useRef(state);
  stateRef.current = state;

  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const retryRef = useRef(0);
  const lastSavedRef = useRef<string>(
    JSON.stringify(buildStudioPayload(mergeWithDefaults(event.settings))),
  );

  const doSave = useCallback(async () => {
    if (savingRef.current) {
      pendingRef.current = true;
      return;
    }
    savingRef.current = true;
    dispatch({ type: "MARK_SAVING" });

    const payload = buildStudioPayload(stateRef.current.settings);
    const json = JSON.stringify(payload);

    let ok = false;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-event-settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ event_id: event.id, settings: payload }),
        },
      );
      const data = await res.json().catch(() => ({ success: res.ok }));
      ok = !!data?.success;
    } catch {
      ok = false;
    }

    savingRef.current = false;

    if (ok) {
      lastSavedRef.current = json;
      retryRef.current = 0;
      dispatch({ type: "MARK_SAVED" });
      onUpdate();
      // A dirty edit that arrived mid-flight: persist the newest snapshot now.
      if (pendingRef.current || stateRef.current.saveState === "dirty") {
        pendingRef.current = false;
        void doSave();
      }
      return;
    }

    if (retryRef.current < MAX_RETRIES) {
      retryRef.current += 1;
      window.setTimeout(() => void doSave(), 600 * retryRef.current);
      return;
    }
    retryRef.current = 0;
    dispatch({ type: "MARK_ERROR" });
  }, [event.id, onUpdate]);

  // Debounced autosave: reset the 1200ms timer on every edit.
  useEffect(() => {
    if (state.saveState !== "dirty") return;
    const id = window.setTimeout(() => void doSave(), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [state.saveState, state.settings, doSave]);

  const flush = useCallback(() => {
    if (stateRef.current.saveState === "dirty") void doSave();
  }, [doSave]);

  const retry = useCallback(() => {
    retryRef.current = 0;
    void doSave();
  }, [doSave]);

  // Hard flush when the tab deactivates (keep-alive dashboard hides the tab).
  const prevActive = useRef(isActive);
  useEffect(() => {
    if (prevActive.current && !isActive) flush();
    prevActive.current = isActive;
  }, [isActive, flush]);

  // Hard flush on tab-hide / navigation away.
  useEffect(() => {
    const hardFlush = () => {
      if (stateRef.current.saveState === "dirty") void doSave();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hardFlush();
    };
    window.addEventListener("beforeunload", hardFlush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", hardFlush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [doSave]);

  // Apply incoming server settings only when we're not mid-edit and the payload
  // truly differs from what we last saved (skips our own refetch echo).
  useEffect(() => {
    const s = stateRef.current.saveState;
    if (s !== "idle" && s !== "saved") return;
    const incoming = mergeWithDefaults(event.settings);
    const incomingJson = JSON.stringify(buildStudioPayload(incoming));
    if (incomingJson === lastSavedRef.current) return;
    lastSavedRef.current = incomingJson;
    dispatch({ type: "RESYNC", settings: incoming });
  }, [event.settings]);

  return { state, dispatch, flush, retry };
}
