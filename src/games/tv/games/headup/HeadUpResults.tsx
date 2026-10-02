import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { playerGlow } from '@/lib/party-motion';
import TVPlayerAvatar from '../../cinema/TVPlayerAvatar';
import TVBurst from '../../cinema/TVBurst';
import { riseIn, staggerChildren } from '../../cinema/scene';
import { lu } from '../../components/tv-lobby-scale';
import { tvPanel, tvType } from '../../tv-tokens';
import { HU, seatKey, type HeadUpRoundScore, type HeadUpSeat } from './headup-tv';

function Stat({ value, label, color, reduced }: { value: number; label: string; color: string; reduced: boolean }) {
  return (
    <motion.div variants={riseIn(reduced)} className={`${tvPanel} flex flex-col items-center`} style={{ padding: `${lu(2.4)} ${lu(5)}`, boxShadow: playerGlow(color, 'soft') }}>
      <span className="font-black tabular-nums leading-none" style={{ fontSize: tvType.hero, color: '#fff', textShadow: `0 0 40px ${color}` }}>{value}</span>
      <span className="mt-3 font-bold" style={{ fontSize: tvType.body, color: HU.text }}>{label}</span>
    </motion.div>
  );
}

/** Ende eines Zuges: wer war dran, wie viele richtig/uebersprungen. */
export function HeadUpRoundResult({ guesser, correct, skipped }: { guesser: HeadUpSeat | undefined; correct: number; skipped: number }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const color = guesser?.color || HU.purple;
  return (
    <motion.div className="flex flex-col items-center" style={{ gap: lu(3.4) }} variants={staggerChildren(120)} initial="initial" animate="animate">
      <motion.div variants={riseIn(reduced)} className="flex items-center" style={{ gap: lu(2.4) }}>
        <TVPlayerAvatar id={guesser?.id} name={guesser?.name || '?'} avatar={guesser?.avatar} color={color} size={lu(12)} active />
        <div className="flex flex-col items-start">
          <span className="font-semibold" style={{ fontSize: tvType.body, color: HU.dim }}>{t('tvCinema.headup.turnOf', 'Zug von')}</span>
          <span className="font-black leading-none" style={{ fontSize: tvType.display, color: '#fff' }}>{guesser?.name || ''}</span>
        </div>
      </motion.div>
      <motion.div className="flex" style={{ gap: lu(4) }} variants={staggerChildren(120)}>
        <Stat value={correct} label={t('tv.headup.correct', 'Richtig')} color={HU.green} reduced={reduced} />
        <Stat value={skipped} label={t('tv.headup.skipped', 'Übersprungen')} color={HU.skip} reduced={reduced} />
      </motion.div>
    </motion.div>
  );
}

/**
 * Spielende. Mit Endstand je Spieler (falls die Bruecke ihn liefert) als
 * Rangliste mit Sieger-Moment, sonst als gemeinsamer Abschluss mit allen.
 */
export function HeadUpGameOver({ seats, scores }: { seats: HeadUpSeat[]; scores: HeadUpRoundScore[] }) {
  const { t } = useTranslation();
  const reduced = !!useReducedMotion();
  const ranked = scores
    .map((s) => ({ s, seat: seats.find((p) => p.name === s.playerName) ?? { name: s.playerName } }))
    .sort((a, b) => b.s.correct - a.s.correct);
  const best = ranked[0]?.s.correct ?? 0;

  if (ranked.length === 0) {
    return (
      <motion.div className="flex flex-col items-center text-center" style={{ gap: lu(3) }} variants={staggerChildren(100)} initial="initial" animate="animate">
        <motion.h1 variants={riseIn(reduced)} className="font-black" style={{ fontSize: tvType.display, color: HU.text }}>{t('tvCinema.headup.allDone', 'Alle waren dran!')}</motion.h1>
        <motion.div className="flex flex-wrap justify-center" style={{ gap: lu(2.4) }} variants={staggerChildren(80)}>
          {seats.map((p, i) => (
            <motion.div key={seatKey(p, i)} variants={riseIn(reduced)} className="flex flex-col items-center" style={{ gap: lu(1) }}>
              <TVPlayerAvatar id={p.id} name={p.name} avatar={p.avatar} color={p.color} size={lu(10)} />
              <span className="font-bold" style={{ fontSize: tvType.body, color: HU.text }}>{p.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  const winner = ranked[0];
  return (
    <div className="absolute inset-x-[5vw] bottom-[6vh] top-[14vh] grid grid-cols-[1.1fr_1fr] items-center" style={{ gap: lu(6) }}>
      <div className="relative flex h-full items-center justify-center">
        <div className="pointer-events-none absolute inset-0 z-0"><TVBurst colors={[HU.gold, HU.cyan, HU.purple, '#ffffff']} count={60} delay={0.35} /></div>
        <motion.div className="relative z-10 flex flex-col items-center rounded-[50%] px-[5vw] py-[4vh] text-center" style={{ gap: lu(2), background: 'radial-gradient(ellipse closest-side, #060810 62%, rgba(6,8,16,0.85) 80%, transparent 100%)' }}
          variants={staggerChildren(140)} initial="initial" animate="animate">
          <motion.div variants={riseIn(reduced)}>
            <TVPlayerAvatar id={winner.seat.id} name={winner.seat.name} avatar={winner.seat.avatar} color={winner.seat.color} size={lu(18)} active />
          </motion.div>
          <motion.h1 variants={riseIn(reduced)} className="font-black leading-none" style={{ fontSize: tvType.display, color: '#fff', textShadow: `0 0 60px ${HU.gold}88` }}>
            {t('tvCinema.headup.winner', '{{name}} gewinnt!', { name: winner.seat.name })}
          </motion.h1>
          <motion.span variants={riseIn(reduced)} className="font-bold" style={{ fontSize: tvType.body, color: HU.gold }}>
            {t('tvCinema.headup.correctCount', '{{count}} richtig', { count: winner.s.correct })}
          </motion.span>
        </motion.div>
      </div>
      <motion.ol className="flex flex-col" style={{ gap: lu(1.4) }} variants={staggerChildren(80)} initial="initial" animate="animate">
        {ranked.map(({ s, seat }, i) => (
          <motion.li key={`${i}:${s.playerName}`} variants={riseIn(reduced)} className={`${tvPanel} flex items-center`}
            style={{ gap: lu(2), padding: `${lu(1.3)} ${lu(2.6)}`, boxShadow: s.correct === best ? playerGlow(HU.gold, 'active') : undefined }}>
            <span className="text-center font-black" style={{ minWidth: '1.8em', fontSize: tvType.body, color: s.correct === best ? HU.gold : HU.dim }}>{s.correct === best ? '👑' : i + 1}</span>
            <TVPlayerAvatar id={seat.id} name={seat.name} avatar={seat.avatar} color={seat.color} size={lu(5.6)} />
            <span className="min-w-0 flex-1 truncate font-bold" style={{ fontSize: tvType.body, color: HU.text }}>{seat.name}</span>
            <span className="font-black tabular-nums" style={{ fontSize: tvType.title, color: '#fff' }}>{s.correct}</span>
          </motion.li>
        ))}
      </motion.ol>
    </div>
  );
}
