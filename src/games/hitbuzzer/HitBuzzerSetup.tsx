import { useTranslation } from 'react-i18next';
import { Play, SlidersHorizontal } from 'lucide-react';
import { PlayerSetup, type PlayerSetupPlayer } from '../ui/PlayerSetup';
import { PremiumImageChoiceCard } from '../ui/PremiumImageChoiceCard';
import { OHRWURM_GENRE_ASSETS, OHRWURM_MODE_ASSETS } from '../ui/premium-game-assets';
import { OHRWURM_GENRES } from '../ohrwurm/ohrwurm-content';
import { StageAction } from '../ui/GameStage';
import { TeamFormation } from '../ui/TeamFormation';
import { randomTeamAssignments } from '../ui/random-teams';
import { HIT_TEAM_IDS, teamForPlayer } from './setup-roster';
import type { HitConfig } from './engine';
import type { hitText } from './strings';

type SetupText = ReturnType<typeof hitText>;

interface HitBuzzerSetupProps {
  text: SetupText;
  config: HitConfig;
  setConfig: React.Dispatch<React.SetStateAction<HitConfig>>;
  players: PlayerSetupPlayer[];
  locked: boolean;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onImportNames: (names: string[]) => void;
  teamMode: boolean;
  setTeamMode: (value: boolean) => void;
  teams: Record<string, string>;
  setTeams: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  teamCount: number;
  setTeamCount: React.Dispatch<React.SetStateAction<number>>;
  teamNames: Record<string, string>;
  setTeamNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onStart: () => void;
  busy: boolean;
}

const accent = '#df8eff';
const selected = 'border-[#df8eff] bg-[#df8eff]/15 text-white shadow-[0_0_0_1px_rgba(223,142,255,0.2)]';
const idle = 'border-white/10 bg-[#21182e] text-white/70 hover:border-white/30 hover:text-white';

const teamColors = ['#df8eff', '#8ff5ff', '#ff2e88', '#f9ca24'];

