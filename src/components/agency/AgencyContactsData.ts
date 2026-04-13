import { Building2, Briefcase, Users, UserCheck } from "lucide-react";

export type ContactType = "veranstalter" | "dienstleister" | "crew" | "kontaktperson";

export interface PriceHistoryEntry {
  event: string;
  date: string;
  price: number;
}

export interface PastEvent {
  name: string;
  date: string;
  rating: number;
}

export interface Contact {
  id: string;
  name: string;
  type: ContactType;
  company: string;
  phone: string;
  email: string;
  rating: number;
  lastUsed: string;
  tags: string[];
  notes: string;
  city: string;
  pastEvents: number;
  specialty?: string;
  specializations: string[];
  qualityScore: number;
  priceHistory: PriceHistoryEntry[];
  pastEventDetails: PastEvent[];
}

export const contactTypeLabels: Record<ContactType, string> = {
  veranstalter: "Veranstalter",
  dienstleister: "Dienstleister",
  crew: "Crew/Helfer",
  kontaktperson: "Kontaktperson",
};

export const contactTypeColors: Record<ContactType, string> = {
  veranstalter: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  dienstleister: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  crew: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  kontaktperson: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

export const contactTypeIcons: Record<ContactType, typeof Building2> = {
  veranstalter: Building2,
  dienstleister: Briefcase,
  crew: Users,
  kontaktperson: UserCheck,
};

export const specializationTags = [
  "Catering", "Technik", "Location", "Fotografie", "Musik", "Dekoration",
  "Floristik", "Moderation", "Security", "Transport", "Videografie", "Licht",
];

export const mockContacts: Contact[] = [
  {
    id: "1", name: "Hans Schulz", type: "dienstleister", company: "Schulz Fotografie",
    phone: "+49 170 1234567", email: "hans@schulz-foto.de", rating: 5, lastUsed: "15. Maer 2026",
    tags: ["Fotograf", "Premium"], notes: "Sehr zuverlaessig, tolle Ergebnisse.",
    city: "Muenchen", pastEvents: 8, specialty: "Fotografie",
    specializations: ["Fotografie", "Videografie"], qualityScore: 95,
    priceHistory: [
      { event: "Hochzeit Braun", date: "Okt 2025", price: 3200 },
      { event: "Gala Schmidt", date: "Jun 2025", price: 2800 },
      { event: "Firmenfeier TechCo", date: "Maer 2025", price: 3500 },
    ],
    pastEventDetails: [
      { name: "Hochzeit Braun", date: "12. Okt 2025", rating: 5 },
      { name: "Gala Schmidt", date: "15. Jun 2025", rating: 5 },
      { name: "Firmenfeier TechCo", date: "20. Maer 2025", rating: 4 },
    ],
  },
  {
    id: "2", name: "Maria Weber", type: "dienstleister", company: "Catering Weber",
    phone: "+49 171 2345678", email: "info@catering-weber.de", rating: 4, lastUsed: "10. Maer 2026",
    tags: ["Catering", "Hochzeit"], notes: "Gute Auswahl, faire Preise.",
    city: "Berlin", pastEvents: 12, specialty: "Catering",
    specializations: ["Catering"], qualityScore: 82,
    priceHistory: [
      { event: "Firmenfeier SAP", date: "Maer 2026", price: 9600 },
      { event: "Hochzeit Braun", date: "Okt 2025", price: 7800 },
      { event: "Sommerfest 2025", date: "Aug 2025", price: 5200 },
    ],
    pastEventDetails: [
      { name: "Firmenfeier SAP", date: "22. Maer 2026", rating: 4 },
      { name: "Hochzeit Braun", date: "12. Okt 2025", rating: 4 },
    ],
  },
  {
    id: "3", name: "DJ Beat Master", type: "dienstleister", company: "BeatMaster Events",
    phone: "+49 172 3456789", email: "dj@beatmaster.de", rating: 4, lastUsed: "05. Maer 2026",
    tags: ["DJ", "Musik", "Party"], notes: "Grossartige Stimmung.",
    city: "Hamburg", pastEvents: 6, specialty: "DJ/Musik",
    specializations: ["Musik"], qualityScore: 78,
    priceHistory: [
      { event: "JGA Hamburg", date: "Mai 2026", price: 1200 },
      { event: "Hochzeit Braun", date: "Okt 2025", price: 2500 },
      { event: "Firmenfeier SAP", date: "Maer 2025", price: 2800 },
    ],
    pastEventDetails: [
      { name: "JGA Hamburg", date: "05. Mai 2026", rating: 5 },
      { name: "Hochzeit Braun", date: "12. Okt 2025", rating: 4 },
    ],
  },
  {
    id: "4", name: "Sarah Mueller", type: "veranstalter", company: "Mueller GmbH",
    phone: "+49 173 4567890", email: "s.mueller@mueller-gmbh.de", rating: 5, lastUsed: "20. Maer 2026",
    tags: ["Corporate", "Stammkunde"], notes: "Langjaehriger Kunde, bucht regelmaessig.",
    city: "Frankfurt", pastEvents: 15,
    specializations: [], qualityScore: 90,
    priceHistory: [],
    pastEventDetails: [
      { name: "Firmenfeier Mueller GmbH", date: "20. Maer 2026", rating: 5 },
      { name: "Weihnachtsfeier 2025", date: "15. Dez 2025", rating: 5 },
    ],
  },
  {
    id: "5", name: "Thomas Klein", type: "crew", company: "Freelancer",
    phone: "+49 174 5678901", email: "thomas.klein@email.de", rating: 3, lastUsed: "01. Maer 2026",
    tags: ["Aufbau", "Technik"], notes: "Kann kurzfristig einspringen.",
    city: "Koeln", pastEvents: 4,
    specializations: ["Technik"], qualityScore: 55,
    priceHistory: [],
    pastEventDetails: [
      { name: "Konferenz 2025", date: "15. Sep 2025", rating: 3 },
    ],
  },
  {
    id: "6", name: "Eva Becker", type: "kontaktperson", company: "Schloss Rosenstein",
    phone: "+49 175 6789012", email: "e.becker@schloss-rosenstein.de", rating: 5, lastUsed: "25. Maer 2026",
    tags: ["Location", "Hochzeit", "Premium"], notes: "Ansprechpartnerin für alle Buchungen im Schloss.",
    city: "Stuttgart", pastEvents: 10,
    specializations: ["Location"], qualityScore: 98,
    priceHistory: [
      { event: "Hochzeit Mueller", date: "Jun 2026", price: 8000 },
      { event: "Hochzeit Braun", date: "Okt 2025", price: 7500 },
      { event: "Gala 2025", date: "Apr 2025", price: 9200 },
    ],
    pastEventDetails: [
      { name: "Hochzeit Mueller", date: "15. Jun 2026", rating: 5 },
      { name: "Hochzeit Braun", date: "12. Okt 2025", rating: 5 },
    ],
  },
  {
    id: "7", name: "Marco Rossi", type: "dienstleister", company: "Rossi Blumen",
    phone: "+49 176 7890123", email: "marco@rossi-blumen.de", rating: 4, lastUsed: "12. Maer 2026",
    tags: ["Floristik", "Dekoration"], notes: "Kreative Arrangements.",
    city: "Muenchen", pastEvents: 7, specialty: "Floristik",
    specializations: ["Floristik", "Dekoration"], qualityScore: 85,
    priceHistory: [
      { event: "Hochzeit Mueller", date: "Jun 2026", price: 4000 },
      { event: "Hochzeit Braun", date: "Okt 2025", price: 3200 },
    ],
    pastEventDetails: [
      { name: "Hochzeit Braun", date: "12. Okt 2025", rating: 4 },
    ],
  },
  {
    id: "8", name: "Julia Hartmann", type: "crew", company: "Freelancer",
    phone: "+49 177 8901234", email: "julia.h@email.de", rating: 4, lastUsed: "18. Maer 2026",
    tags: ["Service", "Bar"], notes: "Erfahrene Barkeeperin.",
    city: "Berlin", pastEvents: 9,
    specializations: [], qualityScore: 72,
    priceHistory: [],
    pastEventDetails: [
      { name: "Firmenfeier SAP", date: "22. Maer 2026", rating: 4 },
      { name: "Sommerfest 2025", date: "20. Aug 2025", rating: 4 },
    ],
  },
];
