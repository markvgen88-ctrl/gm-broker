import { useEffect } from "react";

interface SeoOptions {
  title: string;
  description: string;
  canonicalPath: string;
  jsonLd?: Record<string, unknown>;
}

const SITE_URL = "https://gm-broker.ru";
const JSON_LD_ID = "page-json-ld";

function setMetaTag(name: string, content: string, attr: "name" | "property" = "name") {
  let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

/**
 * Обновляет title, description, canonical и Open Graph теги при переходе
 * между страницами (главная / статьи), а также вставляет JSON-LD разметку
 * конкретной страницы. Нужен, поскольку сайт — SPA без серверного рендеринга:
 * без этого хука все страницы делили бы одинаковые SEO-теги из index.html.
 */
export function useSeo({ title, description, canonicalPath, jsonLd }: SeoOptions) {
  useEffect(() => {
    const fullUrl = `${SITE_URL}${canonicalPath}`;

    document.title = title;
    setMetaTag("description", description);
    setMetaTag("og:title", title, "property");
    setMetaTag("og:description", description, "property");
    setMetaTag("og:url", fullUrl, "property");
    setMetaTag("twitter:title", title);
    setMetaTag("twitter:description", description);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", fullUrl);

    let ldScript = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!ldScript) {
        ldScript = document.createElement("script");
        ldScript.id = JSON_LD_ID;
        ldScript.type = "application/ld+json";
        document.head.appendChild(ldScript);
      }
      ldScript.textContent = JSON.stringify(jsonLd);
    } else if (ldScript) {
      ldScript.remove();
    }

    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [title, description, canonicalPath, jsonLd]);
}
