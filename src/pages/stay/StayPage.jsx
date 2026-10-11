import { useState } from 'react';
import { useTripStore } from '../../stores/tripStore';
import { tripRangeText } from '../../utils/date';
import { mapsUrl } from '../../utils/helpers';
import Icon from '../../components/common/Icon';
import StayTab from '../todo/StayTab';
import { HOTEL_SOURCE, isNagahoriHotel, STAY_STREETS, STAY_FOOD } from '../../data/stayArea';
import './stay.css';

function AreaPhoto({ place }) {
  const [failed, setFailed] = useState(false);
  return (
    <article className="card stay-area__card">
      {failed ? <div className="stay-area__missing"><Icon name="image" /><span>照片暫時無法載入，可前往來源查看</span></div> :
        <a className="stay-area__image" href={place.image} target="_blank" rel="noopener noreferrer" aria-label={`放大${place.title}照片`}>
          <img src={place.image} alt={place.title} loading="lazy" decoding="async" onError={() => setFailed(true)} />
        </a>}
      <div className="stay-area__body">
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
  return (
    <>
      <header className="page-head">
        <h1 className="page-title">住宿</h1>
        <div className="page-sub">{trip.name} · {tripRangeText(trip)}</div>
      </header>
      <main className="content stay-page">
        <section aria-labelledby="stay-booking-title">
          <h2 id="stay-booking-title" className="section-title stay-area__heading"><Icon name="bed" />我們的住宿</h2>
          <div className="stay-page__bookings"><StayTab /></div>
        </section>
        {hasNagahori && <>
          <aside className="card card--pad stay-area__guide">
            <h2 className="section-title">心齋橋長堀通・住宿小提醒</h2>
            <p>四ツ橋站 2 號出口約步行 1 分鐘；心齋橋站約步行 5 分鐘。</p>
            <p>飯店一般入住時間 15:00、退房時間 11:00；實際依訂房確認單為準。</p>
            <div className="btn-row"><a className="btn btn--sm" href="tel:+81671661111"><Icon name="phone" />飯店電話</a><a className="btn btn--sm" href={HOTEL_SOURCE} target="_blank" rel="noopener noreferrer">飯店官網</a></div>
          </aside>
          <section aria-labelledby="stay-streets-title">
            <h2 id="stay-streets-title" className="section-title stay-area__heading"><Icon name="map" />周邊街道</h2>
            <p className="small muted stay-area__intro">從車站回飯店的實景照片，點圖片可放大。</p>
            <div className="stay-area__grid">{STAY_STREETS.map((place) => <AreaPhoto key={place.title} place={place} />)}</div>
          </section>
          <section aria-labelledby="stay-food-title">
            <h2 id="stay-food-title" className="section-title stay-area__heading"><Icon name="food" />附近吃什麼</h2>
            <p className="small muted stay-area__intro">飯店早餐與同街區的洋食店。餐點及營業資訊以店家當天公告為準。</p>
            <div className="stay-area__grid">{STAY_FOOD.map((place) => <AreaPhoto key={place.title} place={place} />)}</div>
          </section>
        </>}
      </main>
    </>
  );
}
