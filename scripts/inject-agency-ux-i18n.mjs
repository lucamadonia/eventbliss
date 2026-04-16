import fs from "node:fs";
import path from "node:path";

const LOCALES_DIR = path.resolve("src/i18n/locales");

const T = {
  de: {
    welcome: {
      title: "Herzlich willkommen!",
      subtitle: "Dein Starter-Paket ist aktiv. Entdecke alle Module in der Sidebar \u2014 locked Module kannst du jederzeit per Upgrade freischalten.",
      ctaPricing: "Upgrade-Optionen ansehen",
      dismiss: "Sp\u00E4ter",
    },
    sidebar: {
      upgradePill: "Upgrade",
      upgradeToPro: "Auf Professional",
      upgradeToEnt: "Auf Enterprise",
      starterTagline: "Schalte 6 weitere Module frei",
      proTagline: "Command Center f\u00FCr Marktf\u00FChrer",
    },
    celebration: {
      title: "Willkommen in {{tier}}!",
      subtitle: "{{count}} neue Module sind jetzt freigeschaltet.",
      cta: "Los geht\u2019s",
      invoice: "Deine n\u00E4chste Rechnung findest du im Stripe Customer Portal.",
    },
    landingSection: {
      badge: "F\u00FCR AGENTUREN",
      title1: "Du bist Event-Agentur?",
      title2: "Werde Partner und",
      highlight: "erreiche 100.000+ Planer",
      subtitle: "Kein Marketing-Budget n\u00F6tig. Wir bringen dir die Kunden \u2014 du lieferst die magische Event-Experience.",
      b0: "Leads direkt aus dem Marketplace \u2014 keine Kaltakquise",
      b1: "Eigenes Agency Dashboard mit CRM, Budget Engine und Run of Show",
      b2: "Stripe-Integration f\u00FCr automatische Abrechnung",
      cta: "Agentur-Pl\u00E4ne ansehen",
    },
  },
  en: {
    welcome: { title: "Welcome aboard!", subtitle: "Your Starter plan is active. Explore all modules in the sidebar \u2014 locked modules can be unlocked anytime via upgrade.", ctaPricing: "See upgrade options", dismiss: "Later" },
    sidebar: { upgradePill: "Upgrade", upgradeToPro: "Go Professional", upgradeToEnt: "Go Enterprise", starterTagline: "Unlock 6 more modules", proTagline: "Command center for market leaders" },
    celebration: { title: "Welcome to {{tier}}!", subtitle: "{{count}} new modules are now unlocked.", cta: "Let\u2019s go", invoice: "Your next invoice is available in the Stripe Customer Portal." },
    landingSection: { badge: "FOR AGENCIES", title1: "Run an event agency?", title2: "Become a partner and", highlight: "reach 100,000+ planners", subtitle: "Zero marketing budget needed. We bring the clients \u2014 you deliver the magical event experience.", b0: "Leads straight from the marketplace \u2014 no cold outreach", b1: "Own Agency Dashboard with CRM, Budget Engine and Run of Show", b2: "Stripe integration for automated billing", cta: "See agency plans" },
  },
  es: {
    welcome: { title: "\u00A1Bienvenido!", subtitle: "Tu plan Starter est\u00E1 activo. Explora todos los m\u00F3dulos en la barra lateral \u2014 los m\u00F3dulos bloqueados se pueden desbloquear con un upgrade.", ctaPricing: "Ver opciones de upgrade", dismiss: "M\u00E1s tarde" },
    sidebar: { upgradePill: "Upgrade", upgradeToPro: "A Professional", upgradeToEnt: "A Enterprise", starterTagline: "Desbloquea 6 m\u00F3dulos m\u00E1s", proTagline: "Centro de mando para l\u00EDderes" },
    celebration: { title: "\u00A1Bienvenido a {{tier}}!", subtitle: "{{count}} nuevos m\u00F3dulos est\u00E1n desbloqueados.", cta: "Vamos", invoice: "Tu pr\u00F3xima factura est\u00E1 en el Stripe Customer Portal." },
    landingSection: { badge: "PARA AGENCIAS", title1: "\u00BFTienes una agencia de eventos?", title2: "H\u00E1zte partner y", highlight: "llega a 100.000+ planificadores", subtitle: "Sin necesidad de presupuesto de marketing. Nosotros traemos los clientes \u2014 t\u00FA creas la experiencia m\u00E1gica.", b0: "Leads directos del Marketplace \u2014 sin llamadas en fr\u00EDo", b1: "Dashboard de agencia con CRM, Budget Engine y Run of Show", b2: "Integraci\u00F3n Stripe para facturaci\u00F3n autom\u00E1tica", cta: "Ver planes de agencia" },
  },
  fr: {
    welcome: { title: "Bienvenue !", subtitle: "Ton plan Starter est actif. Explore tous les modules dans la barre lat\u00E9rale \u2014 les modules verrouill\u00E9s peuvent \u00EAtre d\u00E9bloqu\u00E9s par un upgrade.", ctaPricing: "Voir les options d\u2019upgrade", dismiss: "Plus tard" },
    sidebar: { upgradePill: "Upgrade", upgradeToPro: "Vers Professional", upgradeToEnt: "Vers Enterprise", starterTagline: "D\u00E9bloque 6 modules suppl\u00E9mentaires", proTagline: "Centre de commande pour leaders" },
    celebration: { title: "Bienvenue dans {{tier}} !", subtitle: "{{count}} nouveaux modules sont maintenant d\u00E9bloqu\u00E9s.", cta: "C\u2019est parti", invoice: "Ta prochaine facture est dans le Stripe Customer Portal." },
    landingSection: { badge: "POUR LES AGENCES", title1: "Tu g\u00E8res une agence \u00E9v\u00E9nementielle ?", title2: "Deviens partenaire et", highlight: "atteins 100 000+ organisateurs", subtitle: "Aucun budget marketing n\u00E9cessaire. Nous apportons les clients \u2014 tu d\u00E9livres l\u2019exp\u00E9rience magique.", b0: "Leads directement depuis le Marketplace \u2014 pas de prospection \u00E0 froid", b1: "Dashboard d\u2019agence avec CRM, Budget Engine et Run of Show", b2: "Int\u00E9gration Stripe pour facturation automatis\u00E9e", cta: "Voir les plans agence" },
  },
  it: {
    welcome: { title: "Benvenuto!", subtitle: "Il tuo piano Starter \u00E8 attivo. Esplora tutti i moduli nella sidebar \u2014 i moduli bloccati si possono sbloccare con un upgrade.", ctaPricing: "Vedi opzioni di upgrade", dismiss: "Pi\u00F9 tardi" },
    sidebar: { upgradePill: "Upgrade", upgradeToPro: "Passa a Professional", upgradeToEnt: "Passa a Enterprise", starterTagline: "Sblocca altri 6 moduli", proTagline: "Comando per i leader del mercato" },
    celebration: { title: "Benvenuto in {{tier}}!", subtitle: "{{count}} nuovi moduli sono ora sbloccati.", cta: "Andiamo", invoice: "La tua prossima fattura \u00E8 nel Stripe Customer Portal." },
    landingSection: { badge: "PER AGENZIE", title1: "Hai un\u2019agenzia di eventi?", title2: "Diventa partner e", highlight: "raggiungi 100.000+ planner", subtitle: "Zero budget marketing necessario. Noi portiamo i clienti \u2014 tu consegni l\u2019esperienza magica.", b0: "Lead direttamente dal Marketplace \u2014 niente cold outreach", b1: "Dashboard dedicata con CRM, Budget Engine e Run of Show", b2: "Integrazione Stripe per fatturazione automatica", cta: "Vedi piani agenzia" },
  },
  nl: {
    welcome: { title: "Welkom!", subtitle: "Je Starter-pakket is actief. Verken alle modules in de sidebar \u2014 vergrendelde modules kun je via upgrade ontgrendelen.", ctaPricing: "Bekijk upgrade-opties", dismiss: "Later" },
    sidebar: { upgradePill: "Upgrade", upgradeToPro: "Naar Professional", upgradeToEnt: "Naar Enterprise", starterTagline: "Ontgrendel 6 extra modules", proTagline: "Commandocentrum voor marktleiders" },
    celebration: { title: "Welkom bij {{tier}}!", subtitle: "{{count}} nieuwe modules zijn nu ontgrendeld.", cta: "Laten we beginnen", invoice: "Je volgende factuur staat in de Stripe Customer Portal." },
    landingSection: { badge: "VOOR AGENCIES", title1: "Run je een event-agency?", title2: "Word partner en", highlight: "bereik 100.000+ planners", subtitle: "Geen marketingbudget nodig. Wij brengen de klanten \u2014 jij levert de magische ervaring.", b0: "Leads direct vanuit de Marketplace \u2014 geen koude acquisitie", b1: "Eigen Agency Dashboard met CRM, Budget Engine en Run of Show", b2: "Stripe-integratie voor geautomatiseerde facturering", cta: "Bekijk agency-plannen" },
  },
  pl: {
    welcome: { title: "Witamy!", subtitle: "Tw\u00F3j plan Starter jest aktywny. Odkryj wszystkie modu\u0142y w sidebarze \u2014 zablokowane modu\u0142y mo\u017Cesz odblokowa\u0107 przez upgrade.", ctaPricing: "Zobacz opcje upgrade", dismiss: "P\u00F3\u017Aniej" },
    sidebar: { upgradePill: "Upgrade", upgradeToPro: "Na Professional", upgradeToEnt: "Na Enterprise", starterTagline: "Odblokuj kolejne 6 modu\u0142\u00F3w", proTagline: "Centrum dowodzenia dla lider\u00F3w" },
    celebration: { title: "Witaj w {{tier}}!", subtitle: "{{count}} nowych modu\u0142\u00F3w jest odblokowanych.", cta: "Zaczynajmy", invoice: "Nast\u0119pna faktura w Stripe Customer Portal." },
    landingSection: { badge: "DLA AGENCJI", title1: "Prowadzisz agencj\u0119 eventow\u0105?", title2: "Zosta\u0144 partnerem i", highlight: "dotrzyj do 100 000+ planistom", subtitle: "Zero bud\u017Cetu marketingowego. My dostarczamy klient\u00F3w \u2014 ty magi\u0119 eventu.", b0: "Leady bezpo\u015Brednio z Marketplace \u2014 bez zimnej akwizycji", b1: "W\u0142asny Agency Dashboard z CRM, Budget Engine i Run of Show", b2: "Integracja Stripe dla automatycznego rozliczania", cta: "Zobacz plany agencji" },
  },
  pt: {
    welcome: { title: "Bem-vindo!", subtitle: "O teu plano Starter est\u00E1 ativo. Explora todos os m\u00F3dulos na sidebar \u2014 m\u00F3dulos bloqueados podem ser desbloqueados por upgrade.", ctaPricing: "Ver op\u00E7\u00F5es de upgrade", dismiss: "Mais tarde" },
    sidebar: { upgradePill: "Upgrade", upgradeToPro: "Para Professional", upgradeToEnt: "Para Enterprise", starterTagline: "Desbloqueia mais 6 m\u00F3dulos", proTagline: "Centro de comando para l\u00EDderes" },
    celebration: { title: "Bem-vindo ao {{tier}}!", subtitle: "{{count}} novos m\u00F3dulos est\u00E3o desbloqueados.", cta: "Vamos l\u00E1", invoice: "A tua pr\u00F3xima fatura est\u00E1 no Stripe Customer Portal." },
    landingSection: { badge: "PARA AG\u00CANCIAS", title1: "Tens uma ag\u00EAncia de eventos?", title2: "Torna-te parceiro e", highlight: "alcan\u00E7a 100 000+ planners", subtitle: "Sem or\u00E7amento de marketing. N\u00F3s trazemos os clientes \u2014 tu entregas a experi\u00EAncia m\u00E1gica.", b0: "Leads diretamente do Marketplace \u2014 sem cold outreach", b1: "Dashboard pr\u00F3prio com CRM, Budget Engine e Run of Show", b2: "Integra\u00E7\u00E3o Stripe para faturamento automatizado", cta: "Ver planos de ag\u00EAncia" },
  },
  tr: {
    welcome: { title: "Ho\u015F geldin!", subtitle: "Starter plan\u0131n aktif. T\u00FCm mod\u00FClleri yan men\u00FCde ke\u015Ffet \u2014 kilitli mod\u00FCller istedi\u011Fin zaman upgrade ile a\u00E7\u0131labilir.", ctaPricing: "Upgrade se\u00E7eneklerini g\u00F6r", dismiss: "Sonra" },
    sidebar: { upgradePill: "Upgrade", upgradeToPro: "Professional\u2019a", upgradeToEnt: "Enterprise\u2019a", starterTagline: "6 mod\u00FCl daha a\u00E7", proTagline: "Liderler i\u00E7in komuta merkezi" },
    celebration: { title: "{{tier}}\u2019a ho\u015F geldin!", subtitle: "{{count}} yeni mod\u00FCl art\u0131k a\u00E7\u0131k.", cta: "Hadi ba\u015Flayal\u0131m", invoice: "Bir sonraki faturan Stripe Customer Portal\u2019da." },
    landingSection: { badge: "AJANSLAR \u0130\u00C7\u0130N", title1: "Etkinlik ajans\u0131 m\u0131 y\u00F6netiyorsun?", title2: "Partner ol ve", highlight: "100.000+ planlay\u0131c\u0131ya ula\u015F", subtitle: "S\u0131f\u0131r pazarlama b\u00FCt\u00E7esi. Biz m\u00FC\u015Fterileri getiriyoruz \u2014 sen b\u00FCy\u00FCl\u00FC deneyimi sunuyorsun.", b0: "Lead\u2019ler do\u011Frudan Marketplace\u2019den \u2014 so\u011Fuk arama yok", b1: "CRM, Budget Engine ve Run of Show ile kendi Agency Dashboard\u2019u", b2: "Otomatik faturalama i\u00E7in Stripe entegrasyonu", cta: "Ajans planlar\u0131n\u0131 g\u00F6r" },
  },
  ar: {
    welcome: { title: "\u0623\u0647\u0644\u0627\u064B \u0628\u0643!", subtitle: "\u062E\u0637\u0629 Starter \u0646\u0634\u0637\u0629. \u0627\u0633\u062A\u0643\u0634\u0641 \u062C\u0645\u064A\u0639 \u0627\u0644\u0648\u062D\u062F\u0627\u062A \u2014 \u064A\u0645\u0643\u0646 \u0641\u062A\u062D \u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0627\u0644\u0645\u063A\u0644\u0642\u0629 \u0641\u064A \u0623\u064A \u0648\u0642\u062A \u0639\u0628\u0631 \u0627\u0644\u062A\u0631\u0642\u064A\u0629.", ctaPricing: "\u0639\u0631\u0636 \u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u062A\u0631\u0642\u064A\u0629", dismiss: "\u0644\u0627\u062D\u0642\u0627\u064B" },
    sidebar: { upgradePill: "\u062A\u0631\u0642\u064A\u0629", upgradeToPro: "\u0625\u0644\u0649 Professional", upgradeToEnt: "\u0625\u0644\u0649 Enterprise", starterTagline: "\u0627\u0641\u062A\u062D 6 \u0648\u062D\u062F\u0627\u062A \u0625\u0636\u0627\u0641\u064A\u0629", proTagline: "\u0645\u0631\u0643\u0632 \u0642\u064A\u0627\u062F\u0629 \u0644\u0644\u0642\u0627\u062F\u0629" },
    celebration: { title: "\u0645\u0631\u062D\u0628\u0627\u064B \u0641\u064A {{tier}}!", subtitle: "{{count}} \u0648\u062D\u062F\u0627\u062A \u062C\u062F\u064A\u062F\u0629 \u0645\u0641\u062A\u0648\u062D\u0629 \u0627\u0644\u0622\u0646.", cta: "\u0647\u064A\u0627 \u0628\u0646\u0627", invoice: "\u0641\u0627\u062A\u0648\u0631\u062A\u0643 \u0627\u0644\u062A\u0627\u0644\u064A\u0629 \u0641\u064A Stripe Customer Portal." },
    landingSection: { badge: "\u0644\u0644\u0648\u0643\u0627\u0644\u0627\u062A", title1: "\u062A\u062F\u064A\u0631 \u0648\u0643\u0627\u0644\u0629 \u0641\u0639\u0627\u0644\u064A\u0627\u062A\u061F", title2: "\u0635\u0631 \u0634\u0631\u064A\u0643\u0627\u064B \u0648", highlight: "\u0627\u0635\u0644 \u0625\u0644\u0649 100\u060C000+ \u0645\u062E\u0637\u0651\u0637", subtitle: "\u0644\u0627 \u062D\u0627\u062C\u0629 \u0644\u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u062A\u0633\u0648\u064A\u0642\u064A\u0629. \u0646\u062D\u0646 \u0646\u062C\u0644\u0628 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u2014 \u0648\u0623\u0646\u062A \u062A\u0642\u062F\u0645 \u0627\u0644\u062A\u062C\u0631\u0628\u0629 \u0627\u0644\u0633\u062D\u0631\u064A\u0629.", b0: "\u0639\u0645\u0644\u0627\u0621 \u0645\u062D\u062A\u0645\u0644\u0648\u0646 \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0646 Marketplace \u2014 \u0628\u062F\u0648\u0646 \u062A\u0648\u0627\u0635\u0644 \u0628\u0627\u0631\u062F", b1: "\u0644\u0648\u062D\u0629 \u0648\u0643\u0627\u0644\u0629 \u062E\u0627\u0635\u0629 \u0645\u0639 CRM\u060C Budget Engine \u0648 Run of Show", b2: "\u062A\u0643\u0627\u0645\u0644 Stripe \u0644\u0644\u0641\u0648\u062A\u0631\u0629 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A\u0629", cta: "\u0639\u0631\u0636 \u062E\u0637\u0637 \u0627\u0644\u0648\u0643\u0627\u0644\u0627\u062A" },
  },
};

for (const lang of Object.keys(T)) {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  data.agency = data.agency || {};
  data.agency.welcome = T[lang].welcome;
  data.agency.sidebar = T[lang].sidebar;
  data.agency.celebration = T[lang].celebration;
  data.agency.landingSection = T[lang].landingSection;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`\u2713 ${lang}.json updated with agency.{welcome,sidebar,celebration,landingSection}`);
}
