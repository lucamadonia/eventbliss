/**
 * Die drei Stufen auf der Agentur-Demoseite — in allen zehn Sprachen.
 *
 * Stufe 1 ist das, was der Pilot heute bietet: Profil und Anfrage. Stufe 2 und
 * 3 zeigen, wohin es gehen kann — buchbare Leistungen und eine Empfehlung im
 * Planungsmoment.
 *
 * ZWEI HARTE REGELN, die den Ton dieser Texte bestimmen:
 *
 * 1. AUSBLICK, KEIN VERSPRECHEN. Stufe 2 und 3 tragen ausdruecklich "spaeter
 *    moeglich" und enden mit dem Satz, dass nichts davon Voraussetzung fuer den
 *    Piloten ist. Kein Termin, keine Zusage. Die Technik existiert zwar bereits
 *    (marketplace_services, useContextualServices), aber eine Agentur soll aus
 *    dieser Seite keinen Anspruch ableiten koennen.
 *
 * 2. KEINE ZAHLEN VON UNS. Keine Provision, kein Preis, keine Laufzeit. Der
 *    einzige Betrag auf den Beispielkarten ist ein Preis DER AGENTUR fuer eine
 *    erfundene Leistung — sichtbar als Beispiel gekennzeichnet, damit ihn
 *    niemand fuer eine Aussage ueber Konditionen haelt.
 *
 * Getrennt von agency-demo-copy.ts, damit beide Dateien lesbar bleiben; die
 * Sprachregel ist dieselbe (vollstaendiges Record, Rueckfall auf Englisch).
 */
import type { SeoLang } from "@/lib/seo-routes";

export interface StageCopy {
  sectionTitle: string;
  sectionLead: string;
  nowBadge: string;
  laterBadge: string;
  stage1Title: string;
  stage1Body: string;
  stage2Title: string;
  stage2Body: string;
  stage3Title: string;
  stage3Body: string;
  /** Beschriftungen der erfundenen Beispielkarten. */
  exampleTag: string;
  serviceTitle: string;
  servicePrice: string;
  availabilityLabel: string;
  bookButton: string;
  aiPrompt: string;
  aiAnswer: string;
  recommendedLabel: string;
  /** Der Satz, der den Ausblick vom Versprechen trennt. */
  noCondition: string;
}

const de: StageCopy = {
  sectionTitle: "Wie es weitergehen kann",
  sectionLead:
    "Der Pilot beginnt beim Profil und der Anfrage. Was daraus werden kann, seht ihr hier — damit ihr wisst, worauf ihr euch einlasst.",
  nowBadge: "Jetzt",
  laterBadge: "Später möglich",
  stage1Title: "Profil und Anfrage",
  stage1Body:
    "Ihr steht unter eurer Stadt, die Gruppe schreibt euch an, alles Weitere läuft direkt zwischen euch.",
  stage2Title: "Leistungen direkt buchbar",
  stage2Body:
    "Statt nur anzufragen, bucht die Gruppe eine eurer Leistungen in der App und bezahlt dort. Das Geld geht an euch, und eure Leistung erscheint automatisch in allen zehn Sprachen.",
  stage3Title: "Empfehlung im Planungsmoment",
  stage3Body:
    "Die Gruppe fragt nach einem Programm für Samstagnachmittag — und eure Leistung steht direkt unter der Antwort. Keine Werbung, sondern die Antwort auf das, was gerade geplant wird.",
  exampleTag: "Beispiel",
  serviceTitle: "Stadtrallye durch die Altstadt",
  servicePrice: "39 € p. P.",
  availabilityLabel: "Sa 12.09. frei",
  bookButton: "Buchen",
  aiPrompt: "Was können wir Samstagnachmittag mit 11 Leuten machen?",
  aiAnswer:
    "Nachmittags passt etwas mit Bewegung draußen, danach bleibt Zeit fürs Abendessen. Hier zwei Vorschläge aus eurer Stadt:",
  recommendedLabel: "Passt zu eurem Plan",
  noCondition: "Ohne Bedingung und ohne Termin — nichts davon ist Voraussetzung für den Piloten.",
};

