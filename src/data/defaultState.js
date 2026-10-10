import { uid } from '../utils/helpers';
import { addDays } from '../utils/date';
import { defaultDialogue } from './dialogueScript';

/** 範例資料版本：更新預設行程時 +1，並在 tripStore 的 upgradeSample 補上對應判斷 */
export const SAMPLE_SEED = 4;

/* 住宿：心齋橋長堀通哈頓飯店（地圖搜尋用日文名稱比較準） */
export const HOTEL = {
  name: '心齋橋長堀通哈頓飯店',
  mapName: 'ハートンホテル心斎橋長堀通',
  address: '〒550-0013 大阪府大阪市西區新町 1-5-11'
};

/* 樂桃航空：去程 MM024、回程 MM027（樂桃在關西機場使用第二航廈、桃園使用第一航廈） */
export const FLIGHTS = {
  out: { leg: '去程', airline: '樂桃航空', flightNo: 'MM024', from: 'TPE', fromName: '桃園 第一航廈', to: 'KIX', toName: '關西 第二航廈', dep: '09:40', arr: '13:10', seat: 'TSUI YUNGCHING 21A、LEE YUJUNG 21B、CHEN BOYOU 21C' },
  back: { leg: '回程', airline: '樂桃航空', flightNo: 'MM027', from: 'KIX', fromName: '關西 第二航廈', to: 'TPE', toName: '桃園 第一航廈', dep: '15:25', arr: '17:55', seat: 'TSUI YUNGCHING 22A、LEE YUJUNG 22B、CHEN BOYOU 22C' }
};

export const PEACH_BAGGAGE_TODO = '確認樂桃行李額度（託運行李需另外加購）';

/** seed 4 範例行程（不含 id）；tripStore 的升級也用這份 */
export function seed4Items() {
  const hotel = HOTEL.mapName;
  return [
    /* D1：去程 樂桃 MM024 TPE 09:40 → KIX 13:10 */
    { day: 0, time: '07:30', category: '交通', title: '抵達桃園機場第一航廈辦理報到', place: '桃園國際機場 第一航廈', note: '樂桃航空櫃檯；廉航櫃檯約起飛前 50 分鐘關閉，請提早到' },
    { day: 0, time: '09:40', category: '交通', title: '樂桃 MM024 TPE → KIX 起飛', place: '桃園國際機場 第一航廈', note: '座位 21A／21B／21C；13:10 抵達關西機場第二航廈' },
    { day: 0, time: '13:10', category: '交通', title: '抵達關西機場第二航廈', place: '關西國際機場 第二航廈', note: '樂桃使用第二航廈；入境審查出示 Visit Japan Web QR Code' },
    { day: 0, time: '14:00', category: '交通', title: '搭免費接駁巴士到關西空港駅', place: '關西國際機場 第二航廈', note: '第二航廈沒有車站，接駁巴士約 10 分鐘到第一航廈／關西空港駅' },
    { day: 0, time: '14:15', category: '交通', title: '南海電鐵售票處兌換 rapi:t 車票', place: '關西空港駅 南海電鐵售票處', note: '回程也從關西機場出發，可一併規劃回程車票' },
    { day: 0, time: '14:30', category: '交通', title: '搭乘南海 rapi:t 前往難波', place: '關西空港駅', note: '約 35 分鐘抵達難波' },
    { day: 0, time: '15:15', category: '交通', title: '從難波前往飯店', place: 'なんば駅', note: '地鐵四つ橋線難波 → 四ツ橋 1 站後步行，或從難波步行約 20 分鐘（以 Google 地圖為準）' },
    { day: 0, time: '15:45', category: '住宿', title: `${HOTEL.name} 入住`, place: hotel, note: `${HOTEL.address}；辦理入住、放行李` },

    /* D2：環球影城 */
    { day: 1, time: '07:30', category: '交通', title: '從飯店出發前往環球影城', place: '西大橋駅', note: '長堀鶴見綠地線西大橋 → 大正，轉 JR 環狀線到西九條，再轉 JR 夢咲線到環球城站，約 35–40 分鐘（以 Google 地圖為準）' },
    { day: 1, time: '08:30', category: '景點', title: '日本環球影城入園', place: 'ユニバーサル・スタジオ・ジャパン', note: '開園時間以官網為準；入園後先用 APP 確認任天堂世界整理券' },
    { day: 1, time: '12:00', category: '餐廳', title: '園區內午餐', place: 'ユニバーサル・スタジオ・ジャパン', note: '避開 12:00–13:00 尖峰可提早或延後' },
    { day: 1, time: '18:00', category: '景點', title: '夜間遊行／聖誕活動', place: 'ユニバーサル・スタジオ・ジャパン', note: '聖誕季活動，時間以園區當日公告為準' },
    { day: 1, time: '20:30', category: '交通', title: '搭車返回飯店', place: 'ユニバーサルシティ駅', note: '閉園前人潮多，可提早離開' },

    /* D5：回程 樂桃 MM027 KIX 15:25 → TPE 17:55 */
    { day: 4, time: '10:00', category: '住宿', title: '飯店退房', place: hotel, note: '確認行李、退稅商品' },
    { day: 4, time: '11:15', category: '交通', title: '搭乘南海 rapi:t 前往關西機場', place: 'なんば駅（南海）', note: '約 35 分鐘到關西空港駅，再搭免費接駁巴士到第二航廈（約 10 分鐘）' },
    { day: 4, time: '12:30', category: '交通', title: '抵達關西機場第二航廈辦理報到', place: '關西國際機場 第二航廈', note: '廉航櫃檯約起飛前 50 分鐘關閉；退稅商品放隨身行李' },
    { day: 4, time: '15:25', category: '交通', title: '樂桃 MM027 KIX → TPE 起飛', place: '關西國際機場 第二航廈', note: '座位 22A／22B／22C；17:55 抵達桃園機場第一航廈' }
  ];
}

