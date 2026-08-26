/**
 * Die Produkt-Tour im Influencer-Bereich — acht Module, in zehn Sprachen.
 *
 * WARUM ES DAS GIBT: bis hierher bekam ein Influencer die Vereinbarung, das
 * Briefing und Material — aber niemand erklaerte ihm, was die App eigentlich
 * kann. Wer das Produkt bewerben soll, muss es zuerst selbst verstehen, und
 * zwar ohne sich durch eine Hilfeseite zu klicken.
 *
 * JEDES KAPITEL HAT DREI TEILE:
 *   1. Was es ist           — in zwei Saetzen, ohne Funktionsliste
 *   2. Ein echter Bildschirm — public/tour/<lang>/<shot>.webp, in SEINER
 *                              Sprache (erzeugt von generate-tour-shots.mjs)
 *   3. Was er daraus machen kann — ein konkreter Drehvorschlag
 *
 * Der dritte Teil ist der eigentliche Grund fuer die Tour. Eine
 * Funktionsbeschreibung liest niemand zweimal; ein Vorschlag, aus dem ein
 * Beitrag wird, schon.
 *
 * ZEHN SPRACHEN, weil Influencer international angesprochen werden — dasselbe
 * Muster wie agency-demo-copy.ts, inklusive Rueckfall auf Englisch statt auf
 * Deutsch. Die Bildschirme gibt es in denselben zehn Sprachen; ein englischer
 * Screenshot unter tuerkischem Text waere die Halbheit, die man sofort sieht.
 *
 * DIE SPIELE STEHEN NICHT HIER. Namen und Beschreibungen der 22 Spiele kommen
 * aus playable-games.ts und i18n (native.gameNames.* / native.gameDescs.*),
 * also aus derselben Quelle wie in der App. Abgeschriebene Spielnamen waeren
 * am Tag der naechsten Umbenennung falsch.
 */
import type { SeoLang } from "@/lib/seo-routes";

export interface TourChapter {
  /** Dateiname unter public/tour/<lang>/ — ohne Endung. */
  shot: string;
  title: string;
  body: string;
  idea: string;
}

export interface CreatorTour {
  title: string;
  intro: string;
  ideaLabel: string;
  chapters: TourChapter[];
  gamesTitle: string;
  gamesIntro: string;
  gamesFree: string;
  gamesPremium: string;
  gamesPlayers: (min: number, max: number) => string;
  gamesNote: string;
}

const de: CreatorTour = {
  title: "Die App",
  intro:
    "Acht Bildschirme, acht Gedanken. Danach kannst du erklären, worum es geht, ohne nachzuschlagen — und du siehst zu jedem Teil, was sich daraus machen lässt.",
  ideaLabel: "Was du daraus machen kannst",
  chapters: [
    {
      shot: "home",
      title: "Übersicht",
      body: "Jedes Ereignis mit Datum, Ort und Gästen auf einer Karte. Wer die App öffnet, sieht sofort, was als Nächstes ansteht — keine Liste von Chats.",
      idea: "Öffne die App vor der Kamera und scroll einmal durch. Der erste Eindruck erledigt hier schon die Hälfte.",
    },
    {
      shot: "schedule",
      title: "Programm und Termine",
      body: "Der Ablauf nach Tagen, mit Uhrzeit, Dauer und Preis pro Person. Änderungen sieht die ganze Gruppe sofort, niemand muss etwas weiterleiten.",
      idea: "Zeig einen echten Ablauf: Freitag anreisen, Samstag Karting, Sonntag Brunch. Drei Zeilen genügen, damit man versteht, was gemeint ist.",
    },
    {
      shot: "ideas",
      title: "Ideenboard",
      body: "Jeder wirft rein, was ihm einfällt — Links, Orte, Bilder. Abgestimmt wird danach, in Ruhe, statt in einem Chat, in dem der Vorschlag von gestern nicht mehr auffindbar ist.",
      idea: "Frag dein Publikum nach Ideen, sammle sie im Board und zeig das Ergebnis. Das ist ein Beitrag, der Antworten bekommt.",
    },
    {
      shot: "guests",
      title: "Gäste",
      body: "Wer kommt, wer hat zugesagt, wer schuldet noch eine Antwort. Eingeladen wird per Link — niemand muss die App installieren, um zuzusagen.",
      idea: "Der Moment, in dem die Zusagen eintrudeln, ist gutes Material. Kurz, ehrlich, ohne Erklärung.",
    },
    {
      shot: "expenses",
      title: "Ausgaben und Abrechnung",
      body: "Ausgaben eintragen und aufteilen — gleichmäßig, nach Anteilen, mit mehreren Zahlern. Am Ende steht, wer wem was schuldet und was noch offen ist.",
      idea: "Der stärkste Blickwinkel überhaupt, weil ihn jeder kennt. Zeig eine echte Abrechnung mit echten Beträgen; Namen kannst du unkenntlich machen.",
    },
    {
      shot: "messages",
      title: "Nachrichten",
      body: "Absprachen bleiben beim Ereignis, nicht in einem Chat zwischen Urlaubsfotos und Sprachnachrichten. Für die Ansage an alle gibt es fertige Vorlagen.",
      idea: "Stell die eine Nachricht, die in jedem Gruppenchat untergeht, neben dieselbe Nachricht hier. Mehr Erklärung braucht es nicht.",
    },
    {
      shot: "games",
      title: "22 Party-Spiele",
      body: "Alle spielen am eigenen Handy mit, ohne etwas zu installieren. Ist ein Fernseher da, läuft das Spielfeld darauf und alle schauen in dieselbe Richtung.",
      idea: "Film die Runde, nicht den Bildschirm. Die Reaktionen ab Minute zwei sind das, was hängen bleibt.",
    },
    {
      shot: "services",
      title: "Anbieter finden",
      body: "Anbieter für den Abend — Kochkurs, Bootstour, Fotograf — direkt beim Ereignis, mit Preis pro Person. Angefragt wird aus der Planung heraus.",
      idea: "Wenn du in einer Stadt drehst, zeig, was dort buchbar ist. Das ist lokal und damit für dein Publikum nah.",
    },
  ],
  gamesTitle: "Alle 22 Spiele",
  gamesIntro: "Damit du weißt, worüber du redest. „Frei\" heißt: ohne Premium spielbar.",
  gamesFree: "Frei",
  gamesPremium: "Premium",
  gamesPlayers: (min, max) => `${min}–${max} Personen`,
  gamesNote: "Die Namen stehen hier in deiner Sprache — genau so heißen sie auch in der App.",
};

