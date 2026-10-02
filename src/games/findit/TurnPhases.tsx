/**
 * WO IST WAS — Zugspiele (Memory, Speed, Unterschiede): Lernen, Frage,
 * Aufloesung und Rundenende. Reine Darstellung; die Logik bleibt im Spiel.
 * `view` ist die synchron gezeigte Phase (Design §9), `canAct` ob dieses
 * Handy fuer den Platz am Zug tippen darf (eigener Platz oder 🔁-Gast).
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Target } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { StageAction } from '../ui/GameStage';
import { ObjectBoard, ObjectPicture } from './VisualObjects';
import { parseObjectGrid, type VisualScene as Scene, type VisualDiffScene as DiffScene } from './visual-content';
import type { Mode, Phase, Player } from './findit-config';

export function TurnPhases({ view, mode, imagesAvailable, imageError, onRetryImages, studyCountdown, studyTime, questionCountdown, currentScene, currentDiff,
  questionIdx, selectedAnswer, answerCorrect, foundDiffs, players, canAct, onAnswer, onDiffTap }: {
  view: Phase; mode: Mode; imagesAvailable: boolean; imageError: boolean; onRetryImages: () => void;
  studyCountdown: number; studyTime: number; questionCountdown: number; currentScene: Scene | null; currentDiff: DiffScene | null;
  questionIdx: number; selectedAnswer: number | null; answerCorrect: boolean | null; foundDiffs: number[]; players: Player[];
  canAct: boolean; onAnswer: (idx: number) => void; onDiffTap: (cell: number) => void;
}) {
  const { t } = useTranslation();
  const parsedGrid = useMemo(() => currentScene ? parseObjectGrid(currentScene.grid) : null, [currentScene]);
  const parsedDiffA = useMemo(() => currentDiff ? parseObjectGrid(currentDiff.gridA) : null, [currentDiff]);
  const parsedDiffB = useMemo(() => currentDiff ? parseObjectGrid(currentDiff.gridB) : null, [currentDiff]);
  return (
    <>
    {/* Study Phase */}
    {!imagesAvailable && mode !== 'karte' && mode !== 'streetview' && <div className="findit-content-loading" role="status">
      {t(imageError ? 'games.findit.visual.imageError' : 'games.findit.visual.loading')}
      {imageError && <StageAction onClick={onRetryImages}>{t('games.findit.visual.retryImages')}</StageAction>}
    </div>}
    <AnimatePresence mode="wait">
      {imagesAvailable && view === 'study' && (
        <motion.div
          key="study"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="expedition-phase space-y-4"
        >
          <div className="text-center space-y-1">
            <p className="text-cyan-300 font-bold text-lg">{t('games.findit.studyMemorize')}</p>
            <motion.p
              className="text-4xl font-black text-white"
              key={studyCountdown}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {studyCountdown}
            </motion.p>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-600"
              initial={{ width: '100%' }}
              animate={{ width: `${(studyCountdown / studyTime) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Emoji Grid */}
          {mode === 'unterschiede' && parsedDiffA && parsedDiffB ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ObjectBoard grid={parsedDiffA} label={t('games.findit.imgA')} />
              <ObjectBoard grid={parsedDiffB} label={t('games.findit.imgB')} />
            </div>
          ) : parsedGrid ? (
            <ObjectBoard grid={parsedGrid} />
          ) : null}
        </motion.div>
      )}

      {/* Karte Mode is rendered OUTSIDE AnimatePresence below */}

      {/* Question Phase */}
      {imagesAvailable && (view === 'question' || view === 'answer') && mode !== 'unterschiede' && mode !== 'karte' && currentScene && (
        <motion.div
          key={`q-${questionIdx}`}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="expedition-phase space-y-4"
        >
          {/* Show grid in speed mode */}
          {mode === 'speed' && parsedGrid && (
            <ObjectBoard grid={parsedGrid} compact />
          )}

          {/* Question timer */}
          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full transition-colors',
                questionCountdown > 5 ? 'bg-gradient-to-r from-cyan-400 to-cyan-600' : 'bg-gradient-to-r from-red-400 to-red-600'
              )}
              style={{ width: `${(questionCountdown / 15) * 100}%` }}
            />
          </div>

          {/* Question */}
          <div className="bg-gray-800/60 backdrop-blur border border-cyan-500/20 rounded-2xl p-5 text-center">
            <p className="text-xs text-cyan-400 mb-1 font-semibold">{t('games.findit.questionLabel', { current: questionIdx + 1, total: currentScene.questions.length })}</p>
            <p className="text-white font-bold text-lg leading-tight">{t(currentScene.questions[questionIdx].q, { position: currentScene.questions[questionIdx].position })}</p>
          </div>

          {/* Options */}
          <div className="findit-answer-options">
            {currentScene.questions[questionIdx].options.map((opt, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOpt = idx === currentScene.questions[questionIdx].correct;
              const showResult = view === 'answer';

              return (
                <motion.button
                  key={idx}
                  onClick={() => onAnswer(idx)}
                  disabled={view === 'answer' || !imagesAvailable || !canAct}
                  className={cn(
                    'findit-answer-option rounded-xl border-2 font-semibold text-sm transition-all',
                    showResult && isCorrectOpt
                      ? 'border-green-400 bg-green-500/20 text-green-300'
                      : showResult && isSelected && !isCorrectOpt
                      ? 'border-red-400 bg-red-500/20 text-red-300'
                      : isSelected
                      ? 'border-cyan-400 bg-cyan-500/20 text-white'
                      : 'border-gray-700 bg-gray-800/40 text-gray-200 hover:border-cyan-500/50 hover:bg-gray-800/60'
                  )}
                  whileTap={view !== 'answer' ? { scale: 0.95 } : {}}
                >
                  <ObjectPicture id={opt} label={t(`games.findit.objects.${opt}`)} />
                  <span className="flex items-center justify-center gap-2">
                    {showResult && isCorrectOpt && <Check className="w-4 h-4 text-green-400" />}
                    {showResult && isSelected && !isCorrectOpt && <X className="w-4 h-4 text-red-400" />}
                    {t(`games.findit.objects.${opt}`)}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Answer feedback */}
          <AnimatePresence>
            {view === 'answer' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  'text-center py-2 rounded-xl font-bold',
                  answerCorrect ? 'text-green-400' : 'text-red-400'
                )}
              >
                {answerCorrect ? t('games.findit.feedbackCorrect') : t('games.findit.feedbackWrong')}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Unterschiede Question Phase */}
      {imagesAvailable && (view === 'question' || view === 'answer') && mode === 'unterschiede' && currentDiff && parsedDiffA && parsedDiffB && (
        <motion.div
          key="diff-q"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="expedition-phase space-y-4"
        >
          <div className="text-center">
            <p className="text-cyan-300 font-bold">{t('games.findit.diffFindTitle', { count: currentDiff.count })}</p>
            <p className="text-gray-400 text-xs">{t('games.findit.visual.compareHint')}</p>
          </div>

          {/* Timer */}
          <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                questionCountdown > 5 ? 'bg-gradient-to-r from-cyan-400 to-cyan-600' : 'bg-gradient-to-r from-red-400 to-red-600'
              )}
              style={{ width: `${(questionCountdown / Math.max(30, studyTime * 3)) * 100}%` }}
            />
          </div>

          <div className="findit-comparison">
            <ObjectBoard grid={parsedDiffA} label={t('games.findit.imgOriginal')} compact />
            <ObjectBoard grid={parsedDiffB} label={t('games.findit.imgChanged')} targets={view === 'answer' ? currentDiff.diffs : []} found={foundDiffs} onTap={onDiffTap} disabled={view !== 'question' || !imagesAvailable || !canAct} />
          </div>

          <div className="flex justify-center gap-2">
            {Array.from({ length: currentDiff.count }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all',
                  i < foundDiffs.length
                    ? 'border-green-400 bg-green-500/20'
                    : 'border-gray-600 bg-gray-800/40'
                )}
              >
                {i < foundDiffs.length ? <Check className="w-4 h-4 text-green-400" /> : <span className="text-white/60 text-xs">{i + 1}</span>}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Round End */}
      {view === 'roundEnd' && (
        <motion.div
          key="round-end"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="text-center py-8 space-y-3"
        >
          <Target className="w-10 h-10 text-cyan-400 mx-auto" />
          <p className="text-white font-bold text-xl">{t('games.findit.roundEndNext')}</p>
          <div className="flex justify-center gap-3">
            {players.map((p, i) => (
              <div key={p.id} className="text-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm mx-auto"
                  style={{ backgroundColor: p.color }}
                >
                  {p.avatar}
                </div>
                <p className="text-xs text-gray-300 mt-1">{p.score}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
