export const PAVILION_RICH_TEXT_KINDS = [
  'term',
  'item',
  'stat',
  'route',
  'warning',
  'success',
  'action',
  'path',
  'realm',
] as const;

export type PavilionRichTextKind = typeof PAVILION_RICH_TEXT_KINDS[number];

export type PavilionRichTextToken =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'semantic'; kind: PavilionRichTextKind; text: string };

const PAVILION_RICH_TEXT_KIND_SET = new Set<string>(PAVILION_RICH_TEXT_KINDS);

function isPavilionRichTextKind(value: string): value is PavilionRichTextKind {
  return PAVILION_RICH_TEXT_KIND_SET.has(value);
}

function pushText(tokens: PavilionRichTextToken[], text: string): void {
  if (text.length === 0) return;
  const previous = tokens[tokens.length - 1];
  if (previous?.type === 'text') {
    previous.text += text;
    return;
  }
  tokens.push({ type: 'text', text });
}

export function parsePavilionRichText(input: string): PavilionRichTextToken[] {
  const tokens: PavilionRichTextToken[] = [];
  let index = 0;

  while (index < input.length) {
    const nextBold = input.indexOf('**', index);
    const nextSemantic = input.indexOf('{', index);
    const candidates = [nextBold, nextSemantic].filter((candidate) => candidate >= 0);

    if (candidates.length === 0) {
      pushText(tokens, input.slice(index));
      break;
    }

    const next = Math.min(...candidates);
    if (next > index) {
      pushText(tokens, input.slice(index, next));
      index = next;
    }

    if (input.startsWith('**', index)) {
      const close = input.indexOf('**', index + 2);
      if (close < 0) {
        pushText(tokens, input.slice(index));
        break;
      }

      const text = input.slice(index + 2, close);
      if (text.length === 0) {
        pushText(tokens, input.slice(index, close + 2));
      } else {
        tokens.push({ type: 'bold', text });
      }
      index = close + 2;
      continue;
    }

    const close = input.indexOf('}', index + 1);
    if (close < 0) {
      pushText(tokens, input.slice(index));
      break;
    }

    const raw = input.slice(index + 1, close);
    const separator = raw.indexOf('|');
    const kind = separator >= 0 ? raw.slice(0, separator) : '';
    const text = separator >= 0 ? raw.slice(separator + 1) : '';
    if (!isPavilionRichTextKind(kind) || text.length === 0) {
      pushText(tokens, input.slice(index, close + 1));
      index = close + 1;
      continue;
    }

    tokens.push({ type: 'semantic', kind, text });
    index = close + 1;
  }

  return tokens;
}