export function HitBuzzerSetup({ text, config, setConfig, players, locked, onAdd, onRemove, onRename, onImportNames, teamMode, setTeamMode, teams, setTeams, teamCount, setTeamCount, teamNames, setTeamNames, onStart, busy }: HitBuzzerSetupProps) {
  const { t } = useTranslation();
  const assignedTeam = (playerId: string, index: number) => teamForPlayer(playerId, index, teams, teamCount);
  const formedTeams = HIT_TEAM_IDS.slice(0, teamCount).map((teamId, index) => ({
    id: teamId, name: teamNames[teamId] ?? `${text.team} ${teamId}`, color: teamColors[index],
    members: players.filter((player, playerIndex) => assignedTeam(player.id, playerIndex) === teamId)
      .map(player => ({ id: player.id, name: player.name || text.player })),
  }));
  const canStart = players.length >= 2 && players.every(player => !!player.name.trim())
    && (!teamMode || formedTeams.every(team => !!team.name.trim() && team.members.length > 0));
  const shuffleTeams = () => {
    const current = Object.fromEntries(players.map((player, index) => [player.id, HIT_TEAM_IDS.indexOf(assignedTeam(player.id, index) as typeof HIT_TEAM_IDS[number])]));
    const shuffled = randomTeamAssignments(players.map(player => player.id), teamCount, current);
    setTeams(Object.fromEntries(Object.entries(shuffled).map(([playerId, index]) => [playerId, HIT_TEAM_IDS[index]])));
  };
  const moveMember = (playerId: string) => {
    const index = players.findIndex(player => player.id === playerId);
    if (index < 0) return;
    const current = HIT_TEAM_IDS.indexOf(assignedTeam(playerId, index) as typeof HIT_TEAM_IDS[number]);
    setTeams(previous => ({ ...previous, [playerId]: HIT_TEAM_IDS[(current + 1) % teamCount] }));
  };
  const addTeam = () => {
    if (teamCount >= 4 || teamCount >= players.length) return;
    const largest = formedTeams.reduce((best, team, index) => team.members.length > formedTeams[best].members.length ? index : best, 0);
    const moving = formedTeams[largest].members.at(-1);
    if (moving) setTeams(previous => ({ ...previous, [moving.id]: HIT_TEAM_IDS[teamCount] }));
    setTeamCount(teamCount + 1);
  };
  const removeTeam = () => {
    if (teamCount <= 2) return;
    const removed = HIT_TEAM_IDS[teamCount - 1];
    setTeams(previous => ({ ...previous, ...Object.fromEntries(formedTeams[teamCount - 1].members.map((member, index) => [member.id, HIT_TEAM_IDS[index % (teamCount - 1)]])) }));
    setTeamNames(previous => { const next = { ...previous }; delete next[removed]; return next; });
    setTeamCount(teamCount - 1);
  };
  const goalByScore = config.targetScore !== null;
  const chooseGoal = (byScore: boolean) => setConfig(previous => ({ ...previous, targetScore: byScore ? previous.targetScore ?? 750 : null }));

  return <div className="space-y-8 pb-4 font-game sm:space-y-10" data-testid="hitbuzzer-setup">
    <section className="relative isolate min-h-[280px] overflow-hidden rounded-[32px] border border-white/10 bg-[#16101f] shadow-[0_24px_70px_rgba(0,0,0,0.38)] sm:min-h-[340px]">
      <img src={config.genre ? OHRWURM_GENRE_ASSETS[config.genre] : '/images/games/hit-buzzer.webp'} alt="" aria-hidden="true" className={`absolute inset-0 h-full w-full object-cover ${config.genre ? 'object-center' : 'object-[center_74%]'}`} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#090711]/85 via-[#090711]/10 to-[#090711]/30 sm:bg-gradient-to-t sm:from-[#090711] sm:via-[#090711]/60 sm:to-[#090711]/5" />
      <div className="relative flex min-h-[280px] flex-col justify-start p-6 sm:min-h-[340px] sm:justify-end sm:p-9">
        <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[#8ff5ff]">{text.eyebrow}</p>
        <h1 className="text-[clamp(2.9rem,9vw,5.5rem)] font-black leading-[0.91] tracking-[-0.07em] text-white drop-shadow-[0_4px_22px_rgba(0,0,0,0.55)]">{text.name}</h1>
        <p className="mt-4 max-w-lg text-sm font-semibold leading-relaxed text-white/80 sm:text-base">{text.tagline}</p>
      </div>
    </section>

    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-9">
      <div className="min-w-0 space-y-8">
        <section className="min-w-0" aria-label={t('games.ohrwurm.players')}>
          <PlayerSetup players={players} locked={locked} onAdd={onAdd} onRemove={onRemove} onRename={onRename}
            onImportNames={locked ? undefined : onImportNames}
            min={locked ? players.length : 2} max={locked ? players.length : 20} accent={accent}
            label={locked ? t('games.ohrwurm.inRoom') : t('games.ohrwurm.players')} maxNameLength={16} />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold text-white/65">{t('games.ohrwurm.sectionMode')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <PremiumImageChoiceCard title={t('games.ohrwurm.modeSoloLabel')} image={OHRWURM_MODE_ASSETS.solo}
              selected={!teamMode} onClick={() => setTeamMode(false)} accent={accent} />
            <PremiumImageChoiceCard title={t('games.ohrwurm.modeGroupLabel')} image={OHRWURM_MODE_ASSETS.group}
              selected={teamMode} onClick={() => setTeamMode(true)} accent={accent} />
          </div>
          {teamMode && <div className="mt-4 space-y-4 rounded-[24px] border border-white/10 bg-[#16101f] p-4" data-testid="hitbuzzer-team-setup">
            <TeamFormation teams={formedTeams} title={t('games.ohrwurm.formTeams')} hint={t('games.pantomime.tapToSwap')}
              shuffleLabel={t('games.splitquiz.reshuffleTeams')} emptyLabel={t('games.ohrwurm.emptyTeam')}
              renameLabel={index => t('games.ohrwurm.nameTeam', { n: index + 1 })}
              onShuffle={shuffleTeams} onMove={moveMember}
              onRename={(index, name) => setTeamNames(previous => ({ ...previous, [HIT_TEAM_IDS[index]]: name }))}
              surface="#21182e" elevated="#0d0915" text="#ffffff" muted="#b3a8c9" />
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={addTeam} disabled={teamCount >= 4 || teamCount >= players.length}
                className="min-h-11 rounded-xl border border-[#df8eff]/40 px-3 text-xs font-bold text-[#df8eff] disabled:opacity-40">+ {t('games.ohrwurm.addTeam')}</button>
              {teamCount > 2 && <button type="button" onClick={removeTeam} className="min-h-11 px-3 text-xs font-bold text-white/60">{t('games.ohrwurm.removeLastTeam')}</button>}
            </div>
          </div>}
        </section>
      </div>

      <div className="min-w-0 space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-bold text-white/65">{text.goal}</h2>
          <div className="rounded-[28px] border border-white/10 bg-[#16101f] p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" aria-pressed={!goalByScore} onClick={() => chooseGoal(false)} className={`min-h-12 rounded-2xl border px-3 text-sm font-bold transition-colors ${!goalByScore ? selected : idle}`}>{text.roundGoal}</button>
              <button type="button" aria-pressed={goalByScore} onClick={() => chooseGoal(true)} className={`min-h-12 rounded-2xl border px-3 text-sm font-bold transition-colors ${goalByScore ? selected : idle}`}>{text.points}</button>
            </div>
            <div className="mt-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-white/45">{goalByScore ? text.points : text.rounds}</p>
              <div className="grid grid-cols-3 gap-2">
                {(goalByScore ? [500, 750, 1000] : [10, 15, 25]).map(value => <button key={value} type="button"
                  aria-pressed={goalByScore ? config.targetScore === value : config.rounds === value}
                  onClick={() => setConfig(previous => goalByScore ? { ...previous, targetScore: value } : { ...previous, rounds: value })}
                  className={`min-h-20 rounded-2xl border px-1 text-center transition-colors ${goalByScore ? config.targetScore === value ? selected : idle : config.rounds === value ? selected : idle}`}>
                  <span className="block text-xl font-black tabular-nums sm:text-2xl">{value}</span>
                  <span className="mt-0.5 block text-[11px] font-semibold opacity-70">{goalByScore ? text.points : text.rounds}</span>
                </button>)}
              </div>
            </div>
          </div>
        </section>

        <details className="group rounded-[28px] border border-white/10 bg-[#16101f] p-4 open:border-[#df8eff]/25 sm:p-5">
          <summary className="flex min-h-8 cursor-pointer list-none items-center gap-3 text-sm font-bold text-white/80 [&::-webkit-details-marker]:hidden">
            <SlidersHorizontal className="h-5 w-5 text-[#8ff5ff]" aria-hidden="true" />
            {text.answerTime} · {text.penalty}
            <span className="ml-auto text-xl font-light leading-none text-[#df8eff] group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <div className="space-y-5 border-t border-white/10 pt-5 mt-4">
            <SettingChoices title={text.answerTime} values={[5, 8, 12]} selectedValue={config.answerSeconds}
              format={value => `${value} s`} onChoose={value => setConfig(previous => ({ ...previous, answerSeconds: value }))} />
            <SettingChoices title={text.penalty} values={[0, 10, 20, 30]} selectedValue={config.penalty}
              format={value => `−${value}`} onChoose={value => setConfig(previous => ({ ...previous, penalty: value }))} />
            <button type="button" role="switch" aria-checked={config.constantPoints} onClick={() => setConfig(previous => ({ ...previous, constantPoints: !previous.constantPoints }))}
              className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#21182e] px-4 text-left text-sm font-semibold text-white/80">
              {text.constantPoints}<span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${config.constantPoints ? 'bg-[#df8eff]' : 'bg-white/20'}`}><span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${config.constantPoints ? 'translate-x-5' : ''}`} /></span>
            </button>
          </div>
        </details>
      </div>
    </div>

    <section>
      <h2 className="mb-3 text-sm font-bold text-white/65">{text.genre} <span className="font-normal text-white/35">({t('games.ohrwurm.optional')})</span></h2>
      <PremiumImageChoiceCard title={text.allGenres} image={OHRWURM_MODE_ASSETS.solo} selected={config.genre === null}
        onClick={() => setConfig(previous => ({ ...previous, genre: null }))} accent="#8ff5ff" layout="wide" className="mb-3 !min-h-[142px]" />
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {OHRWURM_GENRES.map(genre => <PremiumImageChoiceCard key={genre} title={genre} image={OHRWURM_GENRE_ASSETS[genre]}
          selected={config.genre === genre} onClick={() => setConfig(previous => ({ ...previous, genre }))}
          accent="#8ff5ff" className="!w-[148px] min-w-[148px] shrink-0 snap-start sm:!w-full sm:min-w-0" />)}
      </div>
    </section>

    <StageAction onClick={onStart} disabled={busy || !canStart} className="!min-h-16 w-full !rounded-full text-base shadow-[0_14px_40px_rgba(223,142,255,0.2)]"><Play className="h-5 w-5" aria-hidden="true" />{busy ? text.loading : text.start}</StageAction>
  </div>;
}

function SettingChoices({ title, values, selectedValue, format, onChoose }: { title: string; values: number[]; selectedValue: number; format: (value: number) => string; onChoose: (value: number) => void }) {
  return <div><p className="mb-2 text-xs font-bold text-white/55">{title}</p><div className="flex flex-wrap gap-2">{values.map(value => <button key={value} type="button" aria-pressed={selectedValue === value} onClick={() => onChoose(value)} className={`min-h-11 min-w-14 rounded-xl border px-3 text-sm font-bold transition-colors ${selectedValue === value ? selected : idle}`}>{format(value)}</button>)}</div></div>;
}
