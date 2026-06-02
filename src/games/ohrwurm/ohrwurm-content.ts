// OHRWURM — Songdatenbank (auto-generiert aus Hippster_Songliste.xlsx)
// 1281 Songs · 1939–2024 · 76 Länder
//
// Daten sind als kompakter String gepackt (Format: jahr~künstler~titel~flagge~genre),
// damit das Modul klein bleibt, und werden beim Laden einmalig zu Song[] geparst.
// Die Spotify-Such-URL (= QR-Inhalt, vgl. Spec §5.1) wird zur Laufzeit gebaut.

// Vorab aufgelöste Spotify-Track-URIs (id → "spotify:track:…"), befüllt durch
// scripts/resolve-spotify-uris.mjs. Leer = es greift der Laufzeit-Resolver.
import SPOTIFY_URIS from './spotify-uris.json';

export interface Song {
  id: string;          // "ow-0001"
  year: number;        // Erscheinungsjahr
  artist: string;      // Künstler
  title: string;       // Titel
  flag: string;        // Länder-Flagge (Emoji)
  genre: string;       // Genre
  /** open.spotify.com/search/... — Inhalt des QR-Codes (Spec §5.1) */
  qrPayload: string;
  /**
   * Vorab aufgelöste Spotify-Track-URI (spotify:track:…) für die Premium-
   * Vollwiedergabe — wie bei Hitster fest hinterlegt, damit zur Laufzeit KEINE
   * Spotify-Suche nötig ist. Befüllt durch scripts/resolve-spotify-uris.mjs
   * (spotify-uris.json). Fehlt sie → Laufzeit-Resolver → 30s-Vorschau.
   */
  spotifyUri?: string;
}

/** Spotify-Such-URL bauen — identisch mit dem QR-Code-Inhalt der Karte. */
export function spotifySearchUrl(artist: string, title: string): string {
  return 'https://open.spotify.com/search/' + encodeURIComponent(artist + ' ' + title);
}

// Filterbare Genres (>= 15 Songs) für den Genre-Battle-Modus.
export const OHRWURM_GENRES: string[] = ["Pop","Rock","Hip-Hop","Electronic","R&B","Eurodance","Indie","Reggaeton","Schlager","Soul","Chanson","Folk"];

// Vorhandene Jahrzehnte (für Statistik / spätere Modi).
export const OHRWURM_DECADES: number[] = [1930,1940,1950,1960,1970,1980,1990,2000,2010,2020];