const en: StageCopy = {
  sectionTitle: "Where this can go",
  sectionLead:
    "The pilot starts with the profile and the request. What it can grow into is shown here — so you know what you are signing up to.",
  nowBadge: "Now",
  laterBadge: "Possible later",
  stage1Title: "Profile and request",
  stage1Body:
    "You are listed under your city, the group writes to you, everything after that runs directly between you.",
  stage2Title: "Services bookable directly",
  stage2Body:
    "Instead of only asking, the group books one of your services in the app and pays there. The money goes to you, and your service appears automatically in all ten languages.",
  stage3Title: "A recommendation while they plan",
  stage3Body:
    "The group asks what to do on Saturday afternoon — and your service sits right under the answer. Not an ad, but the answer to what is being planned at that moment.",
  exampleTag: "Example",
  serviceTitle: "City rally through the old town",
  servicePrice: "€39 pp",
  availabilityLabel: "Sat 12 Sep free",
  bookButton: "Book",
  aiPrompt: "What can 11 of us do on Saturday afternoon?",
  aiAnswer:
    "The afternoon suits something active outdoors, which still leaves time for dinner. Two suggestions from your city:",
  recommendedLabel: "Fits your plan",
  noCondition: "No conditions and no dates — none of this is a requirement for the pilot.",
};

const es: StageCopy = {
  sectionTitle: "Hacia dónde puede ir esto",
  sectionLead:
    "El piloto empieza con el perfil y la solicitud. Aquí se ve en qué puede convertirse, para que sepáis a qué os apuntáis.",
  nowBadge: "Ahora",
  laterBadge: "Posible más adelante",
  stage1Title: "Perfil y solicitud",
  stage1Body:
    "Aparecéis en vuestra ciudad, el grupo os escribe y todo lo demás ocurre directamente entre vosotros.",
  stage2Title: "Servicios reservables directamente",
  stage2Body:
    "En lugar de solo preguntar, el grupo reserva uno de vuestros servicios en la app y paga allí. El dinero va a vosotros y vuestro servicio aparece automáticamente en los diez idiomas.",
  stage3Title: "Recomendación mientras planifican",
  stage3Body:
    "El grupo pregunta qué hacer el sábado por la tarde — y vuestro servicio aparece justo debajo de la respuesta. No es publicidad, es la respuesta a lo que se está planificando en ese momento.",
  exampleTag: "Ejemplo",
  serviceTitle: "Gymkhana urbana por el casco antiguo",
  servicePrice: "39 € por persona",
  availabilityLabel: "Sáb 12 sept. libre",
  bookButton: "Reservar",
  aiPrompt: "¿Qué podemos hacer 11 personas el sábado por la tarde?",
  aiAnswer:
    "Por la tarde encaja algo activo al aire libre y queda tiempo para cenar. Dos propuestas de vuestra ciudad:",
  recommendedLabel: "Encaja con vuestro plan",
  noCondition: "Sin condiciones y sin fechas — nada de esto es requisito para el piloto.",
};

const fr: StageCopy = {
  sectionTitle: "Ce que cela peut devenir",
  sectionLead:
    "Le pilote commence par le profil et la demande. Voici ce que cela peut devenir, pour que vous sachiez à quoi vous vous engagez.",
  nowBadge: "Maintenant",
  laterBadge: "Possible plus tard",
  stage1Title: "Profil et demande",
  stage1Body:
    "Vous apparaissez dans votre ville, le groupe vous écrit, et tout le reste se passe directement entre vous.",
  stage2Title: "Prestations réservables directement",
  stage2Body:
    "Au lieu de seulement demander, le groupe réserve une de vos prestations dans l'application et paie sur place. L'argent vous revient, et votre prestation s'affiche automatiquement dans les dix langues.",
  stage3Title: "Une recommandation pendant qu'ils planifient",
  stage3Body:
    "Le groupe demande quoi faire samedi après-midi — et votre prestation se trouve juste sous la réponse. Pas une publicité, mais la réponse à ce qui est en train d'être organisé.",
  exampleTag: "Exemple",
  serviceTitle: "Rallye urbain dans la vieille ville",
  servicePrice: "39 € / pers.",
  availabilityLabel: "Sam. 12 sept. libre",
  bookButton: "Réserver",
  aiPrompt: "Que peut-on faire à 11 samedi après-midi ?",
  aiAnswer:
    "L'après-midi se prête à quelque chose d'actif en extérieur, il reste du temps pour le dîner. Deux propositions dans votre ville :",
  recommendedLabel: "Correspond à votre plan",
  noCondition: "Sans condition et sans échéance — rien de tout cela n'est requis pour le pilote.",
};

