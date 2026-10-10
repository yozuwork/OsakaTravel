/* =========================================================
   機票／飯店／機加酒參考方案（「更多 › 機票」頁）
   - 2026/10/05 上網查詢：班次時刻、飯店、套裝起價有來源；
     12/21–12/25 聖誕週的實際票價／房價查不到，標「估價」的是依旺季推算
   - 價格單位：新台幣，pricePerPerson 為每人價（飯店＝4 晚總價 ÷ 3 人）
   - 更新方案：直接改這個檔案；id 不要重複（收集箱用 id 判斷是否已喜歡）
   ========================================================= */

export const DEALS_META = { checkedAt: '2026/10/05', pax: 3, budgetPerPerson: 17000 };

const FLIGHTS = [
  {
    id: 'fl-peach-mm024', airline: '樂桃航空', carrierType: 'LCC',
    outFlightNo: 'MM024', outDep: '09:40', outArr: '13:10', retFlightNo: 'MM027', retDep: '15:25', retArr: '17:55',
    pricePerPerson: 9500, priceStatus: '估價', baggage: '含 20kg 託運估價（基本票只含 7kg 手提）',
    note: '時刻已查到。聖誕週無行李約 NT$7,500–8,500，加 20kg 約 9,500–10,500。另有晚班 MM028 18:50 → 22:15。',
    url: 'https://www.flypeach.com/tw/lm/st/routemap'
  },
  {
    id: 'fl-tigerair-it210', airline: '台灣虎航', carrierType: 'LCC',
    outFlightNo: 'IT210', outDep: '06:40', outArr: '10:25', retFlightNo: 'IT211', retDep: '18:00', retArr: '19:45',
    pricePerPerson: 10000, priceStatus: '估價', baggage: '基本票只含 10kg 手提，託運另購',
    note: '去程是超早班機，要留意去機場的交通。IT211 回程時刻各資料來源有出入，請到官網確認 12 月班表。',
    url: 'https://www.tigerairtw.com/zh-tw'
  },
  {
    id: 'fl-jetstar-gk54', airline: '捷星日本', carrierType: 'LCC',
    outFlightNo: 'GK54', outDep: '18:20', outArr: '22:00', retFlightNo: 'GK57', retDep: '23:35', retArr: '01:30',
    pricePerPerson: 8500, priceStatus: '估價', baggage: '基本票只含 7kg 手提，託運另購',
    note: '通常最便宜，但去程晚上才到，回程是紅眼班機（凌晨 01:30 抵台），等於少玩半天。',
    url: 'https://www.jetstar.com/tw/zh'
  },
  {
    id: 'fl-cathay-cx564', airline: '國泰航空', carrierType: '傳統',
    outFlightNo: 'CX564', outDep: '11:05', outArr: '14:55', retFlightNo: 'CX565', retDep: '16:15', retArr: '18:15',
    pricePerPerson: 13500, priceStatus: '估價', baggage: '含 23kg 託運及餐食',
    note: '香港經台北飛大阪的航班，時間適中，常有促銷。',
    url: 'https://flights.cathaypacific.com/destinations/zh_TW/%E5%BE%9E%E5%8F%B0%E5%8C%97%E5%88%B0%E5%A4%A7%E9%98%AA%E7%9A%84%E8%88%AA%E7%8F%AD'
  },
  {
    id: 'fl-china-ci152', airline: '中華航空', carrierType: '傳統',
    outFlightNo: 'CI152', outDep: '09:00', outArr: '12:50', retFlightNo: 'CI153', retDep: '14:00', retArr: '15:55',
    pricePerPerson: 14000, priceStatus: '估價', baggage: '含 23kg 託運及餐食',
    note: '去回時間都很好。聖誕週經濟艙約 NT$12,500–16,000。',
    url: 'https://www.china-airlines.com/tw/zh'
  },
  {
    id: 'fl-eva-br178', airline: '長榮航空', carrierType: '傳統',
    outFlightNo: 'BR178', outDep: '06:30', outArr: '10:10', retFlightNo: 'BR177', retDep: '11:10', retArr: '13:05',
    pricePerPerson: 14500, priceStatus: '估價', baggage: '含 23kg 託運及餐食',
    note: '早去早回，最後一天能玩的時間少。實際時刻以冬季班表為準。',
    url: 'https://www.evaair.com/zh-tw/index.html'
  },
  {
    id: 'fl-starlux-jx820', airline: '星宇航空', carrierType: '傳統',
    outFlightNo: 'JX820', outDep: '08:30', outArr: '12:15', retFlightNo: 'JX821', retDep: '13:25', retArr: '15:20',
    pricePerPerson: 16000, priceStatus: '估價', baggage: '含 23kg 託運及餐食',
    note: '每日都有班次，服務評價高。聖誕週約 NT$14,500–18,000。',
    url: 'https://www.starlux-airlines.com/zh-TW'
  }
];

