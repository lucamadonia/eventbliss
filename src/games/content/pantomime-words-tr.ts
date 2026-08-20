/**
 * OHNE WORTE — Begriffe auf Türkisch.
 *
 * Das ist eine ANPASSUNG der deutschen Vorlage, keine Übersetzung. Die
 * Kategorie-IDs bleiben deutsch (sie sind Schlüssel), der Inhalt richtet sich
 * nach dem türkischen Sprachraum.
 *
 * Auswahlkriterium bleibt: Jeder Begriff muss sich OHNE Ton und OHNE Requisit
 * darstellen lassen. Bevorzugt sind Dinge mit typischer BEWEGUNG, typischer
 * FORM oder typischer SZENE.
 *
 * Zwei Kategorien sind bewusst NICHT übersetzt, sondern ersetzt:
 * - `sprichwoerter`: hier stehen gängige türkische Redewendungen („Pireyi deve
 *   yapmak"). Wörtlich übersetzte deutsche Redewendungen wären im Spiel
 *   unratbar.
 * - `filme`: Filmtitel in der ortsüblichen Fassung; Titel ohne Bekanntheit im
 *   Zielland (z. B. „Tatort") sind durch dort geläufige Filme und Serien
 *   ersetzt.
 */

import type { PantomimeCategory } from './pantomime-words-de';

