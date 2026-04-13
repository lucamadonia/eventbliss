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
  { statement: 'Oktopusse haben drei Herzen.', isTrue: true, explanation: 'Zwei Kiemenherzen pumpen Blut zu den Kiemen, ein Hauptherz pumpt es durch den Körper.', category: 'Natur' },
  { statement: 'Goldfische haben ein Gedaechtnis von nur 3 Sekunden.', isTrue: false, explanation: 'Goldfische können sich monatelang an Dinge erinnern — der 3-Sekunden-Mythos ist falsch.', category: 'Natur' },
  { statement: 'Honig kann niemals schlecht werden.', isTrue: true, explanation: 'In aegyptischen Graebern wurde 3000 Jahre alter Honig gefunden, der noch essbar war.', category: 'Natur' },
  { statement: 'Krokodile können nicht mit der Zunge lecken.', isTrue: true, explanation: 'Die Zunge eines Krokodils ist am Gaumen festgewachsen und kann nicht herausgestreckt werden.', category: 'Natur' },
  { statement: 'Elefanten sind die einzigen Tiere, die nicht springen können.', isTrue: true, explanation: 'Aufgrund ihres Gewichts und ihrer Knochenstruktur können Elefanten tatsaechlich nicht springen.', category: 'Natur' },
  { statement: 'Bananen wachsen auf Baeumen.', isTrue: false, explanation: 'Bananenpflanzen sind keine Baeume, sondern riesige Staudenpflanzen.', category: 'Natur' },
  { statement: 'Ein Blitz kann die gleiche Stelle zweimal treffen.', isTrue: true, explanation: 'Hohe Gebaeude wie das Empire State Building werden jedes Jahr bis zu 100 Mal getroffen.', category: 'Natur' },
  { statement: 'Delfine schlafen mit einem offenen Auge.', isTrue: true, explanation: 'Delfine schlafen mit einer Gehirnhälfte und halten ein Auge offen fürRaubtiere.', category: 'Natur' },
  { statement: 'Koalas trinken kein Wasser.', isTrue: false, explanation: 'Koalas trinken selten Wasser, da sie Feuchtigkeit aus Eukalyptusblaettern beziehen, aber bei Hitze trinken sie durchaus.', category: 'Natur' },
  { statement: 'Schmetterlinge schmecken mit ihren Fuessen.', isTrue: true, explanation: 'Schmetterlinge haben Geschmacksrezeptoren an ihren Fuessen, um Pflanzen zu identifizieren.', category: 'Natur' },

  // Wissenschaft
  { statement: 'Schall reist schneller als Licht.', isTrue: false, explanation: 'Licht reist mit etwa 300.000 km/s, Schall nur mit etwa 343 m/s.', category: 'Wissenschaft' },
  { statement: 'Der Mensch besteht zu etwa 60% aus Wasser.', isTrue: true, explanation: 'Der menschliche Körper besteht je nach Alter zu 50-75% aus Wasser.', category: 'Wissenschaft' },
  { statement: 'Venus dreht sich in die entgegengesetzte Richtung der meisten Planeten.', isTrue: true, explanation: 'Venus hat eine retrograde Rotation — die Sonne geht dort im Westen auf.', category: 'Wissenschaft' },
  { statement: 'Glas ist eine Fluessigkeit.', isTrue: false, explanation: 'Glas ist ein amorpher Feststoff. Der Mythos von fliessendem Glas in alten Fenstern ist falsch.', category: 'Wissenschaft' },
  { statement: 'Ein Tag auf der Venus ist laenger als ein Jahr auf der Venus.', isTrue: true, explanation: 'Eine Rotation dauert 243 Erdtage, eine Umrundung der Sonne nur 225 Erdtage.', category: 'Wissenschaft' },
  { statement: 'Menschen nutzen nur 10% ihres Gehirns.', isTrue: false, explanation: 'Hirnscans zeigen, dass wir praktisch alle Bereiche des Gehirns nutzen, nur nicht alle gleichzeitig.', category: 'Wissenschaft' },
  { statement: 'Diamanten entstehen aus Kohle.', isTrue: false, explanation: 'Diamanten entstehen aus Kohlenstoff unter extremem Druck, aber nicht aus Kohle — die meisten sind aelter als Pflanzen auf der Erde.', category: 'Wissenschaft' },
  { statement: 'Im Weltraum herrscht absolute Stille.', isTrue: true, explanation: 'Schall braucht ein Medium zur Ausbreitung. Im Vakuum des Weltalls gibt es keines.', category: 'Wissenschaft' },
  { statement: 'Der menschliche Körper hat mehr Bakterien als eigene Zellen.', isTrue: true, explanation: 'Schaetzungen zufolge hat der Körper etwa 38 Billionen Bakterien bei 30 Billionen eigenen Zellen.', category: 'Wissenschaft' },
  { statement: 'Wasser leitet Strom.', isTrue: false, explanation: 'Reines Wasser leitet keinen Strom. Erst die darin geloesten Mineralien und Salze machen es leitfaehig.', category: 'Wissenschaft' },

  // Geschichte
  { statement: 'Kleopatra lebte naeher an der Mondlandung als am Bau der Pyramiden.', isTrue: true, explanation: 'Die Pyramiden wurden ca. 2560 v.Chr. gebaut, Kleopatra lebte 69-30 v.Chr., die Mondlandung war 1969.', category: 'Geschichte' },
  { statement: 'Napoleon war ungewöhnlich klein.', isTrue: false, explanation: 'Napoleon war ca. 1,70m groß — durchschnittlich fürseine Zeit. Der Mythos entstand durch britische Propaganda.', category: 'Geschichte' },
  { statement: 'Die Chinesische Mauer ist vom Mond aus sichtbar.', isTrue: false, explanation: 'Astronauten bestaetigen, dass die Mauer vom Mond aus nicht sichtbar ist — sie ist zu schmal.', category: 'Geschichte' },
  { statement: 'Oxford University ist aelter als das Aztekenreich.', isTrue: true, explanation: 'Oxford wurde ab 1096 gegruendet, das Aztekenreich erst 1428.', category: 'Geschichte' },
  { statement: 'Wikinger trugen Helme mit Hoernern.', isTrue: false, explanation: 'Archaeologische Funde zeigen einfache Helme ohne Hoerner. Das Klischee stammt aus dem 19. Jahrhundert.', category: 'Geschichte' },
  { statement: 'In der Antike hielten die Menschen die Erde füreine Scheibe.', isTrue: false, explanation: 'Bereits die alten Griechen wussten, dass die Erde rund ist. Eratosthenes berechnete sogar ihren Umfang.', category: 'Geschichte' },
  { statement: 'Der Eiffelturm sollte nach 20 Jahren abgerissen werden.', isTrue: true, explanation: 'Er wurde 1889 als temporäres Bauwerk errichtet und überlebte nur, weil er als Funkturm nützlich war.', category: 'Geschichte' },
  { statement: 'Die Titanic wurde als unsinkbar beworben.', isTrue: false, explanation: 'Die White Star Line nannte sie nie offiziell unsinkbar. Das war eine Übertreibung der Presse.', category: 'Geschichte' },
  { statement: 'Albert Einstein ist in Mathe durchgefallen.', isTrue: false, explanation: 'Einstein hatte Bestnoten in Mathematik. Dieser Mythos ist völlig falsch.', category: 'Geschichte' },
  { statement: 'Spaghetti mit Tomatensosse ist ein traditionelles italienisches Gericht.', isTrue: false, explanation: 'Tomaten kamen erst im 16. Jahrhundert aus Amerika nach Europa. Traditionelle Pasta war anders gewuerzt.', category: 'Geschichte' },

  // Geografie
  { statement: 'Russland hat elf Zeitzonen.', isTrue: true, explanation: 'Von Kaliningrad bis Kamtschatka erstreckt sich Russland über11 Zeitzonen.', category: 'Geografie' },
  { statement: 'Der Amazonas ist der längste Fluss der Welt.', isTrue: false, explanation: 'Der Nil mit ca. 6.650 km gilt als längster Fluss, der Amazonas ist der wasserreichste.', category: 'Geografie' },
  { statement: 'Island hat keine Muecken.', isTrue: true, explanation: 'Island ist tatsaechlich eines der wenigen Länder weltweit ohne heimische Mueckenarten.', category: 'Geografie' },
  { statement: 'Die Sahara ist die größte Wüste der Welt.', isTrue: false, explanation: 'Die Antarktis ist die größte Wüste (14 Mio. km²). Die Sahara ist die größte Heisswueste.', category: 'Geografie' },
  { statement: 'In Australien gibt es mehr Kängurus als Menschen.', isTrue: true, explanation: 'Es gibt ca. 50 Millionen Kängurus bei 26 Millionen Menschen in Australien.', category: 'Geografie' },
  { statement: 'Der Mount Everest ist der höchste Berg vom Erdmittelpunkt aus gemessen.', isTrue: false, explanation: 'Der Chimborazo in Ecuador ist dem Erdmittelpunkt am weitesten entfernt, weil die Erde am Aequator dicker ist.', category: 'Geografie' },

  // Kurioses
  { statement: 'In der Schweiz ist es illegal, nur ein Meerschweinchen zu halten.', isTrue: true, explanation: 'Meerschweinchen sind soziale Tiere. Schweizer Tierschutzgesetze verbieten Einzelhaltung.', category: 'Kurioses' },
  { statement: 'Es gibt mehr Sterne im Universum als Sandkoerner auf der Erde.', isTrue: true, explanation: 'Schaetzungen: ca. 10^24 Sterne im beobachtbaren Universum, ca. 7.5×10^18 Sandkoerner.', category: 'Kurioses' },
  { statement: 'Eine Schnecke kann bis zu 3 Jahre schlafen.', isTrue: true, explanation: 'Manche Schneckenarten können in einen langanhaltenden Ruhezustand fallen, besonders bei Trockenheit.', category: 'Kurioses' },
  { statement: 'Der Erfinder der Pringles-Dose ist in einer begraben.', isTrue: true, explanation: 'Fredric Baur, der Erfinder der Pringles-Dose, wurde 2008 auf eigenen Wunsch in einer bestattet.', category: 'Kurioses' },
  { statement: 'Kühe können Treppen hinaufsteigen, aber nicht hinunter.', isTrue: true, explanation: 'Aufgrund ihrer Kniestruktur und ihres Sichtfelds können Kühe Treppen nicht sicher hinabsteigen.', category: 'Kurioses' },
  { statement: 'Jeder Mensch verschluckt im Schlaf durchschnittlich 8 Spinnen pro Jahr.', isTrue: false, explanation: 'Dieser Mythos wurde 1993 absichtlich als Beispiel fürFake-Fakten erfunden.', category: 'Kurioses' },
  { statement: 'Hummeln duerfen laut Physik eigentlich nicht fliegen.', isTrue: false, explanation: 'Dieses Gerücht basiert auf falschen Berechnungen. Die Aerodynamik von Hummelflug ist laengst erklaert.', category: 'Kurioses' },
  { statement: 'In Japan gibt es einen Insel voller Katzen, auf der sie die Menschen überwiegen.', isTrue: true, explanation: 'Aoshima, auch Katzeninsel genannt, hat etwa 6:1 Katzen-zu-Menschen-Verhältnis.', category: 'Kurioses' },
  { statement: 'Der kuerzeste Krieg der Geschichte dauerte 38 Minuten.', isTrue: true, explanation: 'Der Anglo-Sansibar-Krieg 1896 dauerte zwischen 38 und 45 Minuten.', category: 'Kurioses' },
  { statement: 'Flamingos sind von Geburt an rosa.', isTrue: false, explanation: 'Flamingos werden grau-weiss geboren und faerben sich durch ihre Nahrung (Krebstiere, Algen) rosa.', category: 'Kurioses' },

  // Technik
  { statement: 'Das erste iPhone hatte keinen App Store.', isTrue: true, explanation: 'Das erste iPhone kam 2007 heraus, der App Store wurde erst 2008 eingeführt.', category: 'Technik' },
  { statement: 'Die erste SMS der Welt lautete "Merry Christmas".', isTrue: true, explanation: 'Am 3. Dezember 1992 schickte Neil Papworth die erste SMS mit dem Text "Merry Christmas".', category: 'Technik' },
  { statement: 'WiFi steht fürWireless Fidelity.', isTrue: false, explanation: 'WiFi ist ein Markenname und steht fürnichts. Es wurde von einer Marketingfirma erfunden.', category: 'Technik' },
  { statement: 'Der erste Computer war so groß wie ein Raum.', isTrue: true, explanation: 'ENIAC (1945) wog 27 Tonnen und belegte 167 Quadratmeter.', category: 'Technik' },
  { statement: 'E-Mails verbrauchen keinen Strom.', isTrue: false, explanation: 'Jede E-Mail verbraucht ca. 4g CO2, da Server und Netzwerke Energie benoetigen.', category: 'Technik' },

  // Neue Fakten (50)
  { statement: 'Wombats produzieren wuerfelfoemigen Kot.', isTrue: true, explanation: 'Wombats haben einen speziellen Darm, der wuerfelfoermige Hinterlassenschaften formt, damit sie nicht wegrollen.', category: 'Natur' },
  { statement: 'Der Eiffelturm ist im Winter kleiner als im Sommer.', isTrue: true, explanation: 'Durch die Kaelte zieht sich das Metall zusammen, wodurch der Turm bis zu 15 cm schrumpft.', category: 'Kurioses' },
  { statement: 'Kühe haben vier Maegen.', isTrue: true, explanation: 'Kühe haben tatsaechlich vier Maegenabschnitte: Pansen, Netzmagen, Blaettermagen und Labmagen.', category: 'Natur' },
  { statement: 'Ein Strauss kann schneller laufen als ein Pferd.', isTrue: true, explanation: 'Strausse können bis zu 70 km/h erreichen, während Pferde maximal 65 km/h schaffen.', category: 'Natur' },
  { statement: 'Die Erde dreht sich schneller als vor einer Million Jahren.', isTrue: false, explanation: 'Die Erde dreht sich langsamer. Durch die Gezeitenkraefte des Mondes werden die Tage laenger.', category: 'Wissenschaft' },
  { statement: 'Venedig hat mehr Brücken als Amsterdam.', isTrue: false, explanation: 'Amsterdam hat über1.500 Brücken, Venedig nur etwa 400.', category: 'Geografie' },
  { statement: 'Der Amazonas mündet ins Meer ohne eine einzige Brücke.', isTrue: true, explanation: 'Es gibt keine Brücke überden gesamten Amazonas — er fließt durch zu dichten Regenwald.', category: 'Geografie' },
  { statement: 'Bienen können Gesichter erkennen.', isTrue: true, explanation: 'Studien zeigen, dass Honigbienen menschliche Gesichter unterscheiden und wiedererkennen können.', category: 'Natur' },
  { statement: 'Der Mars hat den höchsten Berg im Sonnensystem.', isTrue: true, explanation: 'Olympus Mons auf dem Mars ist mit etwa 22 km der höchste bekannte Berg im Sonnensystem.', category: 'Wissenschaft' },
  { statement: 'Schokolade ist fürHunde giftig.', isTrue: true, explanation: 'Theobromin in Schokolade kann fürHunde tödlich sein, da sie es nicht abbauen können.', category: 'Natur' },
  { statement: 'In Australien verlieren Baeume keine Blaetter, sondern ihre Rinde.', isTrue: true, explanation: 'Viele Eukalyptusarten werfen ihre Rinde ab statt ihrer Blaetter.', category: 'Natur' },
  { statement: 'Das Herz einer Garnele sitzt im Kopf.', isTrue: true, explanation: 'Das Herz einer Garnele befindet sich tatsaechlich in ihrem Kopf.', category: 'Natur' },
  { statement: 'Der Vatikan hat die höchste Kriminalitaetsrate der Welt pro Kopf.', isTrue: true, explanation: 'Da der Vatikan nur etwa 800 Einwohner hat, fuehren wenige Straftaten zu einer hohen Pro-Kopf-Rate.', category: 'Kurioses' },
  { statement: 'Ein Mensch kann im Weltraum überleben, wenn er die Luft anhaelt.', isTrue: false, explanation: 'Im Vakuum würde die Luft aus den Lungen gewaltsam herausgezogen. Man würde ca. 15 Sekunden bewusstlos.', category: 'Wissenschaft' },
  { statement: 'Papier kann maximal 7 Mal gefaltet werden.', isTrue: false, explanation: 'Obwohl es schwierig ist, wurde Papier bereits 12 Mal gefaltet (mit ausreichend großem Blatt).', category: 'Kurioses' },
  { statement: 'Die Große Mauer Chinas ist über21.000 km lang.', isTrue: true, explanation: 'Mit allen Nebenmauern und Verzweigungen misst sie insgesamt 21.196 km.', category: 'Geschichte' },
  { statement: 'Finnland hat mehr Saunas als Autos.', isTrue: true, explanation: 'Finnland hat ca. 3,3 Millionen Saunas bei 5,5 Millionen Einwohnern — das ist mehr als Autos.', category: 'Kurioses' },
  { statement: 'Ein Blauwal-Herz ist so groß wie ein Kleinwagen.', isTrue: true, explanation: 'Das Herz eines Blauwals kann bis zu 600 kg wiegen und ist so groß wie ein VW Kaefer.', category: 'Natur' },
  { statement: 'Die Sonne ist gelb.', isTrue: false, explanation: 'Die Sonne ist eigentlich weiss. Sie erscheint uns gelb durch die Atmosphaere der Erde.', category: 'Wissenschaft' },
  { statement: 'Fische können ertrinken.', isTrue: true, explanation: 'Wenn zu wenig Sauerstoff im Wasser ist, können Fische tatsaechlich ersticken.', category: 'Natur' },
  { statement: 'Der Mount Everest waechst jedes Jahr um etwa 4 Millimeter.', isTrue: true, explanation: 'Durch tektonische Plattenbewegungen waechst der Himalaya immer noch.', category: 'Wissenschaft' },
  { statement: 'Ketchup wurde im 19. Jahrhundert als Medizin verkauft.', isTrue: true, explanation: 'In den 1830er Jahren wurde Tomatenketchup als Heilmittel gegen Durchfall verkauft.', category: 'Geschichte' },
  { statement: 'Der kuerzeste Flug der Welt dauert 57 Sekunden.', isTrue: true, explanation: 'Der Flug zwischen Westray und Papa Westray in Schottland dauert nur knapp eine Minute.', category: 'Kurioses' },
  { statement: 'Oktopusse haben drei Gehirne.', isTrue: false, explanation: 'Oktopusse haben neun Gehirne — ein zentrales und ein zusaetzliches in jedem der acht Arme.', category: 'Natur' },
  { statement: 'Brasilien ist nach einem Baum benannt.', isTrue: true, explanation: 'Brasilien ist nach dem Brasilholz (Pau-Brasil) benannt, das dort reichlich vorkommt.', category: 'Geschichte' },
  { statement: 'Ein Kolibri kann rueckwaerts fliegen.', isTrue: true, explanation: 'Kolibris sind die einzigen Vögel, die tatsaechlich rueckwaerts fliegen können.', category: 'Natur' },
  { statement: 'Die Nase waechst das ganze Leben lang.', isTrue: true, explanation: 'Nase und Ohren hören nie auf zu wachsen, da sie aus Knorpel bestehen.', category: 'Wissenschaft' },
  { statement: 'In Japan ist es ueblich, in der Badewanne zu essen.', isTrue: false, explanation: 'In Japan wird das Bad als Ort der Reinigung betrachtet. Essen darin waere unueblich.', category: 'Kurioses' },
  { statement: 'Der menschliche Magen produziert taeglich etwa 2 Liter Salzsaeure.', isTrue: true, explanation: 'Die Magensaeure ist stark genug, um Metall aufzuloesen, wird aber durch Schleimhaut geschuetzt.', category: 'Wissenschaft' },
  { statement: 'Es gibt mehr Baeume auf der Erde als Sterne in der Milchstraße.', isTrue: true, explanation: 'Es gibt etwa 3 Billionen Baeume auf der Erde, aber nur 100-400 Milliarden Sterne in der Milchstraße.', category: 'Natur' },
  { statement: 'Die Farbe Orange wurde nach der Frucht benannt, nicht umgekehrt.', isTrue: true, explanation: 'Vor der Orange hiess die Farbe auf Englisch "geoluhread" (gelb-rot). Die Frucht gab der Farbe ihren Namen.', category: 'Kurioses' },
  { statement: 'Bananen sind radioaktiv.', isTrue: true, explanation: 'Bananen enthalten Kalium-40, ein radioaktives Isotop. Die Strahlung ist aber völlig harmlos.', category: 'Wissenschaft' },
  { statement: 'Ein Tag auf dem Pluto dauert laenger als eine Woche auf der Erde.', isTrue: true, explanation: 'Ein Pluto-Tag dauert 6,4 Erdtage — also fast eine ganze Erdwoche.', category: 'Wissenschaft' },
  { statement: 'In der Schweiz darf man nach 22 Uhr nicht mehr die Toilette spuelen.', isTrue: false, explanation: 'Das ist ein weit verbreiteter Mythos. Es gibt kein solches Gesetz in der Schweiz.', category: 'Kurioses' },
  { statement: 'Lachen ist ansteckend, weil das Gehirn Spiegelneuronen aktiviert.', isTrue: true, explanation: 'Spiegelneuronen im Gehirn reagieren auf das Lachen anderer und loesen ähnliche Reaktionen aus.', category: 'Wissenschaft' },
  { statement: 'Russland hat eine groessere Fläche als Pluto.', isTrue: true, explanation: 'Russland hat 17,1 Mio. km², die Oberflaeche von Pluto betraegt nur 16,7 Mio. km².', category: 'Geografie' },
  { statement: 'Ein Teeloefel voll Neutronenstern-Material wiegt 6 Milliarden Tonnen.', isTrue: true, explanation: 'Neutronensterne sind so dicht, dass ein Teeloefel ihres Materials Milliarden Tonnen wiegt.', category: 'Wissenschaft' },
  { statement: 'Katzen haben mehr Knochen als Menschen.', isTrue: true, explanation: 'Katzen haben ca. 230 Knochen, Menschen nur 206.', category: 'Natur' },
  { statement: 'Der Atlantische Ozean wird jedes Jahr breiter.', isTrue: true, explanation: 'Durch Plattentektonik wird der Atlantik jedes Jahr etwa 2,5 cm breiter.', category: 'Wissenschaft' },
  { statement: 'In Norwegen gibt es eine Stadt namens "Hell".', isTrue: true, explanation: 'Hell ist ein Ort in der Gemeinde Verdal in Norwegen. Im Winter friert Hell regelmäßig zu.', category: 'Geografie' },
  { statement: 'Ameisen können schwimmen.', isTrue: true, explanation: 'Die meisten Ameisenarten können schwimmen und erzeugen kleine Floesse bei Hochwasser.', category: 'Natur' },
  { statement: 'Der Mensch teilt 60% seiner DNA mit einer Banane.', isTrue: true, explanation: 'Menschen und Bananen teilen tatsaechlich etwa 60% identischer Gene.', category: 'Wissenschaft' },
  { statement: 'Es regnet auf der Venus Schwefelsaeure.', isTrue: true, explanation: 'Die Wolken der Venus bestehen aus Schwefelsaeuretroepfchen, die aber vor dem Boden verdampfen.', category: 'Wissenschaft' },
  { statement: 'Oxford University existierte vor dem Aztekenreich und vor dem Bau von Machu Picchu.', isTrue: true, explanation: 'Oxford begann ab 1096, das Aztekenreich wurde 1428 gegruendet, Machu Picchu um 1450 gebaut.', category: 'Geschichte' },
  { statement: 'Ein Chamäleon aendert seine Farbe zur Tarnung.', isTrue: false, explanation: 'Chamäleons ändern ihre Farbe hauptsaechlich zur Kommunikation und Temperaturregulierung, nicht zur Tarnung.', category: 'Natur' },
  { statement: 'Der Geruch von frisch geschnittenem Gras ist eigentlich ein Notruf der Pflanzen.', isTrue: true, explanation: 'Pflanzen setzen chemische Stoffe frei, wenn sie verletzt werden — der Geruch ist eine Stressreaktion.', category: 'Natur' },
  { statement: 'In Schweden gibt es ein Hotel komplett aus Eis.', isTrue: true, explanation: 'Das Icehotel in Jukkasjaervi wird jeden Winter aus Eis und Schnee neu aufgebaut.', category: 'Kurioses' },
  { statement: 'Spinnen können fliegen.', isTrue: true, explanation: 'Manche Spinnen nutzen "Ballooning" — sie lassen sich an Seidenfaeden vom Wind tragen.', category: 'Natur' },
  { statement: 'Das Licht der Sonne braucht 8 Sekunden bis zur Erde.', isTrue: false, explanation: 'Es dauert etwa 8 Minuten und 20 Sekunden, nicht 8 Sekunden.', category: 'Wissenschaft' },
  { statement: 'Ein Pinguin kann hoeher springen als ein Haus.', isTrue: true, explanation: 'Das ist ein Scherzfakt — Haeuser können gar nicht springen, also gewinnt der Pinguin.', category: 'Kurioses' },
];

