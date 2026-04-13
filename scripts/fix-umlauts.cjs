const fs = require('fs');
const path = require('path');

const files = [
  'src/games/content/questions-de.ts',
  'src/games/content/taboo-words-de.ts',
  'src/games/content/headup-words-de.ts',
  'src/games/content/categories-de.ts',
  'src/games/bottlespin/bottlespin-content-de.ts',
  'src/games/truthdare/truthdare-content-de.ts',
  'src/games/fakeorfact/fakeorfact-content-de.ts',
  'src/games/storybuilder/story-prompts-de.ts',
  'src/games/thisorthat/thisorthat-content-de.ts',
  'src/games/emojiguess/emoji-content-de.ts',
  'src/games/quickdraw/quickdraw-words-de.ts',
  'src/games/sharedquiz/sharedquiz-content-de.ts',
  'src/games/whoami/whoami-content-de.ts',
];

const replacements = [
  ['Aenderung', 'Änderung'], ['aendern', 'ändern'],
  ['Aerzte', 'Ärzte'], ['Aegypten', 'Ägypten'], ['Aegaeisch', 'Ägäisch'],
  ['aelteste', 'älteste'], ['Aelteste', 'Älteste'],
  ['aerger', 'ärger'], ['Aerger', 'Ärger'],
  ['Baecker', 'Bäcker'], ['Baelle', 'Bälle'],
  ['Eisbaer', 'Eisbär'], ['Waschbaer', 'Waschbär'],
  ['Bruecke', 'Brücke'], ['Bruehdruck', 'Brühdruck'],
  ['Bundeslaender', 'Bundesländer'],
  ['Chamaeleon', 'Chamäleon'],
  ['Doener', 'Döner'], ['Duesseldorf', 'Düsseldorf'],
  ['Eichhoernchen', 'Eichhörnchen'], ['Eiskoenigin', 'Eiskönigin'],
  ['Erdmaennchen', 'Erdmännchen'],
  ['Faehrmann', 'Fährmann'], ['Flaeche', 'Fläche'],
  ['Fruehstueck', 'Frühstück'], ['Fruehling', 'Frühling'],
  ['Gaertner', 'Gärtner'], ['Gaeste', 'Gäste'],
  ['Gebaeudereiniger', 'Gebäudereiniger'],
  ['Gemuese', 'Gemüse'], ['Gepaeck', 'Gepäck'],
  ['Getraenk', 'Getränk'], ['Getraenke', 'Getränke'],
  ['Gewuerz', 'Gewürz'], ['Gluehwein', 'Glühwein'],
  ['Gummibaerchen', 'Gummibärchen'],
  ['groesste', 'größte'], ['Groesste', 'Größte'],
  ['hoechste', 'höchste'], ['Hoechste', 'Höchste'],
  ['hoechsten', 'höchsten'],
  ['heisst', 'heißt'],
  ['Kaenguru', 'Känguru'], ['Kaese', 'Käse'],
  ['Kaesespaetzle', 'Käsespätzle'],
  ['Koeln', 'Köln'], ['Koenig', 'König'], ['koenig', 'könig'],
  ['Koenigin', 'Königin'], ['Koenigreich', 'Königreich'],
  ['Koerper', 'Körper'], ['koerper', 'körper'],
  ['Kuenstler', 'Künstler'], ['Kuestenstadt', 'Küstenstadt'],
  ['Laender', 'Länder'], ['laender', 'länder'],
  ['laengste', 'längste'], ['Laengste', 'Längste'],
  ['Liegestuetze', 'Liegestütze'], ['Loewe', 'Löwe'], ['Loewen', 'Löwen'],
  ['Maerchen', 'Märchen'], ['Maerz', 'März'],
  ['Muell', 'Müll'], ['Mueller', 'Müller'],
  ['Muenchen', 'München'], ['Muenze', 'Münze'],
  ['Naegel', 'Nägel'], ['Naechste', 'Nächste'],
  ['Nuernberg', 'Nürnberg'], ['Nuesse', 'Nüsse'],
  ['Saenger', 'Sänger'], ['Saeugetier', 'Säugetier'],
  ['Schaerfste', 'Schärfste'],
  ['Schildkroete', 'Schildkröte'],
  ['Schluesselblume', 'Schlüsselblume'],
  ['Schuetze', 'Schütze'],
  ['Spuelmaschine', 'Spülmaschine'],
  ['Suedamerika', 'Südamerika'], ['Suedlich', 'Südlich'], ['suedlich', 'südlich'],
  ['Suessigkeit', 'Süßigkeit'],
  ['Taetigkeiten', 'Tätigkeiten'],
  ['Thailaendisch', 'Thailändisch'],
  ['Tuerkei', 'Türkei'], ['tuerkis', 'türkis'],
  ['Voegel', 'Vögel'], ['voellig', 'völlig'],
  ['Waerme', 'Wärme'], ['Waehrung', 'Währung'],
  ['Wueste', 'Wüste'],
  ['Zahnaerztin', 'Zahnärztin'],
  ['Zuerich', 'Zürich'],
  ['Zurueck', 'Zurück'], ['zurueck', 'zurück'],
  ['Fluesse', 'Flüsse'],
  ['ausraeumen', 'ausräumen'],
  ['Groenemeyer', 'Grönemeyer'],
  ['Boehmermann', 'Böhmermann'],
  ['Juergen', 'Jürgen'],
  ['laengsten', 'längsten'],
  ['Saeugetiere', 'Säugetiere'],
  ['Gleichmaessig', 'Gleichmäßig'],
  ['Strasse', 'Straße'], ['strasse', 'straße'],
  ['Fussball', 'Fußball'], ['fussball', 'fußball'],
  ['Schlaeger', 'Schläger'],
  ['Nahrungsmittelunvertraeglichkeit', 'Nahrungsmittelunverträglichkeit'],
  ['Schaedel', 'Schädel'],
  ['Gewaesser', 'Gewässer'],
  ['Saeure', 'Säure'],
  ['Staerke', 'Stärke'], ['staerker', 'stärker'],
  ['Waende', 'Wände'],
  ['Gebaeck', 'Gebäck'],
  ['Maenner', 'Männer'], ['maennlich', 'männlich'],
  ['Fraesmaschine', 'Fräsmaschine'],
  ['Geruecht', 'Gerücht'],
  ['Gefuehl', 'Gefühl'], ['gefuehle', 'gefühle'],
  ['Ausfuehr', 'Ausführ'],
  ['gruenden', 'gründen'],
  ['Uebung', 'Übung'], ['uebung', 'übung'],
  ['Ruecken', 'Rücken'],
  ['Stueck', 'Stück'], ['stueck', 'stück'],
  ['Glueck', 'Glück'], ['glueck', 'glück'],
  ['Brueder', 'Brüder'],
  ['Muede', 'Müde'], ['muede', 'müde'],
  ['Kuehe', 'Kühe'],
  ['Blueserin', 'Blüserin'],
  ['gruene', 'grüne'], ['Gruene', 'Grüne'],
  ['schoene', 'schöne'], ['Schoene', 'Schöne'],
  ['hoere', 'höre'],
  ['moechte', 'möchte'], ['Moechte', 'Möchte'],
  ['koennte', 'könnte'], ['Koennte', 'Könnte'],
  ['muesste', 'müsste'],
  ['wuerde', 'würde'], ['Wuerde', 'Würde'],
  ['natuerlich', 'natürlich'],
  ['gluecklich', 'glücklich'],
  ['ploetzlich', 'plötzlich'],
  ['voellig', 'völlig'],
  ['ueberall', 'überall'],
  ['moeglich', 'möglich'],
  ['naemlich', 'nämlich'],
  ['ungewoehnlich', 'ungewöhnlich'],
  ['spaeter', 'später'],
  ['waehrend', 'während'],
  ['zunaechst', 'zunächst'],
  ['aehnlich', 'ähnlich'],
  ['gefaehrlich', 'gefährlich'],
  ['regelmaessig', 'regelmäßig'],
  ['Ernaehrung', 'Ernährung'],
  ['ueberraschend', 'überraschend'],
  ['Ueberraschung', 'Überraschung'],
  ['Stuehle', 'Stühle'],
  ['Veroeffentlich', 'Veröffentlich'],
  ['Unterschaetz', 'Unterschätz'],
];

let totalFixed = 0;
for (const file of files) {
  const fp = path.resolve(file);
  if (!fs.existsSync(fp)) { console.log('SKIP: ' + file); continue; }
  let content = fs.readFileSync(fp, 'utf8');
  let fileFixed = 0;
  for (const [from, to] of replacements) {
    const re = new RegExp(from, 'g');
    const matches = content.match(re);
    if (matches) {
      content = content.replace(re, to);
      fileFixed += matches.length;
    }
  }
  if (fileFixed > 0) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log(file + ': ' + fileFixed + ' fixes');
    totalFixed += fileFixed;
  } else {
    console.log(file + ': clean');
  }
}
console.log('\nTotal: ' + totalFixed + ' umlauts fixed');