export const PANTOMIME_CATEGORIES_TR: PantomimeCategory[] = [
  {
    id: 'tiere',
    name: 'Hayvanlar',
    emoji: '🐘',
    words: [
      'Fil', 'Zürafa', 'Penguen', 'Kanguru', 'Yılan',
      'Kartal', 'Kurbağa', 'Timsah', 'Maymun', 'Aslan',
      'Arı', 'Kelebek', 'Örümcek', 'Yengeç', 'Köpekbalığı',
      'Balina', 'Yunus', 'Kirpi', 'Baykuş', 'Leylek',
      'Tavus kuşu', 'Tembel hayvan', 'Mirket', 'Deve', 'Gergedan',
      'Flamingo', 'Kaplumbağa', 'Yarasa', 'Köstebek', 'Istakoz',
      'Denizanası', 'Denizatı', 'Rakun', 'Sincap', 'Sinekkuşu',
      'Devekuşu', 'Goril', 'Kurt', 'Tilki', 'Tavşan',
      'İnek', 'Domuz', 'Tavuk', 'At', 'Kedi',
      'Köpek', 'Ördek', 'Keçi', 'Koyun', 'Fare',
    ],
  },
  {
    id: 'berufe',
    name: 'Meslekler',
    emoji: '👷',
    words: [
      'İtfaiyeci', 'Aşçı', 'Diş hekimi', 'Pilot', 'Kuaför',
      'Polis', 'Öğretmen', 'İnşaat işçisi', 'Garson', 'Bahçıvan',
      'Fotoğrafçı', 'Orkestra şefi', 'Palyaço', 'Astronot', 'Dalgıç',
      'Fırıncı', 'Kasap', 'Ressam', 'Kaynakçı', 'Postacı',
      'Çöpçü', 'Otobüs şoförü', 'Hakim', 'Avukat', 'Cerrah',
      'Hemşire', 'Veteriner', 'Kütüphaneci', 'Kasiyer', 'Barmen',
      'DJ', 'Oyuncu', 'Futbol antrenörü', 'Maç hakemi', 'Dağ rehberi',
      'Arıcı', 'Çoban', 'Balıkçı', 'Çiftçi', 'Tamirci',
      'Elektrikçi', 'Tesisatçı', 'Çatı ustası', 'Baca temizleyicisi', 'Sekreter',
      'Manken', 'Dublör', 'Sihirbaz', 'Pazarcı', 'Kapıcı',
    ],
  },
  {
    id: 'filme',
    name: 'Filmler ve diziler',
    emoji: '🎬',
    words: [
      'Titanik', 'Baba', 'Yıldız Savaşları', 'Jurassic Park', 'Aslan Kral',
      'Rocky', 'Terminatör', 'Matrix', 'Karayip Korsanları', 'Yüzüklerin Efendisi',
      'Harry Potter', 'E.T.', 'Jaws', 'Hayalet Avcıları', 'Geleceğe Dönüş',
      'Forrest Gump', 'Dirty Dancing', 'Pretty Woman', 'Esaretin Bedeli', 'Görevimiz Tehlike',
      'James Bond', 'Indiana Jones', 'Oz Büyücüsü', 'Mary Poppins', 'Karlar Ülkesi',
      'Kayıp Balık Nemo', 'Shrek', 'Buz Devri', 'Oyuncak Hikayesi', 'Orman Kitabı',
      'Alaaddin', 'Sindirella', 'Bambi', 'Dumbo', 'Kung Fu Panda',
      'Simpsonlar', 'Taht Oyunları', 'Breaking Bad', 'Stranger Things', 'Friends',
      'Sherlock', 'Sahil Güvenlik', 'Kurtlar Vadisi', 'Çukur', 'Squid Game',
      'La Casa de Papel', 'Yerçekimi', 'Marslı', 'Avatar', 'Şeytan',
    ],
  },
  {
    id: 'alltag',
    name: 'Günlük hayat',
    emoji: '🪥',
    words: [
      'Diş fırçalamak', 'Kahve yapmak', 'Çamaşır asmak', 'Elektrik süpürgesi çekmek', 'Cam silmek',
      'Ayakkabı bağlamak', 'Şemsiye açmak', 'Araba yıkamak', 'Çim biçmek', 'Çöp çıkarmak',
      'Yatak toplamak', 'Bulaşık yıkamak', 'Ütü yapmak', 'Saç kurutmak', 'Tırnak kesmek',
      'Ekmeğe reçel sürmek', 'Yumurta kırmak', 'Makarna süzmek', 'Pizza siparişi vermek', 'Alışveriş arabası itmek',
      'Sırada beklemek', 'Otobüsü kaçırmak', 'Bisiklet lastiği yamamak', 'Lastik değiştirmek', 'Raf kurmak',
      'Çivi çakmak', 'Ampul değiştirmek', 'Kargo paketi açmak', 'Hediye paketlemek', 'Mektup postalamak',
      'Anahtar aramak', 'Telefon şarj etmek', 'Selfie çekmek', 'Kanal değiştirmek', 'Alarmı kapatmak',
      'Uyuyakalmak', 'Bavul hazırlamak', 'Çadır kurmak', 'Mangal yapmak', 'Kardan adam yapmak',
      'Çiçek sulamak', 'Köpek gezdirmek', 'Bebeğin bezini değiştirmek', 'Diş ipi kullanmak', 'Hapşırmak',
      'Esnemek', 'Hıçkırık tutmak', 'Sakız çiğnemek', 'Asansör beklemek', 'Yolunu kaybetmek',
    ],
  },
  {
    id: 'sport',
    name: 'Spor',
    emoji: '⚽',
    words: [
      'Futbol', 'Basketbol', 'Tenis', 'Golf', 'Boks',
      'Yüzme', 'Dalış', 'Kayak', 'Snowboard', 'Buz pateni',
      'Jimnastik', 'Yüksek atlama', 'Uzun atlama', 'Sırıkla atlama', 'Cirit atma',
      'Gülle atma', 'Engelli koşu', 'Maraton', 'Bisiklet', 'Kürek',
      'Yelken', 'Sörf', 'Tırmanış', 'Dağcılık', 'Binicilik',
      'Okçuluk', 'Eskrim', 'Judo', 'Karate', 'Güreş',
      'Halter', 'Masa tenisi', 'Badminton', 'Voleybol', 'Hentbol',
      'Hokey', 'Buz hokeyi', 'Ragbi', 'Beyzbol', 'Kriket',
      'Bowling', 'Dart', 'Bilardo', 'Kaykay', 'Paten kaymak',
      'Trambolinde zıplamak', 'Yoga', 'İp atlama', 'Balık tutmak', 'Formula 1',
    ],
  },
  {
    id: 'gefuehle',
    name: 'Duygular',
    emoji: '😤',
    words: [
      'Öfke', 'Sevinç', 'Korku', 'Üzüntü', 'İğrenme',
      'Şaşkınlık', 'Can sıkıntısı', 'Gerginlik', 'Gurur', 'Utanç',
      'Kıskançlık', 'Haset', 'Aşık olmak', 'Sıla hasreti', 'Yorgunluk',
      'Bitkinlik', 'Panik', 'Rahatlama', 'Hayal kırıklığı', 'Mahcubiyet',
      'Oh olsun demek', 'Özlem', 'Memnuniyet', 'Sabırsızlık', 'Güvensizlik',
      'Merak', 'Coşku', 'Hüsran', 'Şok', 'Huşu',
      'Minnettarlık', 'Umut', 'Çaresizlik', 'Sakinlik', 'Telaş',
      'İnatçılık', 'Acıma', 'Hayranlık', 'Kafa karışıklığı', 'Şüphecilik',
      'Sinirlenmek', 'Çekingenlik', 'Cesaret', 'Korkaklık', 'Pişmanlık',
      'Zafer sevinci', 'Yalnızlık', 'Huzur', 'Gezme isteği', 'Dört gözle beklemek',
    ],
  },
  {
    id: 'sprichwoerter',
    name: 'Deyimler',
    emoji: '💬',
    words: [
      'Pireyi deve yapmak', 'Etekleri zil çalmak', 'Havlu atmak', 'Bir taşla iki kuş vurmak', 'Buzları eritmek',
      'Kafayı kuma gömmek', 'Ateşe körükle gitmek', 'Göz yummak', 'Ağzından baklayı çıkarmak', 'Kolları sıvamak',
      'Ağzı açık kalmak', 'Burun kıvırmak', 'Kulak kabartmak', 'Ağzı kulaklarına varmak', 'Eli ayağına dolaşmak',
      'Dokuz doğurmak', 'İpe un sermek', 'Balık kavağa çıkınca', 'Armut piş ağzıma düş', 'Kaş yapayım derken göz çıkarmak',
      'Bindiği dalı kesmek', 'Ayağını yorganına göre uzatmak', 'Burnu havada olmak', 'Elini taşın altına koymak', 'Pabucu dama atılmak',
      'Damlaya damlaya göl olur', 'Ateş olmayan yerden duman çıkmaz', 'Sütten ağzı yanan yoğurdu üfleyerek yer', 'Ayağını denk almak', 'Kulağına küpe olmak',
      'Çam devirmek', 'Baltayı taşa vurmak', 'Küplere binmek', 'Etekleri tutuşmak', 'Saçını başını yolmak',
      'Burnundan solumak', 'Ağız dolusu gülmek', 'Eli kolu bağlı kalmak', 'İki ayağını bir pabuca sokmak', 'Yüreği ağzına gelmek',
      'Gözleri fal taşı gibi açılmak', 'Diken üstünde oturmak', 'Ayvayı yemek', 'Turnayı gözünden vurmak', 'İğneyi kendine çuvaldızı başkasına batırmak',
      'Tereyağından kıl çeker gibi', 'Nalları dikmek', 'Kulağını çekmek', 'Parmak ısırmak', 'El üstünde tutmak',
    ],
  },
  {
    id: 'maerchen',
    name: 'Masallar ve karakterler',
    emoji: '🧚',
    words: [
      'Kırmızı Başlıklı Kız', 'Pamuk Prenses', 'Külkedisi', 'Uyuyan Güzel', 'Rapunzel',
      'Hansel ve Gretel', 'Kurbağa Prens', 'Rumpelstiltskin', 'Bremen Mızıkacıları', 'Çizmeli Kedi',
      'Pinokyo', 'Peter Pan', 'Alice Harikalar Diyarında', 'Robin Hood', 'Kral Arthur',
      'Herkül', 'Zeus', 'Poseidon', 'Medusa', 'İkarus',
      'Frankenstein', 'Drakula', 'Noel Baba', 'Paskalya Tavşanı', 'Diş Perisi',
      'Bir tek boynuzlu at', 'Bir ejderha', 'Bir cüce', 'Bir dev', 'Bir cadı',
      'Bir büyücü', 'Bir şövalye', 'Bir korsan', 'Bir deniz kızı', 'Bir vampir',
      'Bir kurt adam', 'Bir zombi', 'Bir hayalet', 'Bir robot', 'Bir uzaylı',
      'Süpermen', 'Batman', 'Örümcek Adam', 'Hulk', 'Wonder Woman',
      'Yoda', 'Gollum', 'Denizci Sinbad', 'Nasreddin Hoca', 'Keloğlan',
    ],
  },
  {
    id: 'ab18',
    name: '18+',
    emoji: '🔥',
    adult: true,
    words: [
      'Striptiz', 'Fransız öpücüğü', 'Kör randevu', 'Prezervatif', 'İç çamaşırı',
      'Direk dansı', 'Göbek dansı', 'Kucak dansı', 'Kelepçe', 'Kamasutra',
      'Bekarlığa veda partisi', 'Tinder buluşması', 'Muhabbet açma cümlesi', 'Ret cevabı almak', 'Flört etmek',
      'Aşk ısırığı', 'Aşk mektubu', 'Kalp çarpıntısı', 'Baştan çıkarma', 'Gözlerini kapatmak',
      'Masaj', 'Köpüklü banyo', 'Gül yaprakları', 'Mum ışığı', 'Gerdek gecesi',
      'Balayı', 'Hamilelik testi', 'İlişki kavgası', 'Kıskançlık krizi', 'Ayrılık',
      'Eski sevgili', 'Aldatma', 'Utanç verici fotoğraf', 'İtiraf', 'Yalan makinesi',
      'Votka shotu', 'Sabah akşamdan kalmalık', 'Sarhoş dans etmek', 'Gece üçte karaoke', 'Bira göbeği',
      'Çıplak yüzmek', 'Nudist plaj', 'Sauna', 'Dövme yaptırmak', 'Piercing',
      'Karın kaslarını göstermek', 'Pazı göstermek', 'Aynada kendini beğenmek', 'Gece gizlice eve girmek', 'Hesabı bölüşmek',
    ],
  },
];
