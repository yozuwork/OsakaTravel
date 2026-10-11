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
import { HOTEL_PHOTO, HOTEL_SOURCE, isNagahoriHotel } from '../../data/stayArea';

const stayActions = addActions({ voiceDesc: '用說的快速建立住宿', textDesc: '手動輸入住宿資訊', onText: () => openStayEditor(null), onVoice: () => openVoiceStay(() => openStayEditor(null)) });

export default function StayTab() {
  const stays = useTripStore((s) => s.stays);
  return (
    <>
      {stays.map((s) => {
        const nights = s.checkIn && s.checkOut ? diffDays(s.checkIn, s.checkOut) : 0;
        const q = s.address || s.name;
        const photo = s.images?.[0] || s.photo || (isNagahoriHotel(s) ? HOTEL_PHOTO : '');
        const officialPhoto = photo === HOTEL_PHOTO;
        return (
          <article key={s.id} className="card" style={{ overflow: 'hidden' }}>
            <div className="stay__photo">
              {photo ? <img src={photo} alt={`${s.name || '飯店'}外觀或住宿照片`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><Icon name="image" /><span style={{ marginLeft: 6 }}>飯店照片</span></>}
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {officialPhoto && <a className="small muted" href={HOTEL_SOURCE} target="_blank" rel="noopener noreferrer">照片來源：Hearton Hotel 官方網站</a>}
              <div>
                <h2 className="section-title" style={{ fontSize: 20 }}>{s.name || '尚未填寫飯店名稱'}</h2>
                {s.bookingStatus && <span style={{ display: 'inline-block', marginTop: 8, padding: '5px 10px', borderRadius: 4, background: 'var(--navy)', color: 'white', fontSize: 12 }}>{s.bookingStatus}</span>}
                {s.englishName && <p className="small muted">{s.englishName}</p>}
                <div className="tl-meta" style={{ marginTop: 6 }}><Icon name="pin" /><span>{s.address || '尚未填寫地址'}</span></div>
              </div>
              <div className="stay__dates">
                <div className="stay__date"><span className="kv__k">入住</span><strong>{mdw(s.checkIn) || '未定'}</strong><span className="small">{s.checkInTime || '--:--'}</span></div>
                <div className="stay__nights">{nights > 0 ? nights + ' 晚' : '—'}</div>
                <div className="stay__date stay__date--r"><span className="kv__k">退房</span><strong>{mdw(s.checkOut) || '未定'}</strong><span className="small">{s.checkOutTime || '--:--'}</span></div>
              </div>
              <div className="kv"><KV k="房型" v={s.roomType} /><KV k="電話" v={s.phone} /><KV k="訂房平台" v={s.platform} /></div>
              <div className="kv">{[['床型', s.bedType], ['房間數', s.rooms], ['每房人數上限', s.capacity], ['入住時段（當地時間）', s.checkInWindow]].filter(([, v]) => v).map(([k, v]) => <KV key={k} k={k} v={v} />)}</div>
              {s.email && <a href={`mailto:${s.email}`}>{s.email}</a>}
              {['specialRequest', 'arrivalNote', 'paymentNote'].map((key, i) => s[key] && <div key={key}><strong>{['特殊需求', '入住提醒', '稅金與付款提醒'][i]}</strong><p className="small" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{s[key]}</p></div>)}
              {s.images?.length > 0 && <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }} aria-label="住宿照片與訂房截圖">{s.images.map((image, index) => <a key={`${index}-${image.slice(0, 40)}`} href={image} target="_blank" rel="noopener noreferrer"><img src={image} alt={`住宿照片或訂房截圖 ${index + 1}`} loading="lazy" style={{ width: 120, height: 100, objectFit: 'contain' }} /></a>)}</div>}
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