const it: StageCopy = {
  sectionTitle: "Dove può arrivare",
  sectionLead:
    "Il pilota parte dal profilo e dalla richiesta. Qui si vede cosa può diventare, così sapete a cosa aderite.",
  nowBadge: "Ora",
  laterBadge: "Possibile più avanti",
  stage1Title: "Profilo e richiesta",
  stage1Body:
    "Comparite nella vostra città, il gruppo vi scrive e tutto il resto avviene direttamente tra voi.",
  stage2Title: "Servizi prenotabili direttamente",
  stage2Body:
    "Invece di limitarsi a chiedere, il gruppo prenota un vostro servizio nell'app e paga lì. Il denaro arriva a voi e il servizio compare automaticamente in tutte e dieci le lingue.",
  stage3Title: "Un consiglio mentre pianificano",
  stage3Body:
    "Il gruppo chiede cosa fare sabato pomeriggio — e il vostro servizio sta subito sotto la risposta. Non pubblicità, ma la risposta a ciò che si sta organizzando in quel momento.",
  exampleTag: "Esempio",
  serviceTitle: "Caccia al tesoro nel centro storico",
  servicePrice: "39 € a persona",
  availabilityLabel: "Sab 12 set. libero",
  bookButton: "Prenota",
  aiPrompt: "Cosa possiamo fare in 11 sabato pomeriggio?",
  aiAnswer:
    "Il pomeriggio si presta a qualcosa di attivo all'aperto e resta tempo per la cena. Due proposte dalla vostra città:",
  recommendedLabel: "Adatto al vostro piano",
  noCondition: "Senza condizioni e senza scadenze — nulla di questo è requisito per il pilota.",
};

const pt: StageCopy = {
  sectionTitle: "Até onde isto pode ir",
  sectionLead:
    "O piloto começa no perfil e no pedido. Aqui veem no que pode tornar-se, para saberem ao que aderem.",
  nowBadge: "Agora",
  laterBadge: "Possível mais tarde",
  stage1Title: "Perfil e pedido",
  stage1Body:
    "Aparecem na vossa cidade, o grupo escreve-vos e tudo o resto acontece diretamente entre vocês.",
  stage2Title: "Serviços reserváveis diretamente",
  stage2Body:
    "Em vez de apenas perguntar, o grupo reserva um dos vossos serviços na aplicação e paga aí. O dinheiro vai para vocês e o serviço aparece automaticamente nos dez idiomas.",
  stage3Title: "Recomendação enquanto planeiam",
  stage3Body:
    "O grupo pergunta o que fazer no sábado à tarde — e o vosso serviço fica logo por baixo da resposta. Não é publicidade, é a resposta ao que está a ser planeado naquele momento.",
  exampleTag: "Exemplo",
  serviceTitle: "Peddy-paper pelo centro histórico",
  servicePrice: "39 € por pessoa",
  availabilityLabel: "Sáb. 12 set. livre",
  bookButton: "Reservar",
  aiPrompt: "O que podemos fazer em 11 pessoas no sábado à tarde?",
  aiAnswer:
    "A tarde pede algo ativo ao ar livre e ainda sobra tempo para o jantar. Duas sugestões da vossa cidade:",
  recommendedLabel: "Encaixa no vosso plano",
  noCondition: "Sem condições e sem prazos — nada disto é requisito para o piloto.",
};

