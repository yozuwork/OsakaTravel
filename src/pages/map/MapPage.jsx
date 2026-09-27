import { useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast, loading } from '../../stores/uiStore';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { mapsUrl } from '../../utils/helpers';

const STAGE_W = 390, STAGE_H = 504;

/** 把 390×504 的插畫地圖依容器寬度等比縮放 */
function useMapLayout(wrapRef, stageRef) {
  useLayoutEffect(() => {
    function layout() {
      const wrap = wrapRef.current, stage = stageRef.current;
      if (!wrap || !stage) return;
      const desktop = window.matchMedia('(min-width: 900px)').matches;
      const w = wrap.clientWidth;
      let scale = w / STAGE_W;
      if (desktop) {
        // 網站版：地圖填滿可視高度，等比置中
        const h = Math.max(420, window.innerHeight - wrap.getBoundingClientRect().top - 24);
        scale = Math.min(w / STAGE_W, h / STAGE_H);
        wrap.style.height = h + 'px';
        stage.style.left = Math.round((w - STAGE_W * scale) / 2) + 'px';
        stage.style.top = Math.round((h - STAGE_H * scale) / 2) + 'px';
      } else {
        wrap.style.height = Math.round(STAGE_H * scale) + 'px';
        stage.style.left = '0px';
        stage.style.top = '0px';
      }
      stage.style.transform = `scale(${scale})`;
    }
    layout();
    window.addEventListener('resize', layout);
    return () => window.removeEventListener('resize', layout);
  }, [wrapRef, stageRef]);
}

function locate() {
  if (!navigator.geolocation) { toast('這個瀏覽器不支援定位'); return; }
  loading.show('定位中…');
  navigator.geolocation.getCurrentPosition(
    (p) => { loading.hide(); window.open(mapsUrl(p.coords.latitude + ',' + p.coords.longitude), '_blank', 'noopener'); },
    () => { loading.hide(); toast('無法取得位置，請確認已允許定位權限'); },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

export default function MapPage() {
  const spots = useTripStore((s) => s.spots);
  const to = useTripStore((s) => s.trip.to);
  const uiSpot = useTripStore((s) => s.ui.spot);
  const wrapRef = useRef(null);
  const stageRef = useRef(null);
  useMapLayout(wrapRef, stageRef);

  const sel = Math.min(uiSpot, spots.length - 1);
  const cur = spots[sel];
  const setSpot = (i) => updateTrip((s) => { s.ui.spot = (i + s.spots.length) % s.spots.length; });

  return (
    <>
      <header className="page-head" style={{ paddingTop: 28 }}>
        <div className="page-head__row" style={{ alignItems: 'flex-end' }}>
          <div><h1 className="page-title">地圖</h1><div className="page-sub">已規劃 {spots.length} 個地點 · 點地點看附近車站</div></div>
          <Button size="sm" onClick={() => toast('目前只有大阪地圖，更多城市規劃中')} style={{ borderRadius: 22, height: 44 }}>
            <Icon name="pin" />{to}<Icon name="chevronDown" />
          </Button>
        </div>
      </header>
      <div className="map-page">
        <div className="map-stage-wrap" ref={wrapRef}>
          <div className="map-stage" ref={stageRef}>
            <span className="map-bay" aria-hidden="true">大阪灣</span>
            <svg className="map-routes" viewBox="0 0 390 504" fill="none" aria-hidden="true">
              <g stroke="var(--route)" strokeWidth="4" strokeDasharray="8 7" strokeLinecap="round">
                <path d="M70 174 Q 110 70 210 40" /><path d="M210 40 L200 238" /><path d="M200 238 L320 142" />
                <path d="M200 238 L210 428" /><path d="M210 428 Q 270 360 316 342" /><path d="M76 342 Q 120 270 200 238" />
              </g>
            </svg>
            {spots.map((s) => (
              <span key={'st' + s.name} className="station" style={{ left: s.tx, top: s.ty }}><Icon name="train" />{s.station}</span>
            ))}
            {spots.map((s, i) => (
              <button key={s.name} className="spot" style={{ left: s.x, top: s.y, width: s.w }} aria-pressed={i === sel} onClick={() => setSpot(i)} aria-label={`${i + 1}. ${s.name}`}>
                <span className="spot__no">{i + 1}</span><span className="spot__name">{s.name}</span><span className="spot__en">{s.en}</span>
              </button>
            ))}
          </div>
          <button className="icon-btn map-fab" style={{ top: 12 }} onClick={() => toast('地圖已是北方朝上')} aria-label="北方朝上"><Icon name="arrowUp" /></button>
          <button className="icon-btn map-fab" style={{ bottom: 26 }} onClick={locate} aria-label="在 Google 地圖查看我的位置"><Icon name="locate" /></button>
        </div>
        <section className="map-sheet" aria-label="地點資訊">
          <div className="map-sheet__handle" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="map-sheet__no">{sel + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}><div className="map-sheet__name">{cur.name}</div><div className="small muted">{cur.en}</div></div>
            <button className="icon-btn" onClick={() => setSpot(sel - 1)} aria-label="上一個地點"><Icon name="chevronLeft" /></button>
            <button className="icon-btn" onClick={() => setSpot(sel + 1)} aria-label="下一個地點"><Icon name="chevronRight" /></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}><Icon name="train" /><span className="muted">最近車站</span><strong>{cur.station}</strong></div>
          <div className="btn-row">
            <a className="btn btn--primary btn--sm" href={mapsUrl(cur.name.split('・')[0] + ' ' + to)} target="_blank" rel="noopener"><Icon name="nav" />導航</a>
            <Link className="btn btn--sm" to="/itinerary">在行程中查看</Link>
          </div>
        </section>
      </div>
    </>
  );
}
