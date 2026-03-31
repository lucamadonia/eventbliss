export interface Fact {
  statement: string;
  isTrue: boolean;
  explanation: string;
  category: string;
}

export interface ThreeStatements {
  statements: [string, string, string];
  trueIndex: number;
  category: string;
}

export const FACTS: Fact[] = [
  // Natur & Tiere
  { statement: 'Oktopusse haben drei Herzen.', isTrue: true, explanation: 'Zwei Kiemenherzen pumpen Blut zu den Kiemen, ein Hauptherz pumpt es durch den Koerper.', category: 'Natur' },
  { statement: 'Goldfische haben ein Gedaechtnis von nur 3 Sekunden.', isTrue: false, explanation: 'Goldfische koennen sich monatelang an Dinge erinnern — der 3-Sekunden-Mythos ist falsch.', category: 'Natur' },
  { statement: 'Honig kann niemals schlecht werden.', isTrue: true, explanation: 'In aegyptischen Graebern wurde 3000 Jahre alter Honig gefunden, der noch essbar war.', category: 'Natur' },
  { statement: 'Krokodile koennen nicht mit der Zunge lecken.', isTrue: true, explanation: 'Die Zunge eines Krokodils ist am Gaumen festgewachsen und kann nicht herausgestreckt werden.', category: 'Natur' },
  { statement: 'Elefanten sind die einzigen Tiere, die nicht springen koennen.', isTrue: true, explanation: 'Aufgrund ihres Gewichts und ihrer Knochenstruktur koennen Elefanten tatsaechlich nicht springen.', category: 'Natur' },
  { statement: 'Bananen wachsen auf Baeumen.', isTrue: false, explanation: 'Bananenpflanzen sind keine Baeume, sondern riesige Staudenpflanzen.', category: 'Natur' },
  { statement: 'Ein Blitz kann die gleiche Stelle zweimal treffen.', isTrue: true, explanation: 'Hohe Gebaeude wie das Empire State Building werden jedes Jahr bis zu 100 Mal getroffen.', category: 'Natur' },
  { statement: 'Delfine schlafen mit einem offenen Auge.', isTrue: true, explanation: 'Delfine schlafen mit einer Gehirnhaelfte und halten ein Auge offen fuer Raubtiere.', category: 'Natur' },
  { statement: 'Koalas trinken kein Wasser.', isTrue: false, explanation: 'Koalas trinken selten Wasser, da sie Feuchtigkeit aus Eukalyptusblaettern beziehen, aber bei Hitze trinken sie durchaus.', category: 'Natur' },
  { statement: 'Schmetterlinge schmecken mit ihren Fuessen.', isTrue: true, explanation: 'Schmetterlinge haben Geschmacksrezeptoren an ihren Fuessen, um Pflanzen zu identifizieren.', category: 'Natur' },

  // Wissenschaft
  { statement: 'Schall reist schneller als Licht.', isTrue: false, explanation: 'Licht reist mit etwa 300.000 km/s, Schall nur mit etwa 343 m/s.', category: 'Wissenschaft' },
  { statement: 'Der Mensch besteht zu etwa 60% aus Wasser.', isTrue: true, explanation: 'Der menschliche Koerper besteht je nach Alter zu 50-75% aus Wasser.', category: 'Wissenschaft' },
  { statement: 'Venus dreht sich in die entgegengesetzte Richtung der meisten Planeten.', isTrue: true, explanation: 'Venus hat eine retrograde Rotation — die Sonne geht dort im Westen auf.', category: 'Wissenschaft' },
  { statement: 'Glas ist eine Fluessigkeit.', isTrue: false, explanation: 'Glas ist ein amorpher Feststoff. Der Mythos von fliessendem Glas in alten Fenstern ist falsch.', category: 'Wissenschaft' },
  { statement: 'Ein Tag auf der Venus ist laenger als ein Jahr auf der Venus.', isTrue: true, explanation: 'Eine Rotation dauert 243 Erdtage, eine Umrundung der Sonne nur 225 Erdtage.', category: 'Wissenschaft' },
  { statement: 'Menschen nutzen nur 10% ihres Gehirns.', isTrue: false, explanation: 'Hirnscans zeigen, dass wir praktisch alle Bereiche des Gehirns nutzen, nur nicht alle gleichzeitig.', category: 'Wissenschaft' },
  { statement: 'Diamanten entstehen aus Kohle.', isTrue: false, explanation: 'Diamanten entstehen aus Kohlenstoff unter extremem Druck, aber nicht aus Kohle — die meisten sind aelter als Pflanzen auf der Erde.', category: 'Wissenschaft' },
  { statement: 'Im Weltraum herrscht absolute Stille.', isTrue: true, explanation: 'Schall braucht ein Medium zur Ausbreitung. Im Vakuum des Weltalls gibt es keines.', category: 'Wissenschaft' },
  { statement: 'Der menschliche Koerper hat mehr Bakterien als eigene Zellen.', isTrue: true, explanation: 'Schaetzungen zufolge hat der Koerper etwa 38 Billionen Bakterien bei 30 Billionen eigenen Zellen.', category: 'Wissenschaft' },
  { statement: 'Wasser leitet Strom.', isTrue: false, explanation: 'Reines Wasser leitet keinen Strom. Erst die darin geloesten Mineralien und Salze machen es leitfaehig.', category: 'Wissenschaft' },

  // Geschichte
  { statement: 'Kleopatra lebte naeher an der Mondlandung als am Bau der Pyramiden.', isTrue: true, explanation: 'Die Pyramiden wurden ca. 2560 v.Chr. gebaut, Kleopatra lebte 69-30 v.Chr., die Mondlandung war 1969.', category: 'Geschichte' },
  { statement: 'Napoleon war ungewoehnlich klein.', isTrue: false, explanation: 'Napoleon war ca. 1,70m gross — durchschnittlich fuer seine Zeit. Der Mythos entstand durch britische Propaganda.', category: 'Geschichte' },
  { statement: 'Die Chinesische Mauer ist vom Mond aus sichtbar.', isTrue: false, explanation: 'Astronauten bestaetigen, dass die Mauer vom Mond aus nicht sichtbar ist — sie ist zu schmal.', category: 'Geschichte' },
  { statement: 'Oxford University ist aelter als das Aztekenreich.', isTrue: true, explanation: 'Oxford wurde ab 1096 gegruendet, das Aztekenreich erst 1428.', category: 'Geschichte' },
  { statement: 'Wikinger trugen Helme mit Hoernern.', isTrue: false, explanation: 'Archaeologische Funde zeigen einfache Helme ohne Hoerner. Das Klischee stammt aus dem 19. Jahrhundert.', category: 'Geschichte' },
  { statement: 'In der Antike hielten die Menschen die Erde fuer eine Scheibe.', isTrue: false, explanation: 'Bereits die alten Griechen wussten, dass die Erde rund ist. Eratosthenes berechnete sogar ihren Umfang.', category: 'Geschichte' },
  { statement: 'Der Eiffelturm sollte nach 20 Jahren abgerissen werden.', isTrue: true, explanation: 'Er wurde 1889 als temporaeres Bauwerk errichtet und ueberlebte nur, weil er als Funkturm nuetzlich war.', category: 'Geschichte' },
  { statement: 'Die Titanic wurde als unsinkbar beworben.', isTrue: false, explanation: 'Die White Star Line nannte sie nie offiziell unsinkbar. Das war eine Uebertreibung der Presse.', category: 'Geschichte' },
  { statement: 'Albert Einstein ist in Mathe durchgefallen.', isTrue: false, explanation: 'Einstein hatte Bestnoten in Mathematik. Dieser Mythos ist voellig falsch.', category: 'Geschichte' },
  { statement: 'Spaghetti mit Tomatensosse ist ein traditionelles italienisches Gericht.', isTrue: false, explanation: 'Tomaten kamen erst im 16. Jahrhundert aus Amerika nach Europa. Traditionelle Pasta war anders gewuerzt.', category: 'Geschichte' },

  // Geografie
  { statement: 'Russland hat elf Zeitzonen.', isTrue: true, explanation: 'Von Kaliningrad bis Kamtschatka erstreckt sich Russland ueber 11 Zeitzonen.', category: 'Geografie' },
  { statement: 'Der Amazonas ist der laengste Fluss der Welt.', isTrue: false, explanation: 'Der Nil mit ca. 6.650 km gilt als laengster Fluss, der Amazonas ist der wasserreichste.', category: 'Geografie' },
  { statement: 'Island hat keine Muecken.', isTrue: true, explanation: 'Island ist tatsaechlich eines der wenigen Laender weltweit ohne heimische Mueckenarten.', category: 'Geografie' },
  { statement: 'Die Sahara ist die groesste Wueste der Welt.', isTrue: false, explanation: 'Die Antarktis ist die groesste Wueste (14 Mio. km²). Die Sahara ist die groesste Heisswueste.', category: 'Geografie' },
  { statement: 'In Australien gibt es mehr Kaengurus als Menschen.', isTrue: true, explanation: 'Es gibt ca. 50 Millionen Kaengurus bei 26 Millionen Menschen in Australien.', category: 'Geografie' },
  { statement: 'Der Mount Everest ist der hoechste Berg vom Erdmittelpunkt aus gemessen.', isTrue: false, explanation: 'Der Chimborazo in Ecuador ist dem Erdmittelpunkt am weitesten entfernt, weil die Erde am Aequator dicker ist.', category: 'Geografie' },

  // Kurioses
  { statement: 'In der Schweiz ist es illegal, nur ein Meerschweinchen zu halten.', isTrue: true, explanation: 'Meerschweinchen sind soziale Tiere. Schweizer Tierschutzgesetze verbieten Einzelhaltung.', category: 'Kurioses' },
  { statement: 'Es gibt mehr Sterne im Universum als Sandkoerner auf der Erde.', isTrue: true, explanation: 'Schaetzungen: ca. 10^24 Sterne im beobachtbaren Universum, ca. 7.5×10^18 Sandkoerner.', category: 'Kurioses' },
  { statement: 'Eine Schnecke kann bis zu 3 Jahre schlafen.', isTrue: true, explanation: 'Manche Schneckenarten koennen in einen langanhaltenden Ruhezustand fallen, besonders bei Trockenheit.', category: 'Kurioses' },
  { statement: 'Der Erfinder der Pringles-Dose ist in einer begraben.', isTrue: true, explanation: 'Fredric Baur, der Erfinder der Pringles-Dose, wurde 2008 auf eigenen Wunsch in einer bestattet.', category: 'Kurioses' },
  { statement: 'Kuehe koennen Treppen hinaufsteigen, aber nicht hinunter.', isTrue: true, explanation: 'Aufgrund ihrer Kniestruktur und ihres Sichtfelds koennen Kuehe Treppen nicht sicher hinabsteigen.', category: 'Kurioses' },
  { statement: 'Jeder Mensch verschluckt im Schlaf durchschnittlich 8 Spinnen pro Jahr.', isTrue: false, explanation: 'Dieser Mythos wurde 1993 absichtlich als Beispiel fuer Fake-Fakten erfunden.', category: 'Kurioses' },
  { statement: 'Hummeln duerfen laut Physik eigentlich nicht fliegen.', isTrue: false, explanation: 'Dieses Geruecht basiert auf falschen Berechnungen. Die Aerodynamik von Hummelflug ist laengst erklaert.', category: 'Kurioses' },
  { statement: 'In Japan gibt es einen Insel voller Katzen, auf der sie die Menschen ueberwiegen.', isTrue: true, explanation: 'Aoshima, auch Katzeninsel genannt, hat etwa 6:1 Katzen-zu-Menschen-Verhaeltnis.', category: 'Kurioses' },
  { statement: 'Der kuerzeste Krieg der Geschichte dauerte 38 Minuten.', isTrue: true, explanation: 'Der Anglo-Sansibar-Krieg 1896 dauerte zwischen 38 und 45 Minuten.', category: 'Kurioses' },
  { statement: 'Flamingos sind von Geburt an rosa.', isTrue: false, explanation: 'Flamingos werden grau-weiss geboren und faerben sich durch ihre Nahrung (Krebstiere, Algen) rosa.', category: 'Kurioses' },

  // Technik
  { statement: 'Das erste iPhone hatte keinen App Store.', isTrue: true, explanation: 'Das erste iPhone kam 2007 heraus, der App Store wurde erst 2008 eingefuehrt.', category: 'Technik' },
  { statement: 'Die erste SMS der Welt lautete "Merry Christmas".', isTrue: true, explanation: 'Am 3. Dezember 1992 schickte Neil Papworth die erste SMS mit dem Text "Merry Christmas".', category: 'Technik' },
  { statement: 'WiFi steht fuer Wireless Fidelity.', isTrue: false, explanation: 'WiFi ist ein Markenname und steht fuer nichts. Es wurde von einer Marketingfirma erfunden.', category: 'Technik' },
  { statement: 'Der erste Computer war so gross wie ein Raum.', isTrue: true, explanation: 'ENIAC (1945) wog 27 Tonnen und belegte 167 Quadratmeter.', category: 'Technik' },
  { statement: 'E-Mails verbrauchen keinen Strom.', isTrue: false, explanation: 'Jede E-Mail verbraucht ca. 4g CO2, da Server und Netzwerke Energie benoetigen.', category: 'Technik' },
];

