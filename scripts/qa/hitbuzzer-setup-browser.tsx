import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GameStage } from '@/games/ui/GameStage';
import { HitBuzzerSetup } from '@/games/hitbuzzer/HitBuzzerSetup';
import { DEFAULT_CONFIG } from '@/games/hitbuzzer/engine';
import { hitText } from '@/games/hitbuzzer/strings';
import i18n, { i18nInitPromise, loadLocale } from '@/i18n';
import '@/index.css';

await i18nInitPromise;
await loadLocale('de');
await i18n.changeLanguage('de');

function Preview() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [teamMode, setTeamMode] = useState(false);
  const [teams, setTeams] = useState<Record<string, string>>({});
  const [teamCount, setTeamCount] = useState(2);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const players = [{ id: 'a', name: 'Mia' }, { id: 'b', name: 'Alex' }, { id: 'c', name: 'Sam' }];
  return <GameStage gameId="hitbuzzer"><main className="mx-auto max-w-5xl bg-[#060810] px-4 py-6 text-white">
    <HitBuzzerSetup text={hitText('de')} config={config} setConfig={setConfig} players={players} locked
      onAdd={() => {}} onRemove={() => {}} onRename={() => {}} onImportNames={() => {}}
      teamMode={teamMode} setTeamMode={setTeamMode} teams={teams} setTeams={setTeams}
      teamCount={teamCount} setTeamCount={setTeamCount} teamNames={teamNames} setTeamNames={setTeamNames}
      onStart={() => {}} onOpenRules={() => {}} busy={false} />
  </main></GameStage>;
}

createRoot(document.getElementById('root')!).render(<Preview />);