export const THREE_STATEMENTS: ThreeStatements[] = [
  {
    statements: [
      'Ein Mensch produziert in seinem Leben genug Speichel, um zwei Schwimmbecken zu fuellen.',
      'Das menschliche Auge kann über100 Millionen Farben unterscheiden.',
      'Die menschliche Nase kann über1 Billion verschiedene Gerüche wahrnehmen.',
    ],
    trueIndex: 2,
    category: 'Körper',
  },
  {
    statements: [
      'Finnland hat mehr Saunas als Autos.',
      'In Frankreich ist es verboten, ein Schwein Napoleon zu nennen.',
      'In England ist es illegal, im Parlament zu sterben.',
    ],
    trueIndex: 0,
    category: 'Länder',
  },
  {
    statements: [
      'Bienen können Gesichter erkennen.',
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
      'Haie können Krebs bekommen.',
      'Flamingos können nur auf einem Bein stehen weil das andere nicht knicken kann.',
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
      'Katzen können Wasser schmecken.',
      'Katzen haben mehr Knochen als Menschen.',
      'Katzen schwitzen nur an den Augen.',
    ],
    trueIndex: 1,
    category: 'Katzen',
  },
  {
    statements: [
      'Der QR-Code wurde in Deutschland erfunden.',
      'Der QR-Code wurde fürdie Automobilindustrie erfunden.',
      'Der erste QR-Code enthielt eine URL.',
    ],
    trueIndex: 1,
    category: 'Technik',
  },
  {
    statements: [
      'Ein Chamäleon kann jedes Auge unabhaengig bewegen.',
      'Chamäleons können sich völlig unsichtbar machen.',
      'Chamäleons leben nur in Afrika.',
    ],
    trueIndex: 0,
    category: 'Tiere',
  },
  {
    statements: [
      'Der Kaugummi wurde in Finnland erfunden.',
      'Kaugummi braucht 7 Jahre zum Verdauen.',
      'Der älteste bekannte Kaugummi ist über5.000 Jahre alt.',
    ],
    trueIndex: 2,
    category: 'Geschichte',
  },
  {
    statements: [
      'Venedig wird jedes Jahr 1 cm kleiner.',
      'Venedig hat über400 Brücken.',
      'In Venedig gibt es keine Autos und keine Straßen.',
    ],
    trueIndex: 1,
    category: 'Geografie',
  },
  {
    statements: [
      'Honig ist das einzige Lebensmittel, das nie verdirbt.',
      'Ahornsirup kann auch nicht schlecht werden.',
      'Reis ist das am längsten haltbare Nahrungsmittel.',
    ],
    trueIndex: 0,
    category: 'Essen',
  },
  {
    statements: [
      'Der Merkur ist der heisseste Planet im Sonnensystem.',
      'Die Venus ist der heisseste Planet im Sonnensystem.',
      'Der Mars war frueher heisser als die Venus.',
    ],
    trueIndex: 1,
    category: 'Weltraum',
  },
  {
    statements: [
      'Jeder Mensch hat einzigartige Zungenabdruecke.',
      'Der Fingerabdruck aendert sich alle 10 Jahre.',
      'Zwillinge haben immer identische Fingerabdruecke.',
    ],
    trueIndex: 0,
    category: 'Körper',
  },
  {
    statements: [
      'Island hat keinen McDonald\'s.',
      'Island hat keine Baeume.',
      'In Island gibt es keine Nachnamen.',
    ],
    trueIndex: 0,
    category: 'Länder',
  },
  {
    statements: [
      'Der erste Computer-Virus wurde 1971 geschrieben.',
      'Der erste Computer-Virus hiess "Creeper".',
      'Der erste Computer-Virus kam aus Russland.',
    ],
    trueIndex: 1,
    category: 'Technik',
  },
  {
    statements: [
      'Elefanten können nicht schwimmen.',
      'Elefanten trauern um ihre Toten.',
      'Elefanten vergessen wirklich nie.',
    ],
    trueIndex: 1,
    category: 'Tiere',
  },
  {
    statements: [
      'Die Berliner Mauer stand laenger als sie existierte.',
      'Die Berliner Mauer stand 28 Jahre.',
      'Die Berliner Mauer war 200 km lang.',
    ],
    trueIndex: 1,
    category: 'Geschichte',
  },
];
