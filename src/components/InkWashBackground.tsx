/**
 * Ink wash themed background with mountain silhouettes and mist
 */
export function InkWashBackground() {
  return (
    <div className={'inkWashBackgroundBackground'}>
      {/* Gradient base */}
      <div className={'inkWashBackgroundBase'} />

      {/* Mountain silhouettes */}
      <div className={'inkWashBackgroundMountains'}>
        <svg viewBox="0 0 1440 320" className={'inkWashBackgroundFullSize'}>
          <path
            fill="#1a1a1a"
            d="M0,224L48,208C96,192,192,160,288,154.7C384,149,480,171,576,181.3C672,192,768,192,864,170.7C960,149,1056,107,1152,112C1248,117,1344,171,1392,197.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* Pine tree silhouettes - corners */}
      <div className={'inkWashBackgroundTrees'}>
        <svg viewBox="0 0 100 200" className={'inkWashBackgroundFullSize'}>
          <polygon points="50,10 30,60 70,60" fill="#0a0a0a" />
          <polygon points="50,40 25,90 75,90" fill="#0a0a0a" />
          <polygon points="50,70 20,130 80,130" fill="#0a0a0a" />
          <rect x="45" y="130" width="10" height="70" fill="#0a0a0a" />
        </svg>
      </div>

      {/* Floating mist effect */}
      <div className={'inkWashBackgroundMist'} />
    </div>
  );
}
import './InkWashBackground.scss';
