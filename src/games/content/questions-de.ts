export interface QuizQuestion {
  question: string;
  answers: [string, string, string, string];
  correctIndex: number;
}

export const QUIZ_QUESTIONS_DE: QuizQuestion[] = [
  { question: 'Wie heißt die Hauptstadt von Australien?', answers: ['Sydney', 'Canberra', 'Melbourne', 'Brisbane'], correctIndex: 1 },
  { question: 'Welches ist das größte Organ des Menschen?', answers: ['Leber', 'Gehirn', 'Haut', 'Lunge'], correctIndex: 2 },
  { question: 'In welchem Jahr fiel die Berliner Mauer?', answers: ['1987', '1989', '1990', '1991'], correctIndex: 1 },
  { question: 'Wie viele Bundesländer hat Deutschland?', answers: ['14', '15', '16', '17'], correctIndex: 2 },
  { question: 'Welches Tier kann am längsten ohne Wasser überleben?', answers: ['Kamel', 'Kängururatte', 'Elefant', 'Schildkröte'], correctIndex: 1 },
  { question: 'Welcher Planet ist der größte in unserem Sonnensystem?', answers: ['Saturn', 'Neptun', 'Jupiter', 'Uranus'], correctIndex: 2 },
  { question: 'Wie heißt die längste Autobahn Deutschlands?', answers: ['A1', 'A7', 'A3', 'A9'], correctIndex: 1 },
  { question: 'Welches Land hat die meisten Einwohner?', answers: ['Indien', 'USA', 'China', 'Indonesien'], correctIndex: 0 },
  { question: 'Was ist die chemische Formel für Wasser?', answers: ['HO2', 'H2O', 'H2O2', 'OH'], correctIndex: 1 },
  { question: 'Welches Tier ist das schnellste an Land?', answers: ['Löwe', 'Gepard', 'Antilope', 'Windhund'], correctIndex: 1 },
  { question: 'In welcher Stadt steht der Eiffelturm?', answers: ['London', 'Rom', 'Berlin', 'Paris'], correctIndex: 3 },
  { question: 'Wie viele Zähne hat ein erwachsener Mensch normalerweise?', answers: ['28', '30', '32', '34'], correctIndex: 2 },
  { question: 'Welcher Ozean ist der größte?', answers: ['Atlantik', 'Indischer Ozean', 'Pazifik', 'Arktischer Ozean'], correctIndex: 2 },
  { question: 'Wer malte die Mona Lisa?', answers: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Rembrandt'], correctIndex: 1 },
  { question: 'Was ist die Hauptstadt von Japan?', answers: ['Osaka', 'Kyoto', 'Tokio', 'Yokohama'], correctIndex: 2 },
  { question: 'Wie viele Kontinente gibt es?', answers: ['5', '6', '7', '8'], correctIndex: 2 },
  { question: 'Welches Element hat das Symbol "Fe"?', answers: ['Fluor', 'Eisen', 'Francium', 'Fermium'], correctIndex: 1 },
  { question: 'Wer schrieb "Faust"?', answers: ['Schiller', 'Goethe', 'Lessing', 'Heine'], correctIndex: 1 },
  { question: 'Wie heißt der höchste Berg der Welt?', answers: ['K2', 'Kangchendzönga', 'Mount Everest', 'Makalu'], correctIndex: 2 },
  { question: 'Welche Farbe hat ein Smaragd?', answers: ['Blau', 'Rot', 'Grün', 'Gelb'], correctIndex: 2 },
  { question: 'Wie viele Spieler hat eine Fußballmannschaft?', answers: ['9', '10', '11', '12'], correctIndex: 2 },
  { question: 'In welchem Land liegt Machu Picchu?', answers: ['Bolivien', 'Peru', 'Kolumbien', 'Ecuador'], correctIndex: 1 },
  { question: 'Welches Gas atmen Pflanzen hauptsächlich ein?', answers: ['Sauerstoff', 'Stickstoff', 'CO2', 'Helium'], correctIndex: 2 },
  { question: 'Wie heißt der längste Fluss der Welt?', answers: ['Amazonas', 'Nil', 'Mississippi', 'Jangtse'], correctIndex: 1 },
  { question: 'In welchem Jahr wurde das iPhone vorgestellt?', answers: ['2005', '2006', '2007', '2008'], correctIndex: 2 },
  { question: 'Welches Land ist flächenmäßig das größte der Welt?', answers: ['Kanada', 'China', 'USA', 'Russland'], correctIndex: 3 },
  { question: 'Welche Blutgruppe ist die seltenste?', answers: ['A negativ', 'O negativ', 'AB negativ', 'B negativ'], correctIndex: 2 },
  { question: 'Was bedeutet "www" im Internet?', answers: ['World Wide Web', 'Western World Web', 'Wide World Web', 'World Web Wide'], correctIndex: 0 },
  { question: 'Welches Vitamin produziert der Körper durch Sonnenlicht?', answers: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin B12'], correctIndex: 2 },
  { question: 'Wie viele Herzkammern hat ein Mensch?', answers: ['2', '3', '4', '5'], correctIndex: 2 },
];

let _usedIndices: Set<number> = new Set();

export function getRandomQuestion(): QuizQuestion {
  if (_usedIndices.size >= QUIZ_QUESTIONS_DE.length) {
    _usedIndices.clear();
  }
  let idx: number;
  do {
    idx = Math.floor(Math.random() * QUIZ_QUESTIONS_DE.length);
  } while (_usedIndices.has(idx));
  _usedIndices.add(idx);
  return QUIZ_QUESTIONS_DE[idx];
}

export function resetQuestions(): void {
  _usedIndices.clear();
}
