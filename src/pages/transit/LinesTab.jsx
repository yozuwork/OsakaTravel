import Icon from '../../components/common/Icon';
import { LINES, LINE_GROUPS } from '../../data/transit/lines';
import { isInterchange } from '../../utils/transit';

export default function LinesTab() {
  return (
    <>
      <p className="small muted tr-legend-note">
        車站指示牌、地面地圖都用同樣的顏色與代號，看顏色找月台最快。點一條線看全部車站，粗框是可轉乘站。
      </p>
      {LINE_GROUPS.map((g) => (
        <section key={g.title} className="line-group" aria-labelledby={`lg-${g.en}`}>
          <h2 className="section-title" id={`lg-${g.en}`}>{g.title}<small>{g.en}</small></h2>
          <div className="card line-group__list">
            {g.lines.map((id) => {
              const L = LINES[id];
              return (
                <details key={id} className="line-row" style={{ '--line': L.color }}>
                  <summary>
                    <span className="line-row__bar" aria-hidden="true" />
                    <span className="line-row__name">{L.name}<small>{L.en}</small></span>
                    <span className={'line-row__code' + (L.light ? ' is-light' : '')}>{L.code}</span>
                    <Icon name="chevronDown" className="line-row__chev" />
                  </summary>
                  <ul className="line-row__stations" aria-label={`${L.name}車站`}>
                    {L.stations.map((s) => (
                      <li key={s} className={isInterchange(s) ? 'is-x' : undefined}>
                        {s}{isInterchange(s) && <span className="sr-only">（可轉乘）</span>}
                      </li>
                    ))}
                  </ul>
                </details>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
