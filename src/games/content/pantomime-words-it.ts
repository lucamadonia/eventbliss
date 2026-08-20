/**
 * OHNE WORTE — Begriffe auf Italienisch.
 *
 * Das hier ist eine ANPASSUNG, keine Übersetzung. Ein Begriff taugt nur dann,
 * wenn er sich OHNE Ton und OHNE Requisit darstellen lässt UND im italienischen
 * Kulturraum bekannt ist. Wörtlich übersetzte deutsche Begriffe erfüllen
 * regelmäßig nur die erste Hälfte davon.
 *
 * Konkret heißt das:
 * - Redewendungen (`sprichwoerter`) sind KEINE Übersetzungen der deutschen
 *   Vorlage, sondern 50 gängige italienische Redewendungen — „Avere le mani
 *   bucate" statt einer sinnfreien Wort-für-Wort-Fassung von „Schwein haben".
 * - Filmtitel (`filme`) stehen in der ortsüblichen Fassung („Il Re Leone",
 *   nicht „Der König der Löwen"). Titel ohne Bekanntheit in Italien sind
 *   ersetzt: statt „Tatort" steht hier „Montalbano".
 * - Märchen (`maerchen`) sind lokal geläufige Figuren.
 * - Bei `tiere`, `berufe`, `alltag`, `sport` und `gefuehle` trägt meist die
 *   direkte Entsprechung, geprüft wurde trotzdem die Darstellbarkeit.
 *
 * Achtung bei Homonymen: „Medusa" heißt auf Italienisch sowohl Qualle als auch
 * Gorgone. Die Qualle steht bei `tiere`, in `maerchen` steht deshalb der
 * Minotauro.
 *
 * Die Kategorie-IDs bleiben deutsch — sie sind Schlüssel, keine Anzeige.
 * Apostrophe sind bewusst vermieden (also „Direttore di coro" statt
 * „Direttore d'orchestra"), damit die Strings ohne Maskierung auskommen.
 */

import type { PantomimeCategory } from './pantomime-words-de';

