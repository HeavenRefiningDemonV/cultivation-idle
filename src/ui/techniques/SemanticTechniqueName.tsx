import type { TechniqueNameToken } from '../../features/techniques/techniqueVisualIdentity.js';

interface SemanticTechniqueNameProps {
  tokens?: readonly TechniqueNameToken[] | null;
  fallback: string;
  className?: string;
}

const fallbackToken = (fallback: string): TechniqueNameToken => ({
  text: fallback,
  tone: 'ink',
  emphasis: 'none',
  reason: 'none',
});

export function SemanticTechniqueName({ tokens, fallback, className }: SemanticTechniqueNameProps) {
  const renderedTokens = tokens && tokens.length > 0 ? tokens : [fallbackToken(fallback)];
  return (
    <span className={className} data-semantic-name="true">
      {renderedTokens.map((token, index) => (
        <span
          key={`${token.text}-${index}`}
          className="semanticNameToken"
          data-tone={token.tone}
          data-emphasis={token.emphasis}
          data-reason={token.reason}
        >
          {token.text}
        </span>
      ))}
    </span>
  );
}
