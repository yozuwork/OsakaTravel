import { uid } from '../utils/helpers';
import { addDays } from '../utils/date';

/** 範例資料版本：更新預設行程時 +1，並在 tripStore 的 upgradeSample 補上對應判斷 */
export const SAMPLE_SEED = 2;

export function defaultState() {
  const start = '2026-12-21';
  return {
    v: 1,
    seed: SAMPLE_SEED,
    trip: { name: '大阪冬旅', en: 'Osaka', from: '台北', to: '大阪', startDate: start, days: 5 },
    items: [
      /* D1：去程 TPE 09:20 → KIX 12:50（星宇航空，直飛 2 小時 30 分） */
      { id: uid(), day: 0, time: '07:00', category: '交通', title: '抵達桃園機場辦理報到', place: '桃園國際機場', note: '星宇航空櫃檯，起飛前 2 小時到' },
      { id: uid(), day: 0, time: '09:20', category: '交通', title: '星宇航空 TPE → KIX 起飛', place: '桃園國際機場', note: '直飛，約 2 小時 30 分鐘' },
      { id: uid(), day: 0, time: '12:50', category: '交通', title: '抵達關西機場第一航廈', place: '關西國際機場 第一航廈', note: '入境審查出示 Visit Japan Web QR Code' },
      { id: uid(), day: 0, time: '13:40', category: '交通', title: '南海電鐵售票處兌換 rapi:t 車票', place: '關西空港駅 南海電鐵售票處', note: '回程改從神戶機場出發，買單程票即可' },
      { id: uid(), day: 0, time: '14:00', category: '交通', title: '搭乘南海 rapi:t 前往難波', place: '關西空港駅', note: '約 35 分鐘抵達難波' },
      { id: uid(), day: 0, time: '15:00', category: '住宿', title: '難波站步行至飯店入住', place: '難波駅', note: '辦理入住、放行李' },

      /* D2：環球影城 */
      { id: uid(), day: 1, time: '07:30', category: '交通', title: '從難波出發前往環球影城', place: '難波駅', note: '阪神難波線到西九條，轉 JR 夢咲線至環球城站，約 30 分鐘' },
      { id: uid(), day: 1, time: '08:30', category: '景點', title: '日本環球影城入園', place: 'ユニバーサル・スタジオ・ジャパン', note: '開園時間以官網為準；入園後先用 APP 確認任天堂世界整理券' },
      { id: uid(), day: 1, time: '12:00', category: '餐廳', title: '園區內午餐', place: 'ユニバーサル・スタジオ・ジャパン', note: '避開 12:00–13:00 尖峰可提早或延後' },
      { id: uid(), day: 1, time: '18:00', category: '景點', title: '夜間遊行／聖誕活動', place: 'ユニバーサル・スタジオ・ジャパン', note: '聖誕季活動，時間以園區當日公告為準' },
      { id: uid(), day: 1, time: '20:30', category: '交通', title: '搭車返回難波飯店', place: 'ユニバーサルシティ駅', note: '閉園前人潮多，可提早離開' },

      /* D5：回程 UKB 12:45 → TPE 15:05（星宇航空，直飛 3 小時 20 分） */
      { id: uid(), day: 4, time: '08:30', category: '住宿', title: '飯店退房', place: '難波駅', note: '確認行李、退稅商品' },
      { id: uid(), day: 4, time: '09:00', category: '交通', title: '前往神戶機場', place: '大阪難波駅', note: '阪神難波線到神戶三宮，轉 Port Liner 至神戶空港，約 1 小時 15 分' },
      { id: uid(), day: 4, time: '10:30', category: '交通', title: '抵達神戶機場辦理報到', place: '神戶機場 第2航廈', note: '國際線在第 2 航廈' },
      { id: uid(), day: 4, time: '12:45', category: '交通', title: '星宇航空 UKB → TPE 起飛', place: '神戶機場', note: '直飛，約 3 小時 20 分鐘，15:05 抵達桃園' }
    ],
    todos: [
      { id: uid(), text: '填寫 Visit Japan Web 入境資料', done: false },
      { id: uid(), text: '購買 eSIM／網卡', done: false },
      { id: uid(), text: '兌換日幣現金', done: false },
      { id: uid(), text: '投保旅遊平安險', done: false },
      { id: uid(), text: '購買環球影城門票（考慮快速通關）', done: false },
      { id: uid(), text: '確認神戶機場回程交通', done: false },
      { id: uid(), text: '預訂南海 rapi:t 車票', done: true },
      { id: uid(), text: '確認住宿訂單', done: true }
    ],
    flights: [
      { id: uid(), leg: '去程', airline: '星宇航空', date: start, from: 'TPE', fromName: '桃園機場', to: 'KIX', toName: '關西 第一航廈', dep: '09:20', arr: '12:50', flightNo: '', pnr: '', seat: '', baggage: '', ticket: '' },
      { id: uid(), leg: '回程', airline: '星宇航空', date: addDays(start, 4), from: 'UKB', fromName: '神戶機場', to: 'TPE', toName: '桃園機場', dep: '12:45', arr: '15:05', flightNo: '', pnr: '', seat: '', baggage: '', ticket: '' }
    ],
    entry: { steps: [false, false, false, false, false], qr: '' },
    stays: [
      { id: uid(), name: '', address: '', checkIn: start, checkInTime: '', checkOut: addDays(start, 4), checkOutTime: '', orderNo: '', roomType: '', phone: '', platform: '', photo: '' }
    ],
    bag: [
      { id: uid(), name: '證件與錢包', items: ['護照', '電子機票', '日幣現金', '信用卡'] },
      { id: uid(), name: '衣物', items: ['保暖外套', '圍巾與手套', '換洗衣物', '好走的鞋'] },
      { id: uid(), name: '電子產品', items: ['手機充電器', '行動電源', 'eSIM／網卡'] },
      { id: uid(), name: '盥洗與藥品', items: ['牙刷牙膏', '保養品', '常備藥品'] }
    ].map((g) => ({ ...g, items: g.items.map((t) => ({ id: uid(), text: t, done: false })) })),
    spots: [
      { name: '梅田', en: 'UMEDA', station: '大阪站／梅田站', x: 150, y: 16, w: 120, tx: 160, ty: 72 },
      { name: '大阪城', en: 'OSAKA CASTLE', station: '森之宮站', x: 262, y: 118, w: 116, tx: 290, ty: 174 },
      { name: '環球影城', en: 'UNIVERSAL CITY', station: '環球城站', x: 12, y: 150, w: 122, tx: 34, ty: 206 },
      { name: '海遊館・天保山', en: 'OSAKA PORT', station: '大阪港站', x: 12, y: 318, w: 132, tx: 34, ty: 374 },
      { name: '心齋橋・難波', en: 'MINAMI', station: '心齋橋站／難波站', x: 130, y: 214, w: 136, tx: 140, ty: 270 },
      { name: '日本橋・黑門', en: 'NIPPOMBASHI', station: '日本橋站', x: 250, y: 318, w: 128, tx: 280, ty: 374 },
      { name: '天王寺・新世界', en: 'TENNOJI', station: '惠美須町站／天王寺站', x: 140, y: 404, w: 136, tx: 144, ty: 460 }
    ],
    ideas: [],
    ui: { day: 0, showDone: true, spot: 4 }
  };
}
