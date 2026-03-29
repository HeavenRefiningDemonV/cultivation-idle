import qiSign from '../../assets/onscreen/qisign.png';
import './DantianOrb.scss';

type DantianOrbProps = {
  heartLawTags: string[];
  isCultivating: boolean;
  isNearReady: boolean;
  isReady: boolean;
  className?: string;
  tone?: 'cultivation' | 'status';
};

const ELEMENT_PRIORITY = ['fire', 'water', 'earth', 'metal', 'wood', 'neutral'] as const;

export function DantianOrb({
  heartLawTags,
  isCultivating,
  isNearReady,
  isReady,
  className,
  tone = 'cultivation',
}: DantianOrbProps) {
  const elementTag = ELEMENT_PRIORITY.find((tag) => heartLawTags.includes(tag)) ?? 'neutral';
  const classes = [
    'dantianOrb',
    `dantianOrb--${tone}`,
    `dantianOrb--${elementTag}`,
    isCultivating ? 'dantianOrb--cultivating' : '',
    isReady ? 'dantianOrb--ready' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} aria-hidden="true">
      <div className="dantianOrbHalo" />
      {isNearReady ? <span className="dantianOrbRing" /> : null}
      {isReady ? <span className="dantianOrbSpark" /> : null}
      <img className="dantianOrbImage" src={qiSign} alt="" aria-hidden="true" />
    </div>
  );
}
