import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { openForm } from '../../components/form/openForm';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import Fab, { addActions } from '../../components/common/Fab';
import KV from '../../components/common/KV';
import { addDays, diffDays, mdw } from '../../utils/date';
import { mapsUrl, uid } from '../../utils/helpers';
import { compressImage } from '../../utils/file';

function editStay(id) {
  const { stays, trip } = useTripStore.getState();
  const existing = id ? stays.find((x) => x.id === id) : null;
  const s = existing ? { ...existing } : { name: '', address: '', checkIn: trip.startDate, checkInTime: '', checkOut: addDays(trip.startDate, 1), checkOutTime: '', orderNo: '', roomType: '', phone: '', platform: '', photo: '' };

  openForm({
    title: existing ? '編輯住宿' : '新增住宿',
    fields: [
      { name: 'name', label: '飯店名稱', value: s.name, required: true, full: true },
      { name: 'address', label: '地址', value: s.address, full: true, hint: '導航會用這個地址搜尋 Google 地圖' },
      { name: 'checkIn', label: '入住日期', type: 'date', value: s.checkIn },
      { name: 'checkInTime', label: '入住時間', type: 'time', value: s.checkInTime },
      { name: 'checkOut', label: '退房日期', type: 'date', value: s.checkOut },
      { name: 'checkOutTime', label: '退房時間', type: 'time', value: s.checkOutTime },
      { name: 'orderNo', label: '訂單編號', value: s.orderNo },
      { name: 'roomType', label: '房型', value: s.roomType },
      { name: 'phone', label: '電話', type: 'tel', value: s.phone },
      { name: 'platform', label: '訂房平台', value: s.platform },
      { name: 'photo', label: '飯店照片', type: 'file', full: true, hint: s.photo ? '已有照片，選新檔會取代' : '選填' }
    ],
    onSave: async (v) => {
      const { photo: photoFile, ...rest } = v;
      const data = { ...s, ...rest };
      if (photoFile) {
        try { data.photo = await compressImage(photoFile, 900, 0.78); } catch { toast('圖片讀取失敗'); return false; }
      }
      updateTrip((st) => {
        const target = existing && st.stays.find((x) => x.id === id);
        if (target) Object.assign(target, data); else st.stays.push({ ...data, id: uid() });
      });
      toast('已儲存住宿');
    },
    onDelete: existing ? () => {
      updateTrip((st) => { st.stays = st.stays.filter((x) => x.id !== id); });
      toast('已刪除住宿');
    } : undefined
  });
}

const stayActions = addActions({ voiceDesc: '用說的快速建立住宿', textDesc: '手動輸入住宿資訊', onText: () => editStay(null) });

export default function StayTab() {
  const stays = useTripStore((s) => s.stays);
  return (
    <>
      {stays.map((s) => {
        const nights = s.checkIn && s.checkOut ? diffDays(s.checkIn, s.checkOut) : 0;
        const q = s.address || s.name;
        return (
          <article key={s.id} className="card" style={{ overflow: 'hidden' }}>
            <div className="stay__photo" style={s.photo ? { backgroundImage: `url('${s.photo}')` } : undefined}>
              {!s.photo && <><Icon name="image" /><span style={{ marginLeft: 6 }}>飯店照片</span></>}
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <h2 className="section-title" style={{ fontSize: 20 }}>{s.name || '尚未填寫飯店名稱'}</h2>
                <div className="tl-meta" style={{ marginTop: 6 }}><Icon name="pin" /><span>{s.address || '尚未填寫地址'}</span></div>
              </div>
              <div className="stay__dates">
                <div className="stay__date"><span className="kv__k">入住</span><strong>{mdw(s.checkIn) || '未定'}</strong><span className="small">{s.checkInTime || '--:--'}</span></div>
                <div className="stay__nights">{nights > 0 ? nights + ' 晚' : '—'}</div>
                <div className="stay__date stay__date--r"><span className="kv__k">退房</span><strong>{mdw(s.checkOut) || '未定'}</strong><span className="small">{s.checkOutTime || '--:--'}</span></div>
              </div>
              <div className="kv"><KV k="訂單編號" v={s.orderNo} /><KV k="房型" v={s.roomType} /><KV k="電話" v={s.phone} /><KV k="訂房平台" v={s.platform} /></div>
              <div className="btn-row">
                {q
                  ? <a className="btn btn--primary btn--sm" href={mapsUrl(q)} target="_blank" rel="noopener"><Icon name="nav" />導航</a>
                  : <Button variant="primary" size="sm" onClick={() => toast('請先填寫飯店地址')}><Icon name="nav" />導航</Button>}
                {s.phone
                  ? <a className="btn btn--sm" href={`tel:${s.phone.replace(/[^\d+]/g, '')}`}><Icon name="phone" />撥打電話</a>
                  : <Button size="sm" onClick={() => toast('請先填寫飯店電話')}><Icon name="phone" />撥打電話</Button>}
              </div>
              <Button size="sm" block onClick={() => editStay(s.id)}><Icon name="edit" />編輯住宿資訊</Button>
            </div>
          </article>
        );
      })}
      <Button variant="dashed" className="add-inline" onClick={() => editStay(null)}><Icon name="plus" />新增住宿</Button>
      <Fab label="新增住宿" actions={stayActions} />
    </>
  );
}
