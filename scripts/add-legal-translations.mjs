// One-shot: fill missing legal.agency_agreement + extended legal.terms.* keys
// across all non-DE/EN locales (es, fr, it, nl, pl, pt, tr, ar).
// Short form with binding-German disclaimer — matches the existing EN pattern.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const LOCALES = ["es", "fr", "it", "nl", "pl", "pt", "tr", "ar"];

// -----------------------------------------------------------------------------
// Translations per locale
// -----------------------------------------------------------------------------
// Each entry contains:
//   terms    — 5 new sub-sections (booking_process, payment_methods,
//              cancellation_refund, off_platform_bypass, lastUpdatedDate) +
//              overwrites of intro/governingLaw to reference Cyprus LTD
//   agency_agreement — compact full section tree with binding-German note
// -----------------------------------------------------------------------------

const T = {
  es: {
    lastUpdatedDate: "Abril 2026",
    intro: "Bienvenido/a a EventBliss. Estas Condiciones regulan el uso de la plataforma, operada por MYFAMBLISS GROUP LTD, Gladstonos 12-14, 8046 Paphos, Chipre. La versión vinculante es la alemana.",
    governingLaw: "Derecho aplicable: La plataforma está operada por MYFAMBLISS GROUP LTD con sede en la República de Chipre. Se aplica el derecho chipriota con exclusión de la CISG. Los derechos imperativos del consumidor de su residencia habitual (p. ej. § 312g BGB en Alemania) no quedan afectados (Art. 6(2) Roma I). Plataforma de resolución de litigios de la UE: https://ec.europa.eu/consumers/odr",
    booking_process: {
      title: "Proceso de reserva",
      content: "El contrato de servicio se celebra con la agencia, no con EventBliss. EventBliss actúa como intermediario. Para pagos en línea, la confirmación se emite tras el pago exitoso con Stripe. Para pagos en el lugar, la agencia confirma manualmente. Consumidores tienen derecho de desistimiento según § 312g BGB (14 días), con excepciones para servicios a fecha fija.",
    },
    payment_methods: {
      title: "Formas de pago",
      content: "Dos opciones: (1) Pago en línea por Stripe — tarjeta, Apple/Google Pay, SEPA. (2) Pago en el lugar — directamente a la agencia al momento del servicio. En ambos casos, el precio mostrado es final e incluye la comisión de plataforma del 10%.",
    },
    cancellation_refund: {
      title: "Cancelación y reembolso",
      content: "La política de cancelación (flexible / moderada / estricta) se muestra por servicio. Los reembolsos se procesan al medio de pago original en un plazo de 14 días. Para reservas con pago en el lugar, las cancelaciones se gestionan directamente con la agencia; EventBliss media en caso de disputa.",
    },
    off_platform_bypass: {
      title: "Protección contra elusión",
      content: "Las agencias están contractualmente obligadas a procesar todas las reservas a través de la plataforma. Tras una cancelación, las agencias NO pueden contactarle directamente para ofrecer una reserva fuera de la plataforma con pago en efectivo — esto constituye un incumplimiento contractual. No acepte tales ofertas: perdería la protección de EventBliss (soporte, garantía de reembolso). Denuncie intentos a compliance@event-bliss.com — recibirá un bono del 20% en su próxima reserva (máx. 200 €, 12 meses).",
    },
  },
  fr: {
    lastUpdatedDate: "Avril 2026",
    intro: "Bienvenue sur EventBliss. Ces Conditions régissent l'utilisation de la plateforme, exploitée par MYFAMBLISS GROUP LTD, Gladstonos 12-14, 8046 Paphos, Chypre. La version contraignante est l'allemande.",
    governingLaw: "Droit applicable : La plateforme est exploitée par MYFAMBLISS GROUP LTD ayant son siège en République de Chypre. Le droit chypriote s'applique à l'exclusion de la CVIM. Les droits impératifs de protection du consommateur de votre résidence habituelle (ex. § 312g BGB en Allemagne) demeurent inchangés (Art. 6(2) Rome I). Plateforme de règlement des litiges UE : https://ec.europa.eu/consumers/odr",
    booking_process: {
      title: "Processus de réservation",
      content: "Le contrat de service est conclu avec l'agence, non EventBliss. EventBliss agit en tant qu'intermédiaire. Pour un paiement en ligne, la confirmation intervient après un paiement Stripe réussi. Pour un paiement sur place, l'agence confirme manuellement. Les consommateurs disposent d'un droit de rétractation selon § 312g BGB (14 jours), avec des exceptions pour les prestations à date fixe.",
    },
    payment_methods: {
      title: "Modes de paiement",
      content: "Deux options : (1) Paiement en ligne via Stripe — carte, Apple/Google Pay, SEPA. (2) Paiement sur place — directement à l'agence le jour de la prestation. Dans les deux cas, le prix affiché est définitif et inclut la commission de plateforme de 10%.",
    },
    cancellation_refund: {
      title: "Annulation et remboursement",
      content: "La politique d'annulation (flexible / modérée / stricte) est affichée par service. Les remboursements sont effectués sur le moyen de paiement d'origine sous 14 jours. Pour les réservations avec paiement sur place, les annulations se règlent directement avec l'agence ; EventBliss médie en cas de litige.",
    },
    off_platform_bypass: {
      title: "Protection contre le contournement",
      content: "Les agences sont contractuellement tenues de traiter toutes les réservations via la plateforme. Après une annulation, les agences NE peuvent PAS vous contacter directement pour proposer une réservation hors plateforme avec paiement en espèces — cela constitue une violation contractuelle. N'acceptez pas ces offres : vous perdriez la protection EventBliss (support, garantie de remboursement). Signalez les tentatives à compliance@event-bliss.com — vous recevrez un avoir de 20% sur votre prochaine réservation (max. 200 €, 12 mois).",
    },
  },
  it: {
    lastUpdatedDate: "Aprile 2026",
    intro: "Benvenuto/a su EventBliss. Le presenti Condizioni regolano l'uso della piattaforma, gestita da MYFAMBLISS GROUP LTD, Gladstonos 12-14, 8046 Paphos, Cipro. La versione vincolante è quella tedesca.",
    governingLaw: "Legge applicabile: La piattaforma è gestita da MYFAMBLISS GROUP LTD con sede nella Repubblica di Cipro. Si applica il diritto cipriota, esclusa la CVIM. I diritti imperativi a tutela dei consumatori della residenza abituale (es. § 312g BGB in Germania) restano impregiudicati (Art. 6(2) Roma I). Piattaforma UE di risoluzione online: https://ec.europa.eu/consumers/odr",
    booking_process: {
      title: "Processo di prenotazione",
      content: "Il contratto di servizio è stipulato con l'agenzia, non con EventBliss. EventBliss agisce come intermediario. Per i pagamenti online, la conferma avviene dopo il pagamento Stripe. Per i pagamenti sul posto, l'agenzia conferma manualmente. I consumatori hanno diritto di recesso ai sensi del § 312g BGB (14 giorni), con eccezioni per le prestazioni a data fissa.",
    },
    payment_methods: {
      title: "Modalità di pagamento",
      content: "Due opzioni: (1) Pagamento online tramite Stripe — carta, Apple/Google Pay, SEPA. (2) Pagamento sul posto — direttamente all'agenzia al momento del servizio. In entrambi i casi, il prezzo visualizzato è finale e include la commissione di piattaforma del 10%.",
    },
    cancellation_refund: {
      title: "Cancellazione e rimborso",
      content: "La politica di cancellazione (flessibile / moderata / rigorosa) è indicata per ogni servizio. I rimborsi vengono elaborati sul metodo di pagamento originale entro 14 giorni. Per le prenotazioni con pagamento sul posto, le cancellazioni si gestiscono direttamente con l'agenzia; EventBliss media in caso di controversia.",
    },
    off_platform_bypass: {
      title: "Protezione anti-elusione",
      content: "Le agenzie sono contrattualmente tenute a elaborare tutte le prenotazioni tramite la piattaforma. Dopo una cancellazione, le agenzie NON possono contattarti direttamente per offrire una prenotazione fuori piattaforma con pagamento in contanti — ciò costituisce violazione contrattuale. Non accettare tali offerte: perderesti la tutela di EventBliss (supporto, garanzia di rimborso). Segnala i tentativi a compliance@event-bliss.com — riceverai un credito del 20% sulla prossima prenotazione (max 200 €, 12 mesi).",
    },
  },
  nl: {
    lastUpdatedDate: "April 2026",
    intro: "Welkom bij EventBliss. Deze Voorwaarden regelen het gebruik van het platform, beheerd door MYFAMBLISS GROUP LTD, Gladstonos 12-14, 8046 Paphos, Cyprus. De bindende versie is de Duitse.",
    governingLaw: "Toepasselijk recht: Het platform wordt beheerd door MYFAMBLISS GROUP LTD met statutaire zetel in de Republiek Cyprus. Cypriotisch recht is van toepassing, met uitsluiting van het Weens Koopverdrag. Dwingende consumentenbeschermingsregels van uw gewone verblijfplaats (bv. § 312g BGB in Duitsland) blijven onaangetast (Art. 6(2) Rome I). EU-platform voor geschillenbeslechting: https://ec.europa.eu/consumers/odr",
    booking_process: {
      title: "Boekingsproces",
      content: "De dienstverleningsovereenkomst wordt gesloten met het agentschap, niet met EventBliss. EventBliss treedt op als tussenpersoon. Bij online betaling vindt de bevestiging plaats na succesvolle Stripe-betaling. Bij betaling ter plaatse bevestigt het agentschap handmatig. Consumenten hebben herroepingsrecht volgens § 312g BGB (14 dagen), met uitzonderingen voor diensten op een vaste datum.",
    },
    payment_methods: {
      title: "Betaalmethoden",
      content: "Twee opties: (1) Online betaling via Stripe — kaart, Apple/Google Pay, SEPA. (2) Betaling ter plaatse — rechtstreeks aan het agentschap op de dag van de dienst. In beide gevallen is de weergegeven prijs definitief en omvat de platformkosten van 10%.",
    },
    cancellation_refund: {
      title: "Annulering en terugbetaling",
      content: "Het annuleringsbeleid (flexibel / matig / strikt) wordt per dienst getoond. Terugbetalingen worden binnen 14 dagen verwerkt op de oorspronkelijke betaalmethode. Voor boekingen met betaling ter plaatse worden annuleringen rechtstreeks met het agentschap afgehandeld; EventBliss bemiddelt bij geschillen.",
    },
    off_platform_bypass: {
      title: "Bescherming tegen omzeiling",
      content: "Agentschappen zijn contractueel verplicht alle boekingen via het platform af te handelen. Na een annulering mogen agentschappen u NIET rechtstreeks benaderen om een boeking buiten het platform met contante betaling aan te bieden — dit is een contractbreuk. Accepteer dergelijke aanbiedingen niet: u verliest de EventBliss-bescherming (support, terugbetalingsgarantie). Meld pogingen aan compliance@event-bliss.com — u ontvangt 20% tegoed op uw volgende boeking (max. € 200, 12 maanden).",
    },
  },
  pl: {
    lastUpdatedDate: "Kwiecień 2026",
    intro: "Witamy w EventBliss. Niniejsze Warunki regulują korzystanie z platformy obsługiwanej przez MYFAMBLISS GROUP LTD, Gladstonos 12-14, 8046 Pafos, Cypr. Wiążąca jest wersja niemiecka.",
    governingLaw: "Prawo właściwe: Platforma jest obsługiwana przez MYFAMBLISS GROUP LTD z siedzibą w Republice Cypryjskiej. Stosuje się prawo cypryjskie z wyłączeniem CISG. Bezwzględnie obowiązujące przepisy o ochronie konsumentów państwa miejsca zwykłego pobytu (np. § 312g BGB w Niemczech) pozostają nienaruszone (Art. 6(2) Rzym I). Platforma UE do rozstrzygania sporów online: https://ec.europa.eu/consumers/odr",
    booking_process: {
      title: "Proces rezerwacji",
      content: "Umowa o świadczenie usług zawierana jest z agencją, nie z EventBliss. EventBliss działa jako pośrednik. Przy płatności online potwierdzenie następuje po udanej płatności Stripe. Przy płatności na miejscu agencja potwierdza ręcznie. Konsumenci mają prawo odstąpienia od umowy zgodnie z § 312g BGB (14 dni), z wyjątkami dla usług w oznaczonym terminie.",
    },
    payment_methods: {
      title: "Metody płatności",
      content: "Dwie opcje: (1) Płatność online przez Stripe — karta, Apple/Google Pay, SEPA. (2) Płatność na miejscu — bezpośrednio u agencji w dniu usługi. W obu przypadkach wyświetlana cena jest ostateczna i zawiera 10% prowizji platformy.",
    },
    cancellation_refund: {
      title: "Anulowanie i zwrot",
      content: "Polityka anulowania (elastyczna / umiarkowana / rygorystyczna) jest widoczna przy każdej usłudze. Zwroty są przetwarzane na pierwotną metodę płatności w ciągu 14 dni. Dla rezerwacji z płatnością na miejscu anulowania są ustalane bezpośrednio z agencją; EventBliss pośredniczy w sporach.",
    },
    off_platform_bypass: {
      title: "Ochrona przed obejściem platformy",
      content: "Agencje są zobowiązane umową do obsługi wszystkich rezerwacji przez platformę. Po anulowaniu agencje NIE mogą kontaktować się z Tobą bezpośrednio w celu zaoferowania rezerwacji poza platformą z płatnością gotówkową — stanowi to naruszenie umowy. Nie akceptuj takich ofert: stracisz ochronę EventBliss (wsparcie, gwarancję zwrotu). Zgłaszaj próby na compliance@event-bliss.com — otrzymasz bon 20% na kolejną rezerwację (maks. 200 €, 12 miesięcy).",
    },
  },
  pt: {
    lastUpdatedDate: "Abril de 2026",
    intro: "Bem-vindo/a à EventBliss. Estas Condições regem o uso da plataforma, operada pela MYFAMBLISS GROUP LTD, Gladstonos 12-14, 8046 Paphos, Chipre. A versão vinculativa é a alemã.",
    governingLaw: "Lei aplicável: A plataforma é operada pela MYFAMBLISS GROUP LTD com sede na República de Chipre. Aplica-se a lei cipriota com exclusão da CISG. Os direitos imperativos de proteção do consumidor da residência habitual (p. ex. § 312g BGB na Alemanha) permanecem inalterados (Art. 6(2) Roma I). Plataforma de resolução de litígios da UE: https://ec.europa.eu/consumers/odr",
    booking_process: {
      title: "Processo de reserva",
      content: "O contrato de serviço é celebrado com a agência, não com a EventBliss. A EventBliss atua como intermediária. Para pagamento online, a confirmação ocorre após pagamento Stripe bem-sucedido. Para pagamento no local, a agência confirma manualmente. Os consumidores têm direito de retratação nos termos do § 312g BGB (14 dias), com exceções para serviços em data fixa.",
    },
    payment_methods: {
      title: "Formas de pagamento",
      content: "Duas opções: (1) Pagamento online via Stripe — cartão, Apple/Google Pay, SEPA. (2) Pagamento no local — diretamente à agência no momento do serviço. Em ambos os casos, o preço exibido é final e inclui a taxa de plataforma de 10%.",
    },
    cancellation_refund: {
      title: "Cancelamento e reembolso",
      content: "A política de cancelamento (flexível / moderada / rigorosa) é indicada por serviço. Os reembolsos são processados para a forma de pagamento original no prazo de 14 dias. Para reservas com pagamento no local, os cancelamentos são tratados diretamente com a agência; a EventBliss medeia em caso de litígio.",
    },
    off_platform_bypass: {
      title: "Proteção contra contorno",
      content: "As agências estão contratualmente obrigadas a processar todas as reservas através da plataforma. Após um cancelamento, as agências NÃO podem contactá-lo/a diretamente para oferecer uma reserva fora da plataforma com pagamento em dinheiro — isto constitui incumprimento contratual. Não aceite tais ofertas: perderia a proteção da EventBliss (suporte, garantia de reembolso). Denuncie tentativas a compliance@event-bliss.com — receberá um crédito de 20% na próxima reserva (máx. 200 €, 12 meses).",
    },
  },
  tr: {
    lastUpdatedDate: "Nisan 2026",
    intro: "EventBliss'e hoş geldiniz. Bu Koşullar, platformu işleten MYFAMBLISS GROUP LTD (Gladstonos 12-14, 8046 Baf, Kıbrıs) tarafından sunulan platformun kullanımını düzenler. Bağlayıcı sürüm Almancadır.",
    governingLaw: "Uygulanacak hukuk: Platform, Kıbrıs Cumhuriyeti'nde kayıtlı MYFAMBLISS GROUP LTD tarafından işletilir. CISG hariç Kıbrıs hukuku uygulanır. Mutad mesken devletinin emredici tüketici koruma hükümleri (örn. Almanya'da § 312g BGB) saklıdır (Roma I md. 6(2)). AB çevrimiçi uyuşmazlık çözüm platformu: https://ec.europa.eu/consumers/odr",
    booking_process: {
      title: "Rezervasyon süreci",
      content: "Hizmet sözleşmesi EventBliss ile değil, ajans ile kurulur. EventBliss aracı olarak hareket eder. Çevrimiçi ödemede, onay Stripe ödemesinin başarılı olmasının ardından verilir. Yerinde ödemede ajans manuel olarak onaylar. Tüketicilerin § 312g BGB uyarınca 14 günlük cayma hakkı vardır; sabit tarihli hizmetler için istisnalar geçerlidir.",
    },
    payment_methods: {
      title: "Ödeme yöntemleri",
      content: "İki seçenek: (1) Stripe üzerinden çevrimiçi ödeme — kart, Apple/Google Pay, SEPA. (2) Yerinde ödeme — hizmet sırasında doğrudan ajansa. Her iki durumda da görüntülenen fiyat nihaidir ve %10 platform komisyonunu içerir.",
    },
    cancellation_refund: {
      title: "İptal ve iade",
      content: "İptal politikası (esnek / orta / katı) her hizmet için gösterilir. İadeler 14 gün içinde orijinal ödeme yöntemine yapılır. Yerinde ödemeli rezervasyonlarda iptaller doğrudan ajans ile yürütülür; uyuşmazlık halinde EventBliss arabulucu olur.",
    },
    off_platform_bypass: {
      title: "Atlatma karşıtı koruma",
      content: "Ajanslar tüm rezervasyonları platform üzerinden yürütmekle sözleşmesel olarak yükümlüdür. İptalden sonra ajanslar sizinle doğrudan iletişime geçerek platform dışında nakit ödemeli rezervasyon sunamazlar — bu sözleşme ihlalidir. Bu tür teklifleri kabul etmeyin: EventBliss korumasını kaybedersiniz (destek, iade garantisi). Girişimleri compliance@event-bliss.com adresine bildirin — bir sonraki rezervasyonunuzda %20 kredi alırsınız (maks. 200 €, 12 ay).",
    },
  },
  ar: {
    lastUpdatedDate: "أبريل 2026",
    intro: "مرحبًا بك في EventBliss. تحكم هذه الشروط استخدام المنصة التي تديرها شركة MYFAMBLISS GROUP LTD، Gladstonos 12-14, 8046 بافوس، قبرص. النسخة الملزمة هي الألمانية.",
    governingLaw: "القانون الواجب التطبيق: تدير المنصة شركة MYFAMBLISS GROUP LTD ومقرها في جمهورية قبرص. يطبق القانون القبرصي باستثناء اتفاقية الأمم المتحدة للبيع الدولي (CISG). تظل أحكام حماية المستهلك الإلزامية لمكان الإقامة المعتاد (مثل § 312g BGB في ألمانيا) نافذة (المادة 6(2) من روما الأولى). منصة تسوية النزاعات في الاتحاد الأوروبي: https://ec.europa.eu/consumers/odr",
    booking_process: {
      title: "عملية الحجز",
      content: "يُبرم عقد الخدمة مع الوكالة، وليس مع EventBliss. تعمل EventBliss كوسيط. في حالة الدفع عبر الإنترنت، يتم التأكيد بعد نجاح الدفع عبر Stripe. في حالة الدفع في الموقع، تؤكد الوكالة يدويًا. يتمتع المستهلكون بحق الانسحاب بموجب § 312g BGB (14 يومًا)، مع استثناءات للخدمات ذات التاريخ المحدد.",
    },
    payment_methods: {
      title: "طرق الدفع",
      content: "خياران: (1) الدفع عبر الإنترنت من خلال Stripe — بطاقة، Apple/Google Pay، SEPA. (2) الدفع في الموقع — مباشرةً للوكالة عند تقديم الخدمة. في كلتا الحالتين، السعر المعروض نهائي ويشمل عمولة المنصة البالغة 10%.",
    },
    cancellation_refund: {
      title: "الإلغاء والاسترداد",
      content: "تُعرض سياسة الإلغاء (مرنة / معتدلة / صارمة) لكل خدمة. تُعالج المبالغ المستردة إلى طريقة الدفع الأصلية خلال 14 يومًا. بالنسبة للحجوزات بالدفع في الموقع، تتم تسوية الإلغاء مباشرة مع الوكالة؛ تتوسط EventBliss في حالة النزاع.",
    },
    off_platform_bypass: {
      title: "الحماية من التحايل",
      content: "الوكالات ملزمة تعاقديًا بمعالجة جميع الحجوزات عبر المنصة. بعد الإلغاء، لا يجوز للوكالات الاتصال بك مباشرة لعرض حجز خارج المنصة بالدفع النقدي — وهذا يعد خرقًا للعقد. لا تقبل مثل هذه العروض: ستفقد حماية EventBliss (الدعم، ضمان الاسترداد). أبلغ عن المحاولات إلى compliance@event-bliss.com — ستتلقى رصيدًا بنسبة 20% على حجزك التالي (بحد أقصى 200 يورو، 12 شهرًا).",
    },
  },
};

