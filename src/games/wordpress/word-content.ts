export const WORD_LANGUAGES = ['de', 'en', 'fr', 'it', 'es', 'pt', 'nl', 'pl', 'tr', 'ar'] as const;
export type WordLanguage = typeof WORD_LANGUAGES[number];
export interface WordPack { animals: string[]; food: string[]; objects: string[]; colors: string[] }
// Every color occupies the same semantic slot in every language. Labels never determine scoring.
export const COLOR_HEX = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#ec4899', '#f8fafc', '#111111', '#a16207'];
const make = (animals: string, food: string, objects: string, colors: string): WordPack => ({ animals: animals.split('|'), food: food.split('|'), objects: objects.split('|'), colors: colors.split('|') });
export const WORD_PACKS: Record<WordLanguage, WordPack> = {
  de: make('Hund|Katze|Elefant|Löwe|Adler|Delfin|Tiger|Pinguin|Fuchs|Hase|Bär|Pferd|Affe|Wolf|Schlange|Papagei|Krokodil|Giraffe|Wal|Frosch',
    'Pizza|Apfel|Kuchen|Sushi|Brot|Nudeln|Schokolade|Banane|Käse|Wurst|Salat|Eis|Suppe|Steak|Reis|Kartoffel|Tomate|Brezel|Torte|Keks',
    'Tisch|Lampe|Auto|Fenster|Stuhl|Buch|Telefon|Schuh|Brille|Tasche|Uhr|Schlüssel|Stern|Wolke|Berg|Fluss|Mond|Sonne|Blume|Baum',
    'Rot|Blau|Grün|Gelb|Lila|Orange|Rosa|Weiß|Schwarz|Braun'),
  en: make('Dog|Cat|Elephant|Lion|Eagle|Dolphin|Tiger|Penguin|Fox|Hare|Bear|Horse|Monkey|Wolf|Snake|Parrot|Crocodile|Giraffe|Whale|Frog',
    'Pizza|Apple|Cake|Sushi|Bread|Pasta|Chocolate|Banana|Cheese|Sausage|Salad|Ice cream|Soup|Steak|Rice|Potato|Tomato|Pretzel|Tart|Cookie',
    'Table|Lamp|Car|Window|Chair|Book|Phone|Shoe|Glasses|Bag|Clock|Key|Star|Cloud|Mountain|River|Moon|Sun|Flower|Tree',
    'Red|Blue|Green|Yellow|Purple|Orange|Pink|White|Black|Brown'),
  fr: make('Chien|Chat|Éléphant|Lion|Aigle|Dauphin|Tigre|Manchot|Renard|Lièvre|Ours|Cheval|Singe|Loup|Serpent|Perroquet|Crocodile|Girafe|Baleine|Grenouille',
    'Pizza|Pomme|Gâteau|Sushi|Pain|Pâtes|Chocolat|Banane|Fromage|Saucisse|Salade|Glace|Soupe|Steak|Riz|Pomme de terre|Tomate|Bretzel|Tarte|Biscuit',
    'Table|Lampe|Voiture|Fenêtre|Chaise|Livre|Téléphone|Chaussure|Lunettes|Sac|Horloge|Clé|Étoile|Nuage|Montagne|Rivière|Lune|Soleil|Fleur|Arbre',
    'Rouge|Bleu|Vert|Jaune|Violet|Orange|Rose|Blanc|Noir|Marron'),
  it: make('Cane|Gatto|Elefante|Leone|Aquila|Delfino|Tigre|Pinguino|Volpe|Lepre|Orso|Cavallo|Scimmia|Lupo|Serpente|Pappagallo|Coccodrillo|Giraffa|Balena|Rana',
    'Pizza|Mela|Torta|Sushi|Pane|Pasta|Cioccolato|Banana|Formaggio|Salsiccia|Insalata|Gelato|Zuppa|Bistecca|Riso|Patata|Pomodoro|Brezel|Crostata|Biscotto',
    'Tavolo|Lampada|Auto|Finestra|Sedia|Libro|Telefono|Scarpa|Occhiali|Borsa|Orologio|Chiave|Stella|Nuvola|Montagna|Fiume|Luna|Sole|Fiore|Albero',
    'Rosso|Blu|Verde|Giallo|Viola|Arancione|Rosa|Bianco|Nero|Marrone'),
  es: make('Perro|Gato|Elefante|León|Águila|Delfín|Tigre|Pingüino|Zorro|Liebre|Oso|Caballo|Mono|Lobo|Serpiente|Loro|Cocodrilo|Jirafa|Ballena|Rana',
    'Pizza|Manzana|Bizcocho|Sushi|Pan|Pasta|Chocolate|Plátano|Queso|Salchicha|Ensalada|Helado|Sopa|Bistec|Arroz|Patata|Tomate|Bretzel|Tarta|Galleta',
    'Mesa|Lámpara|Coche|Ventana|Silla|Libro|Teléfono|Zapato|Gafas|Bolsa|Reloj|Llave|Estrella|Nube|Montaña|Río|Luna|Sol|Flor|Árbol',
    'Rojo|Azul|Verde|Amarillo|Morado|Naranja|Rosa|Blanco|Negro|Marrón'),
  pt: make('Cão|Gato|Elefante|Leão|Águia|Golfinho|Tigre|Pinguim|Raposa|Lebre|Urso|Cavalo|Macaco|Lobo|Cobra|Papagaio|Crocodilo|Girafa|Baleia|Rã',
    'Pizza|Maçã|Bolo|Sushi|Pão|Massa|Chocolate|Banana|Queijo|Salsicha|Salada|Gelado|Sopa|Bife|Arroz|Batata|Tomate|Pretzel|Tarte|Bolacha',
    'Mesa|Candeeiro|Carro|Janela|Cadeira|Livro|Telefone|Sapato|Óculos|Saco|Relógio|Chave|Estrela|Nuvem|Montanha|Rio|Lua|Sol|Flor|Árvore',
    'Vermelho|Azul|Verde|Amarelo|Roxo|Laranja|Rosa|Branco|Preto|Castanho'),
  nl: make('Hond|Kat|Olifant|Leeuw|Adelaar|Dolfijn|Tijger|Pinguïn|Vos|Haas|Beer|Paard|Aap|Wolf|Slang|Papegaai|Krokodil|Giraf|Walvis|Kikker',
    'Pizza|Appel|Cake|Sushi|Brood|Pasta|Chocolade|Banaan|Kaas|Worst|Salade|IJs|Soep|Biefstuk|Rijst|Aardappel|Tomaat|Pretzel|Taart|Koekje',
    'Tafel|Lamp|Auto|Raam|Stoel|Boek|Telefoon|Schoen|Bril|Tas|Klok|Sleutel|Ster|Wolk|Berg|Rivier|Maan|Zon|Bloem|Boom',
    'Rood|Blauw|Groen|Geel|Paars|Oranje|Roze|Wit|Zwart|Bruin'),
  pl: make('Pies|Kot|Słoń|Lew|Orzeł|Delfin|Tygrys|Pingwin|Lis|Zając|Niedźwiedź|Koń|Małpa|Wilk|Wąż|Papuga|Krokodyl|Żyrafa|Wieloryb|Żaba',
    'Pizza|Jabłko|Ciasto|Sushi|Chleb|Makaron|Czekolada|Banan|Ser|Kiełbasa|Sałatka|Lody|Zupa|Stek|Ryż|Ziemniak|Pomidor|Precel|Tort|Ciastko',
    'Stół|Lampa|Samochód|Okno|Krzesło|Książka|Telefon|But|Okulary|Torba|Zegar|Klucz|Gwiazda|Chmura|Góra|Rzeka|Księżyc|Słońce|Kwiat|Drzewo',
    'Czerwony|Niebieski|Zielony|Żółty|Fioletowy|Pomarańczowy|Różowy|Biały|Czarny|Brązowy'),
  tr: make('Köpek|Kedi|Fil|Aslan|Kartal|Yunus|Kaplan|Penguen|Tilki|Tavşan|Ayı|At|Maymun|Kurt|Yılan|Papağan|Timsah|Zürafa|Balina|Kurbağa',
    'Pizza|Elma|Kek|Suşi|Ekmek|Makarna|Çikolata|Muz|Peynir|Sosis|Salata|Dondurma|Çorba|Biftek|Pirinç|Patates|Domates|Simit|Turta|Kurabiye',
    'Masa|Lamba|Araba|Pencere|Sandalye|Kitap|Telefon|Ayakkabı|Gözlük|Çanta|Saat|Anahtar|Yıldız|Bulut|Dağ|Nehir|Ay|Güneş|Çiçek|Ağaç',
    'Kırmızı|Mavi|Yeşil|Sarı|Mor|Turuncu|Pembe|Beyaz|Siyah|Kahverengi'),
  ar: make('كلب|قطة|فيل|أسد|نسر|دلفين|نمر|بطريق|ثعلب|أرنب|دب|حصان|قرد|ذئب|أفعى|ببغاء|تمساح|زرافة|حوت|ضفدع',
    'بيتزا|تفاحة|كعكة|سوشي|خبز|معكرونة|شوكولاتة|موز|جبن|نقانق|سلطة|مثلجات|حساء|شريحة لحم|أرز|بطاطا|طماطم|بريتزل|فطيرة|بسكويت',
    'طاولة|مصباح|سيارة|نافذة|كرسي|كتاب|هاتف|حذاء|نظارة|حقيبة|ساعة|مفتاح|نجمة|سحابة|جبل|نهر|قمر|شمس|زهرة|شجرة',
    'أحمر|أزرق|أخضر|أصفر|بنفسجي|برتقالي|وردي|أبيض|أسود|بني'),
};
export function wordLanguage(language?: string): WordLanguage {
  const base = language?.toLowerCase().split(/[-_]/)[0];
  return WORD_LANGUAGES.includes(base as WordLanguage) ? base as WordLanguage : 'de';
}
export function getWordPack(language?: string) { return WORD_PACKS[wordLanguage(language)]; }
export function translateReactionWord(text: string, sourceLanguage?: string, targetLanguage?: string): string {
  const source = getWordPack(sourceLanguage), target = getWordPack(targetLanguage);
  for (const group of ['animals', 'food', 'objects', 'colors'] as const) {
    const index = source[group].indexOf(text);
    if (index !== -1) return target[group][index];
  }
  return text;
}
export function forbiddenWords(pack: WordPack) {
  return [pack.animals[0], pack.food[0], pack.colors[1], pack.objects[1], pack.animals[1], pack.food[1], pack.colors[0], pack.objects[12]];
}
export type ReactionMode = 'kategorie' | 'stroop' | 'verboten' | 'speed-rush';
export interface ReactionWord { text: string; isTarget: boolean; displayColor?: string }
export function generateWord(mode: ReactionMode, forbiddenWord: string, pack: WordPack, random = Math.random): ReactionWord {
  const from = <T,>(items: T[]) => items[Math.floor(random() * items.length)];
  if (mode === 'stroop') {
    const index = Math.floor(random() * pack.colors.length);
    const isTarget = random() < .35;
    const colorIndex = isTarget ? index : from(pack.colors.map((_, i) => i).filter(i => i !== index));
    return { text: pack.colors[index], displayColor: COLOR_HEX[colorIndex], isTarget };
  }
  if (mode === 'verboten') {
    const allowed = [...pack.animals, ...pack.food, ...pack.objects, ...pack.colors].filter(word => word !== forbiddenWord);
    const text = random() < .35 ? forbiddenWord : from(allowed);
    return { text, isTarget: text !== forbiddenWord };
  }
  const isTarget = random() < (mode === 'speed-rush' ? .45 : .4);
  return { text: from(isTarget ? pack.animals : [...pack.food, ...pack.colors, ...pack.objects]), isTarget };
}