const en: CreatorTour = {
  title: "The app",
  intro:
    "Eight screens, eight ideas. After this you can explain what it is without looking anything up — and for each part you see what you could make of it.",
  ideaLabel: "What you can make of it",
  chapters: [
    {
      shot: "home",
      title: "Overview",
      body: "Every event with date, place and guests on one card. Opening the app shows you what is next straight away — not a list of chats.",
      idea: "Open the app in front of the camera and scroll through once. The first impression already does half the work.",
    },
    {
      shot: "schedule",
      title: "Programme and dates",
      body: "The plan day by day, with time, duration and price per person. Changes are visible to the whole group at once, nobody has to forward anything.",
      idea: "Show a real plan: arrive Friday, karting Saturday, brunch Sunday. Three lines are enough to make the point.",
    },
    {
      shot: "ideas",
      title: "Idea board",
      body: "Everyone drops in whatever occurs to them — links, places, pictures. You vote afterwards, calmly, instead of in a chat where yesterday's suggestion is gone.",
      idea: "Ask your audience for ideas, collect them on the board and show the result. That is a post that gets replies.",
    },
    {
      shot: "guests",
      title: "Guests",
      body: "Who is coming, who confirmed, who still owes an answer. You invite by link — nobody has to install the app to say yes.",
      idea: "The moment the confirmations start coming in is good material. Short, honest, no explanation.",
    },
    {
      shot: "expenses",
      title: "Expenses and settlement",
      body: "Enter expenses and split them — evenly, by shares, with several payers. At the end it says who owes whom what, and what is still open.",
      idea: "The strongest angle there is, because everyone knows it. Show a real settlement with real amounts; you can blur the names.",
    },
    {
      shot: "messages",
      title: "Messages",
      body: "Arrangements stay with the event, not in a chat between holiday photos and voice notes. For the announcement to everyone there are ready-made templates.",
      idea: "Put the one message that always drowns in a group chat next to the same message here. No further explanation needed.",
    },
    {
      shot: "games",
      title: "22 party games",
      body: "Everyone joins from their own phone without installing anything. If there is a TV, the board runs on it and everyone looks the same way.",
      idea: "Film the group, not the screen. The reactions from minute two are what people remember.",
    },
    {
      shot: "services",
      title: "Finding providers",
      body: "Providers for the evening — cooking class, boat trip, photographer — right next to the event, with a price per person. You enquire from inside the planning.",
      idea: "If you are filming in a city, show what is bookable there. That is local, and therefore close to your audience.",
    },
  ],
  gamesTitle: "All 22 games",
  gamesIntro: "So you know what you are talking about. \"Free\" means: playable without Premium.",
  gamesFree: "Free",
  gamesPremium: "Premium",
  gamesPlayers: (min, max) => `${min}–${max} people`,
  gamesNote: "The names are in your language here — that is exactly what they are called in the app.",
};

