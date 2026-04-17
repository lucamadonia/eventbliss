/**
 * Multi-language outreach email templates + country-to-language mapping.
 * Used by AkquiseCampaignManager, AkquiseComposeEmail, and AkquiseTemplateEditor.
 */

// ---------------------------------------------------------------------------
// Country → Language mapping
// ---------------------------------------------------------------------------

const COUNTRY_LANG_MAP: Record<string, string> = {
  // German-speaking
  Deutschland: "de", Germany: "de", Österreich: "de", Austria: "de",
  Schweiz: "de", Switzerland: "de", Liechtenstein: "de", Luxemburg: "de",
  // English-speaking
  "United Kingdom": "en", UK: "en", England: "en", Ireland: "en",
  "United States": "en", USA: "en", Canada: "en", Australia: "en",
  // Spanish
  España: "es", Spain: "es", Spanien: "es", Mexiko: "es", Mexico: "es",
  Argentinien: "es", Argentina: "es", Kolumbien: "es", Colombia: "es",
  // French
  France: "fr", Frankreich: "fr", Belgien: "fr", Belgium: "fr",
  // Italian
  Italia: "it", Italy: "it", Italien: "it",
  // Dutch
  Niederlande: "nl", Netherlands: "nl", "The Netherlands": "nl", Holland: "nl",
  // Portuguese
  Portugal: "pt", Brasilien: "pt", Brazil: "pt",
  // Polish
  Polen: "pl", Poland: "pl",
  // Turkish
  Türkei: "tr", Turkey: "tr", Turkei: "tr",
  // Arabic
  "Vereinigte Arabische Emirate": "ar", UAE: "ar",
};

/**
 * Detect language from country name or country_code.
 * Falls back to "de" (German) if unknown.
 */
export function detectLanguageFromCountry(country?: string, countryCode?: string): string {
  if (country && COUNTRY_LANG_MAP[country]) return COUNTRY_LANG_MAP[country];
  if (countryCode) {
    const codeMap: Record<string, string> = {
      DE: "de", AT: "de", CH: "de", LI: "de", LU: "de",
      GB: "en", IE: "en", US: "en", CA: "en", AU: "en",
      ES: "es", MX: "es", AR: "es", CO: "es",
      FR: "fr", BE: "fr",
      IT: "it",
      NL: "nl",
      PT: "pt", BR: "pt",
      PL: "pl",
      TR: "tr",
      AE: "ar",
    };
    if (codeMap[countryCode.toUpperCase()]) return codeMap[countryCode.toUpperCase()];
  }
  return "de";
}

export const SUPPORTED_OUTREACH_LANGS = ["de", "en", "es", "fr", "it", "nl", "pt", "pl", "tr"] as const;
export type OutreachLang = (typeof SUPPORTED_OUTREACH_LANGS)[number];

export const LANG_LABELS: Record<string, string> = {
  de: "Deutsch", en: "English", es: "Español", fr: "Français",
  it: "Italiano", nl: "Nederlands", pt: "Português", pl: "Polski", tr: "Türkçe",
};

// ---------------------------------------------------------------------------
// Multi-language templates
// ---------------------------------------------------------------------------

export interface OutreachTemplate {
  subject: string;
  body: string;
}

export interface OutreachTemplateSet {
  stage1: OutreachTemplate;
  stage2: OutreachTemplate;
  stage3: OutreachTemplate;
}

type TemplateStyle = "plain" | "html";

