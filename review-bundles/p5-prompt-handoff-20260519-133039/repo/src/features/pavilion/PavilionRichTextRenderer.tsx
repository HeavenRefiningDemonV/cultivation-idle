import { Fragment } from 'react';

import { parsePavilionRichText } from './pavilionRichText.js';

export interface PavilionRichTextProps {
  text: string;
  className?: string;
}

export function PavilionRichText({ text, className }: PavilionRichTextProps) {
  const tokens = parsePavilionRichText(text);

  return (
    <span className={className ? `pavilionRichText ${className}` : 'pavilionRichText'}>
      {tokens.map((token, index) => {
        if (token.type === 'text') {
          return <Fragment key={index}>{token.text}</Fragment>;
        }

        if (token.type === 'bold') {
          return <strong key={index}>{token.text}</strong>;
        }

        return (
          <span key={index} className={`pavilionRich pavilionRich--${token.kind}`}>
            {token.text}
          </span>
        );
      })}
    </span>
  );
}
