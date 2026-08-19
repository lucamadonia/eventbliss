/**
 * CLOSE ENOUGH — Gegenstände der Schätzfragen, als deutsche Wikipedia-Titel.
 *
 * Nach Untergruppe geordnet, weil die Untergruppe bestimmt, WELCHE Rahmen
 * versucht werden (siehe GROUP_FRAMES in closeenough-frames.mjs): Bei einem Berg
 * fragt man nach der Höhe, bei einem Fluss nach der Länge.
 *
 * Von Hand kuratiert, aus demselben Grund wie bei PIXELJAGD: Ein Ratespiel
 * braucht BEKANNTE Gegenstände. Eine automatische Auswahl nach Artikelhäufigkeit
 * liefert statistisch prominente, aber unratbare Einträge. Wer Barcelona nicht
 * einschätzen kann, hat wenigstens ein Gefühl dafür — bei einem Vorort nicht.
 *
 * Die Listen sind länger als das Ziel: Nicht jeder Titel führt zu einer Frage,
 * weil Wikidata die passende Eigenschaft nicht überall gepflegt hat.
 */

const list = (s) => s.split('|').map((x) => x.trim()).filter(Boolean);

export const SUBJECTS = {
  'laender.staaten': list(`Deutschland|Frankreich|Italien|Spanien|Portugal|Niederlande|Belgien|Österreich|Schweiz|Polen|Tschechien|Ungarn|Griechenland|Türkei|Schweden|Norwegen|Dänemark|Finnland|Island|Irland|Vereinigtes Königreich|Russland|Ukraine|Rumänien|Bulgarien|Kroatien|Serbien|Slowakei|Slowenien|Litauen|Lettland|Estland|Luxemburg|Malta|Zypern|Albanien|Vereinigte Staaten|Kanada|Mexiko|Brasilien|Argentinien|Chile|Kolumbien|Peru|Venezuela|Kuba|Jamaika|China|Japan|Indien|Indonesien|Südkorea|Nordkorea|Thailand|Vietnam|Philippinen|Malaysia|Singapur|Pakistan|Bangladesch|Israel|Saudi-Arabien|Vereinigte Arabische Emirate|Katar|Iran|Irak|Ägypten|Marokko|Tunesien|Algerien|Südafrika|Nigeria|Kenia|Äthiopien|Ghana|Tansania|Australien|Neuseeland|Fidschi|Mongolei|Kasachstan|Nepal|Sri Lanka|Myanmar|Kambodscha|Laos|Jordanien|Libanon|Oman|Kuwait|Monaco|Liechtenstein|Andorra|San Marino|Vatikanstadt`),

  'laender.staedte': list(`Berlin|Hamburg|München|Köln|Frankfurt am Main|Stuttgart|Düsseldorf|Leipzig|Dresden|Hannover|Nürnberg|Bremen|Essen|Dortmund|Wien|Zürich|Genf|Basel|Salzburg|Paris|Marseille|Lyon|London|Manchester|Edinburgh|Dublin|Madrid|Barcelona|Valencia|Sevilla|Lissabon|Porto|Rom|Mailand|Neapel|Venedig|Florenz|Turin|Amsterdam|Rotterdam|Brüssel|Antwerpen|Kopenhagen|Stockholm|Oslo|Helsinki|Reykjavík|Warschau|Krakau|Prag|Budapest|Bukarest|Sofia|Athen|Istanbul|Ankara|Moskau|Sankt Petersburg|Kiew|New York City|Los Angeles|Chicago|San Francisco|Miami|Las Vegas|Toronto|Vancouver|Mexiko-Stadt|Havanna|Rio de Janeiro|São Paulo|Buenos Aires|Lima|Bogotá|Santiago de Chile|Tokio|Osaka|Kyōto|Peking|Shanghai|Hongkong|Seoul|Singapur|Bangkok|Jakarta|Manila|Hanoi|Mumbai|Delhi|Dubai|Abu Dhabi|Doha|Riad|Tel Aviv|Jerusalem|Kairo|Casablanca|Marrakesch|Nairobi|Kapstadt|Johannesburg|Lagos|Sydney|Melbourne|Auckland`),

  'laender.sprachen': list(`Deutsche Sprache|Englische Sprache|Spanische Sprache|Französische Sprache|Italienische Sprache|Portugiesische Sprache|Niederländische Sprache|Polnische Sprache|Türkische Sprache|Arabische Sprache|Russische Sprache|Japanische Sprache|Koreanische Sprache|Hindi|Bengalische Sprache|Schwedische Sprache|Griechische Sprache|Hebräische Sprache|Suaheli|Persische Sprache`),

  'bauwerke.wolkenkratzer': list(`Burj Khalifa|Shanghai Tower|Abraj al Bait|Ping An Finance Centre|Lotte World Tower|One World Trade Center|Taipei 101|Petronas Towers|Willis Tower|Empire State Building|Chrysler Building|Burj al Arab|The Shard|Commerzbank Tower|Messeturm|Elbphilharmonie|Torre Agbar|Turning Torso|Marina Bay Sands|Jin Mao Tower|Bank of China Tower|Federation Tower|Gran Torre Santiago|Central Park Tower|432 Park Avenue`),

  'bauwerke.sakral': list(`Kölner Dom|Ulmer Münster|Petersdom|Notre-Dame de Paris|Sagrada Família|Hagia Sophia|Sultan-Ahmed-Moschee|Stephansdom (Wien)|Frauenkirche (Dresden)|Westminster Abbey|Santa Maria del Fiore|Markusdom|Kathedrale von Chartres|Kathedrale von Sevilla|Mailänder Dom|Sacré-Cœur (Paris)|Basilius-Kathedrale|Scheich-Zayid-Moschee|Harmandir Sahib|Angkor Wat|Borobudur|Tōdai-ji|Himmelstempel|Berliner Dom|Aachener Dom|Regensburger Dom|Freiburger Münster`),

  'bauwerke.bruecken': list(`Golden Gate Bridge|Brooklyn Bridge|Tower Bridge|Ponte Vecchio|Rialtobrücke|Öresundbrücke|Akashi-Kaikyō-Brücke|Millauviadukt|Hangzhou-Bucht-Brücke|Humber Bridge|Sydney Harbour Bridge|Karlsbrücke|Pont du Gard|Gotthard-Basistunnel|Eurotunnel|Seikan-Tunnel|Lærdalstunnel|Fehmarnsundbrücke|Köhlbrandbrücke|Müngstener Brücke|Kochertalbrücke|Storebæltbrücke`),

  'bauwerke.denkmaeler': list(`Eiffelturm|Freiheitsstatue|Brandenburger Tor|Arc de Triomphe|Kolosseum|Schiefer Turm von Pisa|Atomium|Space Needle|Berliner Fernsehturm|Fernsehturm Stuttgart|Cristo Redentor|Mount Rushmore National Memorial|Cheops-Pyramide|Große Sphinx von Gizeh|Stonehenge|Trevi-Brunnen|Kleine Meerjungfrau|Siegessäule (Berlin)|Hermannsdenkmal|Völkerschlachtdenkmal|Niederwalddenkmal|London Eye|Tokyo Tower|Tokyo Skytree|CN Tower|Ostankino-Turm`),

  'bauwerke.museen': list(`Louvre|Musée d’Orsay|British Museum|Metropolitan Museum of Art|Museum of Modern Art|Vatikanische Museen|Prado|Eremitage (Sankt Petersburg)|Rijksmuseum|Uffizien|Pergamonmuseum|Deutsches Museum|Naturhistorisches Museum Wien|Guggenheim-Museum Bilbao|Tate Modern|National Gallery (London)|Centre Georges Pompidou|Alte Pinakothek|Museumsinsel|Smithsonian Institution`),

  'natur.berge': list(`Mount Everest|K2|Kangchendzönga|Lhotse|Makalu|Cho Oyu|Manaslu|Nanga Parbat|Annapurna|Mont Blanc|Matterhorn|Dufourspitze|Eiger|Jungfrau|Großglockner|Zugspitze|Watzmann|Brocken|Feldberg (Schwarzwald)|Fichtelberg|Kilimanjaro|Mount Kenya|Denali|Mount Whitney|Aconcagua|Chimborazo|Cotopaxi|Fuji|Ararat|Olymp (Berg)|Ätna|Vesuv|Teide|Elbrus|Tafelberg|Uluru|Popocatépetl|Mauna Kea`),

  'natur.fluesse': list(`Nil|Amazonas|Jangtsekiang|Mississippi|Jenissei|Gelber Fluss|Ob|Kongo|Amur|Lena|Mekong|Mackenzie|Niger|Wolga|Euphrat|Tigris|Ganges|Indus|Donau|Rhein|Elbe|Weser|Main|Mosel|Oder|Seine|Loire|Rhone|Themse|Po|Tiber|Ebro|Tajo|Weichsel|Dnepr|Colorado|Rio Grande|Sankt-Lorenz-Strom|Murray River|Orinoco|Paraná|Sambesi`),

  'natur.seen': list(`Kaspisches Meer|Baikalsee|Victoriasee|Tanganjikasee|Oberer See|Huronsee|Michigansee|Eriesee|Ontariosee|Großer Bärensee|Malawisee|Großer Sklavensee|Aralsee|Ladogasee|Balchaschsee|Titicacasee|Bodensee|Genfersee|Chiemsee|Starnberger See|Müritz|Neusiedler See|Vierwaldstättersee|Zürichsee|Gardasee|Comer See|Lago Maggiore|Plattensee|Loch Ness|Totes Meer`),

  'natur.inseln': list(`Grönland|Neuguinea|Borneo|Madagaskar|Baffininsel|Sumatra|Honshū|Victoria-Insel|Großbritannien|Ellesmere Island|Sulawesi|Südinsel|Java|Nordinsel|Neufundland|Kuba|Island|Luzon|Mindanao|Irland|Hokkaidō|Sachalin|Hispaniola|Tasmanien|Sri Lanka|Sizilien|Sardinien|Zypern|Korsika|Kreta|Mallorca|Teneriffa|Rügen|Sylt|Usedom|Fehmarn`),

  'natur.wasserfaelle': list(`Salto Ángel|Victoriafälle|Niagarafälle|Iguaçu-Wasserfälle|Rheinfall|Trümmelbachfälle|Krimmler Wasserfälle|Gullfoss|Dettifoss|Skógafoss|Seljalandsfoss|Yosemite Falls|Sutherland Falls|Kaieteur-Wasserfall|Tugela Falls|Triberger Wasserfälle`),

  'natur.parks': list(`Yellowstone-Nationalpark|Yosemite-Nationalpark|Grand-Canyon-Nationalpark|Serengeti-Nationalpark|Krüger-Nationalpark|Banff-Nationalpark|Nationalpark Plitvicer Seen|Nationalpark Berchtesgaden|Nationalpark Bayerischer Wald|Nationalpark Sächsische Schweiz|Nationalpark Eifel|Galápagos-Inseln|Great Barrier Reef|Sahara|Gobi|Atacama-Wüste|Death Valley|Everglades-Nationalpark`),

  'tierwelt.saeuger': list(`Afrikanischer Elefant|Asiatischer Elefant|Blauwal|Pottwal|Buckelwal|Schwertwal|Giraffe|Flusspferd|Breitmaulnashorn|Löwe|Tiger|Leopard|Gepard|Jaguar|Puma|Braunbär|Eisbär|Großer Panda|Wolf|Rotfuchs|Eurasischer Luchs|Hauskatze|Haushund|Hauspferd|Hausrind|Hausschwein|Hausschaf|Hausziege|Dromedar|Trampeltier|Lama|Alpaka|Elch|Rothirsch|Reh|Wildschwein|Amerikanischer Bison|Wisent|Zebra|Koala|Wombats|Gorillas|Schimpanse|Orang-Utans|Erdmännchen|Waschbär|Biber|Fischotter|Igel|Eichhörnchen|Walross|Seehund`),

  'tierwelt.voegel': list(`Wanderalbatros|Andenkondor|Kalifornischer Kondor|Weißkopfseeadler|Steinadler|Wanderfalke|Schnee-Eule|Uhu|Kaiserpinguin|Königspinguin|Afrikanischer Strauß|Emu|Kasuare|Kiwis|Flamingos|Weißstorch|Graureiher|Kranich|Höckerschwan|Graugans|Stockente|Silbermöwe|Pelikane|Tukane|Kolibris|Kolkrabe|Elster|Amsel|Rotkehlchen|Kohlmeise|Haussperling|Pfau|Truthühner|Haushuhn`),

  'tierwelt.wasser': list(`Weißer Hai|Walhai|Riesenhai|Tigerhai|Blauhai|Mantarochen|Schwertfisch|Atlantischer Lachs|Karpfen|Hecht|Europäischer Aal|Kabeljau|Hering|Sardine|Makrele|Riesenkalmar|Gemeiner Krake|Seepferdchen|Anemonenfische|Rotfeuerfisch|Lederschildkröte|Suppenschildkröte|Galápagos-Riesenschildkröte|Leistenkrokodil|Nilkrokodil|Mississippi-Alligator|Komodowaran|Grüner Leguan|Große Anakonda|Netzpython|Königskobra|Schwarze Mamba|Ochsenfrosch|Axolotl|Feuersalamander`),

  'sport.stadien': list(`Camp Nou|Santiago Bernabéu|Wembley-Stadion|Old Trafford|Anfield|Signal Iduna Park|Allianz Arena|Olympiastadion Berlin|Veltins-Arena|Deutsche Bank Park|RheinEnergieStadion|Volksparkstadion|Red Bull Arena (Leipzig)|Giuseppe-Meazza-Stadion|Stadio Olimpico|Parc des Princes|Stade de France|Estádio da Luz|Johan Cruyff Arena|Maracanã|Estadio Azteca|MetLife Stadium|AT&T Stadium|Rose Bowl|Melbourne Cricket Ground|Rungrado-Stadion|Narendra Modi Stadium|Luschniki-Stadion`),

  'sport.vereine': list(`FC Bayern München|Borussia Dortmund|FC Schalke 04|Hamburger SV|Werder Bremen|1. FC Köln|Eintracht Frankfurt|VfB Stuttgart|Bayer 04 Leverkusen|Borussia Mönchengladbach|Hertha BSC|FC Barcelona|Real Madrid|Atlético Madrid|Manchester United|FC Liverpool|FC Arsenal|FC Chelsea|Manchester City|Tottenham Hotspur|Juventus Turin|AC Mailand|Inter Mailand|AS Rom|SSC Neapel|Paris Saint-Germain|Olympique Marseille|Ajax Amsterdam|PSV Eindhoven|Benfica Lissabon|FC Porto|Celtic Glasgow|Boca Juniors|River Plate`),

  'sport.athleten': list(`Cristiano Ronaldo|Lionel Messi|Neymar|Kylian Mbappé|Robert Lewandowski|Manuel Neuer|Thomas Müller|Toni Kroos|Zlatan Ibrahimović|Pelé|Diego Maradona|Michael Jordan|LeBron James|Kobe Bryant|Shaquille O’Neal|Stephen Curry|Dirk Nowitzki|Yao Ming|Usain Bolt|Michael Phelps|Roger Federer|Rafael Nadal|Novak Đoković|Serena Williams|Boris Becker|Steffi Graf|Muhammad Ali|Mike Tyson|Wladimir Klitschko|Michael Schumacher|Lewis Hamilton|Sebastian Vettel|Max Verstappen|Tiger Woods|Simone Biles|Wayne Gretzky`),

  'sport.rennstrecken': list(`Nürburgring|Hockenheimring|Circuit de Spa-Francorchamps|Autodromo Nazionale Monza|Silverstone Circuit|Circuit de Monaco|Circuit de Barcelona-Catalunya|Suzuka International Racing Course|Autódromo José Carlos Pace|Circuit of the Americas|Red Bull Ring|Hungaroring|Autodromo Enzo e Dino Ferrari|Sachsenring|Circuit Paul Ricard|Indianapolis Motor Speedway|Daytona International Speedway|Bahrain International Circuit|Marina Bay Street Circuit`),

  'technik.autos': list(`VW Käfer|VW Golf|VW Passat|VW Transporter|Ford Model T|Ford Mustang|Mini (Marke)|Fiat 500|Citroën 2CV|Renault 4|Opel Kadett|Mercedes-Benz S-Klasse|Mercedes-Benz G-Klasse|BMW 3er|BMW 5er|Audi A4|Porsche 911|Porsche Cayenne|Toyota Corolla|Toyota Prius|Honda Civic|Tesla Model S|Tesla Model 3|Ferrari F40|Lamborghini Countach|Bugatti Veyron|Bugatti Chiron|McLaren F1|Trabant 601|Lada Niva`),

  'technik.flugzeuge': list(`Airbus A380|Airbus A320|Airbus A350|Boeing 747|Boeing 737|Boeing 787|Boeing 777|Concorde|Antonow An-225|Antonow An-124|Lockheed SR-71|Lockheed C-130|Junkers Ju 52|Douglas DC-3|Messerschmitt Bf 109|Supermarine Spitfire|Eurofighter Typhoon|General Dynamics F-16|Lockheed Martin F-35|Tupolew Tu-144|Cessna 172|LZ 129|Wright Flyer`),

  'technik.raumfahrt': list(`Saturn V|Space Shuttle|Falcon 9|Falcon Heavy|Ariane 5|Sojus (Rakete)|Internationale Raumstation|Hubble-Weltraumteleskop|James-Webb-Weltraumteleskop|Voyager 1|Voyager 2|Apollo 11|Sputnik 1|Mir (Raumstation)|Curiosity (Rover)|Perseverance (Rover)|Cassini-Huygens|New Horizons|Starship|Wostok 1`),

  'technik.geraete': list(`iPhone|iPad|Macintosh|Walkman|Game Boy|Nintendo Switch|PlayStation 2|Xbox 360|Commodore 64|Sinclair ZX Spectrum|Nokia 3310|Amazon Kindle|GoPro|Compact Disc|DVD|Blu-ray Disc|USB-Stick|Mikrowellenherd|Waschmaschine|Kühlschrank|Staubsauger|Nähmaschine|Schreibmaschine|Glühlampe|Transistor`),

  'technik.firmen': list(`Apple|Microsoft|Google|Amazon (Unternehmen)|Meta Platforms|Samsung|Sony|Toyota|Volkswagen|Mercedes-Benz Group|BMW|Porsche|Siemens|Robert Bosch GmbH|SAP|Deutsche Telekom|Deutsche Post AG|Deutsche Bahn|Lufthansa|Allianz SE|Nestlé|Unilever|Procter & Gamble|Coca-Cola|PepsiCo|McDonald’s|Starbucks|Nike (Unternehmen)|Adidas|IKEA|Walmart|Tesla, Inc.|Intel|Nvidia|IBM|Netflix|Spotify`),
};

/** Wie viele Titel je Untergruppe der Probelauf anfasst. */
export const PROBE_SIZE = 30;
