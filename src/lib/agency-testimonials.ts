/**
 * Per-language agency testimonials for the Agency Pricing page.
 * Native (not translated) — each language has its own agencies, names, cities,
 * quotes, metrics AND its own AI-generated portrait (Higgsfield soul_2, stored
 * in public/testimonials/<lang>-<idx>.webp). Pick via getTestimonials(i18n.language).
 */

export interface AgencyTestimonial {
  name: string;
  role: string;
  quote: string;
  metricValue: string;
  metricLabel: string;
  tierLabel: string;
  tierColor: string;
  /** Portrait URL (falls back to an initials avatar if missing). */
  image?: string;
}

export const TESTIMONIALS_BY_LANG: Record<string, AgencyTestimonial[]> = {
  "de": [
    {
      "name": "Lena Hofmann",
      "role": "Gründerin · Herzklopfen Events · Berlin",
      "quote": "Über den Marktplatz kommen Buchungsanfragen rein, während ich schlafe – ich muss keine Kaltakquise mehr für JGAs machen. Der KI-Eventplaner schlägt uns gezielt bei passenden Gruppen vor, und genau aus dieser Ecke kam unser stärkstes Quartal.",
      "metricValue": "+63%",
      "metricLabel": "mehr Buchungsanfragen",
      "tierLabel": "Professional",
      "tierColor": "from-purple-600 to-pink-600",
      "image": "/testimonials/de-0.webp"
    },
    {
      "name": "Tobias Brunner",
      "role": "Geschäftsführer · Alpenstreich Erlebnisse · Zürich",
      "quote": "Vorher lief alles über drei verschiedene Tools und endlose Excel-Listen, jetzt sind Kunden, Kalender, Team und Rechnungen an einem Ort. Allein bei der Abrechnung und Angebotserstellung spare ich jede Woche einen kompletten Arbeitstag.",
      "metricValue": "8 Std.",
      "metricLabel": "weniger Admin pro Woche",
      "tierLabel": "Enterprise",
      "tierColor": "from-amber-500 to-red-600",
      "image": "/testimonials/de-1.webp"
    },
    {
      "name": "Carolin Weiss",
      "role": "Eventmanagerin · Festfieber Wien · Wien",
      "quote": "Die Live-Screens auf unseren Partys sind ein echter Selbstläufer: Die Gäste scannen den Code, posten Fotos und plötzlich melden sich deren Freundinnen für die nächste Junggesellinnenfeier. So füllt sich unsere Pipeline ganz von selbst.",
      "metricValue": "4×",
      "metricLabel": "mehr Folgeanfragen pro Event",
      "tierLabel": "Professional",
      "tierColor": "from-pink-600 to-rose-500",
      "image": "/testimonials/de-2.webp"
    }
  ],
  "en": [
    {
      "name": "James Whitaker",
      "role": "Founder & Director · Last Hurrah Events · London",
      "quote": "Within two months of listing on the marketplace, the AI planner was recommending us to couples we'd never have reached through Instagram, and most of those enquiries actually converted into deposits. We've gone from chasing leads to picking the bookings that suit our calendar.",
      "metricValue": "47",
      "metricLabel": "New bookings via marketplace (90 days)",
      "tierLabel": "Professional",
      "tierColor": "from-purple-600 to-pink-600",
      "image": "/testimonials/en-0.webp"
    },
    {
      "name": "Aoife Brennan",
      "role": "Operations Manager · Emerald Group Events · Dublin",
      "quote": "We binned three separate tools the week we switched over: client records, the shared calendar and our invoicing all live in one place now. My team spends afternoons running events instead of reconciling spreadsheets.",
      "metricValue": "−60%",
      "metricLabel": "Time spent on admin per week",
      "tierLabel": "Enterprise",
      "tierColor": "from-amber-500 to-red-600",
      "image": "/testimonials/en-1.webp"
    },
    {
      "name": "Marcus Donovan",
      "role": "Co-owner · Five Boroughs Bash Co. · New York",
      "quote": "The live TV screens at our parties turned guests into our best salespeople, with people scanning the QR straight from the dance floor to book their own do. Every event now seeds the next two or three.",
      "metricValue": "3×",
      "metricLabel": "Referral leads per event",
      "tierLabel": "Professional",
      "tierColor": "from-pink-600 to-rose-500",
      "image": "/testimonials/en-2.webp"
    }
  ],
  "es": [
    {
      "name": "Lucía Fernández Aramburu",
      "role": "Fundadora · Despedidas Salseras · Madrid",
      "quote": "Estábamos en la quinta página de Google y nadie nos encontraba; desde que publicamos nuestros packs en el marketplace y el planificador con IA empezó a recomendarnos, recibimos reservas de despedidas casi todas las semanas sin gastar un euro en anuncios.",
      "metricValue": "47",
      "metricLabel": "reservas en el primer trimestre",
      "tierLabel": "Professional",
      "tierColor": "from-purple-600 to-pink-600",
      "image": "/testimonials/es-0.webp"
    },
    {
      "name": "Diego Carrasco Montero",
      "role": "Director de operaciones · Vértigo Eventos Grupales · Valencia",
      "quote": "Antes saltaba entre tres hojas de cálculo, WhatsApp y un programa de facturas que odiaba; ahora tengo clientes, calendario, equipo y cobros en un mismo sitio y dedico la mañana del lunes a vender en lugar de a cuadrar números.",
      "metricValue": "−60%",
      "metricLabel": "horas de gestión administrativa",
      "tierLabel": "Enterprise",
      "tierColor": "from-amber-500 to-red-600",
      "image": "/testimonials/es-1.webp"
    },
    {
      "name": "Valeria Domínguez Olvera",
      "role": "Responsable de marketing · Fiesta Bravo Producciones · Ciudad de México",
      "quote": "Pusimos las pantallas en vivo en una despedida y los invitados empezaron a escanear el código para pedir su propio evento; ese fin de semana entraron contactos nuevos sin que moviéramos un dedo y varios ya se convirtieron en presupuesto.",
      "metricValue": "3×",
      "metricLabel": "leads por evento celebrado",
      "tierLabel": "Professional",
      "tierColor": "from-pink-600 to-rose-500",
      "image": "/testimonials/es-2.webp"
    }
  ],
  "fr": [
    {
      "name": "Camille Lefèvre",
      "role": "Fondatrice · Les Garçons d'Honneur · Lyon",
      "quote": "Depuis qu'on figure sur la marketplace et que le planificateur IA nous recommande, on reçoit des demandes pour des EVG qu'on n'aurait jamais touchées en démarchant à la main. La saison s'est remplie deux mois plus tôt que d'habitude.",
      "metricValue": "+38%",
      "metricLabel": "réservations en haute saison",
      "tierLabel": "Professional",
      "tierColor": "from-purple-600 to-pink-600",
      "image": "/testimonials/fr-0.webp"
    },
    {
      "name": "Thomas Mercier",
      "role": "Directeur des opérations · Atelier Festif · Bordeaux",
      "quote": "On jonglait entre un tableur clients, un agenda partagé et un logiciel de facturation qui ne se parlaient pas. Tout est désormais centralisé, et je passe deux fois moins de temps sur l'administratif chaque semaine.",
      "metricValue": "−50%",
      "metricLabel": "temps passé sur l'administratif",
      "tierLabel": "Enterprise",
      "tierColor": "from-amber-500 to-red-600",
      "image": "/testimonials/fr-1.webp"
    },
    {
      "name": "Inès Marchand",
      "role": "Responsable événementiel · Confettis & Cie · Marseille",
      "quote": "Les écrans diffusés pendant nos enterrements de vie de jeune fille déclenchent un vrai bouche-à-oreille : les invitées scannent et nous contactent pour leur propre événement. On a signé onze nouveaux groupes rien qu'avec ces leads ce trimestre.",
      "metricValue": "11",
      "metricLabel": "nouveaux groupes via les écrans",
      "tierLabel": "Professional",
      "tierColor": "from-pink-600 to-rose-500",
      "image": "/testimonials/fr-2.webp"
    }
  ],
  "it": [
    {
      "name": "Giulia Bertani",
      "role": "Fondatrice · Festa & Co. Eventi · Milano",
      "quote": "Da quando siamo sul marketplace riceviamo richieste mirate per addii al nubilato senza dover più rincorrere i clienti su Instagram. Il pianificatore AI ci propone in automatico quando una comitiva cerca un pacchetto a Milano, e abbiamo riempito quasi tutti i weekend da maggio a settembre.",
      "metricValue": "+38%",
      "metricLabel": "prenotazioni a stagione",
      "tierLabel": "Professional",
      "tierColor": "from-purple-600 to-pink-600",
      "image": "/testimonials/it-0.webp"
    },
    {
      "name": "Lorenzo Marchetti",
      "role": "Titolare · Eventi Capitale · Roma",
      "quote": "Prima gestivo clienti, calendario e fatture su tre strumenti diversi e un'agenda cartacea. Ora ho tutto in un posto solo e dedico al lavoro amministrativo meno della metà del tempo, così posso seguire più gruppi senza assumere altre persone.",
      "metricValue": "−55%",
      "metricLabel": "tempo su gestione e fatture",
      "tierLabel": "Enterprise",
      "tierColor": "from-amber-500 to-red-600",
      "image": "/testimonials/it-1.webp"
    },
    {
      "name": "Federica Esposito",
      "role": "Event Manager · Bellavita Party Planner · Napoli",
      "quote": "Gli schermi live durante le serate sono diventati la nostra arma migliore: gli invitati vedono foto e contenuti in tempo reale e tanti ci scrivono già la sera stessa per organizzare il loro evento. In sei mesi abbiamo raccolto decine di nuovi contatti senza spendere un euro in pubblicità.",
      "metricValue": "47",
      "metricLabel": "nuovi contatti dagli schermi live",
      "tierLabel": "Professional",
      "tierColor": "from-pink-600 to-rose-500",
      "image": "/testimonials/it-2.webp"
    }
  ],
  "nl": [
    {
      "name": "Sanne Bakker",
      "role": "Oprichter · Vrijgezellenfeest Amsterdam · Amsterdam",
      "quote": "Sinds we op de marktplaats staan en de AI-planner ons automatisch aanraadt, komen er boekingen binnen terwijl ik slaap. Vorige zomer hadden we drie weekenden op rij volgeboekt zonder dat ik één advertentie hoefde te plaatsen.",
      "metricValue": "+62%",
      "metricLabel": "meer boekingen",
      "tierLabel": "Professional",
      "tierColor": "from-purple-600 to-pink-600",
      "image": "/testimonials/nl-0.webp"
    },
    {
      "name": "Thomas Vermeulen",
      "role": "Operationeel manager · De Feestfabriek · Rotterdam",
      "quote": "We jongleerden vroeger met drie losse tools voor klanten, agenda en facturen; nu zit alles in EventBliss en mijn team weet altijd wie wat doet. De administratie die me elke vrijdag een halve dag kostte, is teruggebracht tot een uurtje.",
      "metricValue": "−70%",
      "metricLabel": "minder administratietijd",
      "tierLabel": "Enterprise",
      "tierColor": "from-amber-500 to-red-600",
      "image": "/testimonials/nl-1.webp"
    },
    {
      "name": "Lotte Janssens",
      "role": "Creatief directeur · Hooray Events · Antwerpen",
      "quote": "De live TV-schermen op onze evenementen zijn een verrassend sterke leadmachine: gasten scannen de code en boeken zelf hun eigen feest. Eén groepsweekend leverde ons via die schermen elf nieuwe aanvragen op.",
      "metricValue": "11",
      "metricLabel": "nieuwe leads per event",
      "tierLabel": "Professional",
      "tierColor": "from-pink-600 to-rose-500",
      "image": "/testimonials/nl-2.webp"
    }
  ],
  "pt": [
    {
      "name": "Mariana Albuquerque",
      "role": "Fundadora · Lisbon Despedidas & Co. · Lisboa",
      "quote": "O planeador com IA recomenda-nos a casais que nem sabiam que existíamos, e já vêm com o programa quase fechado. Passámos de esperar pelo passa-palavra para ter a agenda cheia de despedidas de solteira sem gastar um euro em anúncios.",
      "metricValue": "+62%",
      "metricLabel": "Reservas via marketplace",
      "tierLabel": "Professional",
      "tierColor": "from-purple-600 to-pink-600",
      "image": "/testimonials/pt-0.webp"
    },
    {
      "name": "Rui Cavaco",
      "role": "Diretor de Operações · Invicta Group Events · Porto",
      "quote": "Antes tínhamos os clientes no Excel, a faturação noutro sítio e a equipa a perguntar quem fazia o quê. Agora está tudo num só lugar e fechamos o mês em metade do tempo, com a equipa toda a ver o mesmo calendário.",
      "metricValue": "−55%",
      "metricLabel": "Tempo em tarefas administrativas",
      "tierLabel": "Enterprise",
      "tierColor": "from-amber-500 to-red-600",
      "image": "/testimonials/pt-1.webp"
    },
    {
      "name": "Camila Nogueira",
      "role": "Sócia-gerente · Folia Eventos Coletivos · São Paulo",
      "quote": "Os telões ao vivo nas festas viraram nossa melhor propaganda: os convidados veem o nome da agência na tela e já saem pedindo orçamento para o próprio grupo. Numa única despedida saíram oito contatos novos sem a gente fazer nada.",
      "metricValue": "8×",
      "metricLabel": "Leads por evento",
      "tierLabel": "Professional",
      "tierColor": "from-pink-600 to-rose-500",
      "image": "/testimonials/pt-2.webp"
    }
  ],
  "pl": [
    {
      "name": "Katarzyna Wiśniewska",
      "role": "Założycielka · Panieński Atelier · Warszawa",
      "quote": "Od kiedy nasze pakiety wieczorów panieńskich są w marketplace, klientki same do nas trafiają i rezerwują online bez jednej wymiany maili. Asystent AI poleca nas dokładnie tym grupom, których szukamy, więc nie tracimy czasu na zapytania, które i tak donikąd nie prowadzą.",
      "metricValue": "+40%",
      "metricLabel": "więcej rezerwacji online",
      "tierLabel": "Professional",
      "tierColor": "from-purple-600 to-pink-600",
      "image": "/testimonials/pl-0.webp"
    },
    {
      "name": "Tomasz Kowalczyk",
      "role": "Współwłaściciel · Last Night Events · Kraków",
      "quote": "Wreszcie mam klientów, kalendarz, zespół i fakturowanie w jednym miejscu, a nie w pięciu arkuszach i trzech komunikatorach. Obsługa jednej imprezy zajmuje mi dziś ułamek czasu i nic już nie ginie między ekipą a klientem.",
      "metricValue": "−60%",
      "metricLabel": "mniej pracy administracyjnej",
      "tierLabel": "Enterprise",
      "tierColor": "from-amber-500 to-red-600",
      "image": "/testimonials/pl-1.webp"
    },
    {
      "name": "Magdalena Lewandowska",
      "role": "Dyrektorka kreatywna · Grupa Eventowa Brzask · Wrocław",
      "quote": "Ekrany na żywo podczas imprez okazały się naszym najlepszym handlowcem — goście widzą zdjęcia z eventu, skanują kod i już pytają o własną rezerwację. Z jednego wieczoru kawalerskiego potrafimy wyciągnąć kilkanaście nowych zapytań, zupełnie bez budżetu reklamowego.",
      "metricValue": "3×",
      "metricLabel": "więcej leadów z eventu",
      "tierLabel": "Professional",
      "tierColor": "from-pink-600 to-rose-500",
      "image": "/testimonials/pl-2.webp"
    }
  ],
  "tr": [
    {
      "name": "Selin Aydın",
      "role": "Kurucu Ortak · Bohem Bekarlığa Veda · İstanbul",
      "quote": "Hizmetlerimizi pazar yerine ekledikten sonra İstanbul dışından gelen rezervasyonlar ciddi şekilde arttı; eskiden Instagram DM'lerinde kaybolan talepler artık doğrudan takvime düşüyor. AI etkinlik planlayıcının bizi otomatik önermesi, hiç reklam vermeden yeni müşteri kazandırdı.",
      "metricValue": "+63%",
      "metricLabel": "yeni rezervasyon",
      "tierLabel": "Professional",
      "tierColor": "from-purple-600 to-pink-600",
      "image": "/testimonials/tr-0.webp"
    },
    {
      "name": "Burak Çetinkaya",
      "role": "Operasyon Müdürü · Antalya Grup Etkinlikleri · Antalya",
      "quote": "Üç ayrı program, bir Excel ve sürekli WhatsApp yerine artık müşteri, takvim, faturalandırma ve ekip tek yerde; sezon yoğunluğunda bile hiçbir grup birbirine karışmıyor. Teklif hazırlama ve fatura kesme süremiz neredeyse yarıya indi.",
      "metricValue": "−55%",
      "metricLabel": "idari iş yükü",
      "tierLabel": "Enterprise",
      "tierColor": "from-amber-500 to-red-600",
      "image": "/testimonials/tr-1.webp"
    },
    {
      "name": "Elif Yıldırım",
      "role": "Yaratıcı Direktör · Ege Kutlama Atölyesi · İzmir",
      "quote": "Etkinliklerde kurduğumuz canlı TV ekranları, konukların paylaştığı anları akışa taşıyor ve oradaki misafirler etkinlik biter bitmez bize ulaşıyor; düğün öncesi bir partiden tek gecede üç yeni grup talebi geldi. Pazarlama bütçemize dokunmadan en güçlü reklam kanalımız oldu.",
      "metricValue": "4×",
      "metricLabel": "etkinlik başına lead",
      "tierLabel": "Professional",
      "tierColor": "from-pink-600 to-rose-500",
      "image": "/testimonials/tr-2.webp"
    }
  ],
  "ar": [
    {
      "name": "ليلى الفهري",
      "role": "مديرة الحجوزات · وكالة لمسة فرح للمناسبات · دبي",
      "quote": "ظهرنا في سوق المنصة وبدأ مخطّط الذكاء الاصطناعي يرشّحنا تلقائياً لحفلات توديع العزوبية، فصارت الحجوزات تأتينا ونحن نائمون بدل أن نطارد العملاء على إنستغرام.",
      "metricValue": "+63%",
      "metricLabel": "زيادة في الحجوزات الشهرية",
      "tierLabel": "Professional",
      "tierColor": "from-purple-600 to-pink-600",
      "image": "/testimonials/ar-0.webp"
    },
    {
      "name": "كريم منصور",
      "role": "الشريك المؤسس · ستوديو ليالي بيروت لتنظيم الفعاليات · بيروت",
      "quote": "استبدلنا ثلاثة برامج متفرقة للعملاء والتقويم والفوترة بمنصة واحدة، فاختصرنا العمل الإداري من يومين كاملين إلى ساعتين أسبوعياً وصار الفريق يركّز على التنظيم لا على جداول إكسل.",
      "metricValue": "−75%",
      "metricLabel": "تقليص الوقت الإداري",
      "tierLabel": "Enterprise",
      "tierColor": "from-amber-500 to-red-600",
      "image": "/testimonials/ar-1.webp"
    },
    {
      "name": "نورة القحطاني",
      "role": "مديرة التسويق · وكالة بصمة احتفال · الرياض",
      "quote": "وضعنا الشاشات الحية في حفلات المجموعات فصار الضيوف يمسحون الرمز ويحجزون مناسباتهم القادمة في اللحظة نفسها، وتحوّلت كل حفلة إلى مصدر عملاء جدد دون أي إنفاق إعلاني.",
      "metricValue": "4×",
      "metricLabel": "مضاعفة العملاء المحتملين لكل فعالية",
      "tierLabel": "Professional",
      "tierColor": "from-pink-600 to-rose-500",
      "image": "/testimonials/ar-2.webp"
    }
  ]
};

export function getTestimonials(lang: string | undefined): AgencyTestimonial[] {
  const base = (lang || "en").split("-")[0].toLowerCase();
  return TESTIMONIALS_BY_LANG[base] ?? TESTIMONIALS_BY_LANG.en;
}