export const THREE_STATEMENTS: ThreeStatements[] = [
  {
    statements: [
      'Ein Mensch produziert in seinem Leben genug Speichel, um zwei Schwimmbecken zu fuellen.',
      'Das menschliche Auge kann ueber 100 Millionen Farben unterscheiden.',
      'Die menschliche Nase kann ueber 1 Billion verschiedene Gerueche wahrnehmen.',
    ],
    trueIndex: 2,
    category: 'Koerper',
  },
  {
    statements: [
      'Finnland hat mehr Saunas als Autos.',
      'In Frankreich ist es verboten, ein Schwein Napoleon zu nennen.',
      'In England ist es illegal, im Parlament zu sterben.',
    ],
    trueIndex: 0,
    category: 'Laender',
  },
  {
    statements: [
      'Bienen koennen Gesichter erkennen.',
      'Ameisen schlafen nie.',
      'Schmetterlinge leben nur einen Tag.',
    ],
    trueIndex: 0,
    category: 'Tiere',
  },
  {
    statements: [
      'Shakespeare hat das Wort "Roboter" erfunden.',
      'Shakespeare hat das Wort "Einbrecher" erfunden.',
      'Shakespeare hat das Wort "Augenbraue" erfunden.',
    ],
    trueIndex: 2,
    category: 'Sprache',
  },
  {
    statements: [
      'Der Eiffelturm wird im Sommer bis zu 15 cm hoeher.',
      'Big Ben bezieht sich auf die Glocke, nicht den Turm.',
      'Das Kolosseum hatte ein einziehbares Dach.',
    ],
    trueIndex: 1,
    category: 'Bauwerke',
  },
  {
    statements: [
      'Oktopusse haben blaues Blut.',
      'Haie koennen Krebs bekommen.',
      'Flamingos koennen nur auf einem Bein stehen weil das andere nicht knicken kann.',
    ],
    trueIndex: 0,
    category: 'Tiere',
  },
  {
    statements: [
      'Die Sonne ist ein Planet.',
      'Ein Teeloefel Neutronenstern wiegt ca. 6 Milliarden Tonnen.',
      'Mars hat zwei Monde, die beide groesser als unser Mond sind.',
    ],
    trueIndex: 1,
    category: 'Weltraum',
  },
  {
    statements: [
      'Coca-Cola war urspruenglich gruen.',
      'Orangen heissen in Spanien "Naranja".',
      'Erdbeeren sind keine Beeren, Bananen aber schon.',
    ],
    trueIndex: 2,
    category: 'Essen',
  },
  {
    statements: [
      'Kleopatra lebte naeher an der Erfindung des iPhones als am Bau der Pyramiden.',
      'Die Roemer benutzten bereits Zahnbuersten aus Schweineborsten.',
      'Im Mittelalter glaubten alle, die Erde sei flach.',
    ],
    trueIndex: 0,
    category: 'Geschichte',
  },
  {
    statements: [
      'Wolken wiegen durchschnittlich 500.000 Kilogramm.',
      'Regentropfen fallen immer mit der gleichen Geschwindigkeit.',
      'Blitze sind heisser als die Oberflaeche der Sonne.',
    ],
    trueIndex: 2,
    category: 'Wetter',
  },
  {
    statements: [
      'Katzen koennen Wasser schmecken.',
      'Katzen haben mehr Knochen als Menschen.',
      'Katzen schwitzen nur an den Augen.',
    ],
    trueIndex: 1,
    category: 'Katzen',
  },
  {
    statements: [
      'Der QR-Code wurde in Deutschland erfunden.',
      'Der QR-Code wurde fuer die Automobilindustrie erfunden.',
      'Der erste QR-Code enthielt eine URL.',
    ],
    trueIndex: 1,
    category: 'Technik',
  },
];