const es: CreatorTour = {
  title: "La app",
  intro:
    "Ocho pantallas, ocho ideas. Después puedes explicar de qué va sin consultar nada, y en cada parte ves qué se puede hacer con ella.",
  ideaLabel: "Qué puedes hacer con esto",
  chapters: [
    {
      shot: "home",
      title: "Vista general",
      body: "Cada evento con fecha, lugar e invitados en una sola tarjeta. Quien abre la app ve enseguida qué viene después, no una lista de chats.",
      idea: "Abre la app ante la cámara y desplázate una vez. La primera impresión ya hace la mitad del trabajo.",
    },
    {
      shot: "schedule",
      title: "Programa y fechas",
      body: "El plan por días, con hora, duración y precio por persona. Los cambios los ve todo el grupo al instante; nadie tiene que reenviar nada.",
      idea: "Enseña un plan real: viernes llegada, sábado karting, domingo brunch. Con tres líneas se entiende.",
    },
    {
      shot: "ideas",
      title: "Tablero de ideas",
      body: "Cada uno aporta lo que se le ocurre: enlaces, sitios, imágenes. Se vota después, con calma, en lugar de en un chat donde la propuesta de ayer ya no aparece.",
      idea: "Pide ideas a tu público, recógelas en el tablero y enseña el resultado. Es una publicación que recibe respuestas.",
    },
    {
      shot: "guests",
      title: "Invitados",
      body: "Quién viene, quién ha confirmado, quién debe una respuesta. Se invita con un enlace: nadie necesita instalar la app para confirmar.",
      idea: "El momento en que llegan las confirmaciones es buen material. Corto, honesto, sin explicaciones.",
    },
    {
      shot: "expenses",
      title: "Gastos y cuentas",
      body: "Anota los gastos y repártelos: a partes iguales, por cuotas, con varios pagadores. Al final aparece quién debe qué a quién y qué queda pendiente.",
      idea: "El ángulo más fuerte, porque lo conoce todo el mundo. Enseña una cuenta real con importes reales; los nombres puedes taparlos.",
    },
    {
      shot: "messages",
      title: "Mensajes",
      body: "Los acuerdos se quedan en el evento, no en un chat entre fotos de vacaciones y audios. Para el aviso a todos hay plantillas listas.",
      idea: "Pon el mensaje que siempre se pierde en un grupo al lado del mismo mensaje aquí. No hace falta más explicación.",
    },
    {
      shot: "games",
      title: "22 juegos de fiesta",
      body: "Todos juegan desde su propio móvil, sin instalar nada. Si hay televisor, el tablero se ve ahí y todos miran en la misma dirección.",
      idea: "Graba al grupo, no a la pantalla. Las reacciones a partir del segundo minuto son lo que se recuerda.",
    },
    {
      shot: "services",
      title: "Encontrar proveedores",
      body: "Proveedores para la noche —clase de cocina, paseo en barco, fotógrafo— junto al evento, con precio por persona. Se consulta desde la propia planificación.",
      idea: "Si grabas en una ciudad, enseña qué se puede reservar allí. Es local y por tanto cercano para tu público.",
    },
  ],
  gamesTitle: "Los 22 juegos",
  gamesIntro: "Para que sepas de qué hablas. «Libre» significa: se juega sin Premium.",
  gamesFree: "Libre",
  gamesPremium: "Premium",
  gamesPlayers: (min, max) => `${min}–${max} personas`,
  gamesNote: "Los nombres aparecen en tu idioma: así se llaman también en la app.",
};

const fr: CreatorTour = {
  title: "L'appli",
  intro:
    "Huit écrans, huit idées. Ensuite tu peux expliquer de quoi il s'agit sans rien relire, et pour chaque partie tu vois ce qu'on peut en tirer.",
  ideaLabel: "Ce que tu peux en faire",
  chapters: [
    {
      shot: "home",
      title: "Vue d'ensemble",
      body: "Chaque événement avec sa date, son lieu et ses invités sur une seule carte. En ouvrant l'appli, on voit tout de suite ce qui arrive, pas une liste de discussions.",
      idea: "Ouvre l'appli devant la caméra et fais défiler une fois. La première impression fait déjà la moitié du travail.",
    },
    {
      shot: "schedule",
      title: "Programme et dates",
      body: "Le déroulé jour par jour, avec l'heure, la durée et le prix par personne. Les changements sont visibles par tout le groupe aussitôt, personne n'a rien à transférer.",
      idea: "Montre un vrai programme : vendredi l'arrivée, samedi le karting, dimanche le brunch. Trois lignes suffisent.",
    },
    {
      shot: "ideas",
      title: "Tableau d'idées",
      body: "Chacun dépose ce qui lui vient : liens, lieux, images. On vote ensuite, tranquillement, au lieu de le faire dans une discussion où la proposition d'hier est introuvable.",
      idea: "Demande des idées à ton public, rassemble-les sur le tableau et montre le résultat. C'est une publication qui reçoit des réponses.",
    },
    {
      shot: "guests",
      title: "Invités",
      body: "Qui vient, qui a confirmé, qui doit encore répondre. On invite par lien : personne n'a besoin d'installer l'appli pour répondre.",
      idea: "Le moment où les confirmations arrivent fait de bonnes images. Court, sincère, sans explication.",
    },
    {
      shot: "expenses",
      title: "Dépenses et comptes",
      body: "Saisis les dépenses et partage-les : à parts égales, par quotes-parts, avec plusieurs payeurs. À la fin, on voit qui doit quoi à qui et ce qui reste ouvert.",
      idea: "L'angle le plus fort, parce que tout le monde le connaît. Montre un vrai décompte avec de vrais montants ; les noms, tu peux les masquer.",
    },
    {
      shot: "messages",
      title: "Messages",
      body: "Les décisions restent avec l'événement, pas dans une discussion coincée entre photos de vacances et messages vocaux. Pour l'annonce à tous, il y a des modèles prêts.",
      idea: "Mets le message qui se perd toujours dans un groupe à côté du même message ici. Il n'en faut pas plus.",
    },
    {
      shot: "games",
      title: "22 jeux de soirée",
      body: "Tout le monde joue depuis son propre téléphone, sans rien installer. S'il y a une télé, le plateau s'affiche dessus et tout le monde regarde dans la même direction.",
      idea: "Filme le groupe, pas l'écran. Les réactions à partir de la deuxième minute, c'est ce qui reste.",
    },
    {
      shot: "services",
      title: "Trouver des prestataires",
      body: "Des prestataires pour la soirée — cours de cuisine, sortie en bateau, photographe — directement à côté de l'événement, avec le prix par personne. La demande part de la planification.",
      idea: "Si tu tournes dans une ville, montre ce qui s'y réserve. C'est local, donc proche de ton public.",
    },
  ],
  gamesTitle: "Les 22 jeux",
  gamesIntro: "Pour que tu saches de quoi tu parles. « Libre » veut dire : jouable sans Premium.",
  gamesFree: "Libre",
  gamesPremium: "Premium",
  gamesPlayers: (min, max) => `${min}–${max} personnes`,
  gamesNote: "Les noms sont dans ta langue — ils s'appellent exactement pareil dans l'appli.",
};

