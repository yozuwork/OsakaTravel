import { useEffect, useState } from 'react';
import { auth } from '../../services/firebase';
import { useCloudStatus } from '../../services/cloudSync';
import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { uid } from '../../utils/helpers';
import { diffDays, mdw, tripRangeText } from '../../utils/date';
import { mapsUrl } from '../../utils/helpers';
import Icon from '../../components/common/Icon';
import StayTab from '../todo/StayTab';
import { modal } from '../../stores/modalStore';
import { HOTEL_PHOTO, HOTEL_SOURCE, isNagahoriHotel, STAY_STREETS, STAY_FOOD } from '../../data/stayArea';
import './stay.css';

function PhotoViewer({ places, start }) {
  const [index, setIndex] = useState(start);
  const place = places[index];
  return <div className="stay-lightbox"><img src={place.image} alt={place.title} /><div className="stay-lightbox__caption"><strong>{place.title}</strong><span>{index + 1} / {places.length}</span></div><p>{place.description}</p><div className="stay-lightbox__controls"><button type="button" onClick={() => setIndex((index + places.length - 1) % places.length)}>← 上一張</button><a href={place.source} target="_blank" rel="noopener noreferrer">來源：{place.credit}</a><button type="button" onClick={() => setIndex((index + 1) % places.length)}>下一張 →</button></div></div>;
}

function AreaPhoto({ place, index, places }) {
  const [failed, setFailed] = useState(false);
  return (
    <article className="card stay-area__card">
      {failed ? <div className="stay-area__missing"><Icon name="image" /><span>照片暫時無法載入，可前往來源查看</span></div> :
        <button type="button" className="stay-area__image" onClick={() => modal.open({ title: '街景與美食相簿', content: <PhotoViewer places={places} start={index} /> })} aria-label={`放大${place.title}照片`}>
          <img src={place.image} alt={place.title} loading="lazy" decoding="async" onError={() => setFailed(true)} />
          <span className="stay-area__zoom"><Icon name="plus" /></span>
        </button>}
      <div className="stay-area__body">
        <span className="stay-area__number">{String(index + 1).padStart(2, '0')} / {places === STAY_STREETS ? 'WALK' : 'TASTE'}</span>
        <h3 className="section-title">{place.title}</h3>
        <p className="small muted">{place.description}</p>
        <a className="small muted" href={place.source} target="_blank" rel="noopener noreferrer">照片來源：{place.credit}</a>
        <a className="btn btn--sm" href={mapsUrl(place.query)} target="_blank" rel="noopener noreferrer"><Icon name="nav" />地圖導航</a>
      </div>
    </article>
  );
}

