export interface CategoryPrompt {
  category: string;
  letter?: string;
}

const CATEGORY_NAMES = [
  'Tiere', 'Länder', 'Städte', 'Berufe', 'Sportarten', 'Filme',
  'Serien', 'Marken', 'Obstsorten', 'Gemüsesorten', 'Automarken',
  'Farben', 'Musikinstrumente', 'Getränke', 'Süßigkeiten',
  'Schulfächer', 'Sprachen', 'Blumen', 'Bäume', 'Gewürze',
  'Kleidungsstücke', 'Möbelstücke', 'Körperteile', 'Werkzeuge',
  'Musikbands', 'Comicfiguren', 'Superhelden', 'Disney-Figuren',
  'Küchengeräte', 'Ballsportarten', 'Wassersportarten',
  'Wintersportarten', 'Säugetiere', 'Vögel', 'Fische',
  'Insekten', 'Europäische Hauptstädte', 'Deutsche Städte',
  'Pizzabeläge', 'Cocktails', 'Brotsorten', 'Käsesorten',
  'Tanzstile', 'Kartenspiele', 'Brettspiele', 'Videospiele',
  'Kräuter', 'Nüsse', 'Minerale', 'Stoffarten',
];

const LETTERS = 'ABCDEFGHIKLMNOPRSTUVW'.split('');

export function generateCategoryPrompt(): CategoryPrompt {
  const category = CATEGORY_NAMES[Math.floor(Math.random() * CATEGORY_NAMES.length)];
  const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  return { category, letter };
}

export const CATEGORIES_DE = CATEGORY_NAMES;