const it: CreatorTour = {
  title: "L'app",
  intro:
    "Otto schermate, otto idee. Dopo puoi spiegare di cosa si tratta senza andare a rileggere, e per ogni parte vedi cosa ci si può fare.",
  ideaLabel: "Cosa puoi farci",
  chapters: [
    {
      shot: "home",
      title: "Panoramica",
      body: "Ogni evento con data, luogo e invitati su un'unica scheda. Chi apre l'app vede subito cosa viene dopo, non un elenco di chat.",
      idea: "Apri l'app davanti alla telecamera e scorri una volta. La prima impressione fa già metà del lavoro.",
    },
    {
      shot: "schedule",
      title: "Programma e date",
      body: "Lo svolgimento giorno per giorno, con orario, durata e prezzo a persona. Le modifiche le vede subito tutto il gruppo, nessuno deve inoltrare nulla.",
      idea: "Mostra un programma vero: venerdì arrivo, sabato karting, domenica brunch. Bastano tre righe.",
    },
    {
      shot: "ideas",
      title: "Bacheca delle idee",
      body: "Ognuno butta dentro quello che gli viene in mente: link, posti, immagini. Si vota dopo, con calma, invece che in una chat dove la proposta di ieri non si trova più.",
      idea: "Chiedi idee al tuo pubblico, raccoglile nella bacheca e mostra il risultato. È un post che riceve risposte.",
    },
    {
      shot: "guests",
      title: "Invitati",
      body: "Chi viene, chi ha confermato, chi deve ancora rispondere. Si invita con un link: nessuno deve installare l'app per confermare.",
      idea: "Il momento in cui arrivano le conferme è buon materiale. Corto, sincero, senza spiegazioni.",
    },
    {
      shot: "expenses",
      title: "Spese e conti",
      body: "Inserisci le spese e dividile: in parti uguali, per quote, con più persone che pagano. Alla fine c'è scritto chi deve cosa a chi e cosa resta aperto.",
      idea: "L'angolazione più forte, perché la conoscono tutti. Mostra un conto vero con importi veri; i nomi puoi coprirli.",
    },
    {
      shot: "messages",
      title: "Messaggi",
      body: "Gli accordi restano sull'evento, non in una chat tra foto delle vacanze e vocali. Per l'avviso a tutti ci sono modelli pronti.",
      idea: "Metti il messaggio che in un gruppo si perde sempre accanto allo stesso messaggio qui. Non serve altro.",
    },
    {
      shot: "games",
      title: "22 giochi di gruppo",
      body: "Giocano tutti dal proprio telefono, senza installare niente. Se c'è una TV, il tabellone va lì e tutti guardano nella stessa direzione.",
      idea: "Riprendi il gruppo, non lo schermo. Le reazioni dal secondo minuto sono quelle che restano.",
    },
    {
      shot: "services",
      title: "Trovare fornitori",
      body: "Fornitori per la serata — corso di cucina, gita in barca, fotografo — accanto all'evento, con prezzo a persona. La richiesta parte dalla pianificazione.",
      idea: "Se giri in una città, mostra cosa si può prenotare lì. È locale, quindi vicino al tuo pubblico.",
    },
  ],
  gamesTitle: "Tutti i 22 giochi",
  gamesIntro: "Così sai di cosa parli. «Libero» significa: si gioca senza Premium.",
  gamesFree: "Libero",
  gamesPremium: "Premium",
  gamesPlayers: (min, max) => `${min}–${max} persone`,
  gamesNote: "I nomi sono nella tua lingua — si chiamano così anche nell'app.",
};