// -----------------------------------------------------------------------------
// Agency Agreement — short localized version with binding-German note
// Same key structure as de.json's legal.agency_agreement so UI keys resolve.
// -----------------------------------------------------------------------------

// For each locale we generate a compact subtree with the same shape.
// Brief, legally-safe content. Full text only in German (binding).

function buildAgencyAgreement(loc) {
  const dict = {
    es: {
      title: "Acuerdo de Agencia (EventBliss Partner Agreement)",
      lastUpdated: "Última actualización",
      rightsReserved: "Todos los derechos reservados.",
      intro: "\"EventBliss\" es una marca y un producto de MYFAMBLISS GROUP LTD, sociedad constituida conforme al derecho de la República de Chipre, con sede en Gladstonos 12-14, 8046 Paphos, Chipre. La versión vinculante de este acuerdo es la alemana; esta traducción se ofrece únicamente a título informativo.",
      parties: "Partes: MYFAMBLISS GROUP LTD, Gladstonos 12-14, 8046 Paphos, Chipre (\"EventBliss\" o \"Plataforma\"), y la agencia de servicios de eventos registrada (\"Agencia\"). \"Cliente\" es cualquier persona física o jurídica que reserva a través de la plataforma.",
      preamble: { title: "Preámbulo y ámbito", content: "EventBliss opera un mercado en línea para servicios de eventos. Las definiciones (Plataforma, Agencia, Cliente, Reserva, Cliente remitido) se aplican según la versión alemana." },
      platformServices: { title: "Servicios de la plataforma", content: "EventBliss ofrece listados públicos, flujo de reserva digital, procesamiento de pagos vía Stripe para reservas en línea, soporte y marketing. EventBliss actúa solo como intermediario." },
      agencyDuties: { title: "Obligaciones de la agencia", content: "Prestación de servicios con calidad adecuada, cumplimiento de obligaciones legales y fiscales, actualización de datos del perfil y del calendario, respuesta a consultas en 24 h en días hábiles, precios vinculantes con IVA." },
      platformFee: { title: "Comisión de plataforma", content: "EventBliss cobra una comisión del 10% sobre todas las reservas, independientemente del método de pago. Para reservas en línea, se deduce automáticamente antes del pago. Para pagos en el lugar, la agencia debe abonar la comisión en 14 días tras la prestación del servicio." },
      paymentModes: { title: "Formas de pago e igualdad de trato", content: "Se reconocen como reservas de plataforma tanto los pagos en línea (Stripe) como en el lugar. La elección del método de pago no exime a la agencia del pago de la comisión. Incitar a los clientes a pagar fuera de la plataforma está prohibido y constituye una infracción de la cláusula 6." },
    },
    fr: {
      title: "Accord d'Agence (EventBliss Partner Agreement)",
      lastUpdated: "Dernière mise à jour",
      rightsReserved: "Tous droits réservés.",
      intro: "« EventBliss » est une marque et un produit de MYFAMBLISS GROUP LTD, société constituée selon le droit de la République de Chypre, ayant son siège à Gladstonos 12-14, 8046 Paphos, Chypre. La version contraignante du présent accord est la version allemande ; cette traduction est fournie à titre informatif.",
      parties: "Parties : MYFAMBLISS GROUP LTD, Gladstonos 12-14, 8046 Paphos, Chypre (« EventBliss » ou « Plateforme »), et l'agence de services événementiels enregistrée (« Agence »). Le « Client » est toute personne physique ou morale qui réserve via la plateforme.",
      preamble: { title: "Préambule et champ d'application", content: "EventBliss exploite une marketplace en ligne pour services événementiels. Les définitions (Plateforme, Agence, Client, Réservation, Client référé) s'appliquent selon la version allemande." },
      platformServices: { title: "Services de la plateforme", content: "EventBliss fournit des listings publics, un flux de réservation numérique, le traitement des paiements via Stripe pour les réservations en ligne, le support et le marketing. EventBliss agit uniquement en tant qu'intermédiaire." },
      agencyDuties: { title: "Obligations de l'Agence", content: "Fournir les services avec une qualité appropriée, respecter toutes les obligations légales et fiscales, maintenir à jour les données du profil et du calendrier, répondre aux demandes sous 24 h jours ouvrés, afficher des prix fermes TTC." },
      platformFee: { title: "Commission de plateforme", content: "EventBliss prélève une commission de 10% sur toutes les réservations, quel que soit le mode de paiement. Pour les paiements en ligne, déduction automatique avant versement. Pour les paiements sur place, l'Agence doit reverser la commission sous 14 jours après la prestation." },
      paymentModes: { title: "Modes de paiement et égalité de traitement", content: "Les paiements en ligne (Stripe) et sur place sont tous deux reconnus comme réservations de la plateforme. Le choix du mode de paiement n'exonère pas l'Agence du paiement de la commission. Inciter les clients à payer hors plateforme est interdit et constitue une violation de la clause 6." },
    },
    it: {
      title: "Accordo di Agenzia (EventBliss Partner Agreement)",
      lastUpdated: "Ultimo aggiornamento",
      rightsReserved: "Tutti i diritti riservati.",
      intro: "\"EventBliss\" è un marchio e un prodotto di MYFAMBLISS GROUP LTD, società costituita secondo il diritto della Repubblica di Cipro, con sede in Gladstonos 12-14, 8046 Paphos, Cipro. La versione vincolante del presente accordo è quella tedesca; questa traduzione è fornita solo a scopo informativo.",
      parties: "Parti: MYFAMBLISS GROUP LTD, Gladstonos 12-14, 8046 Paphos, Cipro (\"EventBliss\" o \"Piattaforma\"), e l'agenzia di servizi per eventi registrata (\"Agenzia\"). Il \"Cliente\" è qualsiasi persona fisica o giuridica che prenota tramite la piattaforma.",
      preamble: { title: "Preambolo e ambito", content: "EventBliss gestisce un marketplace online per servizi di eventi. Le definizioni (Piattaforma, Agenzia, Cliente, Prenotazione, Cliente segnalato) si applicano come da versione tedesca." },
      platformServices: { title: "Servizi della piattaforma", content: "EventBliss fornisce annunci pubblici, un flusso di prenotazione digitale, il processamento dei pagamenti tramite Stripe per prenotazioni online, supporto e marketing. EventBliss agisce esclusivamente come intermediaria." },
      agencyDuties: { title: "Obblighi dell'Agenzia", content: "Erogazione del servizio con qualità adeguata, rispetto degli obblighi legali e fiscali, aggiornamento dei dati di profilo e calendario, risposta alle richieste entro 24 h nei giorni lavorativi, prezzi vincolanti IVA inclusa." },
      platformFee: { title: "Commissione di piattaforma", content: "EventBliss applica una commissione del 10% su tutte le prenotazioni, indipendentemente dal metodo di pagamento. Per i pagamenti online, deduzione automatica prima dell'accredito. Per i pagamenti sul posto, l'Agenzia deve versare la commissione entro 14 giorni dall'erogazione." },
      paymentModes: { title: "Modalità di pagamento e parità di trattamento", content: "Sia i pagamenti online (Stripe) che quelli sul posto sono riconosciuti come prenotazioni della piattaforma. La scelta del metodo di pagamento non esonera l'Agenzia dal pagamento della commissione. Indurre i clienti a pagare fuori piattaforma è vietato e costituisce violazione della clausola 6." },
    },
    nl: {
      title: "Agency Agreement (EventBliss Partner Agreement)",
      lastUpdated: "Laatst bijgewerkt",
      rightsReserved: "Alle rechten voorbehouden.",
      intro: "\"EventBliss\" is een merk en product van MYFAMBLISS GROUP LTD, een vennootschap opgericht naar het recht van de Republiek Cyprus, met statutaire zetel te Gladstonos 12-14, 8046 Paphos, Cyprus. De bindende versie van deze overeenkomst is de Duitse; deze vertaling is louter informatief.",
      parties: "Partijen: MYFAMBLISS GROUP LTD, Gladstonos 12-14, 8046 Paphos, Cyprus (\"EventBliss\" of \"Platform\"), en het geregistreerde evenementenbureau (\"Agentschap\"). Een \"Klant\" is elke natuurlijke of rechtspersoon die via het platform boekt.",
      preamble: { title: "Preambule en toepassingsgebied", content: "EventBliss exploiteert een online marktplaats voor evenementendiensten. Definities (Platform, Agentschap, Klant, Boeking, Doorverwezen klant) gelden conform de Duitse versie." },
      platformServices: { title: "Platformdiensten", content: "EventBliss biedt openbare listings, een digitale boekingsworkflow, betalingsverwerking via Stripe voor online boekingen, support en marketing. EventBliss treedt enkel op als tussenpersoon." },
      agencyDuties: { title: "Verplichtingen van het Agentschap", content: "Correcte dienstverlening en kwaliteit, naleving van wet- en belastingverplichtingen, actueel houden van profiel- en kalendergegevens, reactie op aanvragen binnen 24 u op werkdagen, bindende prijzen inclusief btw." },
      platformFee: { title: "Platformvergoeding", content: "EventBliss rekent een vergoeding van 10% op alle boekingen, ongeacht de betalingsmethode. Bij online betaling automatische inhouding vóór uitbetaling. Bij betaling ter plaatse dient het Agentschap de vergoeding binnen 14 dagen na dienstverlening af te dragen." },
      paymentModes: { title: "Betaalmethoden en gelijke behandeling", content: "Zowel online (Stripe) als ter plaatse betalingen gelden als platformboekingen. De keuze van de betaalmethode ontslaat het Agentschap niet van de vergoedingplicht. Klanten aanzetten om buiten het platform te betalen is verboden en vormt een schending van clausule 6." },
    },
    pl: {
      title: "Umowa Agencyjna (EventBliss Partner Agreement)",
      lastUpdated: "Ostatnia aktualizacja",
      rightsReserved: "Wszelkie prawa zastrzeżone.",
      intro: "„EventBliss\" jest marką i produktem MYFAMBLISS GROUP LTD, spółki utworzonej zgodnie z prawem Republiki Cypryjskiej, z siedzibą Gladstonos 12-14, 8046 Pafos, Cypr. Wiążącą wersją niniejszej umowy jest wersja niemiecka; tłumaczenie służy wyłącznie celom informacyjnym.",
      parties: "Strony: MYFAMBLISS GROUP LTD, Gladstonos 12-14, 8046 Pafos, Cypr („EventBliss\" lub „Platforma\"), oraz zarejestrowana agencja usług eventowych („Agencja\"). „Klientem\" jest każda osoba fizyczna lub prawna dokonująca rezerwacji przez platformę.",
      preamble: { title: "Preambuła i zakres", content: "EventBliss prowadzi marketplace online dla usług eventowych. Definicje (Platforma, Agencja, Klient, Rezerwacja, Klient skierowany) zgodnie z wersją niemiecką." },
      platformServices: { title: "Usługi platformy", content: "EventBliss zapewnia publiczne listingi, cyfrowy proces rezerwacji, obsługę płatności przez Stripe dla rezerwacji online, wsparcie i marketing. EventBliss działa wyłącznie jako pośrednik." },
      agencyDuties: { title: "Obowiązki Agencji", content: "Świadczenie usług o odpowiedniej jakości, przestrzeganie zobowiązań prawnych i podatkowych, aktualność danych profilu i kalendarza, odpowiedź na zapytania w ciągu 24 h w dni robocze, wiążące ceny z VAT." },
      platformFee: { title: "Prowizja platformy", content: "EventBliss pobiera prowizję 10% od wszystkich rezerwacji, niezależnie od metody płatności. Przy płatności online automatyczne potrącenie przed wypłatą. Przy płatności na miejscu Agencja musi odprowadzić prowizję w ciągu 14 dni od wykonania usługi." },
      paymentModes: { title: "Metody płatności i równe traktowanie", content: "Zarówno płatności online (Stripe), jak i na miejscu są uznawane za rezerwacje platformy. Wybór metody płatności nie zwalnia Agencji z obowiązku zapłaty prowizji. Nakłanianie klientów do płatności poza platformą jest zabronione i stanowi naruszenie klauzuli 6." },
    },
    pt: {
      title: "Contrato de Agência (EventBliss Partner Agreement)",
      lastUpdated: "Última atualização",
      rightsReserved: "Todos os direitos reservados.",
      intro: "\"EventBliss\" é uma marca e produto da MYFAMBLISS GROUP LTD, sociedade constituída ao abrigo do direito da República de Chipre, com sede em Gladstonos 12-14, 8046 Paphos, Chipre. A versão vinculativa deste contrato é a alemã; esta tradução é fornecida apenas para fins informativos.",
      parties: "Partes: MYFAMBLISS GROUP LTD, Gladstonos 12-14, 8046 Paphos, Chipre (\"EventBliss\" ou \"Plataforma\"), e a agência de serviços de eventos registada (\"Agência\"). \"Cliente\" é qualquer pessoa singular ou coletiva que faça uma reserva através da plataforma.",
      preamble: { title: "Preâmbulo e âmbito", content: "A EventBliss explora um marketplace online para serviços de eventos. As definições (Plataforma, Agência, Cliente, Reserva, Cliente indicado) aplicam-se conforme a versão alemã." },
      platformServices: { title: "Serviços da plataforma", content: "A EventBliss fornece listagens públicas, um fluxo de reserva digital, processamento de pagamentos via Stripe para reservas online, suporte e marketing. A EventBliss atua apenas como intermediária." },
      agencyDuties: { title: "Obrigações da Agência", content: "Prestação de serviços com qualidade adequada, cumprimento de obrigações legais e fiscais, atualização dos dados de perfil e calendário, resposta a consultas em 24 h em dias úteis, preços vinculativos com IVA." },
      platformFee: { title: "Taxa de plataforma", content: "A EventBliss cobra uma taxa de 10% sobre todas as reservas, independentemente do método de pagamento. Para pagamentos online, dedução automática antes da transferência. Para pagamentos no local, a Agência deve pagar a taxa no prazo de 14 dias após a prestação do serviço." },
      paymentModes: { title: "Formas de pagamento e igualdade de tratamento", content: "Tanto os pagamentos online (Stripe) quanto no local são reconhecidos como reservas da plataforma. A escolha do método de pagamento não isenta a Agência do pagamento da taxa. Incentivar clientes a pagar fora da plataforma é proibido e constitui violação da cláusula 6." },
    },
    tr: {
      title: "Ajans Sözleşmesi (EventBliss Partner Agreement)",
      lastUpdated: "Son güncelleme",
      rightsReserved: "Tüm hakları saklıdır.",
      intro: "\"EventBliss\", Kıbrıs Cumhuriyeti hukukuna göre kurulmuş ve Gladstonos 12-14, 8046 Baf, Kıbrıs adresinde bulunan MYFAMBLISS GROUP LTD'nin bir markası ve ürünüdür. Bu sözleşmenin bağlayıcı sürümü Almancadır; bu çeviri yalnızca bilgilendirme amaçlıdır.",
      parties: "Taraflar: MYFAMBLISS GROUP LTD, Gladstonos 12-14, 8046 Baf, Kıbrıs (\"EventBliss\" veya \"Platform\") ve kayıtlı etkinlik hizmetleri ajansı (\"Ajans\"). \"Müşteri\", platform üzerinden rezervasyon yapan her gerçek veya tüzel kişidir.",
      preamble: { title: "Giriş ve kapsam", content: "EventBliss, etkinlik hizmetleri için çevrimiçi bir pazar yeri işletir. Tanımlar (Platform, Ajans, Müşteri, Rezervasyon, Yönlendirilmiş Müşteri) Almanca sürüme göre geçerlidir." },
      platformServices: { title: "Platform hizmetleri", content: "EventBliss, kamuya açık listelemeler, dijital rezervasyon akışı, çevrimiçi rezervasyonlar için Stripe üzerinden ödeme işleme, destek ve pazarlama sağlar. EventBliss yalnızca aracı olarak hareket eder." },
      agencyDuties: { title: "Ajans yükümlülükleri", content: "Uygun kalitede hizmet sunumu, tüm yasal ve vergi yükümlülüklerine uyum, profil ve takvim verilerini güncel tutma, iş günlerinde 24 saat içinde yanıt, KDV dahil bağlayıcı fiyatlar." },
      platformFee: { title: "Platform komisyonu", content: "EventBliss, ödeme yönteminden bağımsız olarak tüm rezervasyonlarda %10 komisyon alır. Çevrimiçi ödemede ödemeden önce otomatik kesinti. Yerinde ödemede Ajansın hizmetin verilmesinden sonraki 14 gün içinde komisyonu ödemesi gerekir." },
      paymentModes: { title: "Ödeme yöntemleri ve eşit muamele", content: "Hem çevrimiçi (Stripe) hem de yerinde ödemeler platform rezervasyonu olarak kabul edilir. Ödeme yöntemi seçimi Ajansı komisyon ödeme yükümlülüğünden muaf tutmaz. Müşterileri platform dışında ödemeye teşvik etmek yasaktır ve madde 6'nın ihlalini oluşturur." },
    },
    ar: {
      title: "اتفاقية الوكالة (EventBliss Partner Agreement)",
      lastUpdated: "آخر تحديث",
      rightsReserved: "جميع الحقوق محفوظة.",
      intro: "\"EventBliss\" هي علامة تجارية ومنتج لشركة MYFAMBLISS GROUP LTD، وهي شركة مؤسسة وفقًا لقانون جمهورية قبرص، ومقرها Gladstonos 12-14, 8046 بافوس، قبرص. النسخة الملزمة من هذه الاتفاقية هي الألمانية؛ تُقدم هذه الترجمة للأغراض الإعلامية فقط.",
      parties: "الأطراف: MYFAMBLISS GROUP LTD، Gladstonos 12-14, 8046 بافوس، قبرص (\"EventBliss\" أو \"المنصة\")، ووكالة خدمات الفعاليات المسجلة (\"الوكالة\"). \"العميل\" هو أي شخص طبيعي أو اعتباري يحجز عبر المنصة.",
      preamble: { title: "ديباجة ونطاق", content: "تدير EventBliss سوقًا إلكترونية لخدمات الفعاليات. تنطبق التعريفات (المنصة، الوكالة، العميل، الحجز، العميل المُحال) كما في النسخة الألمانية." },
      platformServices: { title: "خدمات المنصة", content: "توفر EventBliss قوائم عامة، وسير عمل حجز رقمي، ومعالجة مدفوعات عبر Stripe للحجوزات الإلكترونية، ودعمًا وتسويقًا. تعمل EventBliss كوسيط فقط." },
      agencyDuties: { title: "التزامات الوكالة", content: "تقديم خدمات بجودة مناسبة، الامتثال لجميع الالتزامات القانونية والضريبية، تحديث بيانات الملف الشخصي والتقويم، الرد على الاستفسارات خلال 24 ساعة في أيام العمل، أسعار ملزمة شاملة لضريبة القيمة المضافة." },
      platformFee: { title: "عمولة المنصة", content: "تفرض EventBliss عمولة قدرها 10% على جميع الحجوزات، بصرف النظر عن طريقة الدفع. للدفع الإلكتروني، يتم الخصم التلقائي قبل الصرف. للدفع في الموقع، يجب على الوكالة تحويل العمولة خلال 14 يومًا بعد تقديم الخدمة." },
      paymentModes: { title: "طرق الدفع والمعاملة المتساوية", content: "يتم الاعتراف بالمدفوعات الإلكترونية (Stripe) وفي الموقع كحجوزات منصة. لا يُعفي اختيار طريقة الدفع الوكالة من التزام دفع العمولة. يُحظر تشجيع العملاء على الدفع خارج المنصة ويُعدّ انتهاكًا للبند 6." },
    },
  }[loc];

  // These 7 warn-critical sections are kept concise but present (keys resolve)
  const notice = {
    es: "Consulte la versión alemana para el texto vinculante completo.",
    fr: "Veuillez consulter la version allemande pour le texte contraignant complet.",
    it: "Si prega di consultare la versione tedesca per il testo vincolante completo.",
    nl: "Raadpleeg de Duitse versie voor de volledige bindende tekst.",
    pl: "Pełny wiążący tekst znajduje się w wersji niemieckiej.",
    pt: "Consulte a versão alemã para o texto vinculativo completo.",
    tr: "Tam bağlayıcı metin için lütfen Almanca sürüme başvurun.",
    ar: "يرجى الرجوع إلى النسخة الألمانية للحصول على النص الكامل الملزم.",
  }[loc];

  const warnTitles = {
    es: { excl: "EXCLUSIVIDAD Y PROTECCIÓN ANTI-ELUSIÓN", period: "Periodo de exclusividad", prohibition: "Prohibición de elusión", dataPurpose: "Limitación de finalidad de los datos", penalty: "Cláusula penal", audit: "Derecho de auditoría", cancTitle: "Política de tasa de cancelación", window: "Periodo de referencia", warning: "Advertencia temprana (15%)", suspension: "Suspensión (20%)", exceptions: "Excepciones" },
    fr: { excl: "EXCLUSIVITÉ ET PROTECTION ANTI-CONTOURNEMENT", period: "Période d'exclusivité", prohibition: "Interdiction de contournement", dataPurpose: "Limitation de finalité des données", penalty: "Clause pénale", audit: "Droit d'audit", cancTitle: "Taux d'annulation", window: "Période de référence", warning: "Alerte précoce (15%)", suspension: "Suspension (20%)", exceptions: "Exceptions" },
    it: { excl: "ESCLUSIVITÀ E PROTEZIONE ANTI-ELUSIONE", period: "Periodo di esclusività", prohibition: "Divieto di elusione", dataPurpose: "Limitazione di finalità dei dati", penalty: "Penale contrattuale", audit: "Diritto di audit", cancTitle: "Tasso di cancellazione", window: "Periodo di riferimento", warning: "Allerta precoce (15%)", suspension: "Sospensione (20%)", exceptions: "Eccezioni" },
    nl: { excl: "EXCLUSIVITEIT EN BESCHERMING TEGEN OMZEILING", period: "Exclusiviteitsperiode", prohibition: "Omzeilingsverbod", dataPurpose: "Doelbinding klantgegevens", penalty: "Boetebeding", audit: "Auditrecht", cancTitle: "Annuleringspercentage", window: "Referentieperiode", warning: "Vroegtijdige waarschuwing (15%)", suspension: "Opschorting (20%)", exceptions: "Uitzonderingen" },
    pl: { excl: "WYŁĄCZNOŚĆ I OCHRONA PRZED OBEJŚCIEM", period: "Okres wyłączności", prohibition: "Zakaz obchodzenia", dataPurpose: "Ograniczenie celu danych", penalty: "Kara umowna", audit: "Prawo audytu", cancTitle: "Wskaźnik anulowań", window: "Okres rozliczeniowy", warning: "Wczesne ostrzeżenie (15%)", suspension: "Zawieszenie (20%)", exceptions: "Wyjątki" },
    pt: { excl: "EXCLUSIVIDADE E PROTEÇÃO ANTI-CONTORNO", period: "Período de exclusividade", prohibition: "Proibição de contorno", dataPurpose: "Limitação de finalidade dos dados", penalty: "Cláusula penal", audit: "Direito de auditoria", cancTitle: "Taxa de cancelamento", window: "Período de referência", warning: "Aviso prévio (15%)", suspension: "Suspensão (20%)", exceptions: "Exceções" },
    tr: { excl: "MÜNHASIRLIK VE ATLATMA KARŞITI KORUMA", period: "Münhasırlık süresi", prohibition: "Atlatma yasağı", dataPurpose: "Veri amaç sınırlaması", penalty: "Cezai şart", audit: "Denetim hakkı", cancTitle: "İptal oranı", window: "Referans dönemi", warning: "Erken uyarı (%15)", suspension: "Askıya alma (%20)", exceptions: "İstisnalar" },
    ar: { excl: "الحصرية والحماية من التحايل", period: "فترة الحصرية", prohibition: "حظر التحايل", dataPurpose: "تقييد غرض البيانات", penalty: "شرط جزائي", audit: "حق التدقيق", cancTitle: "معدل الإلغاء", window: "الفترة المرجعية", warning: "إنذار مبكر (15٪)", suspension: "تعليق (20٪)", exceptions: "استثناءات" },
  }[loc];

  const penaltyBrief = {
    es: "Sanción contractual: 2× valor de la reserva (mín. 500 €) + 10.000 € por infracción.",
    fr: "Pénalité contractuelle : 2× la valeur de la réservation (min. 500 €) + 10 000 € par infraction.",
    it: "Penale contrattuale: 2× valore della prenotazione (min. 500 €) + 10.000 € per violazione.",
    nl: "Contractuele boete: 2× boekingswaarde (min. € 500) + € 10.000 per overtreding.",
    pl: "Kara umowna: 2× wartość rezerwacji (min. 500 €) + 10 000 € za każde naruszenie.",
    pt: "Sanção contratual: 2× valor da reserva (mín. 500 €) + 10.000 € por infração.",
    tr: "Cezai şart: rezervasyon değerinin 2 katı (min. 500 €) + ihlal başına 10.000 €.",
    ar: "شرط جزائي: ضعف قيمة الحجز (بحد أدنى 500 يورو) + 10,000 يورو لكل مخالفة.",
  }[loc];

  return {
    ...dict,
    exclusivity: {
      title: warnTitles.excl,
      leadIn: notice,
      period: { title: warnTitles.period, content: "18 " + ({ es: "meses", fr: "mois", it: "mesi", nl: "maanden", pl: "miesięcy", pt: "meses", tr: "ay", ar: "شهرًا" }[loc]) + " — " + notice },
      prohibition: { title: warnTitles.prohibition, content: notice },
      dataPurpose: { title: warnTitles.dataPurpose, content: "Art. 5 GDPR — " + notice },
      penalty: { title: warnTitles.penalty, content: penaltyBrief + " " + notice },
      audit: { title: warnTitles.audit, content: notice },
    },
    cancellationRates: {
      title: warnTitles.cancTitle,
      leadIn: notice,
      window: { title: warnTitles.window, content: "30 " + ({ es: "días", fr: "jours", it: "giorni", nl: "dagen", pl: "dni", pt: "dias", tr: "gün", ar: "يومًا" }[loc]) + " — " + notice },
      warning: { title: warnTitles.warning, content: "> 15% — " + notice },
      suspension: { title: warnTitles.suspension, content: "> 20% — " + notice },
      exceptions: { title: warnTitles.exceptions, content: notice },
    },
    qualityCriteria: { title: { es: "Calidad y listado", fr: "Qualité et listing", it: "Qualità e listing", nl: "Kwaliteit en vermelding", pl: "Jakość i listing", pt: "Qualidade e listagem", tr: "Kalite ve listeleme", ar: "الجودة والإدراج" }[loc], content: notice },
    liability: { title: { es: "Responsabilidad", fr: "Responsabilité", it: "Responsabilità", nl: "Aansprakelijkheid", pl: "Odpowiedzialność", pt: "Responsabilidade", tr: "Sorumluluk", ar: "المسؤولية" }[loc], content: notice },
    dataProtection: { title: { es: "Protección de datos", fr: "Protection des données", it: "Protezione dei dati", nl: "Gegevensbescherming", pl: "Ochrona danych", pt: "Proteção de dados", tr: "Veri koruma", ar: "حماية البيانات" }[loc], content: "GDPR Art. 28 — " + notice },
    termTermination: { title: { es: "Duración y terminación", fr: "Durée et résiliation", it: "Durata e risoluzione", nl: "Looptijd en beëindiging", pl: "Czas trwania i rozwiązanie", pt: "Duração e rescisão", tr: "Süre ve fesih", ar: "المدة والإنهاء" }[loc], content: notice },
    finalProvisions: { title: { es: "Disposiciones finales", fr: "Dispositions finales", it: "Disposizioni finali", nl: "Slotbepalingen", pl: "Postanowienia końcowe", pt: "Disposições finais", tr: "Son hükümler", ar: "أحكام ختامية" }[loc], content: "Cyprus law + " + notice },
    compliance: { title: { es: "Contacto Compliance", fr: "Contact Compliance", it: "Contatto Compliance", nl: "Compliance-contact", pl: "Kontakt Compliance", pt: "Contacto Compliance", tr: "Uyum iletişimi", ar: "الامتثال" }[loc], content: "compliance@event-bliss.com" },
  };
}

// -----------------------------------------------------------------------------
// Merge & write
// -----------------------------------------------------------------------------

for (const loc of LOCALES) {
  const path = resolve(`src/i18n/locales/${loc}.json`);
  const data = JSON.parse(readFileSync(path, "utf-8"));
  data.legal = data.legal || {};

  // --- terms: add new subsections + patch lastUpdatedDate / intro / governingLaw ---
  const t = T[loc];
  const terms = data.legal.terms || {};
  terms.lastUpdatedDate = t.lastUpdatedDate;
  terms.intro = t.intro;
  terms.governingLaw = { ...(terms.governingLaw || {}), content: t.governingLaw };
  terms.booking_process = t.booking_process;
  terms.payment_methods = t.payment_methods;
  terms.cancellation_refund = t.cancellation_refund;
  terms.off_platform_bypass = t.off_platform_bypass;
  data.legal.terms = terms;

  // --- agency_agreement: full subtree ---
  data.legal.agency_agreement = buildAgencyAgreement(loc);

  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`✓ ${loc}`);
}

console.log("\nAll locales updated.");