const TEMPLATES: Record<string, Record<TemplateStyle, OutreachTemplateSet>> = {
  de: {
    plain: {
      stage1: {
        subject: "Kurze Frage an {{agency_name}}",
        body: `<p>Hallo {{contact_name}},</p>
<p>ich bin {{sender_name}} und arbeite bei EventBliss — einer neuen Event-Plattform, die Agenturen wie euch direkt mit Event-Planern verbindet.</p>
<p>Ganz kurz: Wir listen aktuell die ersten 150 Agenturen komplett kostenlos in unserem Marketplace. Keine Gebühren, keine Provision, kein Abo. Euer Profil + Services wären sofort sichtbar für tausende Event-Planer, und unsere KI empfiehlt euch automatisch bei passenden Anfragen.</p>
<p>Wir stehen noch am Anfang (investorenfinanziert, Sitz in Zypern), aber genau deshalb profitieren die ersten Partner am meisten — ihr seid von Tag 1 dabei.</p>
<p>Hätte {{agency_name}} Interesse? Ich kann euch in 5 Minuten freischalten: {{signup_url}}</p>
<p>Oder antwortet einfach kurz auf diese Mail — ich melde mich persönlich.</p>
<p>Beste Grüße<br/>{{sender_name}}</p>`,
      },
      stage2: {
        subject: "Nochmal kurz — {{contact_name}}",
        body: `<p>Hey {{contact_name}},</p>
<p>ich hatte euch letzte Woche wegen EventBliss geschrieben. Wollte nur kurz nachhaken ob die Mail angekommen ist.</p>
<p>Mittlerweile sind schon einige Agenturen aus {{city}} mit dabei. Das Feedback ist super — vor allem die automatische KI-Empfehlung an Event-Planer kommt richtig gut an.</p>
<p>Die kostenlosen Plätze sind begrenzt (erste 150). Falls ihr Interesse habt: {{signup_url}}</p>
<p>Oder kurz antworten — auch ein "Kein Interesse" ist völlig okay. :)</p>
<p>Viele Grüße<br/>{{sender_name}}</p>`,
      },
      stage3: {
        subject: "Letzte Nachricht von mir — {{agency_name}}",
        body: `<p>Hallo {{contact_name}},</p>
<p>versprochen, dies ist meine letzte Mail zu dem Thema.</p>
<p>Falls {{agency_name}} irgendwann mal Lust hat reinzuschauen — der Link bleibt aktiv: {{signup_url}}</p>
<p>Und hier könnt ihr sehen wie andere Agenturen bei uns aussehen: https://event-bliss.com/marketplace</p>
<p>Ich wünsche euch weiterhin viel Erfolg!</p>
<p>Beste Grüße<br/>{{sender_name}}</p>`,
      },
    },
    html: {
      stage1: {
        subject: "{{agency_name}} — kostenlos an 100.000+ Event-Planer empfohlen werden? 🚀",
        body: `<h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#fff;">Hallo {{contact_name}},</h2>
<p style="font-size:15px;line-height:1.7;color:#e2e8f0;">wir sind <strong>EventBliss</strong> — eine <strong>investorengeförderte Event-Tech-Plattform</strong> mit der Mission, das Event-Game in Europa auf ein komplett neues Level zu bringen.</p>
<p style="font-size:15px;line-height:1.7;color:#e2e8f0;">Unsere KI empfiehlt eure Services <strong>automatisch</strong> an passende Events — basierend auf Stadt, Budget, Teilnehmerzahl und Eventtyp.</p>
<div style="background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:20px;margin:20px 0;">
  <p style="margin:0 0 8px;font-weight:800;color:#a855f7;font-size:14px;">🎁 EXKLUSIV FÜR DIE ERSTEN 150 AGENTUREN:</p>
  <ul style="margin:0;padding-left:20px;color:#e2e8f0;font-size:14px;line-height:1.8;">
    <li><strong>Komplett kostenloser</strong> Premium-Eintrag</li>
    <li>Automatische <strong>KI-Empfehlung</strong> an 100.000+ Planer</li>
    <li>Eigenes <strong>Booking-Portal</strong> mit Stripe</li>
    <li>Keine Provision, kein Abo, <strong>keine versteckten Kosten</strong></li>
  </ul>
</div>
<div style="text-align:center;margin:28px 0;">
  <a href="{{signup_url}}" style="display:inline-block;padding:16px 36px;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;border-radius:12px;font-weight:800;font-size:15px;">Jetzt kostenlos listen lassen →</a>
</div>`,
      },
      stage2: {
        subject: "Kurzes Follow-up — {{contact_name}}, Gratis-Plätze fast voll",
        body: `<h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#fff;">Hallo {{contact_name}},</h2>
<p style="font-size:15px;line-height:1.7;color:#e2e8f0;">nur ein kurzes Follow-up zu unserem Angebot für {{agency_name}}. Zahlreiche Agenturen in {{city}} nutzen EventBliss bereits.</p>
<div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:16px;margin:20px 0;text-align:center;">
  <p style="margin:0;font-weight:800;color:#f59e0b;font-size:18px;">⏳ Noch wenige Gratis-Plätze</p>
</div>
<div style="text-align:center;margin:24px 0;">
  <a href="{{signup_url}}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;text-decoration:none;border-radius:12px;font-weight:800;">Kostenlos starten →</a>
</div>`,
      },
      stage3: {
        subject: "Letzte Nachricht — die Einladung bleibt offen ✉️",
        body: `<h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#fff;">Hallo {{contact_name}},</h2>
<p style="font-size:15px;line-height:1.7;color:#e2e8f0;">dies ist unsere letzte Nachricht. Die Einladung bleibt offen:</p>
<p style="font-size:15px;line-height:1.7;color:#e2e8f0;"><a href="https://event-bliss.com/marketplace" style="color:#a855f7;">Marketplace ansehen →</a></p>
<div style="text-align:center;margin:24px 0;">
  <a href="{{signup_url}}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6b7280,#374151);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;">Doch noch dabei sein →</a>
</div>`,
      },
    },
  },

  en: {
    plain: {
      stage1: {
        subject: "Quick question for {{agency_name}}",
        body: `<p>Hi {{contact_name}},</p>
<p>I'm {{sender_name}} from EventBliss — a new event platform that connects agencies like yours directly with event planners.</p>
<p>Quick pitch: We're listing the first 150 agencies completely free in our marketplace. No fees, no commission, no subscription. Your profile + services would be instantly visible to thousands of event planners, and our AI recommends you automatically for matching events.</p>
<p>We're early stage (investor-backed, based in Cyprus), which is exactly why the first partners benefit the most — you'd be in from day one.</p>
<p>Would {{agency_name}} be interested? I can set you up in 5 minutes: {{signup_url}}</p>
<p>Or just reply to this email — I'll get back to you personally.</p>
<p>Best regards<br/>{{sender_name}}</p>`,
      },
      stage2: {
        subject: "Quick follow-up — {{contact_name}}",
        body: `<p>Hey {{contact_name}},</p>
<p>I reached out last week about EventBliss. Just wanted to check if you saw my email.</p>
<p>Several agencies in {{city}} have already joined. The feedback has been great — especially the automatic AI recommendation to event planners.</p>
<p>Free spots are limited (first 150). If you're interested: {{signup_url}}</p>
<p>Or just reply — a "not interested" is totally fine too. :)</p>
<p>Cheers<br/>{{sender_name}}</p>`,
      },
      stage3: {
        subject: "Last message from me — {{agency_name}}",
        body: `<p>Hi {{contact_name}},</p>
<p>Promise, this is my last email about this.</p>
<p>If {{agency_name}} ever wants to check it out — the link stays active: {{signup_url}}</p>
<p>And here's how other agencies look on our platform: https://event-bliss.com/marketplace</p>
<p>Wishing you continued success!</p>
<p>Best<br/>{{sender_name}}</p>`,
      },
    },
    html: {
      stage1: {
        subject: "{{agency_name}} — get recommended to 100,000+ event planners for free? 🚀",
        body: `<h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#fff;">Hi {{contact_name}},</h2>
<p style="font-size:15px;line-height:1.7;color:#e2e8f0;">We're <strong>EventBliss</strong> — an <strong>investor-backed event-tech platform</strong> on a mission to revolutionize event planning across Europe.</p>
<p style="font-size:15px;line-height:1.7;color:#e2e8f0;">Our AI recommends your services <strong>automatically</strong> to matching events — based on city, budget, group size, and event type.</p>
<div style="background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);border-radius:12px;padding:20px;margin:20px 0;">
  <p style="margin:0 0 8px;font-weight:800;color:#a855f7;font-size:14px;">🎁 EXCLUSIVE FOR THE FIRST 150 AGENCIES:</p>
  <ul style="margin:0;padding-left:20px;color:#e2e8f0;font-size:14px;line-height:1.8;">
    <li><strong>Completely free</strong> premium listing</li>
    <li>Automatic <strong>AI recommendation</strong> to 100,000+ planners</li>
    <li>Your own <strong>booking portal</strong> with Stripe</li>
    <li>No commission, no subscription, <strong>no hidden costs</strong></li>
  </ul>
</div>
<div style="text-align:center;margin:28px 0;">
  <a href="{{signup_url}}" style="display:inline-block;padding:16px 36px;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;border-radius:12px;font-weight:800;font-size:15px;">List for free now →</a>
</div>`,
      },
      stage2: {
        subject: "Quick follow-up — {{contact_name}}, free spots filling up",
        body: `<h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#fff;">Hi {{contact_name}},</h2>
<p style="font-size:15px;line-height:1.7;color:#e2e8f0;">Just a quick follow-up on our offer for {{agency_name}}. Multiple agencies in {{city}} are already using EventBliss.</p>
<div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:16px;margin:20px 0;text-align:center;">
  <p style="margin:0;font-weight:800;color:#f59e0b;font-size:18px;">⏳ Limited free spots remaining</p>
</div>
<div style="text-align:center;margin:24px 0;">
  <a href="{{signup_url}}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;text-decoration:none;border-radius:12px;font-weight:800;">Get started free →</a>
</div>`,
      },
      stage3: {
        subject: "Last message — the invitation stays open ✉️",
        body: `<h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#fff;">Hi {{contact_name}},</h2>
<p style="font-size:15px;line-height:1.7;color:#e2e8f0;">This is our last message. The invitation stays open:</p>
<p style="font-size:15px;line-height:1.7;color:#e2e8f0;"><a href="https://event-bliss.com/marketplace" style="color:#a855f7;">See our marketplace →</a></p>
<div style="text-align:center;margin:24px 0;">
  <a href="{{signup_url}}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6b7280,#374151);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;">Join after all →</a>
</div>`,
      },
    },
  },

  es: {
    plain: {
      stage1: {
        subject: "Pregunta rápida para {{agency_name}}",
        body: `<p>Hola {{contact_name}},</p>
<p>Soy {{sender_name}} de EventBliss — una nueva plataforma de eventos que conecta agencias como la tuya directamente con organizadores de eventos.</p>
<p>En resumen: Estamos listando las primeras 150 agencias completamente gratis en nuestro marketplace. Sin comisiones, sin suscripción. Tu perfil y servicios serían visibles al instante para miles de organizadores, y nuestra IA te recomienda automáticamente para eventos relevantes.</p>
<p>Estamos en fase inicial (respaldados por inversores, con sede en Chipre), por eso los primeros socios son los que más se benefician.</p>
<p>¿Le interesaría a {{agency_name}}? Puedo activarte en 5 minutos: {{signup_url}}</p>
<p>O simplemente responde a este email — me pondré en contacto personalmente.</p>
<p>Saludos<br/>{{sender_name}}</p>`,
      },
      stage2: {
        subject: "Seguimiento rápido — {{contact_name}}",
        body: `<p>Hola {{contact_name}},</p>
<p>Te escribí la semana pasada sobre EventBliss. Solo quería comprobar si recibiste mi email.</p>
<p>Varias agencias en {{city}} ya se han unido. Los comentarios son muy positivos.</p>
<p>Las plazas gratuitas son limitadas (primeras 150): {{signup_url}}</p>
<p>Saludos<br/>{{sender_name}}</p>`,
      },
      stage3: {
        subject: "Último mensaje — {{agency_name}}",
        body: `<p>Hola {{contact_name}},</p>
<p>Prometido, este es mi último email sobre esto.</p>
<p>Si {{agency_name}} quiere echar un vistazo — el enlace sigue activo: {{signup_url}}</p>
<p>¡Os deseo mucho éxito!</p>
<p>Saludos<br/>{{sender_name}}</p>`,
      },
    },
    html: {
      stage1: { subject: "{{agency_name}} — ¿recomendados gratis a 100.000+ organizadores? 🚀", body: "" },
      stage2: { subject: "Seguimiento — {{contact_name}}, plazas gratuitas limitadas", body: "" },
      stage3: { subject: "Último mensaje — la invitación sigue abierta ✉️", body: "" },
    },
  },

  fr: {
    plain: {
      stage1: {
        subject: "Petite question pour {{agency_name}}",
        body: `<p>Bonjour {{contact_name}},</p>
<p>Je suis {{sender_name}} d'EventBliss — une nouvelle plateforme événementielle qui connecte les agences comme la vôtre directement avec les organisateurs d'événements.</p>
<p>En bref : Nous listons les 150 premières agences gratuitement dans notre marketplace. Pas de frais, pas de commission, pas d'abonnement. Votre profil serait visible par des milliers d'organisateurs, et notre IA vous recommande automatiquement.</p>
<p>Nous sommes en phase de démarrage (financés par des investisseurs, basés à Chypre), c'est pourquoi les premiers partenaires en profitent le plus.</p>
<p>{{agency_name}} serait-elle intéressée ? Je peux vous activer en 5 minutes : {{signup_url}}</p>
<p>Ou répondez simplement à cet email.</p>
<p>Cordialement<br/>{{sender_name}}</p>`,
      },
      stage2: {
        subject: "Petit suivi — {{contact_name}}",
        body: `<p>Bonjour {{contact_name}},</p>
<p>Je vous avais contacté la semaine dernière concernant EventBliss. Juste un petit suivi.</p>
<p>Plusieurs agences à {{city}} nous ont déjà rejoint. Les retours sont très positifs.</p>
<p>Les places gratuites sont limitées (150 premières) : {{signup_url}}</p>
<p>Cordialement<br/>{{sender_name}}</p>`,
      },
      stage3: {
        subject: "Dernier message — {{agency_name}}",
        body: `<p>Bonjour {{contact_name}},</p>
<p>Promis, c'est mon dernier email à ce sujet.</p>
<p>Si {{agency_name}} souhaite jeter un œil — le lien reste actif : {{signup_url}}</p>
<p>Je vous souhaite beaucoup de succès !</p>
<p>Cordialement<br/>{{sender_name}}</p>`,
      },
    },
    html: {
      stage1: { subject: "{{agency_name}} — recommandés gratuitement à 100 000+ organisateurs ? 🚀", body: "" },
      stage2: { subject: "Suivi — {{contact_name}}, places gratuites bientôt épuisées", body: "" },
      stage3: { subject: "Dernier message — l'invitation reste ouverte ✉️", body: "" },
    },
  },

  it: {
    plain: {
      stage1: {
        subject: "Domanda veloce per {{agency_name}}",
        body: `<p>Ciao {{contact_name}},</p>
<p>Sono {{sender_name}} di EventBliss — una nuova piattaforma per eventi che collega agenzie come la vostra direttamente con gli organizzatori.</p>
<p>In breve: Stiamo inserendo le prime 150 agenzie gratuitamente nel nostro marketplace. Nessun costo, nessuna commissione. Il vostro profilo sarebbe visibile a migliaia di organizzatori, e la nostra IA vi raccomanda automaticamente.</p>
<p>Siamo all'inizio (finanziati da investitori, con sede a Cipro), per questo i primi partner ne beneficiano di più.</p>
<p>{{agency_name}} sarebbe interessata? Posso attivarvi in 5 minuti: {{signup_url}}</p>
<p>Cordiali saluti<br/>{{sender_name}}</p>`,
      },
      stage2: {
        subject: "Breve follow-up — {{contact_name}}",
        body: `<p>Ciao {{contact_name}},</p>
<p>Vi avevo scritto la settimana scorsa riguardo EventBliss. Solo un breve follow-up.</p>
<p>Diverse agenzie a {{city}} si sono già unite. I posti gratuiti sono limitati: {{signup_url}}</p>
<p>Saluti<br/>{{sender_name}}</p>`,
      },
      stage3: {
        subject: "Ultimo messaggio — {{agency_name}}",
        body: `<p>Ciao {{contact_name}},</p>
<p>Promesso, questa è la mia ultima email. Il link resta attivo: {{signup_url}}</p>
<p>Vi auguro tanto successo!</p>
<p>Saluti<br/>{{sender_name}}</p>`,
      },
    },
    html: {
      stage1: { subject: "{{agency_name}} — raccomandati gratis a 100.000+ organizzatori? 🚀", body: "" },
      stage2: { subject: "Follow-up — {{contact_name}}", body: "" },
      stage3: { subject: "Ultimo messaggio ✉️", body: "" },
    },
  },

  nl: {
    plain: {
      stage1: {
        subject: "Korte vraag voor {{agency_name}}",
        body: `<p>Hallo {{contact_name}},</p>
<p>Ik ben {{sender_name}} van EventBliss — een nieuw evenementenplatform dat bureaus zoals jullie direct verbindt met evenementplanners.</p>
<p>Kort gezegd: We listen de eerste 150 bureaus volledig gratis in onze marketplace. Geen kosten, geen commissie. Jullie profiel is direct zichtbaar voor duizenden planners, en onze AI beveelt jullie automatisch aan.</p>
<p>We staan aan het begin (investeerders-gefinancierd, gevestigd in Cyprus), daarom profiteren de eerste partners het meest.</p>
<p>Zou {{agency_name}} interesse hebben? Ik kan jullie in 5 minuten activeren: {{signup_url}}</p>
<p>Met vriendelijke groet<br/>{{sender_name}}</p>`,
      },
      stage2: {
        subject: "Even opvolgen — {{contact_name}}",
        body: `<p>Hallo {{contact_name}},</p>
<p>Ik had vorige week gemaild over EventBliss. Kort even checken of de mail was aangekomen.</p>
<p>Meerdere bureaus in {{city}} doen al mee. Gratis plaatsen zijn beperkt: {{signup_url}}</p>
<p>Groeten<br/>{{sender_name}}</p>`,
      },
      stage3: {
        subject: "Laatste bericht — {{agency_name}}",
        body: `<p>Hallo {{contact_name}},</p>
<p>Beloofd, dit is mijn laatste mail. De link blijft actief: {{signup_url}}</p>
<p>Veel succes gewenst!</p>
<p>Groeten<br/>{{sender_name}}</p>`,
      },
    },
    html: {
      stage1: { subject: "{{agency_name}} — gratis aanbevolen aan 100.000+ planners? 🚀", body: "" },
      stage2: { subject: "Opvolging — {{contact_name}}", body: "" },
      stage3: { subject: "Laatste bericht ✉️", body: "" },
    },
  },

  tr: {
    plain: {
      stage1: {
        subject: "{{agency_name}} için kısa bir soru",
        body: `<p>Merhaba {{contact_name}},</p>
<p>Ben {{sender_name}}, EventBliss'ten — etkinlik ajanslarını doğrudan etkinlik planlayıcılarıyla buluşturan yeni bir platform.</p>
<p>Kısaca: İlk 150 ajansı tamamen ücretsiz olarak marketplace'imize ekliyoruz. Ücret yok, komisyon yok. Profiliniz binlerce planlayıcı tarafından görülebilir ve yapay zekamız sizi otomatik olarak önerir.</p>
<p>{{agency_name}} ilgilenir mi? 5 dakikada aktifleştirebilirim: {{signup_url}}</p>
<p>Saygılarımla<br/>{{sender_name}}</p>`,
      },
      stage2: {
        subject: "Kısa takip — {{contact_name}}",
        body: `<p>Merhaba {{contact_name}},</p>
<p>Geçen hafta EventBliss hakkında yazmıştım. {{city}} bölgesindeki birçok ajans zaten katıldı.</p>
<p>Ücretsiz yerler sınırlı: {{signup_url}}</p>
<p>Saygılarımla<br/>{{sender_name}}</p>`,
      },
      stage3: {
        subject: "Son mesaj — {{agency_name}}",
        body: `<p>Merhaba {{contact_name}},</p>
<p>Söz, bu konudaki son mailim. Link aktif kalıyor: {{signup_url}}</p>
<p>Başarılar dilerim!</p>
<p>Saygılarımla<br/>{{sender_name}}</p>`,
      },
    },
    html: {
      stage1: { subject: "{{agency_name}} — 100.000+ planlayıcıya ücretsiz önerilmek ister misiniz? 🚀", body: "" },
      stage2: { subject: "Takip — {{contact_name}}", body: "" },
      stage3: { subject: "Son mesaj ✉️", body: "" },
    },
  },

  pt: {
    plain: {
      stage1: {
        subject: "Pergunta rápida para {{agency_name}}",
        body: `<p>Olá {{contact_name}},</p>
<p>Sou {{sender_name}} da EventBliss — uma nova plataforma de eventos que conecta agências como a sua diretamente com organizadores.</p>
<p>Resumidamente: Estamos listando as primeiras 150 agências gratuitamente no nosso marketplace. Sem taxas, sem comissão. O vosso perfil ficaria visível para milhares de organizadores, e a nossa IA recomenda-vos automaticamente.</p>
<p>{{agency_name}} teria interesse? Posso ativar em 5 minutos: {{signup_url}}</p>
<p>Cumprimentos<br/>{{sender_name}}</p>`,
      },
      stage2: {
        subject: "Seguimento rápido — {{contact_name}}",
        body: `<p>Olá {{contact_name}},</p>
<p>Escrevi na semana passada sobre EventBliss. Várias agências em {{city}} já aderiram.</p>
<p>Vagas gratuitas limitadas: {{signup_url}}</p>
<p>Cumprimentos<br/>{{sender_name}}</p>`,
      },
      stage3: {
        subject: "Última mensagem — {{agency_name}}",
        body: `<p>Olá {{contact_name}},</p>
<p>Prometo que esta é a última. O link fica ativo: {{signup_url}}</p>
<p>Desejo muito sucesso!</p>
<p>Cumprimentos<br/>{{sender_name}}</p>`,
      },
    },
    html: {
      stage1: { subject: "{{agency_name}} — recomendados grátis a 100.000+ organizadores? 🚀", body: "" },
      stage2: { subject: "Seguimento — {{contact_name}}", body: "" },
      stage3: { subject: "Última mensagem ✉️", body: "" },
    },
  },

  pl: {
    plain: {
      stage1: {
        subject: "Krótkie pytanie do {{agency_name}}",
        body: `<p>Cześć {{contact_name}},</p>
<p>Jestem {{sender_name}} z EventBliss — nowej platformy eventowej, która łączy agencje takie jak Wasza bezpośrednio z organizatorami wydarzeń.</p>
<p>W skrócie: Pierwsze 150 agencji dodajemy całkowicie za darmo do naszego marketplace'u. Bez opłat, bez prowizji. Wasz profil byłby widoczny dla tysięcy organizatorów, a nasza AI poleca Was automatycznie.</p>
<p>Czy {{agency_name}} byłaby zainteresowana? Mogę aktywować w 5 minut: {{signup_url}}</p>
<p>Pozdrawiam<br/>{{sender_name}}</p>`,
      },
      stage2: {
        subject: "Krótki follow-up — {{contact_name}}",
        body: `<p>Cześć {{contact_name}},</p>
<p>Pisałem w zeszłym tygodniu o EventBliss. Kilka agencji z {{city}} już dołączyło.</p>
<p>Darmowe miejsca są ograniczone: {{signup_url}}</p>
<p>Pozdrawiam<br/>{{sender_name}}</p>`,
      },
      stage3: {
        subject: "Ostatnia wiadomość — {{agency_name}}",
        body: `<p>Cześć {{contact_name}},</p>
<p>Obiecuję, to mój ostatni mail. Link pozostaje aktywny: {{signup_url}}</p>
<p>Życzę powodzenia!</p>
<p>Pozdrawiam<br/>{{sender_name}}</p>`,
      },
    },
    html: {
      stage1: { subject: "{{agency_name}} — darmowa rekomendacja dla 100 000+ organizatorów? 🚀", body: "" },
      stage2: { subject: "Follow-up — {{contact_name}}", body: "" },
      stage3: { subject: "Ostatnia wiadomość ✉️", body: "" },
    },
  },
};

/**
 * Get templates for a language + style. Falls back to English → German.
 */
export function getOutreachTemplates(lang: string, style: TemplateStyle): OutreachTemplateSet {
  const l = lang.slice(0, 2).toLowerCase();
  const t = TEMPLATES[l]?.[style] ?? TEMPLATES.en?.[style] ?? TEMPLATES.de[style];
  // If HTML body is empty (some languages only have plain), fall back to German HTML
  if (style === "html" && !t.stage1.body) {
    return TEMPLATES.de.html;
  }
  return t;
}

/**
 * Get all available languages that have templates.
 */
export function getAvailableTemplateLangs(): Array<{ code: string; label: string }> {
  return Object.keys(TEMPLATES).map((code) => ({
    code,
    label: LANG_LABELS[code] || code.toUpperCase(),
  }));
}
