import './WorldActionButton.scss';

export function WorldCommandAlert(props: {
  title: string;
  detail: string;
  ctaLabel: string;
  onCta: () => void;
}) {
  const { title, detail, ctaLabel, onCta } = props;
  return (
    <div className="worldCommandAlert">
      <div className="worldCommandAlertTitle">{title}</div>
      <div className="worldCommandAlertDetail">{detail}</div>
      <button type="button" className="worldCommandAlertCta worldActionButton worldActionButton--subtle" onClick={onCta}>
        {ctaLabel}
      </button>
    </div>
  );
}
