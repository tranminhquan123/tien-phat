const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'ul', 'ol', 'li', 'h2', 'h3', 'blockquote', 'a', 'div',
]);

const BLOCKED_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'svg', 'math',
  'form', 'input', 'button', 'textarea', 'select', 'option',
]);

const ALLOWED_ALIGNMENTS = new Set(['left', 'center', 'right', 'justify']);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function hasHtmlMarkup(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function sanitizeHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^(https?:|mailto:|tel:|\/)/i.test(trimmed)) return trimmed;
  return '';
}

function sanitizeElement(element: Element) {
  Array.from(element.children).forEach(sanitizeElement);

  const tag = element.tagName.toLowerCase();

  if (BLOCKED_TAGS.has(tag)) {
    element.remove();
    return;
  }

  if (!ALLOWED_TAGS.has(tag)) {
    element.replaceWith(...Array.from(element.childNodes));
    return;
  }

  const href = tag === 'a' ? sanitizeHref(element.getAttribute('href') ?? '') : '';
  const alignment = (element as HTMLElement).style.textAlign;

  Array.from(element.attributes).forEach((attribute) => {
    element.removeAttribute(attribute.name);
  });

  if (href) {
    element.setAttribute('href', href);
    element.setAttribute('target', '_blank');
    element.setAttribute('rel', 'noopener noreferrer');
  }

  if (ALLOWED_ALIGNMENTS.has(alignment)) {
    element.setAttribute('style', `text-align: ${alignment}`);
  }
}

export function sanitizeRichTextHtml(value?: string | null) {
  if (!value) return '';

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(`<div id="rich-text-root">${value}</div>`, 'text/html');
  const root = documentNode.getElementById('rich-text-root');
  if (!root) return '';

  Array.from(root.children).forEach(sanitizeElement);
  return root.innerHTML.trim();
}

export function prepareRichTextForEditor(value?: string | null) {
  if (!value?.trim()) return '';

  if (hasHtmlMarkup(value)) {
    return sanitizeRichTextHtml(value);
  }

  return value
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function prepareRichTextForDisplay(value?: string | null) {
  return sanitizeRichTextHtml(prepareRichTextForEditor(value));
}

export function isRichTextEmpty(value?: string | null) {
  if (!value) return true;

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(value, 'text/html');
  return !(documentNode.body.textContent ?? '').replace(/\u00a0/g, ' ').trim();
}
