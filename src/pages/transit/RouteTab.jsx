import { Fragment, useEffect, useMemo, useRef } from 'react';
import Icon from '../../components/common/Icon';
import { LINES } from '../../data/transit/lines';
import { QUICK_STATIONS } from '../../data/transit/stations';
import { directionText, findRoute, stationZh } from '../../utils/transit';
import { transit, useTransitStore } from '../../stores/transitStore';
import { openStationPicker } from './stationPicker';
import LineBadge from './LineBadge';

export default function RouteTab() {
  const { from, to, fewTransfers, recent, pendingPick } = useTransitStore();
  const fieldRefs = { from: useRef(null), to: useRef(null) };

  const pick = (which) => openStationPicker({
    title: which === 'from' ? '從哪一站出發' : '要到哪一站',
    onPick: (s) => transit.setStation(which, s)
  });

  // 從機場頁跳過來：先把焦點放在欄位上（面板關閉後焦點會回到這裡），再開面板
  useEffect(() => {
    const which = useTransitStore.getState().pendingPick; // 讀最新值，StrictMode 重跑 effect 時不會開兩次
    if (!which) return;
    transit.clearPendingPick();
    fieldRefs[which].current?.focus();
    pick(which);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPick]);

  const route = useMemo(() => (from && to ? findRoute(from, to, { fewTransfers }) : null), [from, to, fewTransfers]);

  const onQuick = (s) => {
    if (!from) transit.setStation('from', s);
    else if (s !== from) transit.setStation('to', s);
  };

  return (
    <>
      <section className="card od-card" aria-label="出發與抵達">
        <span className="od-card__connector" aria-hidden="true" />
        <StationField ref={fieldRefs.from} label="出發" station={from} onClick={() => pick('from')} />
        <StationField ref={fieldRefs.to} label="抵達" station={to} isTo onClick={() => pick('to')} />
        <button type="button" className="icon-btn od-card__swap" onClick={transit.swap} aria-label="交換出發與抵達">
          <Icon bi="arrow-down-up" />
        </button>
      </section>

      <div className="tr-toggle" role="group" aria-label="路線偏好">
        <button type="button" aria-pressed={!fewTransfers} onClick={() => transit.setFewTransfers(false)}>最快抵達</button>
        <button type="button" aria-pressed={fewTransfers} onClick={() => transit.setFewTransfers(true)}>少轉乘</button>
      </div>

      <div className="tr-quick" role="group" aria-label="常用站">
        {QUICK_STATIONS.map((q) => (
          <button key={q.id} type="button" className="tr-quick__btn" onClick={() => onQuick(q.id)}
            aria-label={`${from ? '抵達' : '出發'}：${q.label}`}>{q.label}</button>
        ))}
      </div>

      <RouteResult from={from} to={to} route={route} />

      {recent.some((r) => !(r.from === from && r.to === to)) && (
        <section className="tr-recent" aria-label="最近查詢">
          <h2 className="section-title">最近查過</h2>
          <ul className="list">
            {recent.filter((r) => !(r.from === from && r.to === to)).map((r) => (
              <li key={r.from + '>' + r.to}>
                <button type="button" className="tr-recent__item" onClick={() => { transit.setRoute(r.from, r.to); window.scrollTo(0, 0); }}>
                  <span>{r.from} → {r.to}</span><Icon name="chevronRight" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function StationField({ ref, label, station, isTo, onClick }) {
  const zh = station && stationZh(station);
  return (
    <button ref={ref} type="button" className="od-field" onClick={onClick}
      aria-label={`${label}：${station ? station + (zh ? `（${zh}）` : '') : '尚未選擇'}，點選更換`}>
      <span className={'od-field__pin' + (isTo ? ' is-to' : '')} aria-hidden="true" />
      <span className="od-field__text">
        <span className="od-field__label">{label}</span>
        {station
          ? <span className="od-field__name">{station}{zh && <small>{zh}</small>}</span>
          : <span className="od-field__name is-empty">選擇車站</span>}
      </span>
    </button>
  );
}

function RouteResult({ from, to, route }) {
  if (!from || !to) return <Empty>選好出發站和抵達站，<br />就會告訴你要搭哪個顏色的線、在哪裡換車。</Empty>;
  if (from === to) return <Empty>出發站和抵達站相同，換一個抵達站試試。</Empty>;
  if (!route) return <Empty>這兩站之間找不到收錄的路線。</Empty>;

  const rides = route.segs.filter((s) => s.kind === 'ride');
  return (
    <section className="tr-result" aria-live="polite" aria-label="查詢結果">
      <div className="card card--pad tr-answer">
        <div className="tr-answer__head">
          <span className="tr-answer__mins">約 {route.total}<small>分鐘</small></span>
          <span className="tr-answer__xfer">{route.transfers ? `轉乘 ${route.transfers} 次` : '不用轉乘'}</span>
        </div>
        <div className="tr-ribbon" aria-hidden="true">
          {route.segs.map((s, i) => s.kind === 'ride'
            ? <i key={i} style={{ background: LINES[s.line].color, flexGrow: s.min }} />
            : <i key={i} className="is-walk" />)}
        </div>
        <div className="tr-answer__lines">
          {rides.map((s, i) => (
            <Fragment key={i}>
              {i > 0 && <span className="tr-answer__arrow" aria-label="轉乘">›</span>}
              <LineBadge line={s.line} />
            </Fragment>
          ))}
        </div>
      </div>

      <ol className="tr-steps" aria-label="搭乘步驟">
        {route.segs.map((s, i) => <Step key={i} seg={s} prev={route.segs[i - 1]} next={route.segs[i + 1]} />)}
      </ol>

      <p className="tr-note">時間為行車加轉乘的概估，不含候車；出發前請以官方時刻表或 Google 地圖為準。</p>
    </section>
  );
}

function Stop({ name, color, end }) {
  const zh = stationZh(name);
  return (
    <li className="tr-stop" style={color ? { '--line': color } : undefined}>
      <span className={'tr-stop__dot' + (end ? ' is-end' : '')} aria-hidden="true" />
      <span className="tr-stop__name">{name}{zh && <small>{zh}</small>}</span>
    </li>
  );
}

function Step({ seg, prev, next }) {
  if (seg.kind !== 'ride') {
    return (
      <>
        {!prev && <Stop name={seg.from} />}
        <li className="tr-leg tr-leg--walk">
          <span className="tr-leg__rail" aria-hidden="true" />
          <span className="tr-leg__walk">
            <Icon bi={seg.kind === 'walk' ? 'person-walking' : 'arrow-left-right'} />
            {seg.kind === 'walk' ? `步行到 ${seg.to} 站，約 ${seg.min} 分鐘` : `在 ${seg.from} 站內轉乘，約 ${seg.min} 分鐘`}
          </span>
        </li>
        {!next && <Stop name={seg.to} end />}
      </>
    );
  }

  const L = LINES[seg.line];
  const mid = seg.stops.slice(1, -1);
  const last = seg.stops.at(-1);
  const showNote = L.note && (!L.noteStations || seg.stops.some((x) => L.noteStations.includes(x)));
  return (
    <>
      <Stop name={seg.stops[0]} color={L.color} />
      <li className="tr-leg" style={{ '--line': L.color }}>
        <span className="tr-leg__rail" aria-hidden="true" />
        <div className="tr-leg__body">
          <LineBadge line={seg.line} />
          <div className="tr-leg__dir">{directionText(seg)}</div>
          <div className="tr-leg__meta">搭 {seg.stops.length - 1} 站，約 {Math.round(seg.min)} 分鐘</div>
          {mid.length > 0 && (
            <details className="tr-leg__via">
              <summary>看經過的 {mid.length} 站</summary>
              <ol>{mid.map((x) => <li key={x}>{x}</li>)}</ol>
            </details>
          )}
          {showNote && <p className="tr-leg__tip"><Icon name="alert" /><span>{L.note}</span></p>}
        </div>
      </li>
      {next?.kind !== 'transfer' && <Stop name={last} color={L.color} end={!next} />}
    </>
  );
}

function Empty({ children }) {
  return (
    <div className="empty">
      <Icon name="train" />
      <span className="small muted">{children}</span>
    </div>
  );
}
