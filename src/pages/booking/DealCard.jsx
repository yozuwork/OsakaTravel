import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { cx, safeUrl } from '../../utils/helpers';
import { DEALS_META } from '../../data/deals';
import { KIND_LABEL, dealTitle, dealToTrip, money, toggleFav, useIsFav } from './dealActions';

/** 預算提示：機加酒直接比預算；單買機票／飯店顯示佔預算幾成 */
function BudgetBadge({ d }) {
  const per = d.pricePerPerson;
  if (!per) return null;
  const { budgetPerPerson: budget } = DEALS_META;
  if (d.kind === 'package') {
    const over = per - budget;
    return <span className={cx('deal__budget', over > 0 && 'is-over')}>{over > 0 ? `超出 ${money(over)}` : '符合預算'}</span>;
  }
  return <span className="deal__budget is-part">佔預算 {Math.round((per / budget) * 100)}%</span>;
}

function Leg({ label, from, to, dep, arr, no }) {
  return (
    <div className="deal-leg">
      <span className="deal-leg__label">{label}</span>
      <span className="deal-leg__time">{dep || '--:--'}<small>{from}</small></span>
      <span className="deal-leg__mid"><Icon name="plane" /></span>
      <span className="deal-leg__time deal-leg__time--r">{arr || '--:--'}<small>{to}</small></span>
      <span className="deal-leg__no">{no || ''}</span>
    </div>
  );
}

/**
 * 機票／飯店／機加酒方案卡片（「機票與飯店」頁、收集箱「機票與飯店區」共用）
 * 功能：轉成行程、加入／移除喜歡、前往訂購頁
 */
export default function DealCard({ d }) {
  const fav = useIsFav(d.id);
  const url = safeUrl(d.url);
  const from = d.fromCode || 'TPE';
  const to = d.toCode || 'KIX';
  const sub = d.kind === 'flight' ? [d.carrierType, d.baggage].filter(Boolean).join('・')
    : d.kind === 'hotel' ? [d.area, d.station].filter(Boolean).join('・')
      : [d.agency, d.airline].filter(Boolean).join('・');

  return (
    <article className={cx('card deal', `deal--${d.kind}`)}>
      {d.kind === 'hotel' && safeUrl(d.image) && (
        <div className="deal__photo"><img src={safeUrl(d.image)} alt="" loading="lazy" referrerPolicy="no-referrer" /></div>
      )}
      <div className="deal__body">
        <div className="deal__head">
          <span className="deal__tags">
            <span className={cx('tag', d.kind !== 'flight' && 'tag--navy')}>{KIND_LABEL[d.kind]}</span>
            {d.priceStatus && <span className={cx('deal__status', d.priceStatus === '估價' && 'is-est')}>{d.priceStatus}</span>}
          </span>
          <button type="button" className={cx('deal__fav', fav && 'is-on')} onClick={() => toggleFav(d)}
            aria-pressed={fav} aria-label={fav ? '從收集箱移除' : '加入喜歡'} title={fav ? '從收集箱移除' : '加入喜歡'}>
            <Icon bi={fav ? 'heart-fill' : 'heart'} />
          </button>
        </div>

        <div>
          <h3 className="deal__title">{dealTitle(d)}</h3>
          {d.kind === 'hotel' && d.nameLocal && d.nameLocal !== d.name && <div className="deal__local">{d.nameLocal}</div>}
          {sub && <div className="deal__sub">{sub}</div>}
        </div>

        {d.kind === 'flight' && (
          <div className="deal-legs">
            <Leg label="去程" from={from} to={to} dep={d.outDep} arr={d.outArr} no={d.outFlightNo} />
            <Leg label="回程" from={to} to={from} dep={d.retDep} arr={d.retArr} no={d.retFlightNo} />
          </div>
        )}
        {d.kind === 'hotel' && d.roomType && <div className="deal__line"><Icon name="bed" /><span>{d.roomType}{d.rating ? `・評分 ${d.rating}` : ''}</span></div>}
        {d.kind === 'package' && d.hotel && <div className="deal__line"><Icon name="bed" /><span>{d.hotel}</span></div>}

        <div className="deal__price">
          <span className="deal__amount"><small>每人</small>{money(d.pricePerPerson)}</span>
          <BudgetBadge d={d} />
        </div>
        {d.kind === 'hotel' && d.priceTotal > 0 && <div className="deal__sub">{d.nights || 4} 晚 3 人共 {money(d.priceTotal)}</div>}
        {d.note && <p className="deal__note">{d.note}</p>}

        <div className="btn-row">
          <Button variant="primary" size="sm" onClick={() => dealToTrip(d)}><Icon name="calendar" />轉成行程</Button>
          {url
            ? <a className="btn btn--sm" href={url} target="_blank" rel="noopener"><Icon name="external" />查看方案</a>
            : <Button size="sm" disabled><Icon name="external" />查看方案</Button>}
        </div>
      </div>
    </article>
  );
}