const pt: CreatorTour = {
  title: "A app",
  intro:
    "Oito ecrãs, oito ideias. Depois consegues explicar do que se trata sem consultar nada, e em cada parte vês o que se pode fazer com ela.",
  ideaLabel: "O que podes fazer com isto",
  chapters: [
    {
      shot: "home",
      title: "Visão geral",
      body: "Cada evento com data, local e convidados num só cartão. Quem abre a app vê logo o que vem a seguir, não uma lista de conversas.",
      idea: "Abre a app à frente da câmara e percorre uma vez. A primeira impressão já faz metade do trabalho.",
    },
    {
      shot: "schedule",
      title: "Programa e datas",
      body: "O programa dia a dia, com hora, duração e preço por pessoa. As alterações o grupo inteiro vê de imediato, ninguém tem de reencaminhar nada.",
      idea: "Mostra um programa a sério: sexta a chegada, sábado o karting, domingo o brunch. Três linhas chegam.",
    },
    {
      shot: "ideas",
      title: "Quadro de ideias",
      body: "Cada um lança o que lhe ocorre: links, sítios, imagens. Vota-se depois, com calma, em vez de numa conversa onde a proposta de ontem já não se encontra.",
      idea: "Pede ideias ao teu público, junta-as no quadro e mostra o resultado. É uma publicação que recebe respostas.",
    },
    {
      shot: "guests",
      title: "Convidados",
      body: "Quem vem, quem confirmou, quem ainda deve resposta. Convida-se por link: ninguém precisa de instalar a app para confirmar.",
      idea: "O momento em que as confirmações chegam dá bom material. Curto, honesto, sem explicações.",
    },
    {
      shot: "expenses",
      title: "Despesas e contas",
      body: "Regista despesas e divide-as: por igual, por quotas, com vários pagadores. No fim fica escrito quem deve o quê a quem e o que continua em aberto.",
      idea: "O ângulo mais forte, porque toda a gente o conhece. Mostra uma conta real com valores reais; os nomes podes tapar.",
    },
    {
      shot: "messages",
      title: "Mensagens",
      body: "As combinações ficam no evento, não numa conversa entre fotos de férias e mensagens de voz. Para o aviso a todos há modelos prontos.",
      idea: "Põe a mensagem que num grupo se perde sempre ao lado da mesma mensagem aqui. Não é preciso mais.",
    },
    {
      shot: "games",
      title: "22 jogos de festa",
      body: "Jogam todos no próprio telemóvel, sem instalar nada. Se houver televisão, o tabuleiro vai para lá e toda a gente olha na mesma direção.",
      idea: "Filma o grupo, não o ecrã. As reações a partir do segundo minuto são o que fica.",
    },
    {
      shot: "services",
      title: "Encontrar fornecedores",
      body: "Fornecedores para a noite — aula de cozinha, passeio de barco, fotógrafo — ao lado do evento, com preço por pessoa. O pedido parte do próprio planeamento.",
      idea: "Se gravares numa cidade, mostra o que lá se pode reservar. É local e por isso próximo do teu público.",
    },
  ],
  gamesTitle: "Os 22 jogos",
  gamesIntro: "Para saberes do que falas. «Livre» significa: joga-se sem Premium.",
  gamesFree: "Livre",
  gamesPremium: "Premium",
  gamesPlayers: (min, max) => `${min}–${max} pessoas`,
  gamesNote: "Os nomes estão na tua língua — é assim que se chamam também na app.",
};

