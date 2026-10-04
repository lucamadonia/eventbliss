/**
 * NAH DRAN — was der Fernseher sieht (und die Auflösungs-Daten, die Handy und
 * TV teilen). Vor der Auflösung nur WER abgegeben hat, nie WAS; die Antwort
 * erst ab `reveal`. Sendet nur der Host (bzw. das eine lokale Gerät).
 */
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTVGameBridge } from '@/hooks/useTVGameBridge';
import type { OnlineGameProps } from '../multiplayer/OnlineGameTypes';
import type { TvHandover } from '../ui/guest-handover';
import { type CeResult } from './closeenough-scoring';
import { type RevealMark } from './RevealChart';
import { questionText, withUnit, formatAnswer, unitWord, unitSymbol, CE_UNITS, type CeQuestion } from './closeenough-content';
import { CE, type Phase, type Player } from './ce-theme';
import { ceTvPlayers } from './guest-estimates';

export function useCeTv({ online, isHost, phase, phaseStartsAt, handoverTv, players, submittedSet, submittedIds, round, totalRounds, question, results, lang, timeLeft, duration }: {
  online: OnlineGameProps | undefined; isHost: boolean; phase: Phase; phaseStartsAt: number; handoverTv: TvHandover | null;
  players: Player[]; submittedSet: ReadonlySet<string>; submittedIds: string[]; round: number; totalRounds: number;
  question: CeQuestion | null; results: CeResult[] | null; lang: string; timeLeft: number; duration: number;
}) {
  const { t } = useTranslation();
  // Letzte Auflösung merken: Sie bleibt sichtbar, bis alle Geräte gemeinsam zur neuen Runde wechseln.
  const lastReveal = useRef<{ question: CeQuestion | null; results: CeResult[] | null }>({ question: null, results: null });
  if (phase === 'reveal' && results) lastReveal.current = { question, results };

  // --- Fernseher -----------------------------------------------------------
  const revealMarks = useMemo<RevealMark[]>(() => {
    const shown = results ?? lastReveal.current.results;
    if (!shown) return [];
    return shown.map((r) => {
      const p = players.find((x) => x.id === r.playerId);
      return {
        playerId: r.playerId,
        name: p?.name ?? '',
        color: p?.color ?? CE.accent,
        value: r.value,
        bonus: r.bonus,
        rank: r.rank,
      };
    });
  }, [results, players]); // eslint-disable-line react-hooks/exhaustive-deps

  const revealQuestion = phase === 'reveal' ? question : (lastReveal.current.question ?? question);
  const truthLabel = useMemo(() => {
    if (!revealQuestion || typeof revealQuestion.answer !== 'number') return '';
    return withUnit(formatAnswer(revealQuestion.answer, revealQuestion.unitKey, lang), revealQuestion.unitKey, revealQuestion.answer, lang, t);
  }, [revealQuestion, lang, t]);

  const unitLabel = useMemo(() => {
    if (!question) return '';
    return CE_UNITS[question.unitKey] === 'symbol'
      ? unitSymbol(question.unitKey, t)
      : unitWord(question.unitKey, 2, lang, t);
  }, [question, lang, t]);

  // tvHandover() baut jedes Mal ein neues Objekt — nach Inhalt merken, sonst ginge der TV-Stand bei jedem Rendern raus.
  const handoverKey = JSON.stringify(handoverTv);
  const tvPayload = useMemo(
    () => ({
      phase,
      phaseStartsAt,
      handover: handoverTv,
      players: ceTvPlayers(players, online?.players ?? [], submittedSet),
      round: round + 1,
      totalRounds,
      question: question ? questionText(question, t) : '',
      unitLabel,
      timeLeft: timeLeft,
      totalTime: duration,
      submittedCount: players.filter((p) => submittedSet.has(p.id)).length,
      // Erst ab der Auflösung — vorher stünde die Antwort im Datenstrom.
      reveal:
        phase === 'reveal' && question
          ? {
              truth: question.answer,
              truthLabel,
              tolerancePct: question.tolerancePct,
              unitKey: question.unitKey,
              source: question.sourceLabel,
              marks: revealMarks,
            }
          : null,
    }),
    [
      phase,
      phaseStartsAt,
      handoverKey,
      online?.players,
      players,
      submittedSet,
      round,
      totalRounds,
      question,
      unitLabel,
      timeLeft,
      duration,
      revealMarks,
      truthLabel,
      t,
    ], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!online || !isHost) return;
    online.broadcast('tv-state', { game: 'closeenough', ...tvPayload });
  }, [online, isHost, tvPayload]);

  useTVGameBridge('closeenough', tvPayload, [
    phase,
    phaseStartsAt,
    round,
    timeLeft,
    submittedIds.length,
    results,
    handoverTv?.playerId,
    handoverTv?.progress?.phase,
  ], !online || isHost);

  return { lastReveal, revealMarks, truthLabel, unitLabel };
}
