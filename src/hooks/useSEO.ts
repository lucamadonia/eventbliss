/**
 * Lightweight SEO-Hook ohne externe Dependency (kein react-helmet).
 * Setzt document.title, meta-description, canonical, OG- und Twitter-Tags,
 * sowie optional ein JSON-LD-Schema. Räumt beim Unmount wieder auf.
 */
import { useEffect } from "react";

export interface SeoConfig {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string; // "website" | "article" | ...
  jsonLd?: object | object[];
  locale?: string; // e.g. "de_DE"
  keywords?: string;
  /** Document language for <html lang> (e.g. "ar", "es-ES"). */
  htmlLang?: string;
  /** Text direction for <html dir> — "rtl" for Arabic, else "ltr". */
  dir?: "rtl" | "ltr";
  /** robots meta override, e.g. "noindex,follow" for thin/transactional pages. */
  robots?: string;
  /** hreflang alternates (<link rel="alternate" hreflang …>). Cleaned up on unmount. */
  hreflangs?: { hreflang: string; href: string }[];
}

const DEFAULT_ROBOTS = "index, follow, max-image-preview:large";

const META_TAG_ID = "data-managed-seo";
const JSON_LD_ID = "managed-seo-jsonld";
const HREFLANG_ATTR = "data-managed-hreflang";

function setMeta(selector: string, attr: "content", value: string, createIf: () => HTMLMetaElement) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = createIf();
    el.setAttribute(META_TAG_ID, "true");
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setMetaByName(name: string, value: string) {
  setMeta(`meta[name="${name}"]`, "content", value, () => {
    const m = document.createElement("meta");
    m.setAttribute("name", name);
    return m;
  });
}

function setMetaByProperty(property: string, value: string) {
  setMeta(`meta[property="${property}"]`, "content", value, () => {
    const m = document.createElement("meta");
    m.setAttribute("property", property);
    return m;
  });
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

function setJsonLd(data: object | object[]) {
  let script = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.id = JSON_LD_ID;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function removeJsonLd() {
  const script = document.getElementById(JSON_LD_ID);
  script?.remove();
}

function removeHreflangs() {
  document.head
    .querySelectorAll(`link[${HREFLANG_ATTR}]`)
    .forEach((el) => el.remove());
}

function setHreflangs(items: { hreflang: string; href: string }[]) {
  removeHreflangs();
  for (const { hreflang, href } of items) {
    const link = document.createElement("link");
    link.setAttribute("rel", "alternate");
    link.setAttribute("hreflang", hreflang);
    link.setAttribute("href", href);
    link.setAttribute(HREFLANG_ATTR, "true");
    document.head.appendChild(link);
  }
}

export function useSEO(config: SeoConfig) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = config.title;

    const docEl = document.documentElement;
    const previousLang = docEl.lang;
    const previousDir = docEl.getAttribute("dir");
    if (config.htmlLang) docEl.lang = config.htmlLang;
    if (config.dir) docEl.setAttribute("dir", config.dir);

    if (config.robots) setMetaByName("robots", config.robots);

    setMetaByName("description", config.description);
    if (config.keywords) {
      setMetaByName("keywords", config.keywords);
    }

    setMetaByProperty("og:title", config.title);
    setMetaByProperty("og:description", config.description);
    setMetaByProperty("og:type", config.ogType ?? "website");
    if (config.canonical) {
      setMetaByProperty("og:url", config.canonical);
      setCanonical(config.canonical);
    }
    if (config.ogImage) {
      setMetaByProperty("og:image", config.ogImage);
    }
    if (config.locale) {
      setMetaByProperty("og:locale", config.locale);
    }

    setMetaByName("twitter:title", config.title);
    setMetaByName("twitter:description", config.description);
    if (config.ogImage) {
      setMetaByName("twitter:image", config.ogImage);
    }

    if (config.jsonLd) {
      setJsonLd(config.jsonLd);
    } else {
      removeJsonLd();
    }

    if (config.hreflangs?.length) {
      setHreflangs(config.hreflangs);
    } else {
      removeHreflangs();
    }

    return () => {
      document.title = previousTitle;
      if (config.htmlLang) docEl.lang = previousLang;
      if (config.dir) {
        if (previousDir) docEl.setAttribute("dir", previousDir);
        else docEl.removeAttribute("dir");
      }
      if (config.robots) setMetaByName("robots", DEFAULT_ROBOTS);
      removeJsonLd();
      removeHreflangs();
    };
  }, [
    config.title,
    config.description,
    config.canonical,
    config.ogImage,
    config.ogType,
    config.locale,
    config.keywords,
    config.jsonLd,
    config.htmlLang,
    config.dir,
    config.robots,
    config.hreflangs,
  ]);
}
