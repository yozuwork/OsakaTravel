import { useTripStore } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';
import Fab, { addActions } from '../../components/common/Fab';
import KV from '../../components/common/KV';
import { diffDays, mdw } from '../../utils/date';
import { mapsUrl } from '../../utils/helpers';
import { openVoiceStay } from './voiceTodo';
import { openStayEditor } from './stayEditor';

const stayActions = addActions({ voiceDesc: '用說的快速建立住宿', textDesc: '手動輸入住宿資訊', onText: () => openStayEditor(null), onVoice: () => openVoiceStay(() => openStayEditor(null)) });

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
              <Button size="sm" block onClick={() => openStayEditor(s.id)}><Icon name="edit" />編輯住宿資訊</Button>
            </div>
          </article>
        );
      })}
      {!stays.length && <div className="empty"><Icon name="bed" /><span className="empty__title">還沒有住宿</span><span className="small muted">按右下角的「＋」新增住宿</span></div>}
      <Fab label="新增住宿" actions={stayActions} />
    </>
  );
}
