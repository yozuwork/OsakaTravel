import { pad } from '../../features/checkin/engine';
import BlobImg from './BlobImg';

/**
 * 明信片集：當天拍過的明信片，依站分組
 * @param {{ stop, cards: object[] }[]} p.groups 只放有明信片的站
 */
export default function PostcardAlbum({ groups, onOpenCard }) {
  const total = groups.reduce((n, g) => n + g.cards.length, 0);
  return (
    <section className="ck-album" aria-label="明信片集">
      <div className="ck-sec">
        <h2>明信片集</h2>
        <span>{total ? `共 ${total} 張` : '拍過的都收在這裡'}</span>
      </div>
      {total === 0 && <div className="ck-empty">還沒有明信片，先去第一站拍一張吧</div>}
      {groups.map(({ stop, cards }) => (
        <div key={stop.no} className="ck-grp">
          <div className="ck-grp__h"><span>{pad(stop.no)}</span><b>{stop.title}</b><em>{cards.length} 張</em></div>
          <div className="ck-grp__grid">
            {cards.map((r) => (
              <button key={r.id} type="button" onClick={() => onOpenCard(r)} aria-label={`看 ${stop.title} 的明信片`}>
                <BlobImg blob={r.card} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
