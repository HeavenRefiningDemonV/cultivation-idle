interface ManualDetailModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export function ManualDetailModal({ title, subtitle, onClose }: ManualDetailModalProps) {
  return (
    <div className={'pavilionDetailOverlay'} role="presentation" onMouseDown={onClose}>
      <div
        className={'pavilionDetailModal'}
        role="dialog"
        aria-modal="true"
        aria-label={`Manual detail for ${title}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className={'pavilionDetailClose'} type="button" onClick={onClose} aria-label="Close manual detail">
          ✕
        </button>
        <div className={'pavilionDetail'}>
          <div className={'pavilionDetailHeader'}>
            <div>
              <div className={'pavilionDetailName'}>{title}</div>
              {subtitle && <div className={'pavilionDetailId'}>{subtitle}</div>}
            </div>
          </div>
          <div className={'pavilionDetailBody'}>
            <div className={'pavilionDetailLine pavilionDetailPlaceholder'}>TODO: ManualDetailModal</div>
          </div>
        </div>
      </div>
    </div>
  );
}