const nl: CreatorTour = {
  title: "De app",
  intro:
    "Acht schermen, acht gedachten. Daarna kun je uitleggen waar het om gaat zonder na te zoeken, en bij elk onderdeel zie je wat je ermee kunt.",
  ideaLabel: "Wat je hiermee kunt doen",
  chapters: [
    {
      shot: "home",
      title: "Overzicht",
      body: "Elk evenement met datum, plek en gasten op één kaart. Wie de app opent ziet meteen wat eraan komt, geen lijst met chats.",
      idea: "Open de app voor de camera en scroll één keer door. De eerste indruk doet hier al de helft.",
    },
    {
      shot: "schedule",
      title: "Programma en data",
      body: "Het verloop per dag, met tijd, duur en prijs per persoon. Wijzigingen ziet de hele groep meteen, niemand hoeft iets door te sturen.",
      idea: "Laat een echt programma zien: vrijdag aankomst, zaterdag karten, zondag brunch. Drie regels zijn genoeg.",
    },
    {
      shot: "ideas",
      title: "Ideeënbord",
      body: "Iedereen gooit erin wat hem invalt: links, plekken, foto's. Stemmen doe je daarna, rustig, in plaats van in een chat waar het voorstel van gisteren niet meer te vinden is.",
      idea: "Vraag je publiek om ideeën, verzamel ze op het bord en laat het resultaat zien. Dat is een post die reacties krijgt.",
    },
    {
      shot: "guests",
      title: "Gasten",
      body: "Wie komt, wie heeft toegezegd, wie is nog een antwoord schuldig. Uitnodigen gaat via een link: niemand hoeft de app te installeren om toe te zeggen.",
      idea: "Het moment waarop de toezeggingen binnenkomen is goed materiaal. Kort, eerlijk, zonder uitleg.",
    },
    {
      shot: "expenses",
      title: "Uitgaven en afrekening",
      body: "Uitgaven invoeren en verdelen: gelijk, naar aandeel, met meerdere betalers. Aan het eind staat er wie wie wat schuldig is en wat nog openstaat.",
      idea: "De sterkste invalshoek, omdat iedereen hem kent. Laat een echte afrekening zien met echte bedragen; namen kun je afdekken.",
    },
    {
      shot: "messages",
      title: "Berichten",
      body: "Afspraken blijven bij het evenement, niet in een chat tussen vakantiefoto's en spraakberichten. Voor de mededeling aan iedereen zijn er kant-en-klare sjablonen.",
      idea: "Zet het bericht dat in een groep altijd verdwijnt naast hetzelfde bericht hier. Meer uitleg is niet nodig.",
    },
    {
      shot: "games",
      title: "22 partyspellen",
      body: "Iedereen speelt mee op zijn eigen telefoon, zonder iets te installeren. Is er een tv, dan draait het speelveld daarop en kijkt iedereen dezelfde kant op.",
      idea: "Film de groep, niet het scherm. De reacties vanaf de tweede minuut zijn wat blijft hangen.",
    },
    {
      shot: "services",
      title: "Aanbieders vinden",
      body: "Aanbieders voor de avond — kookworkshop, boottocht, fotograaf — direct bij het evenement, met prijs per persoon. Aanvragen doe je vanuit de planning.",
      idea: "Film je in een stad, laat dan zien wat daar te boeken is. Dat is lokaal en dus dichtbij voor je publiek.",
    },
  ],
  gamesTitle: "Alle 22 spellen",
  gamesIntro: "Zodat je weet waar je het over hebt. „Vrij\" betekent: speelbaar zonder Premium.",
  gamesFree: "Vrij",
  gamesPremium: "Premium",
  gamesPlayers: (min, max) => `${min}–${max} personen`,
  gamesNote: "De namen staan hier in jouw taal — zo heten ze ook in de app.",
};

const pl: CreatorTour = {
  title: "Aplikacja",
  intro:
    "Osiem ekranów, osiem myśli. Potem wytłumaczysz, o co chodzi, bez zaglądania gdziekolwiek — i przy każdej części widzisz, co da się z niej zrobić.",
  ideaLabel: "Co możesz z tego zrobić",
  chapters: [
    {
      shot: "home",
      title: "Przegląd",
      body: "Każde wydarzenie z datą, miejscem i gośćmi na jednej karcie. Kto otwiera aplikację, od razu widzi, co jest następne, a nie listę czatów.",
      idea: "Otwórz aplikację przed kamerą i przewiń raz. Pierwsze wrażenie załatwia tu już połowę.",
    },
    {
      shot: "schedule",
      title: "Program i terminy",
      body: "Przebieg dzień po dniu, z godziną, czasem trwania i ceną od osoby. Zmiany widzi od razu cała grupa, nikt nie musi niczego przesyłać dalej.",
      idea: "Pokaż prawdziwy plan: piątek przyjazd, sobota karting, niedziela brunch. Trzy linijki wystarczą.",
    },
    {
      shot: "ideas",
      title: "Tablica pomysłów",
      body: "Każdy wrzuca to, co mu przyjdzie do głowy: linki, miejsca, zdjęcia. Głosuje się potem, na spokojnie, zamiast na czacie, gdzie wczorajszej propozycji już nie da się znaleźć.",
      idea: "Poproś swoich odbiorców o pomysły, zbierz je na tablicy i pokaż wynik. To wpis, który dostaje odpowiedzi.",
    },
    {
      shot: "guests",
      title: "Goście",
      body: "Kto przyjdzie, kto potwierdził, kto jest jeszcze winien odpowiedź. Zaprasza się linkiem — nikt nie musi instalować aplikacji, żeby potwierdzić.",
      idea: "Moment, w którym spływają potwierdzenia, to dobry materiał. Krótko, szczerze, bez tłumaczenia.",
    },
    {
      shot: "expenses",
      title: "Wydatki i rozliczenie",
      body: "Wpisujesz wydatki i dzielisz je: po równo, według udziałów, z kilkoma płacącymi. Na końcu jest napisane, kto komu ile jest winien i co zostało otwarte.",
      idea: "Najmocniejsze ujęcie, bo zna je każdy. Pokaż prawdziwe rozliczenie z prawdziwymi kwotami; nazwiska możesz zasłonić.",
    },
    {
      shot: "messages",
      title: "Wiadomości",
      body: "Ustalenia zostają przy wydarzeniu, a nie na czacie między zdjęciami z wakacji a nagraniami głosowymi. Do ogłoszenia dla wszystkich są gotowe szablony.",
      idea: "Postaw obok siebie wiadomość, która w grupie zawsze ginie, i tę samą wiadomość tutaj. Więcej tłumaczenia nie trzeba.",
    },
    {
      shot: "games",
      title: "22 gry imprezowe",
      body: "Wszyscy grają na własnym telefonie, bez instalowania czegokolwiek. Jeśli jest telewizor, plansza idzie na niego i wszyscy patrzą w tę samą stronę.",
      idea: "Filmuj grupę, nie ekran. Reakcje od drugiej minuty to jest to, co zostaje.",
    },
    {
      shot: "services",
      title: "Znaleźć wykonawców",
      body: "Wykonawcy na wieczór — kurs gotowania, rejs, fotograf — przy samym wydarzeniu, z ceną od osoby. Zapytanie wysyłasz prosto z planowania.",
      idea: "Jeśli kręcisz w jakimś mieście, pokaż, co da się tam zarezerwować. To lokalne, a więc bliskie twoim odbiorcom.",
    },
  ],
  gamesTitle: "Wszystkie 22 gry",
  gamesIntro: "Żebyś wiedział, o czym mówisz. „Wolna\" znaczy: da się grać bez Premium.",
  gamesFree: "Wolna",
  gamesPremium: "Premium",
  gamesPlayers: (min, max) => `${min}–${max} osób`,
  gamesNote: "Nazwy są w twoim języku — dokładnie tak nazywają się w aplikacji.",
};

