import { sanitizeHtml as serverSanitize } from './sanitize-html';

export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  return serverSanitize(dirty);
}

export async function sanitizeHtmlClient(dirty: string): Promise<string> {
  let clean = serverSanitize(dirty);

  if (typeof window !== 'undefined') {
    try {
      const DOMPurify = (await import('dompurify')).default;
      clean = DOMPurify.sanitize(clean, {
        ALLOWED_TAGS: [
          'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'img', 'hr', 'blockquote', 'pre', 'code', 'u', 's', 'sub', 'sup',
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style'],
      });
    } catch {
      // Server sanitization is sufficient
    }
  }

  return clean;
}