export default function StayPage() {
  const trip = useTripStore((s) => s.trip);
  const stays = useTripStore((s) => s.stays);
  const hasNagahori = stays.some(isNagahoriHotel);
  const cloudReady = useCloudStatus((state) => state.readyDocuments.trip);
  const [privateImportError, setPrivateImportError] = useState('');
  useEffect(() => {
    if (!import.meta.env.DEV || !cloudReady || !auth.currentUser) return;
    let cancelled = false;
    const user = auth.currentUser;
    (async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch('/__private/stay-booking', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
        if (response.status === 404) return;
        if (!response.ok) throw new Error('無法取得本機住宿資料，請確認此帳號已獲授權。');
        const payload = await response.json();
        if (cancelled || auth.currentUser?.uid !== user.uid) return;
        if (payload.type !== 'osaka-stay-booking' || !payload.stay?.orderNo) throw new Error('本機住宿資料格式不正確。');
        const booking = payload.stay;
        const existing = useTripStore.getState().stays.find((stay) => stay.orderNo === booking.orderNo);
        if (existing?.bookingImportVersion === 1) return;
        updateTrip((state) => {
          const stay = state.stays.find((stay) => stay.orderNo === booking.orderNo || (stay.name === booking.name && stay.checkIn === booking.checkIn));
          if (stay) Object.assign(stay, booking, { bookingImportVersion: 1 });
          else state.stays.push({ ...booking, bookingImportVersion: 1, id: uid(), images: [], photo: '', platform: '' });
        });
        toast('已補入訂房資訊，雲端寫入結果請看上方儲存狀態');
      } catch (error) { if (!cancelled) setPrivateImportError(error.message); }
    })();
    return () => { cancelled = true; };
  }, [cloudReady]);
  const primary = stays[0];
  const heroPhoto = primary?.images?.[0] || primary?.photo || (primary && isNagahoriHotel(primary) ? HOTEL_PHOTO : '');
  const [heroFailed, setHeroFailed] = useState('');
  const nights = primary?.checkIn && primary?.checkOut ? diffDays(primary.checkIn, primary.checkOut) : 0;
  async function importBooking(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.type !== 'osaka-stay-booking' || !data.stay?.name) throw new Error('format');
      const fields = ['name', 'englishName', 'address', 'checkIn', 'checkInTime', 'checkOut', 'checkOutTime', 'orderNo', 'confirmationNo', 'bookingStatus', 'roomType', 'bedType', 'rooms', 'capacity', 'checkInWindow', 'phone', 'email', 'specialRequest', 'arrivalNote', 'paymentNote'];
      const booking = Object.fromEntries(fields.filter((key) => typeof data.stay[key] === 'string').map((key) => [key, data.stay[key]]));
      updateTrip((state) => {
        const existing = state.stays.find((stay) => stay.orderNo === booking.orderNo && booking.orderNo) || state.stays.find((stay) => stay.name === booking.name && stay.checkIn === booking.checkIn);
        if (existing) Object.assign(existing, booking);
        else state.stays.push({ ...booking, id: uid(), images: [], photo: '', platform: '' });
      });
      toast('住宿資料已匯入，雲端儲存狀態請看上方提示');
    } catch { toast('無法匯入，請選擇住宿資訊 JSON 檔'); }
  }
  return (
    <>
      <main className="content stay-page">
        <header className="stay-masthead"><span className="stay-eyebrow">OSAKA / OUR LITTLE BASE</span><span>{trip.name} · {tripRangeText(trip)}</span></header>
        <section className="stay-hero" aria-labelledby="stay-page-title">
          <div className="stay-hero__copy"><span className="stay-eyebrow">住進旅途的日常</span><h1 id="stay-page-title">在大阪，<br />有個<span>落腳的地方。</span></h1><p>放下行李，再慢慢走進街道。<br />我們的住宿，和附近那些值得停留的小地方。</p><button className="stay-hero__link" type="button" onClick={() => document.getElementById('stay-booking-title')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })}>查看住宿資訊 <span aria-hidden="true">↗</span></button><span className="stay-hero__word" aria-hidden="true">STAY.</span></div>
          <div className="stay-hero__visual">{heroPhoto && heroFailed !== heroPhoto ? <img src={heroPhoto} alt={primary?.name || '我們的住宿'} fetchPriority="high" onError={() => setHeroFailed(heroPhoto)} /> : <div className="stay-hero__placeholder"><Icon name="bed" /><span>下一段旅程，從這裡開始</span></div>}<span className="stay-hero__tag">旅途的基地 / OUR STAY</span><div className="stay-hero__hotel"><span>大阪 · {nights > 0 ? `${nights} NIGHTS` : 'STAY'}</span><strong>{primary?.name || '選一個喜歡的落腳處'}</strong>{heroPhoto === HOTEL_PHOTO && <a href={HOTEL_SOURCE} target="_blank" rel="noopener noreferrer">PHOTO / HEARTON HOTEL ↗</a>}</div></div>
        </section>
        {primary && <div className="stay-strip"><div><span>CHECK IN / 入住</span><strong>{mdw(primary.checkIn) || '日期待定'}</strong><small>{primary.checkInTime || '時間待確認'} · 當地時間</small></div><div className="stay-strip__nights"><strong>{nights > 0 ? String(nights).padStart(2, '0') : '—'}</strong><span>NIGHTS / 晚</span></div><div><span>CHECK OUT / 退房</span><strong>{mdw(primary.checkOut) || '日期待定'}</strong><small>{primary.checkOutTime || '時間待確認'} · 當地時間</small></div></div>}
        <section aria-labelledby="stay-booking-title">
          <div className="stay-section-head"><div><span className="stay-eyebrow">01 / THE RESERVATION</span><h2 id="stay-booking-title">我們的住宿</h2></div><label className="stay-import"><Icon name="inbox" />匯入訂房資料<input className="sr-only" type="file" accept="application/json,.json" onChange={importBooking} /></label></div>
          <div className="stay-page__bookings"><StayTab /></div>
          {privateImportError && <p role="alert">{privateImportError}</p>}
        </section>
        {hasNagahori && <>
          <aside className="stay-area__guide">
            <div><span className="stay-eyebrow">GOOD TO KNOW</span><h2 className="section-title">出發前，記住這幾件事。</h2></div><div>
            <p>四ツ橋站 2 號出口約步行 1 分鐘；心齋橋站約步行 5 分鐘。</p>
            <p>飯店一般入住時間 15:00、退房時間 11:00；實際依訂房確認單為準。</p>
            <div className="btn-row"><a className="btn btn--sm" href="tel:+81671661111"><Icon name="phone" />飯店電話</a><a className="btn btn--sm" href={HOTEL_SOURCE} target="_blank" rel="noopener noreferrer">飯店官網</a></div>
            </div>
          </aside>
          <section aria-labelledby="stay-streets-title">
            <div className="stay-section-head"><div><span className="stay-eyebrow">02 / AROUND THE CORNER</span><h2 id="stay-streets-title">轉個彎，走進街道。</h2></div><Icon name="map" /></div>
            <p className="small muted stay-area__intro">從車站回飯店的實景照片，點圖片可放大。<span className="stay-swipe-hint">左右滑動，看看下一個轉角 →</span></p>
            <div className="stay-area__grid stay-area__grid--streets">{STAY_STREETS.map((place, index) => <AreaPhoto key={place.title} place={place} index={index} places={STAY_STREETS} />)}</div>
          </section>
          <section aria-labelledby="stay-food-title">
            <div className="stay-section-head"><div><span className="stay-eyebrow">03 / SOMETHING DELICIOUS</span><h2 id="stay-food-title">把附近的好味道，收進旅程。</h2></div><Icon name="food" /></div>
            <p className="small muted stay-area__intro">飯店早餐與同街區的洋食店。餐點及營業資訊以店家當天公告為準。<span className="stay-swipe-hint">左右滑動，找一餐喜歡的味道 →</span></p>
            <div className="stay-area__grid stay-area__grid--food">{STAY_FOOD.map((place, index) => <AreaPhoto key={place.title} place={place} index={index} places={STAY_FOOD} />)}</div>
          </section>
        </>}
        <footer className="stay-footer"><span>OSAKA, AT YOUR OWN PACE.</span><span>住得安心，玩得盡興。</span></footer>
      </main>
    </>
  );
}
