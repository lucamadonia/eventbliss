import * as React from "react";

export type ThemeId = "dark" | "light" | "classic" | "epic" | "party" | "adventure";

export interface MarketplaceTheme {
  id: ThemeId;
  label: string;
  tagline: string;
  vibe: string[];
  preview: string; // CSS gradient for picker thumbnail
  colors: {
    bg: string;
    surfaceHigh: string;
    surfaceLow: string;
    text: string;
    textMuted: string;
    border: string; // supports rgba
    primary: string;
    secondary: string;
    tertiary: string;
    ring: string;
  };
  typography: {
    heading: string; // CSS font-family string
    body: string; // CSS font-family string
    weightHeading: 600 | 700 | 800 | 900;
    letterSpacingHeading: string;
  };
  hero: {
    gradient: string;
    overlay: string;
  };
  effects: {
    cardRadius: string; // e.g. "1rem"
    shadowColor: string;
    grainOpacity?: number;
  };
}

export const MARKETPLACE_THEMES: Record<ThemeId, MarketplaceTheme> = {
  dark: {
    id: "dark",
    label: "Dark · Gaming",
    tagline: "Neon-Gaming-Look mit Violett & Cyan",
    vibe: ["modern", "gaming", "tech"],
    preview: "linear-gradient(135deg,#cf96ff 0%,#1f1f29 50%,#00e3fd 100%)",
    colors: {
      bg: "#0d0d15",
      surfaceHigh: "#1f1f29",
      surfaceLow: "#13131b",
      text: "#ffffff",
      textMuted: "#9ca3af",
      border: "rgba(72,71,80,0.1)",
      primary: "#cf96ff",
      secondary: "#00e3fd",
      tertiary: "#ff7350",
      ring: "rgba(207,150,255,0.4)",
    },
    typography: {
      heading: "'Space Grotesk','Inter',system-ui,sans-serif",
      body: "'Be Vietnam Pro',system-ui,sans-serif",
      weightHeading: 900,
      letterSpacingHeading: "-0.02em",
    },
    hero: {
      gradient:
        "linear-gradient(135deg, rgba(207,150,255,0.30), rgba(31,31,41,0.90), rgba(0,227,253,0.15))",
      overlay: "linear-gradient(to top, #0d0d15 0%, transparent 60%)",
    },
    effects: {
      cardRadius: "1rem",
      shadowColor: "rgba(207,150,255,0.20)",
    },
  },
  light: {
    id: "light",
    label: "Modern · Hell",
    tagline: "Clean, minimalistisch, corporate-ready",
    vibe: ["modern", "clean", "corporate"],
    preview: "linear-gradient(135deg,#6366f1 0%,#ffffff 50%,#06b6d4 100%)",
    colors: {
      bg: "#fafaf9",
      surfaceHigh: "#ffffff",
      surfaceLow: "#f4f4f5",
      text: "#0f172a",
      textMuted: "#64748b",
      border: "rgba(15,23,42,0.08)",
      primary: "#6366f1",
      secondary: "#06b6d4",
      tertiary: "#ec4899",
      ring: "rgba(99,102,241,0.25)",
    },
    typography: {
      heading: "'Inter',system-ui,sans-serif",
      body: "'Inter',system-ui,sans-serif",
      weightHeading: 800,
      letterSpacingHeading: "-0.01em",
    },
    hero: {
      gradient:
        "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.10), rgba(236,72,153,0.12))",
      overlay: "linear-gradient(to top, #fafaf9 0%, transparent 60%)",
    },
    effects: {
      cardRadius: "1.25rem",
      shadowColor: "rgba(15,23,42,0.10)",
    },
  },
  classic: {
    id: "classic",
    label: "Klassisch · Elegant",
    tagline: "Zeitlos mit Serifen und Champagner-Tönen",
    vibe: ["elegant", "timeless", "wedding", "premium"],
    preview: "linear-gradient(135deg,#8b5e3c 0%,#faf7f1 50%,#c8a15b 100%)",
    colors: {
      bg: "#faf7f1",
      surfaceHigh: "#ffffff",
      surfaceLow: "#f0ebe0",
      text: "#2d1f14",
      textMuted: "#6b5d4f",
      border: "rgba(91,58,41,0.12)",
      primary: "#8b5e3c",
      secondary: "#c8a15b",
      tertiary: "#5b3a29",
      ring: "rgba(200,161,91,0.35)",
    },
    typography: {
      heading: "'Playfair Display','Libre Baskerville',Georgia,serif",
      body: "'Inter',system-ui,sans-serif",
      weightHeading: 700,
      letterSpacingHeading: "0",
    },
    hero: {
      gradient:
        "linear-gradient(135deg, rgba(200,161,91,0.25), rgba(255,247,230,0.5), rgba(139,94,60,0.15))",
      overlay: "linear-gradient(to top, #faf7f1 0%, transparent 60%)",
    },
    effects: {
      cardRadius: "0.75rem",
      shadowColor: "rgba(91,58,41,0.12)",
    },
  },
  epic: {
    id: "epic",
    label: "Episch · Kinoreif",
    tagline: "Dramatische Gold- und Purpurtöne für Galaabende",
    vibe: ["cinematic", "dramatic", "gala", "luxury"],
    preview: "linear-gradient(135deg,#ffd700 0%,#1a0f2e 50%,#dc2626 100%)",
    colors: {
      bg: "#0a0612",
      surfaceHigh: "#1a0f2e",
      surfaceLow: "#0f0820",
      text: "#f5e6d3",
      textMuted: "#b8a888",
      border: "rgba(255,215,0,0.15)",
      primary: "#ffd700",
      secondary: "#dc2626",
      tertiary: "#9333ea",
      ring: "rgba(255,215,0,0.45)",
    },
    typography: {
      heading: "'Cinzel','Playfair Display',serif",
      body: "'Inter',system-ui,sans-serif",
      weightHeading: 700,
      letterSpacingHeading: "0.02em",
    },
    hero: {
      gradient:
        "linear-gradient(135deg, rgba(255,215,0,0.25), rgba(26,15,46,0.80), rgba(220,38,38,0.20))",
      overlay: "linear-gradient(to top, #0a0612 0%, transparent 60%)",
    },
    effects: {
      cardRadius: "0.5rem",
      shadowColor: "rgba(255,215,0,0.15)",
    },
  },
  party: {
    id: "party",
    label: "Party · Neon",
    tagline: "Vibrant Neon für Nightlife und Feiern",
    vibe: ["vibrant", "playful", "nightlife", "neon"],
    preview: "linear-gradient(135deg,#f0abfc 0%,#facc15 50%,#22d3ee 100%)",
    colors: {
      bg: "#0f0118",
      surfaceHigh: "#1a0524",
      surfaceLow: "#120220",
      text: "#fef3c7",
      textMuted: "#d8b4fe",
      border: "rgba(240,171,252,0.18)",
      primary: "#f0abfc",
      secondary: "#facc15",
      tertiary: "#22d3ee",
      ring: "rgba(240,171,252,0.5)",
    },
    typography: {
      heading: "'Space Grotesk','Nunito',sans-serif",
      body: "'Nunito','Inter',sans-serif",
      weightHeading: 800,
      letterSpacingHeading: "-0.01em",
    },
    hero: {
      gradient:
        "linear-gradient(135deg, rgba(240,171,252,0.35), rgba(250,204,21,0.20), rgba(34,211,238,0.25))",
      overlay: "linear-gradient(to top, #0f0118 0%, transparent 60%)",
    },
    effects: {
      cardRadius: "1.5rem",
      shadowColor: "rgba(240,171,252,0.25)",
    },
  },
  adventure: {
    id: "adventure",
    label: "Adventure · Outdoor",
    tagline: "Erdige Outdoor-Vibes für Festivals & Naturevents",
    vibe: ["outdoor", "rugged", "festival", "nature"],
    preview: "linear-gradient(135deg,#84cc16 0%,#1a2e1a 50%,#f97316 100%)",
    colors: {
      bg: "#1a2e1a",
      surfaceHigh: "#2d4a2d",
      surfaceLow: "#213721",
      text: "#f5f5dc",
      textMuted: "#c4b9a1",
      border: "rgba(132,204,22,0.15)",
      primary: "#84cc16",
      secondary: "#f97316",
      tertiary: "#d6d3d1",
      ring: "rgba(132,204,22,0.4)",
    },
    typography: {
      heading: "'Outfit','Oswald',sans-serif",
      body: "'Inter',system-ui,sans-serif",
      weightHeading: 800,
      letterSpacingHeading: "-0.01em",
    },
    hero: {
      gradient:
        "linear-gradient(135deg, rgba(132,204,22,0.28), rgba(45,74,45,0.85), rgba(249,115,22,0.22))",
      overlay: "linear-gradient(to top, #1a2e1a 0%, transparent 60%)",
    },
    effects: {
      cardRadius: "0.875rem",
      shadowColor: "rgba(132,204,22,0.18)",
    },
  },
};

export const DEFAULT_THEME_ID: ThemeId = "dark";

export function resolveTheme(id?: string | null): MarketplaceTheme {
  const key = (id ?? DEFAULT_THEME_ID) as ThemeId;
  return MARKETPLACE_THEMES[key] ?? MARKETPLACE_THEMES[DEFAULT_THEME_ID];
}

const MarketplaceThemeContext = React.createContext<MarketplaceTheme>(
  MARKETPLACE_THEMES[DEFAULT_THEME_ID],
);

export function useMarketplaceTheme() {
  return React.useContext(MarketplaceThemeContext);
}

export function MarketplaceThemeProvider({
  themeId,
  children,
}: {
  themeId?: string | null;
  children: React.ReactNode;
}) {
  const theme = resolveTheme(themeId);
  return React.createElement(
    MarketplaceThemeContext.Provider,
    { value: theme },
    children,
  );
}
