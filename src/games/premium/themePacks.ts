export interface ThemePack {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: string;
  games: string[];
  contentCount: number;
}

export const THEME_PACKS: ThemePack[] = [
  {
    id: 'weihnachten',
    name: 'Weihnachts-Edition',
    description: '200 festliche Fragen & Aufgaben',
    icon: '\uD83C\uDF84',
    price: '0,99\u20AC',
    games: ['bomb', 'taboo', 'headup'],
    contentCount: 200,
  },
  {
    id: '80er',
    name: '80er Jahre Quiz',
    description: 'Retro-Fragen aus den 80ern',
    icon: '\uD83D\uDD7A',
    price: '0,99\u20AC',
    games: ['bomb', 'split-quiz'],
    contentCount: 150,
  },
  {
    id: 'halloween',
    name: 'Halloween Special',
    description: 'Gruselige Fragen & Aufgaben',
    icon: '\uD83C\uDF83',
    price: '0,99\u20AC',
    games: ['bomb', 'taboo', 'wahrheit-pflicht'],
    contentCount: 180,
  },
  {
    id: 'jga-deluxe',
    name: 'JGA Deluxe',
    description: '300 JGA-Fragen & Aufgaben',
    icon: '\uD83D\uDC8D',
    price: '1,99\u20AC',
    games: ['flaschendrehen', 'wahrheit-pflicht'],
    contentCount: 300,
  },
  {
    id: 'firmen',
    name: 'Business & Teambuilding',
    description: 'Professionelle Eisbrecher',
    icon: '\uD83D\uDCBC',
    price: '1,99\u20AC',
    games: ['bomb', 'taboo', 'this-or-that'],
    contentCount: 250,
  },
  {
    id: 'silvester',
    name: 'Silvester & Neujahr',
    description: 'Party-Fragen zum Jahreswechsel',
    icon: '\uD83C\uDF86',
    price: '0,99\u20AC',
    games: ['bomb', 'flaschendrehen', 'wahrheit-pflicht'],
    contentCount: 160,
  },
  {
    id: 'sommer',
    name: 'Sommer & Festival',
    description: 'Open-Air-Stimmung pur',
    icon: '\u2600\uFE0F',
    price: '0,99\u20AC',
    games: ['bomb', 'this-or-that', 'headup'],
    contentCount: 170,
  },
];

export function getPacksForGame(gameId: string): ThemePack[] {
  return THEME_PACKS.filter((pack) => pack.games.includes(gameId));
}