const nl: StageCopy = {
  sectionTitle: "Waar dit heen kan gaan",
  sectionLead:
    "De pilot begint bij het profiel en de aanvraag. Hier zien jullie wat het kan worden, zodat jullie weten waar jullie aan beginnen.",
  nowBadge: "Nu",
  laterBadge: "Later mogelijk",
  stage1Title: "Profiel en aanvraag",
  stage1Body:
    "Jullie staan onder jullie stad, de groep schrijft jullie aan, en al het andere loopt rechtstreeks tussen jullie.",
  stage2Title: "Diensten direct boekbaar",
  stage2Body:
    "In plaats van alleen te vragen, boekt de groep een van jullie diensten in de app en betaalt daar. Het geld gaat naar jullie, en jullie dienst verschijnt automatisch in alle tien talen.",
  stage3Title: "Een aanbeveling tijdens het plannen",
  stage3Body:
    "De groep vraagt wat ze zaterdagmiddag kunnen doen — en jullie dienst staat direct onder het antwoord. Geen advertentie, maar het antwoord op wat er op dat moment gepland wordt.",
  exampleTag: "Voorbeeld",
  serviceTitle: "Stadsspel door de oude binnenstad",
  servicePrice: "€ 39 p.p.",
  availabilityLabel: "Za 12 sep. vrij",
  bookButton: "Boeken",
  aiPrompt: "Wat kunnen we met 11 mensen zaterdagmiddag doen?",
  aiAnswer:
    "De middag leent zich voor iets actiefs buiten, daarna blijft er tijd over om te eten. Twee suggesties uit jullie stad:",
  recommendedLabel: "Past bij jullie plan",
  noCondition: "Zonder voorwaarden en zonder datum — niets hiervan is een vereiste voor de pilot.",
};

const pl: StageCopy = {
  sectionTitle: "Dokąd to może prowadzić",
  sectionLead:
    "Pilotaż zaczyna się od profilu i zapytania. Tutaj widać, czym może się stać, żebyście wiedzieli, na co się piszecie.",
  nowBadge: "Teraz",
  laterBadge: "Możliwe później",
  stage1Title: "Profil i zapytanie",
  stage1Body:
    "Jesteście widoczni w swoim mieście, grupa pisze do Was, a wszystko dalsze dzieje się bezpośrednio między Wami.",
  stage2Title: "Usługi do rezerwacji od razu",
  stage2Body:
    "Zamiast samego zapytania grupa rezerwuje jedną z Waszych usług w aplikacji i tam płaci. Pieniądze trafiają do Was, a usługa wyświetla się automatycznie we wszystkich dziesięciu językach.",
  stage3Title: "Podpowiedź w trakcie planowania",
  stage3Body:
    "Grupa pyta, co robić w sobotnie popołudnie — a Wasza usługa stoi tuż pod odpowiedzią. To nie reklama, tylko odpowiedź na to, co właśnie jest planowane.",
  exampleTag: "Przykład",
  serviceTitle: "Gra miejska po starówce",
  servicePrice: "39 € od osoby",
  availabilityLabel: "Sob. 12.09 wolne",
  bookButton: "Rezerwuj",
  aiPrompt: "Co możemy robić w 11 osób w sobotnie popołudnie?",
  aiAnswer:
    "Na popołudnie pasuje coś aktywnego na świeżym powietrzu, zostanie też czas na kolację. Dwie propozycje z Waszego miasta:",
  recommendedLabel: "Pasuje do Waszego planu",
  noCondition: "Bez warunków i bez terminów — nic z tego nie jest wymogiem pilotażu.",
};

