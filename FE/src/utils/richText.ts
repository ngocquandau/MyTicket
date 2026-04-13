import DOMPurify from 'dompurify';

const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*>/i;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const normalizeRichTextContent = (value?: string) => {
  const text = String(value || '').trim();
  if (!text) return '';

  if (HTML_TAG_REGEX.test(text)) {
    return text;
  }

  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`);

  return paragraphs.join('') || `<p>${escapeHtml(text).replace(/\n/g, '<br />')}</p>`;
};

export const sanitizeRichText = (value?: string) =>
  DOMPurify.sanitize(normalizeRichTextContent(value), {
    USE_PROFILES: { html: true },
  });

export const stripRichText = (value?: string) =>
  sanitizeRichText(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();