import classNames from 'classnames';
import lotusClosed from '../../assets/icons/qi_lotus_closed.png';
import lotusOpen from '../../assets/icons/qi_lotus_open.png';
import lotusFull from '../../assets/icons/qi_lotus_full.png';

export type QiLotusState = 'closed' | 'open' | 'full';

type QiLotusIconProps = {
  state: QiLotusState;
  size?: number;
  className?: string;
};

export function QiLotusIcon({ state, size = 16, className }: QiLotusIconProps) {
  return (
    <span
      className={classNames('qiLotusIcon', `qiLotusIcon--${state}`, className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img className="qiLotusIcon__img" src={lotusClosed} data-variant="closed" alt="" />
      <img className="qiLotusIcon__img" src={lotusOpen} data-variant="open" alt="" />
      <img className="qiLotusIcon__img" src={lotusFull} data-variant="full" alt="" />
    </span>
  );
}
