import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { addItem } from '../itinerary/itemEditor';
import { safeUrl } from '../../utils/helpers';

/* =========================================================
   機票／飯店／機加酒方案：加入喜歡、轉成行程
   方案資料 deal = { id, kind: 'flight' | 'hotel' | 'package', ... }（見 data/deals.js）
   ========================================================= */

export const KIND_LABEL = { flight: '機票', hotel: '飯店', package: '機加酒' };

export const money = (n) => (n ? 'NT$' + Number(n).toLocaleString('en-US') : '價格未定');

/** 方案的標題（卡片、行程、收集箱共用） */
export function dealTitle(d) {
  if (d.kind === 'flight') return `${d.airline} ${d.fromCode || 'TPE'} ⇄ ${d.toCode || 'KIX'}`;
  if (d.kind === 'hotel') return d.name;
  return d.title;
}

/** 是否已加入喜歡 */
export const useIsFav = (id) => useTripStore((s) => (s.favDeals || []).some((x) => x.id === id));

/** 加入／移除喜歡：存一份快照，之後方案資料更新也不影響收集箱 */
export function toggleFav(deal) {
  const had = (useTripStore.getState().favDeals || []).some((x) => x.id === deal.id);
  updateTrip((s) => {
    s.favDeals = s.favDeals || [];
    if (had) s.favDeals = s.favDeals.filter((x) => x.id !== deal.id);
    else s.favDeals.unshift({ ...deal, savedAt: Date.now() });
  });
  toast(had ? '已從收集箱移除' : '已加入收集箱「機票與飯店區」');
}

/** 轉成行程：機票 → 去程、回程兩筆；飯店 → 入住、退房兩筆；機加酒 → 兩者都加 */
export function dealToTrip(d) {
  const last = useTripStore.getState().trip.days - 1;
  const links = safeUrl(d.url) ? [safeUrl(d.url)] : [];
  const price = d.pricePerPerson ? `參考價每人 ${money(d.pricePerPerson)}` : '';
  const note = (...parts) => parts.filter(Boolean).join('；');
  const add = (data) => addItem({ place: '', note: '', links, ...data });

  if (d.kind === 'flight' || (d.kind === 'package' && d.airline)) {
    const airline = d.airline;
    add({
      day: 0, time: d.outDep || '', category: '交通',
      title: `${airline} ${d.fromCode || 'TPE'} → ${d.toCode || 'KIX'} 起飛`, place: '桃園國際機場',
      note: note(d.outFlightNo && `航班 ${d.outFlightNo}`, d.outArr && `${d.outArr} 抵達`, d.kind === 'flight' && price, d.baggage)
    });
    add({
      day: last, time: d.retDep || '', category: '交通',
      title: `${airline} ${d.toCode || 'KIX'} → ${d.fromCode || 'TPE'} 起飛`, place: '關西國際機場',
      note: note(d.retFlightNo && `航班 ${d.retFlightNo}`, d.retArr && `${d.retArr} 抵達`)
    });
  }
  if (d.kind === 'hotel' || (d.kind === 'package' && d.hotel)) {
    const name = d.kind === 'hotel' ? d.name : d.hotel;
    add({
      day: 0, time: '15:00', category: '住宿', title: `入住 ${name}`, place: d.address || name,
      note: note(d.roomType, d.kind === 'hotel' ? (d.priceTotal ? `${d.nights || 4} 晚共 ${money(d.priceTotal)}` : price) : `${d.agency}｜${d.title}`, d.kind === 'package' && price)
    });
    add({ day: last, time: '10:00', category: '住宿', title: `${name} 退房`, place: d.address || name, note: '確認行李、退稅商品' });
  }
  updateTrip((s) => { s.ui.day = 0; });
  toast(`已加入 D1、D${last + 1} 行程`);
}
