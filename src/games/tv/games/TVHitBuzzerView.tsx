import { useEffect, useRef } from 'react';
import { Music2 } from 'lucide-react';
import { tvPanel, tvPanelRaised, tvType } from '../tv-tokens';
import { hitText } from '@/games/hitbuzzer/strings';
import { roundFlowText } from '@/games/hitbuzzer/round-flow-copy';
import type { HitAttempt } from '@/games/hitbuzzer/engine';
import i18n from '@/i18n';
import './tv-hit-buzzer.css';

interface TVPlayer { id: string; name: string; color: string; avatar: string; score: number }

export default function TVHitBuzzerView({ gameState }: { gameState: Record<string, unknown> }) {
  const text = hitText(i18n.language);
  const flowText = roundFlowText(i18n.language);
  const phase = String(gameState?.phase ?? 'loading');
  const round = Number(gameState?.round ?? 1);
  const total = Number(gameState?.totalRounds ?? 15);
  const timeLeft = Number(gameState?.timeLeft ?? 30);
  const answerLeft = Math.max(0, Number(gameState?.answerLeft ?? 0));
  const answerSeconds = Math.max(1, Number(gameState?.answerSeconds ?? 8));
  const answerMode = String(gameState?.answerMode ?? 'both');
  const answerModeLabel = answerMode === 'title' ? flowText.modeTitle : answerMode === 'artist' ? flowText.modeArtist : flowText.modeBoth;
  const buzzedName = typeof gameState?.buzzedName === 'string' ? gameState.buzzedName : null;
  const players = (Array.isArray(gameState?.players) ? gameState.players : []) as TVPlayer[];
  const previewUrl = typeof gameState?.previewUrl === 'string' ? gameState.previewUrl : null;
  const elapsedMs = typeof gameState?.elapsedMs === 'number' ? gameState.elapsedMs : 0;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !previewUrl) return;
    if (phase !== 'listening') { audio.pause(); return; }
    const expected = Math.max(0, elapsedMs / 1000);
    if (Math.abs(audio.currentTime - expected) > 1.5) audio.currentTime = expected;
    if (audio.paused) void audio.play().catch(() => {});
  }, [phase, previewUrl, elapsedMs]);
  useEffect(() => {
    if (phase !== 'listening') return;
    const unlock = () => {
      const audio = audioRef.current;
      if (audio?.paused) void audio.play().catch(() => {});
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [phase]);
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const revealed = phase === 'reveal' || phase === 'gameOver';
  const reveal = revealed && gameState?.reveal && typeof gameState.reveal === 'object'
    ? gameState.reveal as { title?: string; artist?: string; winnerId?: string; delta?: number } : null;
  const winner = players.find(p => p.id === reveal?.winnerId);
  const attempts = revealed && Array.isArray(gameState?.attempts) ? gameState.attempts as HitAttempt[] : [];

  return <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#060810] p-[4vw] text-white">
    <audio ref={audioRef} src={previewUrl ?? undefined} preload="none" className="hidden" aria-hidden />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(223,142,255,0.12),transparent_58%)]" />
    <header className="relative flex items-center justify-between gap-[3vw]">
      <div className="flex items-center gap-[1vw]"><Music2 className="text-[#df8eff]" style={{ width: '3vw', height: '3vw' }} /><span className="font-game font-black" style={{ fontSize: tvType.title }}>{text.name}</span></div>
      <div className={`${tvPanel} px-[2vw] py-[1vh] font-bold text-[#b3a8c9]`} style={{ fontSize: tvType.body }}>{text.round} {round} / {total}</div>
    </header>
    <div className="relative mt-[4vh] grid min-h-0 flex-1 grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)] gap-[2vw]">
      <section className={`${tvPanelRaised} flex min-h-0 flex-col items-center justify-center gap-[2vh] p-[3vw] text-center`}>
        {phase === 'loading' && <><span className="text-[#df8eff]" style={{ fontSize: tvType.body }}>{text.prepare}</span><p className="font-game font-black" style={{ fontSize: tvType.display }}>{text.waitHost}</p></>}
        {phase === 'listening' && <><span className="text-[#df8eff]" style={{ fontSize: tvType.body }}>{text.listen}</span><div className="grid aspect-square w-[min(25vw,35vh)] place-items-center rounded-full border-[1vw] border-[#8ff5ff] bg-[#ff2e88] font-game font-black shadow-[0_0_6vw_rgba(255,46,136,0.3)]" style={{ fontSize: tvType.hero }}>!</div><p className="font-game font-black tabular-nums text-[#8ff5ff]" style={{ fontSize: tvType.display }}>{timeLeft}s</p></>}
        {phase === 'paused' && <p className="font-game font-black text-[#df8eff]" style={{ fontSize: tvType.display }}>{i18n.t('games.connectionPaused')}</p>}
        {phase === 'answering' && <div className={`hitbuzzer-tv-answer ${answerLeft <= 3 ? 'hitbuzzer-tv-answer-urgent' : ''}`}>
          <span className="hitbuzzer-tv-mode">{answerModeLabel}</span>
          <p className="hitbuzzer-tv-player">{buzzedName}</p>
          <div className="hitbuzzer-tv-clock" aria-label={`${answerLeft} ${text.answerTime}`}>
            <span className="hitbuzzer-tv-orbit hitbuzzer-tv-orbit-outer" aria-hidden="true" />
            <span className="hitbuzzer-tv-orbit hitbuzzer-tv-orbit-inner" aria-hidden="true" />
            <svg className="hitbuzzer-tv-ring" viewBox="0 0 260 260" aria-hidden="true">
              <circle cx="130" cy="130" r="112" fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="9" />
              <circle cx="130" cy="130" r="112" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round"
                transform="rotate(-90 130 130)" strokeDasharray={2 * Math.PI * 112}
                strokeDashoffset={2 * Math.PI * 112 * (1 - Math.min(1, answerLeft / answerSeconds))}
                className="hitbuzzer-tv-ring-progress" />
            </svg>
            <span key={answerLeft} className="hitbuzzer-tv-digit">{answerLeft}<small>s</small></span>
          </div>
          <div className="hitbuzzer-tv-beats" aria-hidden="true">{Array.from({ length: answerSeconds }, (_, index) =>
            <span key={index} className={index < answerLeft ? 'hitbuzzer-tv-beat-on' : ''} />)}</div>
          <p className="hitbuzzer-tv-instruction">{answerMode === 'title' ? flowText.sayTitle : answerMode === 'artist' ? flowText.sayArtist : flowText.sayAnswer}</p>
        </div>}
        {phase === 'reviewing' && <div className="hitbuzzer-tv-review"><span className="hitbuzzer-tv-mode">{answerModeLabel}</span><p className="hitbuzzer-tv-player">{buzzedName}</p><p className="hitbuzzer-tv-review-label">{flowText.tvReview}</p></div>}
        {revealed && <><span className="text-[#df8eff]" style={{ fontSize: tvType.body }}>{phase === 'gameOver' ? text.finished : text.songReveal}</span><p className="font-game font-black" style={{ fontSize: tvType.display }}>{reveal?.title}</p><p className="text-[#b3a8c9]" style={{ fontSize: tvType.title }}>{reveal?.artist}</p>{winner && <p className="font-bold text-[#8ff5ff]" style={{ fontSize: tvType.body }}>{winner.name} +{reveal?.delta}</p>}{attempts.length > 0 && <div className="flex max-h-[18vh] w-full flex-wrap items-center justify-center gap-[.8vw] overflow-y-auto">{attempts.map((attempt, index) => <span key={`${attempt.playerId}-${index}`} className={`rounded-full border px-[1.2vw] py-[.6vh] font-bold ${attempt.outcome === 'correct' ? 'border-[#8ff5ff]/35 bg-[#8ff5ff]/10 text-[#8ff5ff]' : 'border-[#ff6b98]/35 bg-[#ff6b98]/10 text-[#ff8bad]'}`} style={{ fontSize: tvType.label }}>{attempt.playerName} {attempt.delta > 0 ? '+' : ''}{attempt.delta}</span>)}</div>}</>}
      </section>
      <aside className={`${tvPanel} flex min-h-0 flex-col p-[2vw]`}><h2 className="mb-[2vh] font-game font-bold text-[#b3a8c9]" style={{ fontSize: tvType.body }}>{text.standings}</h2><ol className="min-h-0 space-y-[1vh] overflow-y-auto">{sorted.map((p, index) => <li key={p.id} className="flex items-center gap-[1vw] rounded-[1vw] bg-[#16101f] p-[1vw]"><span className="text-[#b3a8c9]" style={{ fontSize: tvType.body }}>{index + 1}.</span><span className="grid size-[3vw] shrink-0 place-items-center rounded-full font-bold text-[#060810]" style={{ background: p.color, fontSize: tvType.label }}>{p.avatar}</span><span className="min-w-0 flex-1 truncate font-semibold" style={{ fontSize: tvType.body }}>{p.name}</span><strong className="tabular-nums text-[#8ff5ff]" style={{ fontSize: tvType.body }}>{p.score}</strong></li>)}</ol></aside>
    </div>
  </div>;
}
