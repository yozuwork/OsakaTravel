import { placeItem, timeIndex } from '../utils/itinerary.js';

/** 使用者確認的 DAY1 入住後行程；固定 ID 避免跨裝置重複新增。 */
export function day1EveningItems() {
  return [
    { time: '16:20', category: '交通', title: '前往日本橋動漫街', place: '大阪日本橋 でんでんタウン', note: '16:20–16:50｜預留約 30 分鐘移動，實際依導航；不帶大行李逛街' },
    { time: '16:50', category: '景點', title: 'Animate 大阪日本橋', place: 'アニメイト大阪日本橋', note: '16:50–17:40｜先逛新作周邊、漫畫與角色商品' },
    { time: '17:40', category: '景點', title: 'Mandarake Grand Chaos', place: 'まんだらけ グランドカオス 大阪日本橋', note: '17:40–18:30｜逛二手收藏、公仔與遊戲相關商品' },
    { time: '18:30', category: '購物', title: '動漫街自由逛／補買', place: '大阪日本橋 でんでんタウン', note: '18:30–19:00｜控制在同一區域，避免第一天太趕' },
    { time: '19:00', category: '餐廳', title: '難波附近晚餐', place: '大阪 難波', note: '19:00–19:50｜購物結束後再吃，較不受店家關門影響；餐廳待選' },
    { time: '19:50', category: '景點', title: '道頓堀夜景散步', place: '道頓堀', note: '19:50–20:30｜拍照、逛街，依體力縮短' },
    { time: '20:30', category: '交通', title: '返回飯店', place: 'ハートンホテル心斎橋長堀通', note: '20:30–21:00｜返回心齋橋長堀通哈頓飯店；隔天要早起去環球影城' }
  ].map((item, index) => ({ id: `day1-anime-evening-${index}`, day: 0, ...item }));
}

export function addDay1Evening(saved) {
  const next = { ...saved, items: (saved.items || []).map((item) => ({ ...item })) };
  const hotel = next.items.find((item) => item.day === 0 && item.time === '15:45' && /哈頓飯店.*入住/.test(item.title));
  if (hotel && !hotel.note?.includes('15:45–16:20')) hotel.note = `${hotel.note || ''}\n15:45–16:20｜飯店入住、放行李、休息；留時間整理，不帶大行李逛街`.trim();
  const arrival = next.items.find((item) => item.day === 0 && item.time === '13:10' && item.title === '抵達關西機場第二航廈');
  if (arrival && !arrival.note?.includes('入境或班機延誤時順延')) arrival.note = `${arrival.note || ''}\n13:10–15:45｜入境、交通、前往飯店沿用原本安排；入境或班機延誤時順延`.trim();
  for (const item of day1EveningItems()) {
    if (next.items.some((existing) => existing.id === item.id || (existing.day === 0 && existing.title === item.title))) continue;
    const index = timeIndex(next.items, 0, item.time);
    next.items.push(item);
    placeItem(next, item.id, index);
  }
  return next;
}