export function defaultState() {
  const start = '2026-12-21';
  return {
    v: 1,
    seed: SAMPLE_SEED,
    trip: { name: '大阪冬旅', en: 'Osaka', from: '台北', to: '大阪', startDate: start, days: 5 },
    items: [
      ...seed4Items().map((it) => ({ id: uid(), ...it }))
    ],
    todos: [
      { id: uid(), text: '填寫 Visit Japan Web 入境資料', done: false },
      { id: uid(), text: '購買 eSIM／網卡', done: false },
      { id: uid(), text: '兌換日幣現金', done: false },
      { id: uid(), text: '投保旅遊平安險', done: false },
      { id: uid(), text: '購買環球影城門票（考慮快速通關）', done: false },
      { id: uid(), text: PEACH_BAGGAGE_TODO, done: false },
      { id: uid(), text: '確認回程前往關西機場的交通', done: false },
      { id: uid(), text: '預訂南海 rapi:t 車票', done: true },
      { id: uid(), text: '確認住宿訂單', done: true }
    ],
    flights: [
      { id: uid(), ...FLIGHTS.out, date: start, pnr: '', baggage: '', ticket: '' },
      { id: uid(), ...FLIGHTS.back, date: addDays(start, 4), pnr: '', baggage: '', ticket: '' }
    ],
    entry: { steps: [false, false, false, false, false], qr: '' },
    stays: [
      { id: uid(), name: HOTEL.name, address: HOTEL.address, checkIn: start, checkInTime: '', checkOut: addDays(start, 4), checkOutTime: '', orderNo: '', roomType: '', phone: '', platform: '', photo: '' }
    ],
    bag: [
      { id: uid(), name: '證件與錢包', items: ['護照', '電子機票', '日幣現金', '信用卡'] },
      { id: uid(), name: '衣物', items: ['保暖外套', '圍巾與手套', '換洗衣物', '好走的鞋'] },
      { id: uid(), name: '電子產品', items: ['手機充電器', '行動電源', 'eSIM／網卡'] },
      { id: uid(), name: '盥洗與藥品', items: ['牙刷牙膏', '保養品', '常備藥品'] }
    ].map((g) => ({ ...g, items: g.items.map((t) => ({ id: uid(), text: t, done: false })) })),
    /* 環球影城：票券資訊（入園日預設 D2，和範例行程一致） */
    usj: { date: addDays(start, 1), ticketType: '', express: '', nintendo: '', orderNo: '', note: '', images: [], links: [] },
    /* 環球影城：分類勾選清單（設施名稱以官網為準，可自行增刪） */
    usjList: [
      { id: uid(), name: '行前準備', items: ['購買門票（官網或授權通路）', '評估是否購買快速通關', '下載 USJ 官方 App 並綁定門票', '查好當天開園時間', '準備暖暖包、手套（12 月很冷）'] },
      { id: uid(), name: '超級任天堂世界', items: ['確認區域入場方式（整理券／快速通關）', '瑪利歐賽車～庫巴的挑戰書～', '耀西冒險', '咚奇剛的瘋狂礦車', '能量手環挑戰'] },
      { id: uid(), name: '哈利波特魔法世界', items: ['哈利波特禁忌之旅', '鷹馬的飛行', '奧利凡德魔杖店'] },
      { id: uid(), name: '其他熱門', items: ['好萊塢美夢・乘車遊', '小小兵瘋狂乘車遊', '飛天翼龍', '大白鯊', '聖誕季活動（以官網公告為準）'] }
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
    /* 收集箱「機票與飯店區」：在「機票與飯店」頁按喜歡的方案（存一份快照） */
    favDeals: [],
    /* 角色對話：角色與劇本（可在「編輯對話」修改） */
    dialogue: defaultDialogue(),
    ui: { day: 0, showDone: true, spot: 4 }
  };
}