export const PANTOMIME_CATEGORIES_IT: PantomimeCategory[] = [
  {
    id: 'tiere',
    name: 'Animali',
    emoji: '🐘',
    words: [
      'Elefante', 'Giraffa', 'Pinguino', 'Canguro', 'Serpente',
      'Aquila', 'Rana', 'Coccodrillo', 'Scimmia', 'Leone',
      'Ape', 'Farfalla', 'Ragno', 'Granchio', 'Squalo',
      'Balena', 'Delfino', 'Riccio', 'Gufo', 'Cicogna',
      'Pavone', 'Bradipo', 'Suricato', 'Cammello', 'Rinoceronte',
      'Fenicottero', 'Tartaruga', 'Pipistrello', 'Talpa', 'Aragosta',
      'Medusa', 'Cavalluccio marino', 'Procione', 'Scoiattolo', 'Colibri',
      'Struzzo', 'Gorilla', 'Lupo', 'Volpe', 'Lepre',
      'Mucca', 'Maiale', 'Gallina', 'Cavallo', 'Gatto',
      'Cane', 'Anatra', 'Capra', 'Pecora', 'Topo',
    ],
  },
  {
    id: 'berufe',
    name: 'Mestieri',
    emoji: '👷',
    words: [
      'Pompiere', 'Cuoco', 'Dentista', 'Pilota', 'Parrucchiere',
      'Poliziotto', 'Insegnante', 'Muratore', 'Cameriere', 'Giardiniere',
      'Fotografo', 'Direttore di coro', 'Clown', 'Astronauta', 'Sommozzatore',
      'Panettiere', 'Macellaio', 'Pittore', 'Saldatore', 'Postino',
      'Netturbino', 'Autista di autobus', 'Giudice', 'Avvocato', 'Chirurgo',
      'Infermiere', 'Veterinario', 'Bibliotecario', 'Cassiera', 'Barista',
      'DJ', 'Attore', 'Allenatore di calcio', 'Arbitro', 'Guida alpina',
      'Apicoltore', 'Pastore', 'Pescatore', 'Contadino', 'Meccanico',
      'Elettricista', 'Idraulico', 'Falegname', 'Spazzacamino', 'Segretaria',
      'Modella', 'Stuntman', 'Mago', 'Venditore ambulante', 'Portinaio',
    ],
  },
  {
    id: 'filme',
    name: 'Film e serie',
    emoji: '🎬',
    words: [
      'Titanic', 'Il Padrino', 'Guerre Stellari', 'Jurassic Park', 'Il Re Leone',
      'Rocky', 'Terminator', 'Matrix', 'Pirati dei Caraibi', 'Il Signore degli Anelli',
      'Harry Potter', 'E.T.', 'Lo squalo', 'Ghostbusters', 'Ritorno al futuro',
      'Forrest Gump', 'Dirty Dancing', 'Pretty Woman', 'Sister Act', 'Mission Impossible',
      'James Bond', 'Indiana Jones', 'Il mago di Oz', 'Mary Poppins', 'Frozen',
      'Alla ricerca di Nemo', 'Shrek', 'Era glaciale', 'Toy Story', 'Il libro della giungla',
      'Aladdin', 'Cenerentola', 'Bambi', 'Dumbo', 'Kung Fu Panda',
      'I Simpson', 'Il Trono di Spade', 'Breaking Bad', 'Stranger Things', 'Friends',
      'Sherlock', 'Baywatch', 'Montalbano', 'Dark', 'Squid Game',
      'La casa di carta', 'Gravity', 'Interstellar', 'Avatar', 'Il Gladiatore',
    ],
  },
  {
    id: 'alltag',
    name: 'Vita quotidiana',
    emoji: '🪥',
    words: [
      'Lavarsi i denti', 'Fare il caffè', 'Stendere il bucato', 'Passare la scopa', 'Pulire i vetri',
      'Allacciarsi le scarpe', 'Aprire un ombrello', 'Lavare la macchina', 'Tagliare il prato', 'Portare fuori la spazzatura',
      'Rifare il letto', 'Lavare i piatti', 'Stirare', 'Asciugarsi i capelli', 'Tagliarsi le unghie',
      'Spalmare la marmellata', 'Rompere un uovo', 'Scolare la pasta', 'Ordinare una pizza', 'Spingere il carrello',
      'Fare la fila', 'Perdere il bus', 'Riparare la bici', 'Cambiare una gomma', 'Montare uno scaffale',
      'Piantare un chiodo', 'Cambiare una lampadina', 'Aprire un pacco', 'Incartare un regalo', 'Imbucare una lettera',
      'Cercare le chiavi', 'Caricare il telefono', 'Farsi un selfie', 'Cambiare canale', 'Spegnere la sveglia',
      'Dormire troppo', 'Fare la valigia', 'Montare la tenda', 'Fare una grigliata', 'Fare un pupazzo di neve',
      'Innaffiare le piante', 'Portare fuori il cane', 'Cambiare il pannolino', 'Usare il filo interdentale', 'Starnutire',
      'Sbadigliare', 'Singhiozzo', 'Masticare una gomma', 'Salire in ascensore', 'Perdersi',
    ],
  },
  {
    id: 'sport',
    name: 'Sport',
    emoji: '⚽',
    words: [
      'Calcio', 'Pallacanestro', 'Tennis', 'Golf', 'Pugilato',
      'Nuoto', 'Immersione', 'Sci', 'Snowboard', 'Pattinaggio',
      'Ginnastica', 'Salto in alto', 'Salto in lungo', 'Triplo salto', 'Lancio del giavellotto',
      'Getto del peso', 'Corsa a ostacoli', 'Maratona', 'Ciclismo', 'Canottaggio',
      'Vela', 'Surf', 'Arrampicata', 'Alpinismo', 'Equitazione',
      'Tiro alla fune', 'Scherma', 'Judo', 'Karate', 'Lotta',
      'Sollevamento pesi', 'Ping pong', 'Badminton', 'Pallavolo', 'Pallamano',
      'Hockey', 'Hockey su ghiaccio', 'Rugby', 'Baseball', 'Cricket',
      'Bowling', 'Freccette', 'Biliardo', 'Skateboard', 'Pattini a rotelle',
      'Trampolino', 'Yoga', 'Salto con la corda', 'Pesca', 'Formula 1',
    ],
  },
  {
    id: 'gefuehle',
    name: 'Emozioni',
    emoji: '😤',
    words: [
      'Rabbia', 'Gioia', 'Paura', 'Tristezza', 'Disgusto',
      'Sorpresa', 'Noia', 'Nervosismo', 'Orgoglio', 'Vergogna',
      'Gelosia', 'Invidia', 'Innamoramento', 'Nostalgia di casa', 'Stanchezza',
      'Sfinimento', 'Panico', 'Sollievo', 'Delusione', 'Imbarazzo',
      'Gioia maligna', 'Struggimento', 'Soddisfazione', 'Impazienza', 'Diffidenza',
      'Curiosità', 'Entusiasmo', 'Frustrazione', 'Shock', 'Soggezione',
      'Gratitudine', 'Speranza', 'Disperazione', 'Calma', 'Eccitazione',
      'Ostinazione', 'Compassione', 'Ammirazione', 'Confusione', 'Scetticismo',
      'Irritazione', 'Timidezza', 'Coraggio', 'Vigliaccheria', 'Rimorso',
      'Trionfo', 'Solitudine', 'Serenità', 'Voglia di partire', 'Trepidazione',
    ],
  },
  {
    id: 'sprichwoerter',
    name: 'Modi di dire',
    emoji: '💬',
    words: [
      'Avere le mani bucate', 'Prendere due piccioni con una fava', 'Essere al verde', 'Avere un diavolo per capello', 'Cadere dalle nuvole',
      'Essere una pecora nera', 'Avere la testa fra le nuvole', 'Rompere il ghiaccio', 'Gettare la spugna', 'Mettere il dito nella piaga',
      'Tirare la carretta', 'Fare orecchie da mercante', 'Chiudere un occhio', 'Avere le mani in pasta', 'Perdere il filo',
      'Avere un nodo alla gola', 'Mettersi le mani nei capelli', 'Toccare ferro', 'Incrociare le dita', 'Alzare il gomito',
      'Avere la coda di paglia', 'Prendere il toro per le corna', 'Buttare benzina sul fuoco', 'Drizzare le orecchie', 'Non chiudere occhio',
      'Essere un elefante in una cristalleria', 'Piangere sul latte versato', 'Fare il passo più lungo della gamba', 'Battere il ferro finché è caldo', 'Tagliare la corda',
      'Mangiarsi le unghie', 'Fare la scarpetta', 'Avere gli occhi foderati di prosciutto', 'Dormire come un ghiro', 'Essere buono come il pane',
      'Stringere i denti', 'Farsi in quattro', 'Avere le braccia corte', 'Restare a bocca aperta', 'Mordersi la lingua',
      'Avere la faccia di bronzo', 'Tirare la cinghia', 'Andare a gonfie vele', 'Fare le corna', 'Battere i denti',
      'Storcere il naso', 'Arrampicarsi sugli specchi', 'Tenere il fiato sospeso', 'Cercare un ago in un pagliaio', 'Mettere i bastoni fra le ruote',
    ],
  },
  {
    id: 'maerchen',
    name: 'Fiabe e personaggi',
    emoji: '🧚',
    words: [
      'Cappuccetto Rosso', 'Biancaneve', 'La Bella Addormentata', 'Raperonzolo', 'Hansel e Gretel',
      'Il Principe Ranocchio', 'Tremotino', 'I musicanti di Brema', 'Il gatto con gli stivali', 'Pinocchio',
      'Peter Pan', 'Alice nel Paese delle Meraviglie', 'Robin Hood', 'Re Artù', 'Ercole',
      'Zeus', 'Poseidone', 'Il Minotauro', 'Icaro', 'Frankenstein',
      'Dracula', 'Babbo Natale', 'La Befana', 'La fatina dei denti', 'Un unicorno',
      'Un drago', 'Un nano', 'Un gigante', 'Una strega', 'Un mago',
      'Un cavaliere', 'Un pirata', 'Una sirena', 'Un vampiro', 'Un lupo mannaro',
      'Uno zombie', 'Un fantasma', 'Un robot', 'Un alieno', 'Superman',
      'Batman', 'Spider-Man', 'Hulk', 'Wonder Woman', 'Yoda',
      'Gollum', 'Il Grinch', 'Sinbad', 'Ali Baba', 'Pollicino',
    ],
  },
  {
    id: 'ab18',
    name: '18+',
    emoji: '🔥',
    adult: true,
    words: [
      'Spogliarello', 'Bacio alla francese', 'Appuntamento al buio', 'Preservativo', 'Lingerie',
      'Pole dance', 'Danza del ventre', 'Lap dance', 'Manette', 'Kamasutra',
      'Addio al celibato', 'Appuntamento su Tinder', 'Frase per rimorchiare', 'Prendere un due di picche', 'Flirtare',
      'Succhiotto', 'Lettera romantica', 'Batticuore', 'Seduzione', 'Coprire gli occhi',
      'Massaggio', 'Bagno di schiuma', 'Petali di rosa', 'Lume di candela', 'Prima notte di nozze',
      'Luna di miele', 'Test di gravidanza', 'Lite di coppia', 'Scenata di gelosia', 'Rottura',
      'Ex fidanzato', 'Tradimento', 'Foto imbarazzante', 'Confessione', 'Macchina della verità',
      'Shot di vodka', 'Postumi da sbornia', 'Ballare ubriachi', 'Karaoke alle tre di notte', 'Pancia da birra',
      'Bagno nudi', 'Spiaggia per nudisti', 'Sauna', 'Farsi un tatuaggio', 'Piercing',
      'Mostrare gli addominali', 'Gonfiare i muscoli', 'Specchiarsi compiaciuti', 'Rientrare di nascosto', 'Dividere il conto',
    ],
  },
];