const tr: StageCopy = {
  sectionTitle: "Bunun varabileceği yer",
  sectionLead:
    "Pilot, profil ve talep ile başlıyor. Neye dönüşebileceğini burada görüyorsunuz; neye dâhil olduğunuzu bilin diye.",
  nowBadge: "Şimdi",
  laterBadge: "İleride mümkün",
  stage1Title: "Profil ve talep",
  stage1Body:
    "Şehrinizde görünüyorsunuz, grup size yazıyor, sonrası doğrudan sizinle grup arasında ilerliyor.",
  stage2Title: "Hizmetler doğrudan rezerve edilebilir",
  stage2Body:
    "Grup yalnızca sormakla kalmaz, hizmetlerinizden birini uygulamada rezerve eder ve orada öder. Para size gelir, hizmetiniz on dilde otomatik olarak görünür.",
  stage3Title: "Planlama anında öneri",
  stage3Body:
    "Grup cumartesi öğleden sonra ne yapabileceğini sorar — ve hizmetiniz cevabın hemen altında durur. Reklam değil; o anda planlanan şeye verilen cevabın parçası.",
  exampleTag: "Örnek",
  serviceTitle: "Tarihî merkezde şehir oyunu",
  servicePrice: "Kişi başı 39 €",
  availabilityLabel: "12 Eyl. Cmt müsait",
  bookButton: "Rezerve et",
  aiPrompt: "11 kişi cumartesi öğleden sonra ne yapabiliriz?",
  aiAnswer:
    "Öğleden sonrası açık havada hareketli bir şeye uygun, akşam yemeğine de zaman kalır. Şehrinizden iki öneri:",
  recommendedLabel: "Planınıza uygun",
  noCondition: "Koşul yok, tarih yok — bunların hiçbiri pilot için ön şart değil.",
};

const ar: StageCopy = {
  sectionTitle: "إلى أين يمكن أن يصل هذا",
  sectionLead:
    "تبدأ المرحلة التجريبية بالملف والطلب. وهنا ترون إلى أي شيء يمكن أن تتطور، كي تعرفوا ما الذي تنضمّون إليه.",
  nowBadge: "الآن",
  laterBadge: "ممكن لاحقاً",
  stage1Title: "الملف والطلب",
  stage1Body: "تظهرون ضمن مدينتكم، وتراسلكم المجموعة، وكل ما بعد ذلك يجري بينكم مباشرة.",
  stage2Title: "حجز الخدمات مباشرة",
  stage2Body:
    "بدل الاكتفاء بالسؤال، تحجز المجموعة إحدى خدماتكم داخل التطبيق وتدفع هناك. المبلغ يصل إليكم، وتظهر خدمتكم تلقائياً بجميع اللغات العشر.",
  stage3Title: "توصية أثناء التخطيط",
  stage3Body:
    "تسأل المجموعة عمّا يمكن فعله بعد ظهر السبت — فتظهر خدمتكم أسفل الإجابة مباشرة. ليست إعلاناً، بل جواباً لما يجري التخطيط له في تلك اللحظة.",
  exampleTag: "مثال",
  serviceTitle: "جولة تحدٍّ في المدينة القديمة",
  servicePrice: "39 يورو للشخص",
  availabilityLabel: "السبت 12 سبتمبر متاح",
  bookButton: "احجز",
  aiPrompt: "ماذا يمكننا أن نفعل ونحن 11 شخصاً بعد ظهر السبت؟",
  aiAnswer:
    "بعد الظهر يناسبه نشاط حركي في الهواء الطلق، ويبقى وقت للعشاء. إليكم اقتراحين من مدينتكم:",
  recommendedLabel: "يناسب خطتكم",
  noCondition: "بلا شروط وبلا مواعيد — لا شيء من ذلك مطلوب للمرحلة التجريبية.",
};

const STAGES: Record<SeoLang, StageCopy> = { de, en, es, fr, it, pt, nl, pl, tr, ar };

/** Wie in agency-demo-copy.ts: unbekannte Sprache faellt auf Englisch zurueck. */
export function agencyDemoStages(lang: string | null | undefined): StageCopy {
  return (lang && STAGES[lang as SeoLang]) || en;
}
