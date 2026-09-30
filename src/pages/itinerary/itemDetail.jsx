import { modal } from '../../stores/modalStore';
import { useTripStore } from '../../stores/tripStore';
import { useModalContext } from '../../components/modal/ModalContext';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import KV from '../../components/common/KV';
import { addDays, mdw } from '../../utils/date';
import { mapsUrl } from '../../utils/helpers';
import { openItemForm } from './itemForm';

/** 行程詳情：可開啟地圖、複製成新行程或編輯 */
export function openItemDetail(id) {
  modal.open({ title: '行程詳情', content: <ItemDetail id={id} /> });
}

function ItemDetail({ id }) {
  const { close } = useModalContext();
  const trip = useTripStore((s) => s.trip);
  const it = useTripStore((s) => s.items.find((x) => x.id === id));
  if (!it) return <p className="muted">此行程已刪除</p>;

  const { id: _id, ...copy } = it;
  const q = it.place || it.title;

  return (
    <>
      <h3 className="tl-title" style={{ whiteSpace: 'normal' }}>{it.title}</h3>
      <div className="kv">
        <KV k="日期" v={`D${it.day + 1} · ${mdw(addDays(trip.startDate, it.day))}`} />
        <KV k="時間" v={it.time} />
        <KV k="類別" v={it.category} />
        <KV k="地點" v={it.place} />
      </div>
      <div className="kv__item">
        <span className="kv__k">備註</span>
        <span className={'kv__v' + (it.note ? '' : ' is-empty')} style={{ whiteSpace: 'pre-wrap' }}>{it.note || '尚未填寫'}</span>
      </div>
      <a className="btn btn--primary btn--block" href={mapsUrl(q)} target="_blank" rel="noopener"><Icon name="map" />在 Google 地圖查看</a>
      <div className="btn-row">
        <Button onClick={() => { close(); openItemForm(null, copy, { copy: true }); }}><Icon name="plus" />複製行程</Button>
        <Button onClick={() => { close(); openItemForm(id); }}><Icon name="edit" />編輯</Button>
      </div>
    </>
  );
}
