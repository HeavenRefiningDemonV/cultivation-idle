import './WorldOverlayInspector.scss';
import './WorldActionButton.scss';

interface WorldOverlayInspectorProps {
  moduleLabel: string;
  roleTag: string;
  bestUsedWhen: string;
  boundaryLine?: string | null;
  outputs: string[];
  stateLine?: string | null;
  openLabel: string;
  onOpen: () => void;
  cityName: string;
  className?: string;
}

export function WorldOverlayInspector({
  moduleLabel,
  roleTag,
  bestUsedWhen,
  boundaryLine = null,
  outputs,
  stateLine = null,
  openLabel,
  onOpen,
  cityName,
  className,
}: WorldOverlayInspectorProps) {
  const classes = className ? `worldOverlayInspector ${className}` : 'worldOverlayInspector';

  return (
    <section className={classes} aria-label="World module inspector">
      <header className="worldOverlayInspector__header">
        <p className="worldOverlayInspector__city">{cityName}</p>
        <h3 className="worldOverlayInspector__title">{moduleLabel}</h3>
        <p className="worldOverlayInspector__role">{roleTag}</p>
      </header>

      <p className="worldOverlayInspector__bestUsedWhen">{bestUsedWhen}</p>
      {boundaryLine ? <p className="worldOverlayInspector__boundary">{boundaryLine}</p> : null}

      <ul className="worldOverlayInspector__outputs">
        {outputs.slice(0, 3).map((output) => (
          <li key={output}>{output}</li>
        ))}
      </ul>

      {stateLine ? <p className="worldOverlayInspector__line">{stateLine}</p> : null}

      <button type="button" className="worldOverlayInspector__openButton worldActionButton uiNoShift" onClick={onOpen}>
        {openLabel}
      </button>
    </section>
  );
}