const tr: CreatorTour = {
  title: "Uygulama",
  intro:
    "Sekiz ekran, sekiz düşünce. Sonrasında hiçbir yere bakmadan anlatabilirsin — ve her bölümde ondan ne çıkarabileceğini görürsün.",
  ideaLabel: "Bundan ne çıkarabilirsin",
  chapters: [
    {
      shot: "home",
      title: "Genel bakış",
      body: "Her etkinlik tarihi, yeri ve konuklarıyla tek bir kartta. Uygulamayı açan, sohbet listesi değil, sırada ne olduğunu hemen görür.",
      idea: "Uygulamayı kameranın önünde aç ve bir kez kaydır. İlk izlenim burada işin yarısını hallediyor.",
    },
    {
      shot: "schedule",
      title: "Program ve tarihler",
      body: "Akış gün gün, saatiyle, süresiyle ve kişi başı fiyatıyla. Değişiklikleri tüm grup anında görür, kimsenin bir şey iletmesi gerekmez.",
      idea: "Gerçek bir akış göster: cuma varış, cumartesi karting, pazar brunch. Üç satır yeter.",
    },
    {
      shot: "ideas",
      title: "Fikir panosu",
      body: "Herkes aklına geleni atar: bağlantılar, mekânlar, görseller. Oylama sonra, sakin sakin yapılır; dünkü önerinin kaybolduğu bir sohbette değil.",
      idea: "Takipçilerinden fikir iste, panoda topla ve sonucu göster. Yanıt alan bir paylaşım olur.",
    },
    {
      shot: "guests",
      title: "Konuklar",
      body: "Kim geliyor, kim onayladı, kim hâlâ cevap borçlu. Davet bağlantıyla gider — onaylamak için kimsenin uygulamayı kurması gerekmez.",
      idea: "Onayların gelmeye başladığı an iyi malzemedir. Kısa, samimi, açıklamasız.",
    },
    {
      shot: "expenses",
      title: "Harcamalar ve hesap",
      body: "Harcamaları gir ve böl: eşit, paylara göre, birden çok ödeyenle. Sonunda kimin kime ne borçlu olduğu ve neyin açık kaldığı yazar.",
      idea: "En güçlü açı, çünkü herkes bunu bilir. Gerçek tutarlarla gerçek bir hesap göster; isimleri kapatabilirsin.",
    },
    {
      shot: "messages",
      title: "Mesajlar",
      body: "Kararlar etkinliğin yanında kalır, tatil fotoğraflarıyla sesli mesajlar arasına sıkışan bir sohbette değil. Herkese duyuru için hazır şablonlar var.",
      idea: "Grup sohbetinde hep kaybolan mesajı, buradaki aynı mesajın yanına koy. Fazla açıklamaya gerek yok.",
    },
    {
      shot: "games",
      title: "22 parti oyunu",
      body: "Herkes kendi telefonundan oynar, hiçbir şey kurmadan. Televizyon varsa oyun ekranı oraya gider ve herkes aynı yöne bakar.",
      idea: "Ekranı değil grubu çek. İkinci dakikadan sonraki tepkiler akılda kalan şeydir.",
    },
    {
      shot: "services",
      title: "Hizmet bulma",
      body: "Akşam için hizmet verenler — yemek kursu, tekne turu, fotoğrafçı — doğrudan etkinliğin yanında, kişi başı fiyatıyla. Talep planlamanın içinden gider.",
      idea: "Bir şehirde çekim yapıyorsan, orada nelerin ayrılabildiğini göster. Yerel, dolayısıyla takipçine yakın.",
    },
  ],
  gamesTitle: "22 oyunun tamamı",
  gamesIntro: "Neden söz ettiğini bilesin diye. „Serbest\" demek: Premium olmadan oynanır.",
  gamesFree: "Serbest",
  gamesPremium: "Premium",
  gamesPlayers: (min, max) => `${min}–${max} kişi`,
  gamesNote: "İsimler senin dilinde — uygulamada da tam olarak böyle geçiyorlar.",
};