const HOTELS = [
  {
    id: 'ht-arrow-shinsaibashi', name: 'Arrow Hotel 心齋橋', nameLocal: 'Arrow Hotel in ShinsaiBashi',
    area: '心齋橋', station: '心齋橋站、難波站約 600m', address: '大阪府大阪市中央区西心斎橋2-9-32',
    roomType: '豪華三人房（27㎡，2 張雙人床）', rating: 'Trip.com 8.6', nights: 4, priceTotal: 16000, pricePerPerson: 5333, priceStatus: '估價',
    note: '附免費早餐。平日每晚 USD74 起（已查到），聖誕週三人房估每晚約 NT$4,000。建築較舊。',
    url: 'https://www.trip.com/hotels/osaka-hotel-detail-2105672/arrow-hotel-osaka/'
  },
  {
    id: 'ht-koko-sennichimae', name: 'KOKO HOTEL 大阪難波千日前', nameLocal: 'KOKO HOTEL Osaka Namba Sennichimae',
    area: '難波・日本橋', station: '日本橋站 2 號出口步行 1 分鐘', address: '大阪府大阪市中央区千日前1-3-7',
    roomType: '三人房（19㎡，3 張單人床）', rating: '', nights: 4, priceTotal: 18000, pricePerPerson: 6000, priceStatus: '估價',
    note: '2025 年新開幕。網路上的三人房 NT$3,100 起是淡季價，聖誕週估每晚約 NT$4,500。',
    url: 'https://www.polaris-holdings.com/en/koko-hotel-osaka-namba-sennichimae-29th-may-2025-grand-opening/'
  },
  {
    id: 'ht-forza-dotonbori', name: '大阪難波道頓堀佛沙飯店', nameLocal: 'Hotel Forza Osaka Namba Dotonbori',
    area: '道頓堀', station: '難波站、日本橋站步行約 6 分鐘', address: '大阪府大阪市中央区道頓堀1-4-22',
    roomType: '三人房', rating: '', nights: 4, priceTotal: 20000, pricePerPerson: 6667, priceStatus: '估價',
    note: '就在道頓堀，逛街、吃東西都方便。聖誕週估每晚約 NT$5,000。',
    url: 'https://us.trip.com/hotels/osaka-hotel-detail-70896604/hotel-forza-osaka-namba/'
  },
  {
    id: 'ht-hiyori-namba', name: '大阪難波日和飯店', nameLocal: 'Hiyori Hotel Osaka Namba Station',
    area: '難波', station: '南海難波站步行 2 分鐘', address: '大阪府大阪市浪速区難波中3-1-2',
    roomType: '標準三人房（2 床＋1 床墊）', rating: '', nights: 4, priceTotal: 22000, pricePerPerson: 7333, priceStatus: '估價',
    note: '南海線直達關西機場就在旁邊，交通最方便。聖誕週估每晚約 NT$5,500。',
    url: 'https://namba.hiyori-hotel.jp/lang_en/'
  },
  {
    id: 'ht-respire-umeda', name: '阪急大阪龍仕柏酒店', nameLocal: 'Hotel Hankyu RESPIRE OSAKA',
    area: '梅田', station: 'JR 大阪站連通道直達', address: '大阪府大阪市北区大深町1-1',
    roomType: '三人房', rating: '', nights: 4, priceTotal: 26000, pricePerPerson: 8667, priceStatus: '估價',
    note: '住梅田，去京都、神戶方便。三人房 NT$3,800 起是淡季價，聖誕週估每晚約 NT$6,500。',
    url: 'https://www.klook.com/zh-TW/blog/umeda-hotels/'
  },
  {
    id: 'ht-mimaru-namba', name: 'MIMARU 大阪難波站', nameLocal: 'MIMARU Osaka Namba Station',
    area: '難波・日本橋', station: '南海難波站步行 4 分鐘', address: '大阪府大阪市浪速区日本橋3-6-24',
    roomType: '家庭公寓（35㎡，附廚房，最多 4 位大人）', rating: '', nights: 4, priceTotal: 36000, pricePerPerson: 12000, priceStatus: '估價',
    note: '公寓式，空間大、有廚房。平日每晚約 USD250 起（已查到），聖誕週更貴，搭配機票會超出預算。',
    url: 'https://mimaruhotels.com/en/hotel/namba-station/',
    image: 'https://mimaruhotels.com/app/uploads/2025/01/pc-2-22.jpg'
  }
];

