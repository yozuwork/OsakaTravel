import { useNavigate } from 'react-router';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { AIRPORT_GROUPS } from '../../data/transit/airport';
import { transit } from '../../stores/transitStore';
import LineBadge from './LineBadge';

export default function AirportTab() {
  const navigate = useNavigate();
  const startFrom = (station) => {
    transit.startFrom(station);
    navigate('/transit', { replace: true });
  };

  return (
    <>
      {AIRPORT_GROUPS.map((g) => (
        <section key={g.id} className="ap-group" aria-labelledby={`ap-${g.id}`}>
          <div className="row-between">
            <h2 className="section-title" id={`ap-${g.id}`}>{g.title}</h2>
            <Button size="sm" variant="primary" onClick={() => startFrom(g.station)}><Icon name="nav" />{g.cta}</Button>
          </div>
          {g.options.map((o) => (
            <article key={o.title} className="card card--pad ap-opt">
              <div className="ap-opt__head">
                <h3 className="ap-opt__title">{o.title}</h3>
                <span className="ap-opt__time">約 {o.min} 分<small>{o.dest}</small></span>
              </div>
              <p className="ap-opt__desc">{o.desc}</p>
              <div className="ap-opt__lines">
                {o.bus
                  ? <span className="tag tag--navy"><Icon name="bus" />巴士</span>
                  : o.lines.map((l) => <LineBadge key={l} line={l} />)}
              </div>
            </article>
          ))}
        </section>
      ))}
      <p className="tr-note">時間為一般情況下的概估；票價與班次請以南海、JR 西日本與機場巴士官網為準。</p>
    </>
  );
}
