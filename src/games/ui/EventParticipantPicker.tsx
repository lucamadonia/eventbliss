import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users, Check, Loader2, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/components/auth/AuthProvider';

/**
 * EventParticipantPicker — lets a logged-in organizer pull the participants of
 * one of THEIR OWN events into a game's player setup (offline pass-and-play).
 *
 * Self-contained: queries `events` (created_by = me) and `participants` directly
 * via the supabase client; returns the chosen names through onSelect.
 */
interface EventRow { id: string; name: string; honoree_name: string | null; event_type: string | null }
interface ParticipantRow { id: string; name: string }

export function EventParticipantPicker({
  open,
  onClose,
  onSelect,
  accent = '#A78BFA',
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (names: string[]) => void;
  accent?: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Load my created events when the picker opens.
  useEffect(() => {
    if (!open) return;
    setSelectedEvent(null);
    setParticipants([]);
    setChecked(new Set());
    setError(null);
    if (!user?.id) { setError(t('games.importPicker.loginRequired')); return; }
    setLoadingEvents(true);
    (async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, honoree_name, event_type, created_at, deleted_at')
        .eq('created_by', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) { setError(t('games.importPicker.errEvents')); setLoadingEvents(false); return; }
      setEvents((data ?? []) as EventRow[]);
      setLoadingEvents(false);
    })();
  }, [open, user?.id]);

  const pickEvent = async (ev: EventRow) => {
    setSelectedEvent(ev);
    setLoadingParts(true);
    setParticipants([]);
    const { data, error } = await supabase
      .from('participants')
      .select('id, name')
      .eq('event_id', ev.id);
    if (error) { setError(t('games.importPicker.errParticipants')); setLoadingParts(false); return; }
    const rows = ((data ?? []) as ParticipantRow[]).filter((p) => p.name && p.name.trim().length > 0);
    setParticipants(rows);
    setChecked(new Set(rows.map((p) => p.id))); // default: all selected
    setLoadingParts(false);
  };

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const confirm = () => {
    const names = participants.filter((p) => checked.has(p.id)).map((p) => p.name.trim());
    if (names.length === 0) return;
    onSelect(names);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            style={{ ['--accent' as string]: accent }}
            className="w-full sm:max-w-md max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#14101f] border border-white/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                {selectedEvent ? <Users className="w-5 h-5 text-[var(--accent)]" /> : <Calendar className="w-5 h-5 text-[var(--accent)]" />}
                <h3 className="text-base font-bold text-white">
                  {selectedEvent ? t('games.importPicker.selectParticipants') : t('games.importPicker.selectEvent')}
                </h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5" aria-label={t('games.importPicker.close')}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {error && <p className="text-sm text-center text-red-300 py-6">{error}</p>}

              {!error && !selectedEvent && (
                loadingEvents ? (
                  <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" /></div>
                ) : events.length === 0 ? (
                  <p className="text-sm text-center text-gray-400 py-10">{t('games.importPicker.noEvents')}</p>
                ) : (
                  events.map((ev) => (
                    <button key={ev.id} onClick={() => pickEvent(ev)}
                      className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left bg-white/[0.04] border border-white/10 hover:border-[var(--accent)]/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{ev.name || ev.honoree_name || t('games.importPicker.eventFallback')}</p>
                        {ev.event_type && <p className="text-xs text-gray-400 capitalize">{ev.event_type}</p>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                    </button>
                  ))
                )
              )}

              {!error && selectedEvent && (
                loadingParts ? (
                  <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" /></div>
                ) : participants.length === 0 ? (
                  <p className="text-sm text-center text-gray-400 py-10">{t('games.importPicker.noParticipants')}</p>
                ) : (
                  participants.map((p) => {
                    const on = checked.has(p.id);
                    return (
                      <button key={p.id} onClick={() => toggle(p.id)}
                        className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left bg-white/[0.04] border border-white/10">
                        <span className={cn('w-6 h-6 rounded-md grid place-items-center border-2 shrink-0 transition-colors',
                          on ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-gray-600')}>
                          {on && <Check className="w-4 h-4 text-white" />}
                        </span>
                        <span className="flex-1 font-medium text-white truncate">{p.name}</span>
                      </button>
                    );
                  })
                )
              )}
            </div>

            {/* Footer — pb clears the iOS home indicator / Android system nav bar so the
                confirm button stays tappable in portrait (previously only reachable in landscape). */}
            {selectedEvent && participants.length > 0 && (
              <div
                className="flex items-center gap-3 px-4 pt-3 border-t border-white/10"
                style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
              >
                <button onClick={() => setSelectedEvent(null)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-300 bg-white/5">
                  {t('games.importPicker.back')}
                </button>
                <button onClick={confirm} disabled={checked.size === 0}
                  className="flex-1 py-2.5 rounded-xl font-bold text-white disabled:opacity-40"
                  style={{ background: accent }}>
                  {t('games.importPicker.confirm', { count: checked.size })}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default EventParticipantPicker;
