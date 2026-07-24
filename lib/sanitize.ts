import sanitizeHtml from "sanitize-html";

/**
 * Server-side HTML sanitizer for dangerouslySetInnerHTML content.
 *
 * Uses sanitize-html with strict allowlists to prevent XSS attacks.
 */

const TRUSTED_IFRAME_HOSTS = [
  "www.google.com",
  "maps.google.com",
  "www.google.com/maps",
  "www.openstreetmap.org",
  "player.vimeo.com",
  "www.youtube.com",
];

/**
 * Default allowed tags for rich text content (blog posts, trek descriptions, etc.)
 */
const RICH_TEXT_TAGS = [
  "p", "br", "b", "i", "em", "strong", "u", "s", "sub", "sup",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "a", "img",
  "blockquote", "pre", "code",
  "table", "thead", "tbody", "tr", "th", "td",
  "hr", "div", "span",
  "figure", "figcaption",
];

const RICH_TEXT_ATTRS = {
  a: ["href", "target", "rel", "title"],
  img: ["src", "alt", "width", "height", "loading", "title"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
  "*": ["class", "id", "style"],
};

/**
 * Sanitize rich text HTML (blog posts, trek content, etc.)
 * Allows most common formatting tags while stripping scripts and event handlers.
 */
export function sanitizeRichText(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: RICH_TEXT_TAGS,
    allowedAttributes: RICH_TEXT_ATTRS,
    allowedStyles: {
      "*": {
        color: [/.*/],
        "background-color": [/.*/],
        "text-align": [/.*/],
        "font-size": [/.*/],
        "font-weight": [/.*/],
      },
    },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || "";
        return {
          tagName,
          attribs: {
            ...attribs,
            rel: "noopener noreferrer",
            target: href.startsWith("http") ? "_blank" : undefined,
          } as Record<string, string>,
        };
      },
    },
    exclusiveFilter: (frame) => {
      return frame.tag === "script" || frame.tag === "style" || frame.tag === "iframe";
    },
  });
}

/**
 * Sanitize an iframe HTML string — strips unsafe iframes and only allows trusted hosts.
 */
export function sanitizeIframeHtml(html: string): string {
  if (!html) return "";

  return sanitizeHtml(html, {
    allowedTags: ["iframe"],
    allowedAttributes: {
      iframe: ["src", "width", "height", "style", "allowfullscreen", "loading", "referrerpolicy", "title"],
    },
    allowVulnerableTags: false,
    transformTags: {
      iframe: (tagName, attribs) => {
        const src = attribs.src || "";
        // Validate the src is from a trusted host
        try {
          const url = new URL(src);
          const isTrusted = TRUSTED_IFRAME_HOSTS.some(
            (host) => url.hostname === host || url.hostname.endsWith("." + host)
          );
          if (!isTrusted) {
            return { tagName: "div", text: "Map content blocked: untrusted source", attribs: { class: "iframe-blocked" as string } };
          }
        } catch {
          return { tagName: "div", text: "Map content blocked: invalid URL", attribs: { class: "iframe-blocked" as string } };
        }

        // Ensure responsive iframe
        return {
          tagName: "iframe",
          attribs: {
            ...attribs,
            style: "width:100%; max-width:100%; border:0;",
          } as Record<string, string>,
        };
      },
    },
    exclusiveFilter: (frame) => {
      return frame.tag === "script" || frame.tag === "object" || frame.tag === "embed";
    },
  });
}

/**
 * Sanitize top bar / announcement bar HTML — only inline text and safe inline elements.
 */
export function sanitizeInlineHtml(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: ["b", "i", "em", "strong", "a", "br", "span", "u"],
    allowedAttributes: {
      a: ["href", "target", "rel", "title"],
      span: ["class", "style"],
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: "noopener noreferrer",
        },
      }),
    },
    allowedSchemes: ["http", "https", "mailto"],
    exclusiveFilter: (frame) => {
      return ["script", "style", "iframe", "object", "embed", "form", "input"].includes(frame.tag);
    },
  });
}