const PACKED = `
1939~Judy Garland~Over The Rainbow~🇺🇸~Soundtrack
1942~Bing Crosby~White Christmas~🇺🇸~Christmas
1946~Édith Piaf~La Vie en rose~🇫🇷~Chanson
1955~Bill Haley & His Comets~Rock Around The Clock~🇺🇸~Rock'n'Roll
1956~Elvis Presley~Hound Dog~🇺🇸~Rock'n'Roll
1956~Lys Assia~Refrain~🇨🇭~Chanson
1956~Édith Piaf~Non, je ne regrette rien~🇫🇷~Chanson
1957~Buddy Holly~Peggy Sue~🇺🇸~Rock'n'Roll
1957~Elvis Presley~Jailhouse Rock~🇺🇸~Rock'n'Roll
1958~André Claveau~Dors, mon amour~🇫🇷~Chanson
1958~Charles Aznavour~La Bohème~🇫🇷~Chanson
1958~Chuck Berry~Johnny B. Goode~🇺🇸~Rock'n'Roll
1958~Domenico Modugno~Volare (Nel blu, dipinto di blu)~🇮🇹~Schlager
1958~Doris Day~Que Sera, Sera~🇺🇸~Soundtrack
1959~Manos Hadjidakis~Never On Sunday~🇬🇷~Folk
1959~Ritchie Valens~La Bamba~🇺🇸~Rock'n'Roll
1960~Ben E. King~Stand By Me~🇺🇸~Soul
1960~Mina~Tintarella di luna~🇮🇹~Pop
1961~Ray Charles~Hit The Road Jack~🇺🇸~Soul
1961~The Tokens~The Lion Sleeps Tonight~🇺🇸~Pop
1962~Charles Aznavour~For Me Formidable~🇫🇷~Chanson
1962~The Beach Boys~Surfin' USA~🇺🇸~Rock
1962~The Crystals~He's A Rebel~🇺🇸~Pop
1962~The Tornados~Telstar~🇬🇧~Instrumental
1963~The Beatles~I Want To Hold Your Hand~🇬🇧~Pop/Rock
1963~The Ronettes~Be My Baby~🇺🇸~Pop
1964~Louis Armstrong~Hello, Dolly!~🇺🇸~Jazz
1964~Mikis Theodorakis~Zorba's Dance~🇬🇷~Folk
1964~Roy Orbison~Oh, Pretty Woman~🇺🇸~Rock
1964~The Animals~The House Of The Rising Sun~🇬🇧~Rock
1964~The Beatles~A Hard Day's Night~🇬🇧~Pop/Rock
1964~The Rolling Stones~(I Can't Get No) Satisfaction~🇬🇧~Rock
1964~The Supremes~Where Did Our Love Go~🇺🇸~Pop
1965~Adriano Celentano~Il ragazzo della via Gluck~🇮🇹~Pop
1965~Bob Dylan~Like a Rolling Stone~🇺🇸~Rock
1965~France Gall~Poupée de cire, poupée de son~🇱🇺~Chanson
1965~Serge Gainsbourg~Poupée de cire, poupée de son~🇱🇺~Chanson
1965~Sonny & Cher~I Got You Babe~🇺🇸~Pop
1965~The Beatles~Yesterday~🇬🇧~Pop
1965~The Beatles~Help!~🇬🇧~Pop
1965~The Byrds~Mr. Tambourine Man~🇺🇸~Folk Rock
1965~The Sound of Music Cast~Do-Re-Mi~🇺🇸~Soundtrack
1966~The Beach Boys~Good Vibrations~🇺🇸~Pop
1966~The Beatles~Eleanor Rigby~🇬🇧~Pop
1966~The Mamas & The Papas~California Dreamin'~🇺🇸~Folk Rock
1967~Aretha Franklin~Respect~🇺🇸~Soul
1967~Louis Armstrong~What A Wonderful World~🇺🇸~Jazz
1967~Procol Harum~A Whiter Shade Of Pale~🇬🇧~Rock
1967~Serge Gainsbourg & Jane Birkin~Je t'aime... moi non plus~🇫🇷~Chanson
1967~The Beatles~All You Need Is Love~🇬🇧~Pop
1967~The Doors~Light My Fire~🇺🇸~Rock
1968~Karel Gott~Lady Carneval~🇨🇿~Schlager
1968~Lucio Battisti~Il tempo di morire~🇮🇹~Pop
1968~Marvin Gaye~I Heard It Through The Grapevine~🇺🇸~Soul
1968~Massiel~La, la, la~🇪🇸~Pop
1968~Otis Redding~(Sittin' On) The Dock Of The Bay~🇺🇸~Soul
1968~The Beatles~Hey Jude~🇬🇧~Pop
1968~The Rolling Stones~Sympathy For The Devil~🇬🇧~Rock
1969~Creedence Clearwater Revival~Bad Moon Rising~🇺🇸~Rock
1969~Frank Sinatra~My Way~🇺🇸~Pop
1969~Led Zeppelin~Whole Lotta Love~🇬🇧~Rock
1969~Shocking Blue~Venus~🇳🇱~Pop
1969~Sly & The Family Stone~Everyday People~🇺🇸~Funk
1969~The Beatles~Come Together~🇬🇧~Rock
1969~The Hollies~He Ain't Heavy, He's My Brother~🇬🇧~Pop
1969~Zager and Evans~In The Year 2525~🇺🇸~Pop
1970~Edwin Hawkins Singers~Oh Happy Day~🇺🇸~Gospel
1970~George Harrison~My Sweet Lord~🇬🇧~Rock
1970~Simon & Garfunkel~Bridge Over Troubled Water~🇺🇸~Folk
1970~The Jackson 5~I Want You Back~🇺🇸~Pop/Soul
1971~Carole King~It's Too Late~🇺🇸~Pop
1971~Cat Stevens~Wild World~🇬🇧~Folk
1971~Don McLean~American Pie~🇺🇸~Folk Rock
1971~John Lennon~Imagine~🇬🇧~Pop
1971~Karat~Über sieben Brücken musst du gehn~🇩🇪~Rock
1971~Led Zeppelin~Stairway To Heaven~🇬🇧~Rock
1971~Lucio Battisti~Pensieri e parole~🇮🇹~Pop
1971~Marvin Gaye~What's Going On~🇺🇸~Soul
1971~Rod Stewart~Maggie May~🇬🇧~Rock
1972~Al Green~Let's Stay Together~🇺🇸~Soul
1972~Danny~Toiset meistä saa kunnian~🇫🇮~Pop
1972~Deep Purple~Smoke On The Water~🇬🇧~Rock
1972~Juliane Werding~Am Tag, als Conny Kramer starb~🇩🇪~Schlager
1972~Marius Müller-Westernhagen~Mit 18~🇩🇪~Rock
1972~Roberta Flack~The First Time Ever I Saw Your Face~🇺🇸~Soul
1972~Roberta Flack~Killing Me Softly With His Song~🇺🇸~Soul
1972~Vicky Leandros~Après toi~🇱🇺~Schlager
1973~Anne-Marie David~Tu te reconnaîtras~🇱🇺~Pop
1973~Carly Simon~You're So Vain~🇺🇸~Rock
1973~Elton John~Goodbye Yellow Brick Road~🇬🇧~Pop/Rock
1973~Karel Gott~Babicka~🇨🇿~Schlager
1973~Mia Martini~Minuetto~🇮🇹~Pop
1973~Mocedades~Eres tú~🇪🇸~Pop
1973~Pink Floyd~Money~🇬🇧~Rock
1973~Stevie Wonder~Superstition~🇺🇸~Funk
1973~Stevie Wonder~Living For The City~🇺🇸~Soul
1974~ABBA~Waterloo~🇸🇪~Pop
1974~Barry White~You're The First, The Last, My Everything~🇺🇸~Soul
1974~Howard Carpendale~Tür an Tür mit Alice~🇩🇪~Schlager
1974~Joe Dassin~Les Champs-Élysées~🇫🇷~Chanson
1974~Queen~Killer Queen~🇬🇧~Rock
1974~Terry Jacks~Seasons In The Sun~🇨🇦~Pop
1974~Udo Jürgens~Griechischer Wein~🇩🇪~Schlager
1975~10cc~I'm Not In Love~🇬🇧~Rock
1975~ABBA~Mamma Mia~🇸🇪~Pop
1975~Bob Marley & The Wailers~No Woman, No Cry~🇯🇲~Reggae
1975~Eagles~Hotel California~🇺🇸~Rock
1975~Joe Dassin~L'été indien~🇫🇷~Chanson
1975~José Afonso~Grândola, Vila Morena~🇵🇹~Folk
1975~KC and the Sunshine Band~That's The Way (I Like It)~🇺🇸~Disco
1975~Queen~Bohemian Rhapsody~🇬🇧~Rock
1976~ABBA~Dancing Queen~🇸🇪~Pop
1976~ABBA~Fernando~🇸🇪~Pop
1976~ABBA~Money, Money, Money~🇸🇪~Pop
1976~Boston~More Than A Feeling~🇺🇸~Rock
1976~Brotherhood of Man~Save Your Kisses For Me~🇬🇧~Pop
1976~Demis Roussos~Forever And Ever~🇬🇷~Pop
1976~Heart~Magic Man~🇺🇸~Rock
1976~Marianne Rosenberg~Er gehört zu mir~🇩🇪~Schlager
1976~Marika Gombitová~Vyznanie~🇸🇰~Pop
1976~Queen~Somebody To Love~🇬🇧~Rock
1976~Udo Lindenberg~Cello~🇩🇪~Rock
1976~Wild Cherry~Play That Funky Music~🇺🇸~Funk
1976~Wings~Let 'Em In~🇬🇧~Pop
1977~ABBA~Knowing Me, Knowing You~🇸🇪~Pop
1977~Bee Gees~Stayin' Alive~🇬🇧~Disco
1977~Bee Gees~How Deep Is Your Love~🇬🇧~Disco
1977~Donna Summer~I Feel Love~🇺🇸~Disco
1977~Fleetwood Mac~Go Your Own Way~🇬🇧~Rock
1977~Fleetwood Mac~Dreams~🇬🇧~Rock
1977~Frank Zander~Oh, Susi (der zensierte Song)~🇩🇪~Schlager
1977~Pussycat~Mississippi~🇳🇱~Pop
1977~Sex Pistols~God Save The Queen~🇬🇧~Punk
1977~Steve Miller Band~Fly Like An Eagle~🇺🇸~Rock
1977~Vicky Leandros~Theo, wir fahr'n nach Lodz~🇬🇷~Schlager
1978~ABBA~Take A Chance On Me~🇸🇪~Pop
1978~Bee Gees~Night Fever~🇬🇧~Disco
1978~Boney M.~Rasputin~🇩🇪~Disco
1978~Earth, Wind & Fire~September~🇺🇸~Disco
1978~Gloria Gaynor~I Will Survive~🇺🇸~Disco
1978~Kate Bush~Wuthering Heights~🇬🇧~Art Rock
1978~Kraftwerk~Das Model~🇩🇪~Electronic
1978~Patrick Hernandez~Born To Be Alive~🇫🇷~Disco
1978~The Cars~Just What I Needed~🇺🇸~Rock
1978~Village People~Y.M.C.A.~🇺🇸~Disco
1979~ABBA~Gimme! Gimme! Gimme!~🇸🇪~Pop
1979~ABBA~Chiquitita~🇸🇪~Pop
1979~Blondie~Heart Of Glass~🇺🇸~New Wave
1979~M~Pop Muzik~🇬🇧~New Wave
1979~Omega~Gyöngyhajú lány~🇭🇺~Rock
1979~Pink Floyd~Another Brick In The Wall~🇬🇧~Rock
1979~Pino Daniele~Napule è~🇮🇹~Pop
1979~Reinhard Mey~Über den Wolken~🇩🇪~Chanson
1979~Sister Sledge~We Are Family~🇺🇸~Disco
1979~The Clash~London Calling~🇬🇧~Punk
1979~The Knack~My Sharona~🇺🇸~Rock
1979~The Sugarhill Gang~Rapper's Delight~🇺🇸~Hip-Hop
1979~Trio~Da Da Da~🇩🇪~NDW
1980~ABBA~The Winner Takes It All~🇸🇪~Pop
1980~ABBA~Super Trouper~🇸🇪~Pop
1980~AC/DC~Back In Black~🇦🇺~Rock
1980~Blondie~Call Me~🇺🇸~New Wave
1980~Boomtown Rats~Banana Republic~🇮🇪~Rock
1980~Joachim Witt~Goldener Reiter~🇩🇪~NDW
1980~John Lennon~(Just Like) Starting Over~🇬🇧~Pop
1980~Johnny Logan~What's Another Year~🇮🇪~Pop
1980~Joy Division~Love Will Tear Us Apart~🇬🇧~Post-Punk
1980~Pink Floyd~Comfortably Numb~🇬🇧~Rock
1980~Pupo~Su di noi~🇮🇹~Schlager
1980~Queen~Another One Bites The Dust~🇬🇧~Rock
1980~Thin Lizzy~Killer On The Loose~🇮🇪~Rock
1980~Vicky Rosti~Sata salamaa~🇫🇮~Pop
1980~Wolf Maahn~Fieber~🇩🇪~Rock
1981~ABBA~One Of Us~🇸🇪~Pop
1981~Aphrodite's Child~Rain And Tears~🇬🇷~Pop
1981~Falco~Ganz Wien~🇦🇹~Pop
1981~Foreigner~Waiting For A Girl Like You~🇺🇸~Rock
1981~Hall & Oates~Private Eyes~🇺🇸~Pop
1981~Hannes Wader~Heute hier, morgen dort~🇩🇪~Folk
1981~Ideal~Blaue Augen~🇩🇪~NDW
1981~Journey~Don't Stop Believin'~🇺🇸~Rock
1981~Phil Collins~In The Air Tonight~🇬🇧~Rock
1981~Plastic Bertrand~Ça plane pour moi~🇧🇪~Pop
1981~Queen & David Bowie~Under Pressure~🇬🇧~Rock
1981~Tankcsapda~A legjobb méreg~🇭🇺~Rock
1981~Toto Cutugno~L'italiano~🇮🇹~Pop
1982~Dexys Midnight Runners~Come On Eileen~🇬🇧~Pop
1982~Falco~Der Kommissar~🇦🇹~Pop
1982~Joan Jett~I Love Rock 'n Roll~🇺🇸~Rock
1982~Joan Jett & The Blackhearts~I Love Rock 'n Roll~🇺🇸~Rock
1982~Joe Jackson~Steppin' Out~🇬🇧~Pop
1982~Michael Jackson~Billie Jean~🇺🇸~Pop
1982~Michael Jackson~Thriller~🇺🇸~Pop
1982~Nena~Nur geträumt~🇩🇪~NDW
1982~Spider Murphy Gang~Skandal im Sperrbezirk~🇩🇪~NDW
1982~Survivor~Eye Of The Tiger~🇺🇸~Rock
1982~Toto~Africa~🇺🇸~Rock
1983~Bonnie Tyler~Total Eclipse Of The Heart~🇬🇧~Pop
1983~Cyndi Lauper~Girls Just Want To Have Fun~🇺🇸~Pop
1983~David Bowie~Let's Dance~🇬🇧~Pop
1983~Eurythmics~Sweet Dreams (Are Made Of This)~🇬🇧~Synthpop
1983~Herbert Grönemeyer~Männer~🇩🇪~Pop
1983~Hubert Kah~Sternenhimmel~🇩🇪~NDW
1983~Hubert Kah~Engel 07~🇩🇪~NDW
1983~Lionel Richie~All Night Long (All Night)~🇺🇸~Pop
1983~Markus~Ich will Spaß~🇩🇪~NDW
1983~Men At Work~Down Under~🇦🇺~Rock
1983~Michael Jackson & Paul McCartney~Say Say Say~🇺🇸~Pop
1983~Nena~99 Luftballons~🇩🇪~NDW
1983~The Police~Every Breath You Take~🇬🇧~Pop
1983~U2~New Year's Day~🇮🇪~Rock
1984~Band Aid~Do They Know It's Christmas?~🇬🇧~Pop
1984~Cyndi Lauper~Time After Time~🇺🇸~Pop
1984~Eros Ramazzotti~Terra promessa~🇮🇹~Pop
1984~Frankie Goes To Hollywood~Relax~🇬🇧~Pop
1984~Herbert Grönemeyer~Bochum~🇩🇪~Pop
1984~Madonna~Like A Virgin~🇺🇸~Pop
1984~Modern Talking~You're My Heart, You're My Soul~🇩🇪~Pop
1984~Peter Schilling~Major Tom (Völlig losgelöst)~🇩🇪~NDW
1984~Prince~When Doves Cry~🇺🇸~Pop
1984~Tina Turner~What's Love Got To Do With It~🇺🇸~Pop
1984~U2~Pride (In The Name Of Love)~🇮🇪~Rock
1984~Wham!~Wake Me Up Before You Go-Go~🇬🇧~Pop
1984~Wham!~Last Christmas~🇬🇧~Pop
1985~Aretha Franklin & George Michael~I Knew You Were Waiting (For Me)~🇬🇧~Pop
1985~BAP~Verdamp lang her~🇩🇪~Rock
1985~Dire Straits~Money For Nothing~🇬🇧~Rock
1985~Etienne Daho~Tombé pour la France~🇫🇷~Pop
1985~Falco~Rock Me Amadeus~🇦🇹~Pop
1985~Foreigner~I Want To Know What Love Is~🇺🇸~Rock
1985~Geier Sturzflug~Bruttosozialprodukt~🇩🇪~NDW
1985~Helena Vondráčková~Sladké mámení~🇨🇿~Pop
1985~Jeanne Mas~En rouge et noir~🇫🇷~Pop
1985~Klaus Lage~1000 und 1 Nacht~🇩🇪~Pop
1985~Mecano~Hijo de la luna~🇪🇸~Pop
1985~Modern Talking~Cheri Cheri Lady~🇩🇪~Pop
1985~Phil Collins~Sussudio~🇬🇧~Pop
1985~Simple Minds~Don't You (Forget About Me)~🇬🇧~Rock
1985~Tears For Fears~Everybody Wants To Rule The World~🇬🇧~Synthpop
1985~USA For Africa~We Are The World~🇺🇸~Pop
1985~Whitney Houston~Saving All My Love For You~🇺🇸~Pop
1985~Whitney Houston~How Will I Know~🇺🇸~Pop
1985~a-ha~Take On Me~🇳🇴~Synthpop
1986~Berlin~Take My Breath Away~🇺🇸~Pop
1986~Bon Jovi~Livin' On A Prayer~🇺🇸~Rock
1986~Bonnie Tyler~Holding Out For A Hero~🇬🇧~Pop
1986~Desireless~Voyage, voyage~🇫🇷~Pop
1986~Die Toten Hosen~Eisgekühlter Bommerlunder~🇩🇪~Punk
1986~Edda Művek~A kör~🇭🇺~Rock
1986~Eros Ramazzotti~Adesso tu~🇮🇹~Pop
1986~Europe~The Final Countdown~🇸🇪~Rock
1986~Falco~Jeanny~🇦🇹~Pop
1986~Falco~Vienna Calling~🇦🇹~Pop
1986~Genesis~Invisible Touch~🇬🇧~Pop
1986~Maanam~Krakowski spleen~🇵🇱~Rock
1986~Madonna~Papa Don't Preach~🇺🇸~Pop
1986~Mecano~Me cuesta tanto olvidarte~🇪🇸~Pop
1986~Münchener Freiheit~Ohne dich (schlaf ich heut Nacht nicht ein)~🇩🇪~Pop
1986~Peter Gabriel~Sledgehammer~🇬🇧~Pop
1986~Robert Palmer~Addicted To Love~🇬🇧~Rock
1986~Sandra~Maria Magdalena~🇩🇪~Pop
1986~The Bangles~Walk Like An Egyptian~🇺🇸~Pop
1987~Die Ärzte~Westerland~🇩🇪~Rock
1987~George Michael~Faith~🇬🇧~Pop
1987~Gianna Nannini~Bello e impossibile~🇮🇹~Rock
1987~Guns N' Roses~Sweet Child O' Mine~🇺🇸~Rock
1987~Heinz Rudolf Kunze~Dein ist mein ganzes Herz~🇩🇪~Pop
1987~Heroes del Silencio~Mar de un sentimiento~🇪🇸~Rock
1987~Johnny Logan~Hold Me Now~🇮🇪~Pop
1987~Michael Jackson~Bad~🇺🇸~Pop
1987~Mylène Farmer~Sans contrefaçon~🇫🇷~Pop
1987~Rick Astley~Never Gonna Give You Up~🇬🇧~Pop
1987~Stars on 45~Stars on 45 Medley~🇳🇱~Pop
1987~Suzanne Vega~Luka~🇺🇸~Pop
1987~U2~With Or Without You~🇮🇪~Rock
1987~U2~I Still Haven't Found What I'm Looking For~🇮🇪~Rock
1987~Whitney Houston~I Wanna Dance With Somebody~🇺🇸~Pop
1988~Belinda Carlisle~Heaven Is A Place On Earth~🇺🇸~Pop
1988~Bobby McFerrin~Don't Worry, Be Happy~🇺🇸~Pop
1988~Celine Dion~Ne partez pas sans moi~🇨🇭~Pop
1988~INXS~Never Tear Us Apart~🇦🇺~Rock
1988~INXS~Need You Tonight~🇦🇺~Rock
1988~Pur~Lena~🇩🇪~Pop
1988~Tracy Chapman~Fast Car~🇺🇸~Folk
1988~U2 with B.B. King~When Love Comes To Town~🇮🇪~Rock
1988~Vanessa Paradis~Joe le taxi~🇫🇷~Pop
1989~Die Toten Hosen~Hier kommt Alex~🇩🇪~Punkrock
1989~Madonna~Like A Prayer~🇺🇸~Pop
1989~Marius Müller-Westernhagen~Freiheit~🇩🇪~Rock
1989~New Kids on the Block~Hangin' Tough~🇺🇸~Pop
1989~Riva~Rock Me~🇭🇷~Pop
1989~Roxette~The Look~🇸🇪~Pop
1989~Roxette~Listen To Your Heart~🇸🇪~Pop
1989~Soul II Soul~Back To Life~🇬🇧~R&B
1989~Tears For Fears~Sowing The Seeds Of Love~🇬🇧~Pop
1989~The B-52's~Love Shack~🇺🇸~New Wave
1989~Tone Loc~Wild Thing~🇺🇸~Hip-Hop
1989~Westernhagen~Freiheit~🇩🇪~Rock
1989~Westernhagen~Sexy~🇩🇪~Rock
1990~DJ BoBo~Somebody Dance With Me~🇨🇭~Eurodance
1990~Edoardo Bennato & Gianna Nannini~Un'estate italiana~🇮🇹~Pop
1990~Kayah~Testosteron~🇵🇱~Pop
1990~MC Hammer~U Can't Touch This~🇺🇸~Hip-Hop
1990~Madonna~Vogue~🇺🇸~Pop
1990~Matthias Reim~Verdammt, ich lieb' dich~🇩🇪~Schlager
1990~Patrick Bruel~Casser la voix~🇫🇷~Chanson
1990~Phil Collins~Another Day In Paradise~🇬🇧~Pop
1990~Roxette~It Must Have Been Love~🇸🇪~Pop
1990~Sinéad O'Connor~Nothing Compares 2 U~🇮🇪~Pop
1990~Vanilla Ice~Ice Ice Baby~🇺🇸~Hip-Hop
1990~Wolfgang Petry~Wahnsinn~🇩🇪~Schlager
1991~Anna Vissi~Forgive Me This~🇬🇷~Pop
1991~Bryan Adams~(Everything I Do) I Do It For You~🇨🇦~Pop
1991~Cathy Dennis~Touch Me (All Night Long)~🇬🇧~Pop
1991~Cher~The Shoop Shoop Song~🇺🇸~Pop
1991~Color Me Badd~I Wanna Sex You Up~🇺🇸~R&B
1991~Die Prinzen~Du musst ein Schwein sein~🇩🇪~Pop
1991~Manolo Tena~Sangre española~🇪🇸~Pop
1991~Metallica~Enter Sandman~🇺🇸~Metal
1991~Michael Jackson~Black Or White~🇺🇸~Pop
1991~Nirvana~Smells Like Teen Spirit~🇺🇸~Grunge
1991~R.E.M.~Losing My Religion~🇺🇸~Rock
1991~Right Said Fred~I'm Too Sexy~🇬🇧~Pop
1991~Roxette~Joyride~🇸🇪~Pop
1991~Technotronic~Pump Up The Jam~🇧🇪~Eurodance
1991~U2~One~🇮🇪~Rock
1992~2 Unlimited~No Limit~🇳🇱~Eurodance
1992~Boyz II Men~End Of The Road~🇺🇸~R&B
1992~Dr. Dre~Nuthin' But A 'G' Thang~🇺🇸~Hip-Hop
1992~Eric Clapton~Tears In Heaven~🇬🇧~Rock
1992~Falco~Titanic~🇦🇹~Pop
1992~House Of Pain~Jump Around~🇺🇸~Hip-Hop
1992~Madredeus~O Pastor~🇵🇹~Folk
1992~Mariah Carey~I'll Be There~🇺🇸~Pop
1992~Patrick Bruel~Place des Grands Hommes~🇫🇷~Chanson
1992~Right Said Fred~Don't Talk Just Kiss~🇬🇧~Pop
1992~Sir Mix-a-Lot~Baby Got Back~🇺🇸~Hip-Hop
1992~Snap!~Rhythm Is A Dancer~🇩🇪~Eurodance
1992~The Cranberries~Linger~🇮🇪~Rock
1992~Whitney Houston~I Will Always Love You~🇺🇸~Pop
1992~Whitney Houston~I Have Nothing~🇺🇸~Pop
1993~2 Unlimited~Get Ready For This~🇳🇱~Eurodance
1993~4 Non Blondes~What's Up?~🇺🇸~Rock
1993~Ace of Base~All That She Wants~🇸🇪~Pop
1993~Ace of Base~The Sign~🇸🇪~Pop
1993~Bryan Adams, Rod Stewart, Sting~All For Love~🌍~Pop
1993~Culture Beat~Mr. Vain~🇩🇪~Eurodance
1993~Die Toten Hosen~Alles aus Liebe~🇩🇪~Punkrock
1993~Dr. Alban~It's My Life~🇸🇪~Eurodance
1993~Haddaway~What Is Love~🇩🇪~Eurodance
1993~Janet Jackson~That's The Way Love Goes~🇺🇸~R&B
1993~Janet Jackson~Again~🇺🇸~Pop
1993~Joaquín Sabina~Y nos dieron las diez~🇪🇸~Pop
1993~Laura Pausini~La solitudine~🇮🇹~Pop
1993~Meat Loaf~I'd Do Anything For Love~🇺🇸~Rock
1993~Selig~Ohne dich~🇩🇪~Rock
1993~Snowy White~Bird Of Paradise~🇧🇪~Rock
1993~The Cranberries~Dreams~🇮🇪~Rock
1993~Twenty 4 Seven~Slave To The Music~🇳🇱~Eurodance
1993~UB40~(I Can't Help) Falling In Love With You~🇬🇧~Reggae
1994~Ace of Base~Don't Turn Around~🇸🇪~Pop
1994~All-4-One~I Swear~🇺🇸~R&B
1994~Beck~Loser~🇺🇸~Alternative
1994~Die Fantastischen Vier~Sie ist weg~🇩🇪~Hip-Hop
1994~Die Schlümpfe~Tekkno ist cool~🇩🇪~Eurodance
1994~Green Day~Basket Case~🇺🇸~Punkrock
1994~MC Solaar~Nouveau Western~🇫🇷~Hip-Hop
1994~Marco Borsato~Dromen zijn bedrog~🇳🇱~Pop
1994~Mariah Carey~All I Want For Christmas Is You~🇺🇸~Pop
1994~Mr. President~4 On The Floor~🇩🇪~Eurodance
1994~Oasis~Live Forever~🇬🇧~Britpop
1994~Paul Harrington & Charlie McGettigan~Rock 'n' Roll Kids~🇮🇪~Pop
1994~Real McCoy~Another Night~🇩🇪~Eurodance
1994~TLC~Waterfalls~🇺🇸~R&B
1994~The Cranberries~Zombie~🇮🇪~Rock
1994~Toni Braxton~Breathe Again~🇺🇸~R&B
1994~Wet Wet Wet~Love Is All Around~🇬🇧~Pop
1995~Alanis Morissette~You Oughta Know~🇨🇦~Rock
1995~Andrea Bocelli~Con te partirò~🇮🇹~Klassik/Pop
1995~Bon Jovi~Always~🇺🇸~Rock
1995~Coolio~Gangsta's Paradise~🇺🇸~Hip-Hop
1995~Die Toten Hosen~Bayern~🇩🇪~Punkrock
1995~Die Ärzte~Männer sind Schweine~🇩🇪~Rock
1995~EAV~Märchenprinz~🇦🇹~Pop
1995~Fettes Brot~Nordisch by Nature~🇩🇪~Hip-Hop
1995~Joan Osborne~One Of Us~🇺🇸~Rock
1995~K3~Heyah Mama~🇧🇪~Pop
1995~La Bouche~Be My Lover~🇩🇪~Eurodance
1995~Mariah Carey~Fantasy~🇺🇸~Pop
1995~Oasis~Wonderwall~🇬🇧~Britpop
1995~Pur~Abenteuerland~🇩🇪~Pop
1995~Reinhard Fendrich~I Am From Austria~🇦🇹~Schlager
1995~Romantikus Erőszak~Csak egy éjszaka~🇭🇺~Rock
1995~Scooter~Hyper Hyper~🇩🇪~Eurodance
1995~Sin With Sebastian~Shut Up (And Sleep With Me)~🇩🇪~Eurodance
1995~TLC~Creep~🇺🇸~R&B
1996~Backstreet Boys~Quit Playing Games (With My Heart)~🇺🇸~Pop
1996~Bea Palya~Hagyj engem!~🇭🇺~Pop
1996~Celine Dion~Because You Loved Me~🇨🇦~Pop
1996~Cher~Strong Enough~🇺🇸~Pop
1996~Die Ärzte~Schrei nach Liebe~🇩🇪~Rock
1996~E-Type~Set The World On Fire~🇸🇪~Eurodance
1996~Echt~Du trägst keine Liebe in dir~🇩🇪~Pop
1996~Eros Ramazzotti & Tina Turner~Cose della vita~🇮🇹~Pop
1996~IAM~Je danse le Mia~🇫🇷~Hip-Hop
1996~Los Del Río~Macarena~🇪🇸~Latin
1996~Lucie Bílá~Trouba~🇨🇿~Pop
1996~Niña Pastori~Cai~🇪🇸~Flamenco
1996~No Doubt~Don't Speak~🇺🇸~Rock
1996~Quad City DJ's~C'mon N' Ride It (The Train)~🇺🇸~Hip-Hop
1996~Robert Miles~Children~🇮🇹~Dance
1996~Spice Girls~Wannabe~🇬🇧~Pop
1996~The Corrs~Runaway~🇮🇪~Pop
1996~Toni Braxton~Un-Break My Heart~🇺🇸~R&B
1996~Tracy Chapman~Give Me One Reason~🇺🇸~Folk
1996~Tupac~California Love~🇺🇸~Hip-Hop
1996~U96~Das Boot~🇩🇪~Eurodance
1997~Aqua~Barbie Girl~🇩🇰~Eurodance
1997~Aqua~Doctor Jones~🇩🇰~Eurodance
1997~Backstreet Boys~Everybody (Backstreet's Back)~🇺🇸~Pop
1997~Blümchen~Boomerang~🇩🇪~Eurodance
1997~Bomfunk MC's~Freestyler~🇫🇮~Hip-Hop
1997~Boyzone~Words~🇮🇪~Pop
1997~DJ Tiësto~Sparkles~🇳🇱~Trance
1997~Daft Punk~Around The World~🇫🇷~Electronic
1997~Doris Dragović~Marija Magdalena~🇭🇷~Pop
1997~Eagle-Eye Cherry~Save Tonight~🇸🇪~Pop
1997~Elton John~Candle In The Wind 1997~🇬🇧~Pop
1997~Hanson~MMMBop~🇺🇸~Pop
1997~Hanson~I Will Come To You~🇺🇸~Pop
1997~Jarabe de Palo~La Flaca~🇪🇸~Pop
1997~Joana~Aphrodite~🇸🇮~Pop
1997~Notorious B.I.G.~Hypnotize~🇺🇸~Hip-Hop
1997~Notorious B.I.G.~Mo Money Mo Problems~🇺🇸~Hip-Hop
1997~Puff Daddy ft. Faith Evans~I'll Be Missing You~🇺🇸~Hip-Hop
1997~Radiohead~Karma Police~🇬🇧~Alternative
1997~Rammstein~Engel~🇩🇪~Metal
1997~Sarah Brightman & Andrea Bocelli~Time To Say Goodbye~🇮🇹~Klassik/Pop
1997~Sash!~Encore Une Fois~🇩🇪~Eurodance
1997~Tic Tac Toe~Verpiss dich~🇩🇪~Pop/Hip-Hop
1997~Wolfsheim~Kein Zurück~🇩🇪~Electronic
1998~Aerosmith~I Don't Want To Miss A Thing~🇺🇸~Rock
1998~Aqua~Lollipop (Candyman)~🇩🇰~Eurodance
1998~Aqua~Cartoon Heroes~🇩🇰~Eurodance
1998~Brandy & Monica~The Boy Is Mine~🇺🇸~R&B
1998~Celine Dion~My Heart Will Go On~🇨🇦~Pop
1998~Cher~Believe~🇺🇸~Pop
1998~Daft Punk~Da Funk~🇫🇷~Electronic
1998~Dana International~Diva~🇮🇱~Pop
1998~Die Ärzte~Junge~🇩🇪~Rock
1998~Dulce Pontes~Canção do Mar~🇵🇹~Fado
1998~Enrique Iglesias~Bailamos~🇪🇸~Latin Pop
1998~Goo Goo Dolls~Iris~🇺🇸~Rock
1998~Guano Apes~Open Your Eyes~🇩🇪~Rock
1998~Lauryn Hill~Doo Wop (That Thing)~🇺🇸~R&B
1998~Madonna~Frozen~🇺🇸~Pop
1998~Manu Chao~Bongo Bong~🇫🇷~World
1998~Natalie Imbruglia~Torn~🇦🇺~Pop
1998~Robyn~Show Me Love~🇸🇪~Pop
1998~Robyn~Do You Know (What It Takes)~🇸🇪~Pop
1998~Run-DMC vs Jason Nevins~It's Like That~🇺🇸~Hip-Hop
1998~Sasha~If You Believe~🇩🇪~Pop
1998~Trijntje Oosterhuis~Hou me vast~🇳🇱~Pop
1999~883~La regina del Celebrità~🇮🇹~Pop
1999~ATB~9PM (Till I Come)~🇩🇪~Trance
1999~Alejandro Sanz~Corazón partío~🇪🇸~Pop
1999~Backstreet Boys~I Want It That Way~🇺🇸~Pop
1999~Bligg ft. Marc Sway~Rosalie~🇨🇭~Hip-Hop
1999~Britney Spears~...Baby One More Time~🇺🇸~Pop
1999~Christina Aguilera~Genie In A Bottle~🇺🇸~Pop
1999~Christina Aguilera~What A Girl Wants~🇺🇸~Pop
1999~DJ Ötzi~Anton aus Tirol~🇦🇹~Schlager
1999~Edyta Górniak~To nie ja!~🇵🇱~Pop
1999~Eiffel 65~Blue (Da Ba Dee)~🇮🇹~Eurodance
1999~Eminem~My Name Is~🇺🇸~Hip-Hop
1999~Jennifer Lopez~If You Had My Love~🇺🇸~Pop
1999~Lou Bega~Mambo No. 5~🇩🇪~Latin Pop
1999~Mariza~Ó Gente da Minha Terra~🇵🇹~Fado
1999~Modern Talking~You're My Heart, You're My Soul '98~🇩🇪~Pop
1999~Myslovitz~Długość dźwięku samotności~🇵🇱~Rock
1999~Ricky Martin~Livin' La Vida Loca~🇵🇷~Latin Pop
1999~Santana ft. Rob Thomas~Smooth~🇺🇸~Latin Rock
1999~Smash Mouth~All Star~🇺🇸~Rock
1999~Sportfreunde Stiller~Ich, Roque~🇩🇪~Rock
1999~Sugar Ray~Every Morning~🇺🇸~Rock
1999~TLC~No Scrubs~🇺🇸~R&B
1999~The Cardigans~My Favourite Game~🇸🇪~Pop
1999~Vasco Rossi~Sally~🇮🇹~Rock
1999~Vengaboys~We Like To Party!~🇳🇱~Eurodance
1999~Vengaboys~Boom Boom Boom Boom!!~🇳🇱~Eurodance
1999~Westlife~Swear It Again~🇮🇪~Pop
1999~Westlife~If I Let You Go~🇮🇪~Pop
2000~*NSYNC~Bye Bye Bye~🇺🇸~Pop
2000~A-Teens~Upside Down~🇸🇪~Pop
2000~Coldplay~Yellow~🇬🇧~Alternative
2000~DJ Ötzi~Hey Baby~🇦🇹~Schlager
2000~Darude~Sandstorm~🇫🇮~Electronic
2000~Destiny's Child~Independent Women~🇺🇸~R&B
2000~Eminem~The Real Slim Shady~🇺🇸~Hip-Hop
2000~Faith Hill~Breathe~🇺🇸~Country/Pop
2000~Ich Troje~A wszystko to...~🇵🇱~Pop
2000~La Oreja de Van Gogh~Cuídate~🇪🇸~Pop
2000~Madonna~Music~🇺🇸~Pop
2000~Manu Chao~Me Gustas Tú~🇫🇷~World
2000~Modjo~Lady (Hear Me Tonight)~🇫🇷~House
2000~No Angels~Daylight In Your Eyes~🇩🇪~Pop
2000~Samantha Mumba~Gotta Tell You~🇮🇪~Pop
2000~Sonique~It Feels So Good~🇬🇧~Dance
2000~Söhne Mannheims~Und wenn ein Lied~🇩🇪~Soul
2000~U2~Beautiful Day~🇮🇪~Rock
2000~Vertical Horizon~Everything You Want~🇺🇸~Rock
2000~Westlife~Flying Without Wings~🇮🇪~Pop
2001~Alicia Keys~Fallin'~🇺🇸~R&B
2001~Alizée~Moi... Lolita~🇫🇷~Pop
2001~Atomic Kitten~Whole Again~🇳🇱~Pop
2001~Christina Aguilera, Lil' Kim, Mýa, Pink~Lady Marmalade~🇺🇸~Pop
2001~Daft Punk~One More Time~🇫🇷~Electronic
2001~Daft Punk~Harder, Better, Faster, Stronger~🇫🇷~Electronic
2001~Estopa~La raja de tu falda~🇪🇸~Rumba
2001~Gorillaz~Clint Eastwood~🇬🇧~Alternative
2001~Jennifer Lopez ft. Ja Rule~I'm Real~🇺🇸~Pop
2001~Kylie Minogue~Can't Get You Out Of My Head~🇦🇺~Pop
2001~Linkin Park~In The End~🇺🇸~Rock
2001~Nelly Furtado~I'm Like A Bird~🇨🇦~Pop
2001~Safri Duo~Played-A-Live (The Bongo Song)~🇩🇰~Electronic
2001~Sakis Rouvas~Disco Girl~🇬🇷~Pop
2001~Sarah Connor~From Sarah With Love~🇩🇪~Pop
2001~Shakira~Whenever, Wherever~🇨🇴~Latin Pop
2001~Tanel Padar & Dave Benton~Everybody~🇪🇪~Pop
2001~Tiziano Ferro~Perdono~🇮🇹~Pop
2001~Train~Drops Of Jupiter~🇺🇸~Pop
2001~Wir sind Helden~Guten Tag~🇩🇪~Pop
2001~Yvonne Catterfeld~Für dich~🇩🇪~Pop
2002~Avril Lavigne~Complicated~🇨🇦~Pop
2002~Bro'Sis~I Believe~🇩🇪~Pop
2002~Carla Bruni~Quelqu'un m'a dit~🇫🇷~Chanson
2002~DJ Sammy & Yanou ft. Do~Heaven~🇩🇪~Dance
2002~El Canto del Loco~Insoportable~🇪🇸~Pop
2002~Eminem~Lose Yourself~🇺🇸~Hip-Hop
2002~HIM~Wings Of A Butterfly~🇫🇮~Rock
2002~Ira Losco~7th Wonder~🇲🇹~Pop
2002~Justin Timberlake~Cry Me A River~🇺🇸~Pop
2002~Justin Timberlake~Like I Love You~🇺🇸~Pop
2002~Kabát~Pohoda~🇨🇿~Rock
2002~Laura Pausini~Surrender~🇮🇹~Pop
2002~Marie N~I Wanna~🇱🇻~Pop
2002~Nelly~Hot In Herre~🇺🇸~Hip-Hop
2002~Norah Jones~Don't Know Why~🇺🇸~Jazz
2002~Pink~Just Like A Pill~🇺🇸~Pop
2002~Sahlene~Runaway~🇪🇪~Pop
2002~The Corrs~Breathless~🇮🇪~Pop
2002~Tiësto & Junkie XL~Obsession~🇧🇪~Electronic
2002~Vanessa Carlton~A Thousand Miles~🇺🇸~Pop
2002~Wir sind Helden~Aurélie~🇩🇪~Pop
2002~Xavier Naidoo~Dieser Weg~🇩🇪~Soul
2003~50 Cent~In Da Club~🇺🇸~Hip-Hop
2003~Anouk~Lost~🇳🇱~Pop
2003~Beyoncé~Baby Boy~🇺🇸~R&B
2003~Beyoncé ft. Jay-Z~Crazy In Love~🇺🇸~R&B
2003~Britney Spears~Toxic~🇺🇸~Pop
2003~Christina Stürmer~Ich lebe~🇦🇹~Pop
2003~Daniel Küblböck~You Drive Me Crazy~🇩🇪~Pop
2003~David Bisbal~Bulería~🇪🇸~Latin Pop
2003~Diam's~DJ~🇫🇷~Hip-Hop
2003~Evanescence~Bring Me To Life~🇺🇸~Rock
2003~Juli~Die perfekte Welle~🇩🇪~Pop
2003~Mandaryna~Ev'ry Night~🇵🇱~Pop
2003~Maroon 5~Harder To Breathe~🇺🇸~Pop
2003~Negramaro~Mentre tutto scorre~🇮🇹~Rock
2003~O-Zone~Dragostea Din Tei~🇷🇴~Pop
2003~OutKast~Hey Ya!~🇺🇸~Hip-Hop
2003~Sean Paul~Get Busy~🇯🇲~Reggae
2003~Severina~Virujen u te~🇭🇷~Pop
2003~Silbermond~Symphonie~🇩🇪~Pop
2003~The Black Eyed Peas~Where Is The Love?~🇺🇸~Hip-Hop
2003~The Hives~Tick Tick Boom~🇸🇪~Rock
2003~The Rasmus~In The Shadows~🇫🇮~Rock
2004~Anastacia~Left Outside Alone~🇺🇸~Pop
2004~Christina Stürmer~Engel fliegen einsam~🇦🇹~Pop
2004~Eric Prydz~Call On Me~🇸🇪~Electronic
2004~Franz Ferdinand~Take Me Out~🇬🇧~Indie
2004~Giorgia~Gocce di memoria~🇮🇹~Pop
2004~Green Day~American Idiot~🇺🇸~Punkrock
2004~Hoobastank~The Reason~🇺🇸~Rock
2004~Juli~Perfekte Welle~🇩🇪~Pop
2004~Kanye West~Jesus Walks~🇺🇸~Hip-Hop
2004~Las Ketchup~The Ketchup Song (Asereje)~🇪🇸~Latin Pop
2004~Maroon 5~This Love~🇺🇸~Pop
2004~Mia.~Hungriges Herz~🇩🇪~Pop
2004~Milow~You Don't Know~🇧🇪~Pop
2004~Nightwish~Nemo~🇫🇮~Metal
2004~Snoop Dogg ft. Pharrell~Drop It Like It's Hot~🇺🇸~Hip-Hop
2004~Sportfreunde Stiller~'54, '74, '90, 2010~🇩🇪~Rock
2004~Tiësto~Adagio For Strings~🇳🇱~Trance
2004~Usher ft. Lil Jon, Ludacris~Yeah!~🇺🇸~R&B
2005~Annett Louisan~Das Spiel~🇩🇪~Pop
2005~Armin van Buuren~Shivers~🇳🇱~Trance
2005~Bebe~Malo~🇪🇸~Pop
2005~Bodyrockers~I Like The Way~🇬🇧~Pop
2005~Calogero~Si seulement je pouvais lui manquer~🇫🇷~Chanson
2005~Christina Stürmer~Mama (Ana ahabak)~🇦🇹~Pop
2005~Coldplay~Fix You~🇬🇧~Alternative
2005~Daniel Powter~Bad Day~🇨🇦~Pop
2005~Doda~Katharsis~🇵🇱~Rock
2005~Gabin~Doo Uap, Doo Uap, Doo Uap~🇮🇹~Jazz/Electronic
2005~Gwen Stefani~Hollaback Girl~🇺🇸~Pop
2005~Helena Paparizou~My Number One~🇬🇷~Pop
2005~James Blunt~You're Beautiful~🇬🇧~Pop
2005~Kanye West ft. Jamie Foxx~Gold Digger~🇺🇸~Hip-Hop
2005~Kelly Clarkson~Since U Been Gone~🇺🇸~Pop
2005~Madonna~Hung Up~🇺🇸~Pop
2005~Mariah Carey~We Belong Together~🇺🇸~R&B
2005~Outlandish~Aicha~🇩🇰~Hip-Hop
2005~Pussycat Dolls ft. Busta Rhymes~Don't Cha~🇺🇸~Pop
2005~Seeed~Aufstehn!~🇩🇪~Reggae
2005~The Frames~Falling Slowly~🇮🇪~Folk
2005~Tiziano Ferro~Sere nere~🇮🇹~Pop
2005~Tokio Hotel~Durch den Monsun~🇩🇪~Pop
2005~Walters and Kazha~The War Is Not Over~🇱🇻~Pop
2005~Yannick Noah~Aux arbres citoyens~🇫🇷~Pop
2006~Beyoncé~Irreplaceable~🇺🇸~R&B
2006~Christophe Maé~On s'attache~🇫🇷~Pop
2006~Damien Rice~9 Crimes~🇮🇪~Folk
2006~Daniel Bedingfield~If You're Not The One~🇬🇧~Pop
2006~Gnarls Barkley~Crazy~🇺🇸~Soul
2006~Junior Senior~Move Your Feet~🇩🇰~Electronic
2006~Justin Timberlake~SexyBack~🇺🇸~Pop
2006~Justin Timberlake~What Goes Around... Comes Around~🇺🇸~Pop
2006~LT United~We Are The Winners~🇱🇹~Pop
2006~Lordi~Hard Rock Hallelujah~🇫🇮~Rock
2006~Ne-Yo~So Sick~🇺🇸~R&B
2006~Nelly Furtado~Maneater~🇨🇦~Pop
2006~Roger Cicero~Frauen regier'n die Welt~🇩🇪~Jazz/Pop
2006~Severina~Moja štikla~🇭🇷~Folk/Pop
2006~Shakira ft. Wyclef Jean~Hips Don't Lie~🇨🇴~Latin
2006~Snow Patrol~Chasing Cars~🇮🇪~Rock
2006~Sportfreunde Stiller~Applaus, Applaus~🇩🇪~Rock
2007~Akon~Don't Matter~🇺🇸~R&B
2007~Amy Winehouse~Rehab~🇬🇧~Soul
2007~Apocalyptica~I Don't Care~🇫🇮~Rock
2007~Avril Lavigne~Girlfriend~🇨🇦~Pop
2007~Bushido~Alles wird gut~🇩🇪~Hip-Hop
2007~Da Weasel~Re-tratamento~🇵🇹~Hip-Hop
2007~Doda~Dziękuję~🇵🇱~Rock
2007~El sueño de Morfeo~Esta soy yo~🇪🇸~Pop
2007~Elitsa Todorova & Stoyan Yankoulov~Water~🇧🇬~Folk
2007~Fergie~Big Girls Don't Cry~🇺🇸~Pop
2007~Ich + Ich~Vom selben Stern~🇩🇪~Pop
2007~Kanye West~Stronger~🇺🇸~Hip-Hop
2007~Magdi Rúzsa~Unsubstantial Blues~🇭🇺~Pop
2007~Marija Šerifović~Molitva~🇷🇸~Pop
2007~Mark Medlock & Dieter Bohlen~You Can Get It~🇩🇪~Pop
2007~Melendi~Caminando por la vida~🇪🇸~Pop
2007~Mondo Marcio~Dentro alla scatola~🇮🇹~Hip-Hop
2007~Peter Fox~Alles neu~🇩🇪~Pop
2007~Plain White T's~Hey There Delilah~🇺🇸~Pop
2007~Rihanna ft. Jay-Z~Umbrella~🇧🇧~Pop
2007~Soulja Boy Tell 'Em~Crank That~🇺🇸~Hip-Hop
2007~The Script~We Cry~🇮🇪~Pop
2007~Timbaland ft. OneRepublic~Apologize~🇺🇸~Pop
2008~Beyoncé~Single Ladies (Put A Ring On It)~🇺🇸~R&B
2008~Coldplay~Viva La Vida~🇬🇧~Alternative
2008~Culcha Candela~Hamma!~🇩🇪~Hip-Hop
2008~Estelle ft. Kanye West~American Boy~🇬🇧~R&B
2008~Feel~A gdy jest już ciemno~🇵🇱~Pop
2008~Inna~Hot~🇷🇴~Dance
2008~Jovanotti~A te~🇮🇹~Pop
2008~Kalomira~Secret Combination~🇬🇷~Pop
2008~Katy Perry~I Kissed A Girl~🇺🇸~Pop
2008~Kings of Leon~Sex On Fire~🇺🇸~Rock
2008~Lady Gaga~Just Dance~🇺🇸~Pop
2008~MGMT~Kids~🇺🇸~Indie
2008~Mickaël Miro~L'horloge tourne~🇫🇷~Pop
2008~Milow~Ayo Technology~🇧🇪~Pop
2008~OneRepublic~Stop And Stare~🇺🇸~Pop
2008~Peter Fox~Haus am See~🇩🇪~Pop
2008~Pink~So What~🇺🇸~Pop
2008~Pink~Sober~🇺🇸~Pop
2008~Sunrise Avenue~Fairytale Gone Bad~🇫🇮~Rock
2008~T.I. ft. Rihanna~Live Your Life~🇺🇸~Hip-Hop
2008~The Script~Breakeven~🇮🇪~Pop
2008~Tokio Hotel~Übers Ende der Welt~🇩🇪~Rock
2009~Alexander Rybak~Fairytale~🇳🇴~Pop
2009~Beyoncé~Halo~🇺🇸~R&B
2009~Black Eyed Peas~Boom Boom Pow~🇺🇸~Pop
2009~David Carreira~Esta Noite~🇵🇹~Pop
2009~David Guetta ft. Akon~Sexy Bitch~🇫🇷~Electronic
2009~Drake~Best I Ever Had~🇨🇦~Hip-Hop
2009~Flo Rida ft. Ke$ha~Right Round~🇺🇸~Pop
2009~Hardwell & DJ Funkadelic~Mercury~🇳🇱~Electronic
2009~Inna~Sun Is Up~🇷🇴~Dance
2009~Jay-Z & Alicia Keys~Empire State Of Mind~🇺🇸~Hip-Hop
2009~Jennifer Rostock~Mein Mikrofon~🇩🇪~Rock
2009~Ke$ha~Tik Tok~🇺🇸~Pop
2009~Lady Gaga~Poker Face~🇺🇸~Pop
2009~Lady Gaga~Bad Romance~🇺🇸~Pop
2009~Marco Mengoni~Credimi ancora~🇮🇹~Pop
2009~Owl City~Fireflies~🇺🇸~Synthpop
2009~Pitbull~I Know You Want Me (Calle Ocho)~🇺🇸~Pop
2009~Shakira~She Wolf~🇨🇴~Pop
2009~Sido & Bushido~Berlin~🇩🇪~Hip-Hop
2009~Stefanie Heinzmann~My Man Is A Mean Man~🇨🇭~Pop
2009~Sunrise Avenue~Hollywood Hills~🇫🇮~Rock
2009~The Black Eyed Peas~I Gotta Feeling~🇺🇸~Pop
2009~Yael Naim~New Soul~🇫🇷~Pop
2010~Akcent~That's My Name~🇷🇴~Dance
2010~Alexandra Stan~Mr. Saxobeat~🇷🇴~Dance
2010~Andreas Gabalier~I sing a Liad für di~🇦🇹~Volksmusik
2010~Azis~Sen Trope~🇧🇬~Pop
2010~Bruno Mars~Just The Way You Are~🇺🇸~Pop
2010~Bushido~Für immer jung~🇩🇪~Hip-Hop
2010~Caro Emerald~Back It Up~🇳🇱~Jazz
2010~Cee Lo Green~Forget You~🇺🇸~Soul
2010~Cee Lo Green~Fuck You / Forget You~🇺🇸~Soul
2010~David Guetta ft. Kid Cudi~Memories~🇫🇷~Electronic
2010~Edward Maya & Vika Jigulina~Stereo Love~🇷🇴~Dance
2010~Eminem ft. Rihanna~Love The Way You Lie~🇺🇸~Hip-Hop
2010~Ewa Farna~Měls mě vůbec rád?~🇨🇿~Pop
2010~Far East Movement ft. Cataracs, Dev~Like A G6~🇺🇸~Pop
2010~Feminnem~Lako je sve~🇭🇷~Pop
2010~Florence + The Machine~You've Got The Love~🇬🇧~Indie
2010~Helene Fischer~Mitten im Paradies~🇩🇪~Schlager
2010~Jason Derulo~In My Head~🇺🇸~Pop
2010~Katy Perry ft. Snoop Dogg~California Gurls~🇺🇸~Pop
2010~Kombii~Pokolenie~🇵🇱~Pop
2010~Kristína~Horehronie~🇸🇰~Pop
2010~Lena~Satellite~🇩🇪~Pop
2010~Medina~You And I~🇩🇰~Pop
2010~Mumford & Sons~Little Lion Man~🇬🇧~Folk
2010~Pablo Alborán~Solamente tú~🇪🇸~Pop
2010~Rihanna~Only Girl (In The World)~🇧🇧~Pop
2010~Rihanna~Rude Boy~🇧🇧~Pop
2010~Robyn~Dancing On My Own~🇸🇪~Pop
2010~Shakira~Waka Waka (This Time For Africa)~🇨🇴~Latin Pop
2010~Stromae~Alors on danse~🇧🇪~Electronic
2010~Taio Cruz~Dynamite~🇬🇧~Pop
2010~Train~Hey, Soul Sister~🇺🇸~Pop
2010~Two Door Cinema Club~Something Good Can Work~🇮🇪~Indie
2010~Unheilig~Geboren um zu leben~🇩🇪~Rock
2010~Usher ft. Pitbull~DJ Got Us Fallin' In Love~🇺🇸~Pop
2010~Vasco Rossi~Manifesto futurista della nuova umanità~🇮🇹~Rock
2011~Adele~Rolling In The Deep~🇬🇧~Pop
2011~Adele~Someone Like You~🇬🇧~Pop
2011~Adele~Set Fire To The Rain~🇬🇧~Pop
2011~Afrojack ft. Eva Simons~Take Over Control~🇳🇱~Electronic
2011~Andreas Gabalier~Hulapalu~🇦🇹~Volksmusik
2011~Auryn~Puppeteer~🇪🇸~Pop
2011~Avicii~Levels~🇸🇪~Electronic
2011~Bruno Mars~Grenade~🇺🇸~Pop
2011~Casper~Auf und davon~🇩🇪~Hip-Hop
2011~Christopher~Against The Odds~🇩🇰~Pop
2011~Coldplay~Paradise~🇬🇧~Alternative
2011~David Guetta ft. Pitbull~Where Them Girls At~🇺🇸~Electronic
2011~Ed Sheeran~Lego House~🇬🇧~Pop
2011~Eric Saade~Popular~🇸🇪~Pop
2011~Foster The People~Pumped Up Kicks~🇺🇸~Indie
2011~Indila~Dernière danse~🇫🇷~Pop
2011~Inna~Caliente~🇷🇴~Dance
2011~LMFAO ft. Lauren Bennett, GoonRock~Party Rock Anthem~🇺🇸~Electronic
2011~Loreen~Euphoria~🇸🇪~Pop
2011~Loukas Yorkas & Stereo Mike~Watch My Dance~🇬🇷~Pop
2011~Lucio Dalla~Caruso~🇮🇹~Pop
2011~Maroon 5 ft. Christina Aguilera~Moves Like Jagger~🇺🇸~Pop
2011~Maître Gims~Bella~🇫🇷~Hip-Hop
2011~Pitbull ft. Ne-Yo, Afrojack, Nayer~Give Me Everything~🇺🇸~Pop
2011~Robin~Frontside Ollie~🇫🇮~Pop
2011~Swedish House Mafia~Save The World~🇸🇪~Electronic
2011~Tim Bendzko~Nur noch kurz die Welt retten~🇩🇪~Pop
2011~Wiz Khalifa~Black And Yellow~🇺🇸~Hip-Hop
2011~ZAZ~Je veux~🇫🇷~Chanson
2012~Andreas Bourani~Auf uns~🇩🇪~Pop
2012~Carly Rae Jepsen~Call Me Maybe~🇨🇦~Pop
2012~Caro Emerald~Tangled Up~🇳🇱~Jazz
2012~Cro~Easy~🇩🇪~Hip-Hop
2012~Cro~Du~🇩🇪~Hip-Hop
2012~David Guetta ft. Sia~Titanium~🇫🇷~Electronic
2012~Donatan & Cleo~My Słowianie~🇵🇱~Folk/Pop
2012~Donny Montell~Love Is Blind~🇱🇹~Pop
2012~Ed Sheeran~The A Team~🇬🇧~Pop
2012~Emma~Non è l'inferno~🇮🇹~Pop
2012~Fun. ft. Janelle Monáe~We Are Young~🇺🇸~Pop
2012~Gotye ft. Kimbra~Somebody That I Used To Know~🇧🇪~Pop
2012~Imagine Dragons~It's Time~🇺🇸~Rock
2012~Lukas Graham~Drunk In The Morning~🇩🇰~Pop
2012~Maroon 5~Payphone~🇺🇸~Pop
2012~Nicky Romero & Avicii~I Could Be The One~🇳🇱~Electronic
2012~Of Monsters and Men~Little Talks~🇮🇸~Indie
2012~PSY~Gentleman~🇰🇷~K-Pop
2012~Pablo Alborán~Te he echado de menos~🇪🇸~Pop
2012~Psy~Gangnam Style~🇰🇷~K-Pop
2012~Swedish House Mafia~Don't You Worry Child~🇸🇪~Electronic
2012~Taylor Swift~We Are Never Ever Getting Back Together~🇺🇸~Pop
2012~The Script ft. will.i.am~Hall Of Fame~🇮🇪~Pop
2012~fun.~Some Nights~🇺🇸~Indie
2013~Antonia~Marabu~🇷🇴~Dance
2013~Avicii~Wake Me Up~🇸🇪~Electronic
2013~Avicii~Hey Brother~🇸🇪~Electronic
2013~Bastille~Pompeii~🇬🇧~Indie
2013~Birgit~Et uus saaks alguse~🇪🇪~Pop
2013~Buraka Som Sistema~Hangover (BaBaBa)~🇵🇹~Electronic
2013~Capital Cities~Safe And Sound~🇺🇸~Indie
2013~Casper~Im Ascheregen~🇩🇪~Hip-Hop
2013~Cassandra Steen~Stadt~🇩🇪~Pop
2013~Daft Punk ft. Pharrell Williams~Get Lucky~🇫🇷~Disco
2013~Drake ft. Majid Jordan~Hold On, We're Going Home~🇨🇦~R&B
2013~Gianluca Bezzina~Tomorrow~🇲🇹~Pop
2013~Helene Fischer~Atemlos durch die Nacht~🇩🇪~Schlager
2013~Icona Pop ft. Charli XCX~I Love It~🇸🇪~Electronic
2013~Idina Menzel~Let It Go~🇺🇸~Soundtrack
2013~Imagine Dragons~Radioactive~🇺🇸~Rock
2013~Katy Perry~Roar~🇺🇸~Pop
2013~Klapa s mora~Mižerja~🇭🇷~Klapa
2013~Koza Mostra & Agathon Iakovidis~Alcohol Is Free~🇬🇷~Folk
2013~Krista Siegfrids~Marry Me~🇫🇮~Pop
2013~Lorde~Royals~🇳🇿~Indie Pop
2013~Lorde~Tennis Court~🇳🇿~Indie
2013~Macklemore & Ryan Lewis ft. Wanz~Thrift Shop~🇺🇸~Hip-Hop
2013~Marco Mengoni~L'essenziale~🇮🇹~Pop
2013~Mark Forster~Au revoir~🇩🇪~Pop
2013~Miley Cyrus~Wrecking Ball~🇺🇸~Pop
2013~Pharrell Williams~Happy~🇺🇸~Pop
2013~Robin Thicke ft. T.I., Pharrell~Blurred Lines~🇺🇸~Pop
2013~Sido~Bilder im Kopf~🇩🇪~Hip-Hop
2013~Stromae~Papaoutai~🇧🇪~Pop
2013~Stromae~Formidable~🇧🇪~Pop
2013~Stromae~Tous les mêmes~🇧🇪~Pop
2013~Tiësto & Showtek~Wasted~🇳🇱~Electronic
2013~Vanesa Martín~Mi mejor regalo~🇪🇸~Pop
2014~AWS~Viszlát nyár~🇭🇺~Rock
2014~Annalisa~Sento solo il presente~🇮🇹~Pop
2014~Calvin Harris~Summer~🇬🇧~Electronic
2014~Christine and the Queens~Christine~🇫🇷~Pop
2014~Conchita Wurst~Rise Like A Phoenix~🇦🇹~Pop
2014~Cro~Traum~🇩🇪~Hip-Hop
2014~Dvicio~Paraíso~🇪🇸~Pop
2014~Ed Sheeran~Thinking Out Loud~🇬🇧~Pop
2014~Fabri Fibra~Pronti, partenza, via!~🇮🇹~Hip-Hop
2014~Glasperlenspiel~Geiles Leben~🇩🇪~Pop
2014~Hozier~Take Me To Church~🇮🇪~Indie
2014~Idina Menzel~Let It Go (Frozen)~🇺🇸~Pop
2014~Iggy Azalea ft. Charli XCX~Fancy~🇦🇺~Hip-Hop
2014~Indila~Tourner dans le vide~🇫🇷~Pop
2014~John Legend~All Of Me~🇺🇸~R&B
2014~Kensington~Streets~🇳🇱~Rock
2014~Loïc Nottet~Rhythm Inside~🇧🇪~Pop
2014~Magic!~Rude~🇨🇦~Reggae/Pop
2014~Malú~A prueba de ti~🇪🇸~Pop
2014~Mans Zelmerlöw~Heroes~🇸🇪~Pop
2014~Mark Forster~Flash mich~🇩🇪~Pop
2014~Mark Ronson ft. Bruno Mars~Uptown Funk~🇬🇧~Funk
2014~Martin Garrix~Animals~🇳🇱~Electronic
2014~Meghan Trainor~All About That Bass~🇺🇸~Pop
2014~Mirai~Když nemůžeš, tak přidej!~🇨🇿~Pop
2014~MØ~Final Song~🇩🇰~Pop
2014~Oliver Heldens~Gecko (Overdrive)~🇳🇱~Electronic
2014~Pharrell Williams~Marilyn Monroe~🇺🇸~Pop
2014~Sam Smith~Stay With Me~🇬🇧~Pop
2014~Sam Smith~I'm Not The Only One~🇬🇧~Pop
2014~Sarah Connor~Wie schön du bist~🇩🇪~Pop
2014~Sia~Chandelier~🇦🇺~Pop
2014~Sylwia Grzeszczak~Sen o przyszłości~🇵🇱~Pop
2014~Taylor Swift~Shake It Off~🇺🇸~Pop
2014~Tinkara Kovač~Round And Round~🇸🇮~Pop
2014~Tove Lo~Habits (Stay High)~🇸🇪~Pop
2014~Wanda~Bologna~🇦🇹~Indie
2015~Adele~Hello~🇬🇧~Pop
2015~Aminata~Love Injected~🇱🇻~Pop
2015~Avicii~The Nights~🇸🇪~Electronic
2015~Bausa~Was du Liebe nennst~🇩🇪~Hip-Hop
2015~Bilderbuch~Maschin~🇦🇹~Indie
2015~Black M~Sur ma route~🇫🇷~Hip-Hop
2015~Bruno Mars & Mark Ronson~Uptown Funk~🇺🇸~Funk
2015~Drake~Hotline Bling~🇨🇦~R&B
2015~Ellie Goulding~Love Me Like You Do~🇬🇧~Pop
2015~Enrique Iglesias ft. Descemer Bueno~Bailando~🇪🇸~Latin Pop
2015~Fedez~Pop-Hoolista~🇮🇹~Hip-Hop
2015~Fetty Wap~Trap Queen~🇺🇸~Hip-Hop
2015~Funambulista~Tres metros sobre el cielo~🇪🇸~Pop
2015~Il Volo~Grande amore~🇮🇹~Klassik/Pop
2015~Inna~Bop Bop~🇷🇴~Dance
2015~Justin Bieber~Sorry~🇨🇦~Pop
2015~Lost Frequencies~Are You With Me~🇧🇪~Electronic
2015~Lost Frequencies~Reality~🇧🇪~Electronic
2015~Lukas Graham~7 Years~🇩🇰~Pop
2015~Lukas Graham~Mama Said~🇩🇰~Pop
2015~Major Lazer~Lean On~🇺🇸~Electronic
2015~Major Lazer ft. MØ, DJ Snake~Lean On~🇺🇸~Electronic
2015~Margaret~Cool Me Down~🇵🇱~Pop
2015~Mark Forster~Bauch und Kopf~🇩🇪~Pop
2015~Mr Probz~Waves~🇳🇱~Electronic
2015~MØ ft. Major Lazer & DJ Snake~Lean On~🇩🇰~Electronic
2015~Niall Horan~This Town~🇮🇪~Pop
2015~OMI~Cheerleader~🇯🇲~Pop
2015~Selena Gomez~Good For You~🇺🇸~Pop
2015~Soprano~Cosmo~🇫🇷~Hip-Hop
2015~Stig~Häppärä~🇫🇮~Pop
2015~The Weeknd~Can't Feel My Face~🇨🇦~R&B
2015~Walk The Moon~Shut Up And Dance~🇺🇸~Indie
2015~Wincent Weiss~Musik sein~🇩🇪~Pop
2015~Wiz Khalifa ft. Charlie Puth~See You Again~🇺🇸~Hip-Hop
2015~Zara Larsson~Lush Life~🇸🇪~Pop
2016~Adele~Send My Love (To Your New Lover)~🇬🇧~Pop
2016~AnnenMayKantereit~Pocahontas~🇩🇪~Indie
2016~Calvin Harris ft. Rihanna~This Is What You Came For~🇬🇧~Electronic
2016~Cro~Unendlichkeit~🇩🇪~Hip-Hop
2016~Drake~One Dance~🇨🇦~R&B
2016~Felix Jaehn ft. Hearts & Colors~Hot2Touch~🇩🇪~Electronic
2016~Francesco Gabbani~Amen~🇮🇹~Pop
2016~Jamala~1944~🇺🇦~Pop
2016~Justin Timberlake~Can't Stop The Feeling!~🇺🇸~Pop
2016~Kasia Moś~Flashlight~🇵🇱~Pop
2016~Kendji Girac~Andalouse~🇫🇷~Pop
2016~Major Lazer ft. Justin Bieber~Cold Water~🇺🇸~Electronic
2016~Manuel Carrasco~Que nadie~🇪🇸~Pop
2016~Martin Garrix & Bebe Rexha~In The Name Of Love~🇳🇱~Pop
2016~Max Giesinger~80 Millionen~🇩🇪~Pop
2016~Mike Posner~I Took A Pill In Ibiza~🇺🇸~Pop
2016~MØ ft. Justin Bieber & Major Lazer~Cold Water~🇩🇰~Pop
2016~Namika~Lieblingsmensch~🇩🇪~Pop
2016~Poli Genova~If Love Was A Crime~🇧🇬~Pop
2016~Rae Sremmurd ft. Gucci Mane~Black Beatles~🇺🇸~Hip-Hop
2016~Sanni~2 in 1~🇫🇮~Pop
2016~Seiler und Speer~Ham kummst~🇦🇹~Pop
2016~Sia~Cheap Thrills~🇦🇺~Pop
2016~The Chainsmokers ft. Halsey~Closer~🇺🇸~Electronic
2016~Twenty One Pilots~Heathens~🇺🇸~Alternative
2016~Twenty One Pilots~Stressed Out~🇺🇸~Alternative
2017~Alle Farben & James Blunt~Walk Away~🇩🇪~Electronic
2017~Bonez MC & RAF Camora~500 PS~🇩🇪~Hip-Hop
2017~Bruno Mars~That's What I Like~🇺🇸~Pop
2017~Camila Cabello~Havana~🇨🇺~Latin Pop
2017~Capital Bra~One Night Stand~🇩🇪~Hip-Hop
2017~Cardi B~Bodak Yellow~🇺🇸~Hip-Hop
2017~Carla's Dreams~Sub pielea mea~🇲🇩~Pop
2017~Charlie Puth~Attention~🇺🇸~Pop
2017~Coely~My Tomorrow~🇧🇪~Soul
2017~DJ Khaled ft. Justin Bieber~I'm The One~🇺🇸~Hip-Hop
2017~DJ Snake ft. Justin Bieber~Let Me Love You~🇫🇷~Electronic
2017~Dawid Podsiadło~W dobrą stronę~🇵🇱~Pop
2017~Demy~This Is Love~🇬🇷~Pop
2017~Ed Sheeran~Shape Of You~🇬🇧~Pop
2017~Ed Sheeran~Perfect~🇬🇧~Pop
2017~Felix Jaehn ft. Jasmine Thompson~Ain't Nobody (Loves Me Better)~🇩🇪~Electronic
2017~Francesco Gabbani~Occidentali's Karma~🇮🇹~Pop
2017~Imagine Dragons~Believer~🇺🇸~Rock
2017~J Balvin & Willy William~Mi Gente~🇨🇴~Reggaeton
2017~Jain~Makeba~🇫🇷~Pop
2017~Joci Pápai~Origo~🇭🇺~Pop
2017~Kendrick Lamar~HUMBLE.~🇺🇸~Hip-Hop
2017~Kristian Kostov~Beautiful Mess~🇧🇬~Pop
2017~Lea~Treppenhaus~🇩🇪~Pop
2017~Luis Fonsi~Despacito~🇵🇷~Latin Pop
2017~Luis Fonsi ft. Daddy Yankee~Despacito~🇵🇷~Latin
2017~Lukas Graham~Love Someone~🇩🇰~Pop
2017~Maluma~Felices los 4~🇨🇴~Reggaeton
2017~Mark Forster & VIZE~Sowieso~🇩🇪~Pop
2017~Migos ft. Lil Uzi Vert~Bad and Boujee~🇺🇸~Hip-Hop
2017~Petit Biscuit~Sunset Lover~🇫🇷~Electronic
2017~Pizzera & Jaus~Jedermann~🇦🇹~Pop
2017~Post Malone~Rockstar~🇺🇸~Hip-Hop
2017~Rosalía & C. Tangana~Antes de morirme~🇪🇸~Flamenco/Pop
2017~Salvador Sobral~Amar pelos dois~🇵🇹~Jazz/Pop
2017~Sam Smith~Too Good At Goodbyes~🇬🇧~Pop
2017~Sigrid~Don't Kill My Vibe~🇳🇴~Pop
2017~Thegiornalisti~Riccione~🇮🇹~Pop
2017~Tiziano Ferro~Il conforto~🇮🇹~Pop
2017~Tiësto & Dzeko ft. Preme & Post Malone~Jackie Chan~🇳🇱~Electronic
2017~Vianney~Je m'en vais~🇫🇷~Pop
2017~ZAYN & Taylor Swift~I Don't Wanna Live Forever~🇺🇸~Pop
2017~Zac Efron & Zendaya~Rewrite The Stars~🇺🇸~Soundtrack
2017~Zara Larsson~Symphony~🇸🇪~Pop
2018~Aitana & Ana Guerra~Lo malo~🇪🇸~Pop
2018~Alma~Phases~🇫🇮~Pop
2018~Andra~Iubirea Schimba Tot~🇷🇴~Pop
2018~Angèle~Tout oublier~🇧🇪~Pop
2018~Angèle~La loi de Murphy~🇧🇪~Pop
2018~Anne-Marie~2002~🇬🇧~Pop
2018~Apache 207~Roller~🇩🇪~Hip-Hop
2018~Ariana Grande~Thank U, Next~🇺🇸~Pop
2018~Aya Nakamura~Djadja~🇫🇷~Pop
2018~Bebe Rexha & Florida Georgia Line~Meant To Be~🇺🇸~Country/Pop
2018~Becky G & Natti Natasha~Sin Pijama~🇺🇸~Reggaeton
2018~Bonez MC ft. RAF Camora~Ohne mein Team~🇩🇪~Hip-Hop
2018~Calvin Harris & Dua Lipa~One Kiss~🇬🇧~Pop
2018~Capital Bra~5 Songs in einer Nacht~🇩🇪~Hip-Hop
2018~Cardi B, Bad Bunny, J Balvin~I Like It~🇺🇸~Latin
2018~Cesare Cremonini~Possibili scenari~🇮🇹~Pop
2018~Childish Gambino~This Is America~🇺🇸~Hip-Hop
2018~Christopher~Heartbeat~🇩🇰~Pop
2018~Cláudia Pascoal~O jardim~🇵🇹~Pop
2018~Dermot Kennedy~Power Over Me~🇮🇪~Pop
2018~Drake~God's Plan~🇨🇦~Hip-Hop
2018~Drake~In My Feelings~🇨🇦~Hip-Hop
2018~Eleni Foureira~Fuego~🇨🇾~Pop
2018~Elina Nechayeva~La forza~🇪🇪~Klassik/Pop
2018~Ermal Meta & Fabrizio Moro~Non mi avete fatto niente~🇮🇹~Pop
2018~Franka~Crazy~🇭🇷~Pop
2018~Ieva Zasimauskaitė~When We're Old~🇱🇹~Pop
2018~Imagine Dragons~Thunder~🇺🇸~Pop Rock
2018~Imagine Dragons~Whatever It Takes~🇺🇸~Rock
2018~Kortez~Bumerang~🇵🇱~Pop
2018~Lady Gaga & Bradley Cooper~Shallow~🇺🇸~Pop
2018~Laura Rizzotto~Funny Girl~🇱🇻~Jazz
2018~Lea Sirk~Hvala, ne!~🇸🇮~Pop
2018~Loredana~Sonnenbrille~🇩🇪~Hip-Hop
2018~Maroon 5 ft. Cardi B~Girls Like You~🇺🇸~Pop
2018~Maroon 5 ft. SZA~What Lovers Do~🇺🇸~Pop
2018~Marshmello & Bastille~Happier~🇺🇸~Electronic
2018~Martin Garrix ft. Khalid~Ocean~🇳🇱~Electronic
2018~Mikolas Josef~Lie To Me~🇨🇿~Pop
2018~Nicky Jam & J Balvin~X (Equis)~🇺🇸~Reggaeton
2018~Picture This~One Drink~🇮🇪~Pop
2018~Post Malone~Better Now~🇺🇸~Pop
2018~Robin Schulz ft. James Blunt~OK~🇩🇪~Electronic
2018~Rosalía~Malamente~🇪🇸~Flamenco/Pop
2018~Tove Styrke~Sway~🇸🇪~Pop
2018~Travis Scott~Sicko Mode~🇺🇸~Hip-Hop
2019~AJR~100 Bad Days~🇺🇸~Indie
2019~Aitana~Vas a quedarte~🇪🇸~Pop
2019~Angèle~Balance ton quoi~🇧🇪~Pop
2019~Anuel AA & Karol G~Secreto~🇵🇷~Reggaeton
2019~Apache 207~Kein Problem~🇩🇪~Hip-Hop
2019~Apache 207~200 km/h~🇩🇪~Hip-Hop
2019~Avicii~SOS~🇸🇪~Electronic
2019~Bad Bunny~Callaita~🇵🇷~Reggaeton
2019~Bigflo & Oli~Bienvenue chez moi~🇫🇷~Hip-Hop
2019~Billie Eilish~Bad Guy~🇺🇸~Pop
2019~Billie Eilish~Ocean Eyes~🇺🇸~Pop
2019~Billie Eilish~When The Party's Over~🇺🇸~Pop
2019~Camila Cabello & Shawn Mendes~Señorita~🇺🇸~Pop
2019~Capital Bra & Samra~Wieder Lila~🇩🇪~Hip-Hop
2019~Cheek~Tytöt tykkää~🇫🇮~Hip-Hop
2019~Conan Osíris~Telemóveis~🇵🇹~Pop
2019~Duncan Laurence~Arcade~🇳🇱~Pop
2019~Halsey~Without Me~🇺🇸~Pop
2019~Hooverphonic~Mad About You~🇧🇪~Pop
2019~Karmen~Kým si tu~🇸🇰~Pop
2019~Karol G & Nicki Minaj~Tusa~🇨🇴~Reggaeton
2019~Katerine Duska~Better Love~🇬🇷~Pop
2019~Khalid~Talk~🇺🇸~R&B
2019~Lake Malawi~Friend Of A Friend~🇨🇿~Pop
2019~Lewis Capaldi~Someone You Loved~🇬🇧~Pop
2019~Lil Nas X ft. Billy Ray Cyrus~Old Town Road~🇺🇸~Country/Hip-Hop
2019~Lizzo~Truth Hurts~🇺🇸~Pop
2019~Lola Indigo~Mujer bruja~🇪🇸~Pop
2019~Loredana & Mozzik~Bonnie & Clyde~🇩🇪~Hip-Hop
2019~Mahmood~Soldi~🇮🇹~Pop
2019~Marshmello & Halsey~Be Kind~🇺🇸~Electronic
2019~Niall Horan~Nice To Meet Ya~🇮🇪~Pop
2019~Post Malone & Swae Lee~Sunflower~🇺🇸~Hip-Hop
2019~RAF Camora~500 PS~🇦🇹~Hip-Hop
2019~ROSALÍA & J Balvin~Con Altura~🇪🇸~Reggaeton
2019~Rosalía~Con altura~🇪🇸~Reggaeton
2019~Sabina Ddumba~Effortless~🇸🇪~Pop
2019~Salmo~1984~🇮🇹~Hip-Hop
2019~Sanah~Szampan~🇵🇱~Pop
2019~Shawn Mendes & Camila Cabello~Señorita~🇨🇦~Pop
2019~Shirin David~Gib ihm~🇩🇪~Hip-Hop
2019~Slavi Trifonov~Bila si moe ime~🇧🇬~Pop
2019~Smiley~Vals~🇷🇴~Pop
2019~Taylor Swift~Lover~🇺🇸~Pop
2019~The Weeknd~Blinding Lights~🇨🇦~Synthpop
2019~Tones and I~Dance Monkey~🇦🇺~Pop
2019~Vegedream~Ramenez la coupe à la maison~🇫🇷~Hip-Hop
2019~Vincent Weiss~An Wunder~🇩🇪~Pop
2020~01099~Damals~🇩🇪~Hip-Hop
2020~24kGoldn ft. iann dior~Mood~🇺🇸~Hip-Hop
2020~Angèle & Damso~Démons~🇧🇪~Pop
2020~Apache 207~Bläulich~🇩🇪~Hip-Hop
2020~Ariana Grande~positions~🇺🇸~Pop
2020~BTS~Dynamite~🇰🇷~K-Pop
2020~Bad Bunny~Yo Perreo Sola~🇵🇷~Reggaeton
2020~Bad Gyal~Hookah~🇪🇸~Latin
2020~Bárbara Tinoco~Despassarado~🇵🇹~Pop
2020~Camilo~Vida de rico~🇨🇴~Latin Pop
2020~Cardi B ft. Megan Thee Stallion~WAP~🇺🇸~Hip-Hop
2020~Dadju~Reine~🇫🇷~R&B
2020~Diodato~Fai rumore~🇮🇹~Pop
2020~Doja Cat~Say So~🇺🇸~Pop
2020~Dua Lipa~Don't Start Now~🇬🇧~Pop
2020~Dua Lipa~Levitating~🇬🇧~Pop
2020~Eno~Lambo Diablo GT~🇩🇪~Hip-Hop
2020~Harry Styles~Watermelon Sugar~🇬🇧~Pop
2020~Maluma~Hawái~🇨🇴~Reggaeton
2020~Martin Garrix ft. Bono & The Edge~We Are The People~🇳🇱~Pop
2020~Master KG ft. Nomcebo Zikode~Jerusalema~🇿🇦~House
2020~Mata~Patointeligencja~🇵🇱~Hip-Hop
2020~Mathea~2x~🇦🇹~Pop
2020~Megan Thee Stallion ft. Beyoncé~Savage Remix~🇺🇸~Hip-Hop
2020~Olivia Rodrigo~drivers license~🇺🇸~Pop
2020~Pablo Alborán~Si hubieras querido~🇪🇸~Pop
2020~Pietro Lombardi~Cinderella~🇩🇪~Pop
2020~Pinguini Tattici Nucleari~Ringo Starr~🇮🇹~Indie
2020~Powfu ft. Beabadoobee~Death Bed~🇨🇦~Lo-fi
2020~Roddy Ricch~The Box~🇺🇸~Hip-Hop
2020~Rosalía & Travis Scott~TKN~🇪🇸~Reggaeton
2020~Sanah & Vito Bambino~Ostatnia nadzieja~🇵🇱~Pop
2020~Sandro~Running~🇨🇾~Pop
2020~Sido & Apache 207~2002~🇩🇪~Hip-Hop
2020~Stromae~Santé~🇧🇪~Pop
2020~Surf Mesa ft. Emilee~ily (i love you baby)~🇺🇸~Pop
2020~Tessa~Smukkere~🇩🇰~Hip-Hop
2020~Tove Lo~Bikini Porn~🇸🇪~Pop
2020~Trevor Daniel~Falling~🇺🇸~Pop
2020~Wellhello~Rakpart~🇭🇺~Pop
2021~AYLIVA~Wunder~🇩🇪~R&B
2021~Adele~Easy On Me~🇬🇧~Pop
2021~BTS~Butter~🇰🇷~K-Pop
2021~Bad Bunny & Jhay Cortez~Dákiti~🇵🇷~Reggaeton
2021~Bausa, Apache 207~Madonna~🇩🇪~Hip-Hop
2021~Camilo & Evaluna Montaner~Por Primera Vez~🇨🇴~Latin Pop
2021~Cornelia Jakobs~Hold Me Closer~🇸🇪~Pop
2021~Daria Zawiałow~Malinowy Chruśniak~🇵🇱~Pop
2021~Destiny~Je Me Casse~🇲🇹~Pop
2021~Doja Cat~Need To Know~🇺🇸~Pop
2021~Doja Cat ft. SZA~Kiss Me More~🇺🇸~R&B
2021~Drake ft. Future, Young Thug~Way 2 Sexy~🇨🇦~Hip-Hop
2021~Ed Sheeran~Bad Habits~🇬🇧~Pop
2021~Edin~Plötzlich Stille~🇩🇪~Pop
2021~Encanto Cast~We Don't Talk About Bruno~🇺🇸~Soundtrack
2021~Fyr & Flamme~Øve os på hinanden~🇩🇰~Pop
2021~Glass Animals~Heat Waves~🇬🇧~Indie
2021~Josh.~Cordula Grün~🇦🇹~Pop
2021~Justin Bieber~Peaches~🇨🇦~R&B
2021~Käärijä~Cha Cha Cha~🇫🇮~Pop/Metal
2021~Lil Nas X~MONTERO (Call Me By Your Name)~🇺🇸~Pop
2021~Lil Nas X & Jack Harlow~Industry Baby~🇺🇸~Hip-Hop
2021~Manuel Carrasco~Salitre~🇪🇸~Pop
2021~Måneskin~Zitti e buoni~🇮🇹~Rock
2021~Måneskin~I Wanna Be Your Slave~🇮🇹~Rock
2021~Måneskin~Beggin'~🇮🇹~Rock
2021~Nina Chuba~Wildberry Lillet~🇩🇪~Pop/Hip-Hop
2021~Olivia Rodrigo~good 4 u~🇺🇸~Pop
2021~Pomme~Anxiété~🇫🇷~Pop
2021~Provinz~Bei mir~🇩🇪~Pop
2021~Rosalía~Saoko~🇪🇸~Pop
2021~S10~De diepte~🇳🇱~Pop
2021~Sanah~Etiuda~🇵🇱~Pop
2021~Stefania~Last Dance~🇬🇷~Pop
2021~The Black Mamba~Love Is On My Side~🇵🇹~Pop
2021~The Kid LAROI & Justin Bieber~STAY~🇦🇺~Pop
2021~Ufo361~Big Body Benz~🇩🇪~Hip-Hop
2021~Victoria~Growing Up Is Getting Old~🇧🇬~Pop
2021~WRS~Llámame~🇷🇴~Latin Pop
2022~AYLIVA~Sie weiß~🇩🇪~R&B
2022~Aitana~Las Babys~🇪🇸~Pop
2022~Andromache~Ela~🇨🇾~Pop
2022~Apache 207 & Udo Lindenberg~Komet~🇩🇪~Pop
2022~Aya Nakamura~Doudou~🇫🇷~Pop
2022~Azahriah~Mind1~🇭🇺~Pop/Hip-Hop
2022~Bad Bunny~Tití Me Preguntó~🇵🇷~Reggaeton
2022~Beyoncé~BREAK MY SOUL~🇺🇸~R&B
2022~Bizarrap & Quevedo~BZRP Music Sessions Vol. 52~🇦🇷~Reggaeton
2022~Dawid Podsiadło~Mori~🇵🇱~Pop
2022~Dermot Kennedy~Better Days~🇮🇪~Pop
2022~Doja Cat~Woman~🇺🇸~Pop
2022~Elodie~Bagno a mezzanotte~🇮🇹~Pop
2022~Em Beihold~Numb Little Bug~🇺🇸~Pop
2022~Future ft. Drake, Tems~WAIT FOR U~🇺🇸~Hip-Hop
2022~GAYLE~abcdefu~🇺🇸~Pop
2022~Harry Styles~As It Was~🇬🇧~Pop
2022~I.M.T. Smile~Sloboda~🇸🇰~Rock
2022~Joji~Glimpse Of Us~🇯🇵~Pop
2022~Kalush Orchestra~Stefania~🇺🇦~Hip-Hop/Folk
2022~Kate Bush~Running Up That Hill~🇬🇧~Pop
2022~LPS~Disko~🇸🇮~Pop
2022~Lizzo~About Damn Time~🇺🇸~Pop
2022~Loreen~Tattoo~🇸🇪~Pop
2022~Luciano~Beautiful Girl~🇩🇪~Hip-Hop
2022~Mahmood & Blanco~Brividi~🇮🇹~Pop
2022~Maro~Saudade, Saudade~🇵🇹~Pop
2022~Pizzera & Jaus~Eine ins Leben~🇦🇹~Pop
2022~Quevedo, Bizarrap~Quédate (BZRP Music Sessions #52)~🇪🇸~Reggaeton
2022~Rosalía~Despechá~🇪🇸~Pop
2022~Sam Smith & Kim Petras~Unholy~🇬🇧~Pop
2022~Sangiovanni~Farfalle~🇮🇹~Pop
2022~Stefan~Hope~🇪🇪~Pop
2022~Steve Lacy~Bad Habit~🇺🇸~R&B
2022~Stromae~L'enfer~🇧🇪~Pop
2022~Stromae~Fils de joie~🇧🇪~Pop
2022~Tananai~Sesso occasionale~🇮🇹~Pop
2022~Taylor Swift~Anti-Hero~🇺🇸~Pop
2022~Tiësto~The Business~🇳🇱~Electronic
2022~We Are Domi~Lights Off~🇨🇿~Electronic
2022~Yung Gravy~Betty (Get Money)~🇺🇸~Hip-Hop
2023~Annalisa~Mon amour~🇮🇹~Pop
2023~Ayliva & Mero~Du fehlst mir~🇩🇪~R&B
2023~Bad Bunny~Where She Goes~🇵🇷~Reggaeton
2023~Beéle ft. Ovy On The Drums~Loko~🇨🇴~Reggaeton
2023~Bilderbuch~Wahnsinn~🇦🇹~Indie
2023~Blanka~Solo~🇵🇱~Pop
2023~Cassö, RAYE, D-Block Europe~Prada~🇬🇧~Pop
2023~Cro & Apache 207~Tag & Nacht~🇩🇪~Hip-Hop
2023~David Kushner~Daylight~🇺🇸~Indie
2023~Doja Cat~Paint The Town Red~🇺🇸~Hip-Hop
2023~Dua Lipa~Dance The Night~🇬🇧~Pop
2023~Eslabón Armado & Peso Pluma~Ella Baila Sola~🇲🇽~Corrido
2023~Gazo & Tiakola~La Mélo~🇫🇷~Hip-Hop
2023~Gustaph~Because Of You~🇧🇪~Pop
2023~Jelly Roll~Need A Favor~🇺🇸~Country
2023~Joker Out~Carpe Diem~🇸🇮~Rock
2023~Jung Kook ft. Latto~Seven~🇰🇷~K-Pop
2023~Karol G & Shakira~TQG~🇨🇴~Reggaeton
2023~Lazza~Cenere~🇮🇹~Hip-Hop
2023~Let 3~Mama ŠČ!~🇭🇷~Rock
2023~Manuel~Húzom a vonalat~🇭🇺~Pop
2023~Manuel Turizo~La Bachata~🇨🇴~Bachata
2023~Marco Mengoni~Due vite~🇮🇹~Pop
2023~Mau P~Drugs From Amsterdam~🇳🇱~Electronic
2023~Metro Boomin, The Weeknd, 21 Savage~Creepin'~🇺🇸~Hip-Hop
2023~Miley Cyrus~Flowers~🇺🇸~Pop
2023~Mimicat~Ai Coração~🇵🇹~Pop
2023~Noah Kahan~Stick Season~🇺🇸~Folk
2023~OG Keemo~216~🇩🇪~Hip-Hop
2023~Olivia Rodrigo~vampire~🇺🇸~Pop
2023~Pashanim~Airwaves~🇩🇪~Hip-Hop
2023~Peso Pluma & Bizarrap~Sessions Vol. 55~🇲🇽~Corrido
2023~PinkPantheress & Ice Spice~Boy's A Liar Pt. 2~🇬🇧~Pop
2023~Quevedo~Columbia~🇪🇸~Reggaeton
2023~RAF Camora~Pyramide~🇦🇹~Hip-Hop
2023~Reiley~Breaking My Heart~🇫🇴~Pop
2023~Rema & Selena Gomez~Calm Down~🇳🇬~Afrobeats
2023~Ryan Gosling~I'm Just Ken~🇨🇦~Soundtrack
2023~SZA~Kill Bill~🇺🇸~R&B
2023~Sanah~Kolońska i Hashish~🇵🇱~Pop
2023~Schmyt & RIN~Bist du wach?~🇩🇪~Pop
2023~Shirin David~Bauch Beine Po~🇩🇪~Hip-Hop
2023~Stephen Sanchez~Until I Found You~🇺🇸~Pop
2023~Sudden Lights~Aijā~🇱🇻~Pop
2023~Taylor Swift~Cruel Summer~🇺🇸~Pop
2023~The Weeknd, JENNIE, Lily-Rose Depp~One Of The Girls~🇨🇦~Pop
2023~Theodor Andrei~D.G.T. (Off And On)~🇷🇴~Pop
2023~Yng Lvcas & Peso Pluma~La Bebe (Remix)~🇲🇽~Hip-Hop
2023~Zaho de Sagazan~La symphonie des éclairs~🇫🇷~Pop
2023~Zara Larsson~Can't Tame Her~🇸🇪~Pop
2024~01099~Tausend Tassen Kaffee~🇩🇪~Hip-Hop
2024~5miinust & Puuluup~(nendest) narkootikumidest ei tea me (küll) midagi~🇪🇪~Folk/Hip-Hop
2024~Aitana~Mariposas~🇪🇸~Pop
2024~Angelina Mango~La noia~🇮🇹~Pop
2024~Annalisa~Sinceramente~🇮🇹~Pop
2024~Artemas~i like the way you kiss me~🇬🇧~Pop
2024~Baby Lasagna~Rim Tim Tagi Dim~🇭🇷~Rock
2024~Benson Boone~Beautiful Things~🇺🇸~Pop
2024~Berq~Untot~🇩🇪~Pop
2024~Billie Eilish~Birds Of A Feather~🇺🇸~Pop
2024~Chappell Roan~Good Luck, Babe!~🇺🇸~Pop
2024~Charli XCX~360~🇬🇧~Pop
2024~Djo~End Of Beginning~🇺🇸~Indie
2024~Future, Metro Boomin, Kendrick Lamar~Like That~🇺🇸~Hip-Hop
2024~Geolier~I p' me, tu p' te~🇮🇹~Hip-Hop
2024~Gracie Abrams~Risk~🇺🇸~Pop
2024~Hozier~Too Sweet~🇮🇪~Indie
2024~Iolanda~Grito~🇵🇹~Pop
2024~Joost Klein~Europapa~🇳🇱~Pop
2024~Kaleen~We Will Rave~🇦🇹~Pop
2024~Karol G~Mi Ex Tenía Razón~🇨🇴~Reggaeton
2024~Kendrick Lamar~Not Like Us~🇺🇸~Hip-Hop
2024~Linkin Park~The Emptiness Machine~🇺🇸~Rock
2024~Lola Young~Messy~🇬🇧~Pop
2024~Luna~The Tower~🇵🇱~Pop
2024~Maja Francis~Falling~🇸🇪~Pop
2024~Marina Satti~Zari~🇬🇷~Pop
2024~Mustii~Before The Party's Over~🇧🇪~Pop
2024~Peso Pluma~La Patrulla~🇲🇽~Corrido
2024~Quevedo~WANDA~🇪🇸~Reggaeton
2024~ROSÉ & Bruno Mars~APT.~🇰🇷~K-Pop
2024~Raiven~Veronika~🇸🇮~Pop
2024~Saba & Tessa~Sand~🇩🇰~Pop
2024~Sabrina Carpenter~Espresso~🇺🇸~Pop
2024~Sabrina Carpenter~Please Please Please~🇺🇸~Pop
2024~Shaboozey~A Bar Song (Tipsy)~🇺🇸~Country
2024~Silvester Belt~Luktelk~🇱🇹~Pop
2024~Ski Aggu, Joost~Friesenjung~🇩🇪~Hip-Hop
2024~Ski Aggu, OG Keemo, Edin~Glühwein~🇩🇪~Hip-Hop
2024~Slimane~Mon amour~🇫🇷~Pop
2024~TALI~Fighter~🇱🇺~Pop
2024~Tate McRae~greedy~🇨🇦~Pop
2024~Taylor Swift ft. Post Malone~Fortnight~🇺🇸~Pop
2024~Teddy Swims~Lose Control~🇺🇸~R&B
2024~Tommy Richman~MILLION DOLLAR BABY~🇺🇸~R&B
2024~Windows95Man~No Rules!~🇫🇮~Electronic
`;

let _base: Song[] | null = null;
let _extra: Song[] = [];

function parseBase(): Song[] {
  const lines = PACKED.trim().split(/\r?\n/);
  const uris = SPOTIFY_URIS as Record<string, string>;
  return lines.map((line, i) => {
    const [year, artist, title, flag, genre] = line.split('~');
    const id = 'ow-' + String(i + 1).padStart(4, '0');
    return {
      id,
      year: Number(year),
      artist,
      title,
      flag,
      genre,
      qrPayload: spotifySearchUrl(artist, title),
      spotifyUri: uris[id],
    };
  });
}

/** Alle Songs (statische 1281er-Liste + ggf. zur Laufzeit zugeschaltete DB-Songs). */
export function getAllSongs(): Song[] {
  if (!_base) _base = parseBase();
  return _extra.length ? [..._base, ..._extra] : _base;
}

/**
 * Admin-/DB-Songs zuschalten (ergänzen die statische Liste). Wird von
 * OhrwurmGame beim Start aufgerufen, nachdem die ohrwurm_songs-Tabelle
 * (gefiltert nach Sprache) geladen wurde.
 */
export function setExtraSongs(songs: Song[]): void {
  _extra = songs;
}
