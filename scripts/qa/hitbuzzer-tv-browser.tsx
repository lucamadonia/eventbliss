import { createRoot } from 'react-dom/client';
import TVHitBuzzerView from '@/games/tv/games/TVHitBuzzerView';
import i18n, { i18nInitPromise, loadLocale } from '@/i18n';
import '@/index.css';

await i18nInitPromise;
await loadLocale('de');
await i18n.changeLanguage('de');
const view = new URLSearchParams(location.search).get('view');
const revealed = view === 'reveal';
const players = [
  { id: 'a', name: 'Mia', avatar: 'M', color: '#df8eff', score: -20 },
  { id: 'b', name: 'Alex', avatar: 'A', color: '#8ff5ff', score: 86 },
  { id: 'c', name: 'Sam', avatar: 'S', color: '#ff6b98', score: 0 },
];
createRoot(document.getElementById('root')!).render(<TVHitBuzzerView gameState={revealed ? {
  phase: 'reveal', round: 3, totalRounds: 15, players,
  reveal: { artist: 'ABBA', title: 'Dancing Queen', winnerId: 'b', delta: 86 },
  attempts: [
    { playerId: 'a', playerName: 'Mia', outcome: 'wrong', delta: -20 },
    { playerId: 'b', playerName: 'Alex', outcome: 'correct', delta: 86 },
  ],
} : { phase: view === 'reviewing' ? 'reviewing' : 'answering', round: 3, totalRounds: 15, players,
  buzzedName: 'Mia', answerLeft: 3, answerSeconds: 8, answerMode: 'title' }} />);