const ar: CreatorTour = {
  title: "التطبيق",
  intro:
    "ثماني شاشات، ثماني أفكار. بعدها تستطيع أن تشرح الأمر دون العودة إلى شيء، ومع كل قسم ترى ما يمكن صنعه منه.",
  ideaLabel: "ما الذي يمكنك صنعه من هذا",
  chapters: [
    {
      shot: "home",
      title: "نظرة عامة",
      body: "كل مناسبة بتاريخها ومكانها وضيوفها في بطاقة واحدة. من يفتح التطبيق يرى فوراً ما هو قادم، لا قائمة محادثات.",
      idea: "افتح التطبيق أمام الكاميرا ومرِّر مرة واحدة. الانطباع الأول يؤدي نصف المهمة هنا.",
    },
    {
      shot: "schedule",
      title: "البرنامج والمواعيد",
      body: "سير اليوم بيومه، مع الوقت والمدة والسعر للفرد. التغييرات تراها المجموعة كلها فوراً، ولا أحد مضطر لإعادة إرسال شيء.",
      idea: "اعرض برنامجاً حقيقياً: الجمعة الوصول، السبت الكارتينغ، الأحد الفطور المتأخر. ثلاثة أسطر تكفي.",
    },
    {
      shot: "ideas",
      title: "لوحة الأفكار",
      body: "كل شخص يضع ما يخطر له: روابط وأماكن وصور. والتصويت يأتي بعدها، بهدوء، بدل محادثة يضيع فيها اقتراح الأمس.",
      idea: "اطلب الأفكار من متابعيك، اجمعها في اللوحة واعرض النتيجة. منشور كهذا يحصل على ردود.",
    },
    {
      shot: "guests",
      title: "الضيوف",
      body: "من سيأتي، ومن أكّد، ومن ما زال مديناً بجواب. الدعوة تُرسل برابط — لا أحد مضطر لتثبيت التطبيق ليؤكد.",
      idea: "لحظة وصول التأكيدات مادة جيدة. قصيرة وصادقة وبلا شرح.",
    },
    {
      shot: "expenses",
      title: "المصاريف والحساب",
      body: "أدخل المصاريف وقسّمها: بالتساوي أو بحصص أو بعدة دافعين. في النهاية يظهر من يدين لمن وبكم، وما بقي مفتوحاً.",
      idea: "أقوى زاوية على الإطلاق، لأن الجميع يعرفها. اعرض حساباً حقيقياً بمبالغ حقيقية؛ والأسماء يمكنك إخفاؤها.",
    },
    {
      shot: "messages",
      title: "الرسائل",
      body: "الاتفاقات تبقى مع المناسبة، لا في محادثة بين صور الإجازة والرسائل الصوتية. وللإعلان للجميع هناك قوالب جاهزة.",
      idea: "ضع الرسالة التي تضيع دائماً في مجموعة بجانب الرسالة نفسها هنا. لا يلزم شرح أكثر.",
    },
    {
      shot: "games",
      title: "22 لعبة للسهرات",
      body: "الجميع يلعب من هاتفه دون تثبيت أي شيء. وإن وُجد تلفاز، تظهر اللعبة عليه وينظر الجميع في الاتجاه نفسه.",
      idea: "صوّر المجموعة، لا الشاشة. ردود الفعل بعد الدقيقة الثانية هي ما يبقى في الذاكرة.",
    },
    {
      shot: "services",
      title: "إيجاد مزوّدي الخدمات",
      body: "مزوّدون للسهرة — درس طبخ، جولة بحرية، مصوّر — بجانب المناسبة مباشرة، مع السعر للفرد. والطلب ينطلق من التخطيط نفسه.",
      idea: "إن كنت تصوّر في مدينة، فاعرض ما يمكن حجزه فيها. محلي، وبالتالي قريب من متابعيك.",
    },
  ],
  gamesTitle: "الألعاب الـ22 كاملة",
  gamesIntro: "لتعرف عمّا تتحدث. «مجانية» تعني: تُلعب بدون Premium.",
  gamesFree: "مجانية",
  gamesPremium: "Premium",
  gamesPlayers: (min, max) => `${min}–${max} أشخاص`,
  gamesNote: "الأسماء هنا بلغتك — وهي نفسها في التطبيق.",
};

const TOUR: Record<SeoLang, CreatorTour> = { de, en, es, fr, it, pt, nl, pl, tr, ar };

/**
 * Tour zur Sprache. Unbekanntes faellt auf Englisch zurueck — NICHT auf
 * Deutsch, wie im Rest der Aussenkommunikation: ein spanischer Influencer soll
 * im Zweifel Englisch lesen, nicht Deutsch.
 */
export function creatorTour(lang: string | null | undefined): CreatorTour {
  return (lang && TOUR[lang as SeoLang]) || en;
}

/**
 * Zu welcher Sprache es Bildschirme gibt. Deckt sich mit den Sprachen der
 * Tour; steht trotzdem hier, weil es an den Dateien unter public/tour/ haengt
 * und nicht am Text.
 */
export function tourShotLang(lang: string | null | undefined): SeoLang {
  return (lang && lang in TOUR ? lang : "en") as SeoLang;
}