/* 機加酒：網頁上查到的是「起價」（多為非節日），pricePerPerson 放 12/21 出發的估價，起價寫在備註 */
const PACKAGES = [
  {
    id: 'pk-besttour-arrow', agency: '喜鴻假期', title: '大阪自由行 5 日｜Arrow Hotel・樂桃 20kg・贈早餐',
    airline: '樂桃航空', hotel: 'Arrow Hotel 心齋橋',
    pricePerPerson: 20000, priceStatus: '估價',
    note: '起價 NT$14,799（已查到）。房型是雙床，第三人要問能不能改住豪華三人房。',
    url: 'https://www.besttour.com.tw/e_web/travel?v=OSA05MM250629HK'
  },
  {
    id: 'pk-kkday-peach', agency: 'KKday', title: '樂桃航空・大阪自選市區飯店機加酒 5 日',
    airline: '樂桃航空', hotel: '自選大阪市區飯店',
    pricePerPerson: 21000, priceStatus: '估價',
    note: '起價 NT$13,900（比價網站上查到），聖誕週估 NT$19,000–23,000。選飯店時要確認有三人房。',
    url: 'https://www.kkday.com/zh-tw/product/157759'
  },
  {
    id: 'pk-cola-peach', agency: '可樂旅遊', title: '樂桃樂玩大阪 5 日（自選關西飯店 4 晚）',
    airline: '樂桃航空', hotel: '自選關西飯店',
    pricePerPerson: 21000, priceStatus: '估價',
    note: '起價 NT$14,888（已查到），聖誕週估 NT$20,000 以上。',
    url: 'https://www.colatour.com.tw/C10P_Package/C10P001_Q1_OrderInfo.aspx?ProjectId=2026OSA-5D4N-N21'
  },
  {
    id: 'pk-lion-arrow', agency: '雄獅旅遊', title: '大阪 Arrow 自由行 5 日（年度精選）',
    airline: '亞洲航空', hotel: 'Arrow Hotel 等可選',
    pricePerPerson: 22000, priceStatus: '估價',
    note: '起價 NT$14,999（已查到），聖誕週估 NT$20,000–24,000。週四訂機加酒現折 $400。',
    url: 'https://vacation.liontravel.com/detail/170607003'
  },
  {
    id: 'pk-ezfly-peach', agency: '易飛旅遊', title: '大阪機加酒 5 日｜心齋橋市區酒店・贈地鐵二日券＋上網卡',
    airline: '樂桃航空', outFlightNo: 'MM024', outDep: '09:40', outArr: '13:10', retFlightNo: 'MM027', retDep: '15:25', retArr: '17:55',
    hotel: '心齋橋格蘭飯店／Just Sleep 心齋橋',
    pricePerPerson: 24000, priceStatus: '估價',
    note: '12/13 出發 NT$15,500（已查到）。頁面寫明 12/24–25 節日價最高 NT$35,900，12/21 出發估 NT$22,000–26,000。含保險。',
    url: 'https://ea.ezfly.com/prodwp/prod/WPKG000004961'
  },
  {
    id: 'pk-eztravel-starlux', agency: '易遊網', title: '星宇航空大阪自由行 5 天',
    airline: '星宇航空', outFlightNo: 'JX820', outDep: '08:30', outArr: '12:15', retFlightNo: 'JX821', retDep: '13:25', retArr: '15:20',
    hotel: '大阪市區飯店',
    pricePerPerson: 23900, priceStatus: '起價',
    note: '這是起價（已查到），聖誕週會更高。需 6 人成行，3 人可能要併團。週三訂現折 800。',
    url: 'https://vacation.eztravel.com.tw/pkgfrn/p/FRN0000020165'
  }
];

export const DEALS = [
  ...FLIGHTS.map((d) => ({ kind: 'flight', fromCode: 'TPE', toCode: 'KIX', ...d })),
  ...HOTELS.map((d) => ({ kind: 'hotel', ...d })),
  ...PACKAGES.map((d) => ({ kind: 'package', ...d }))
];
