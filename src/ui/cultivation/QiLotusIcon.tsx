import './QiLotusIcon.scss';
import lotusClosed from '../../assets/onscreen/qi_lotus_closed.png';
import lotusOpen from '../../assets/onscreen/qi_lotus_open.png';
import lotusFull from '../../assets/onscreen/qi_lotus_full.png';

export type QiLotusState = 'idle' | 'active' | 'ready';

type QiLotusIconProps = {
  state: QiLotusState;
  className?: string;
  title?: string;
  label?: string;
};

export function QiLotusIcon({ state, className = '', title, label }: QiLotusIconProps) {
  return (
    <span className={`qiLotusIcon ${className}`.trim()} data-state={state} title={title} aria-hidden="true">
      <img
        className="qiLotusIcon__img qiLotusIcon__img--closed"
        src={lotusClosed}
        alt=""
        draggable={false}
      />
      <img className="qiLotusIcon__img qiLotusIcon__img--open" src={lotusOpen} alt="" draggable={false} />
      <img className="qiLotusIcon__img qiLotusIcon__img--full" src={lotusFull} alt="" draggable={false} />
      {label ? <span className="qiLotusIcon__label">{label}</span> : null}
    </span>
  );
}
