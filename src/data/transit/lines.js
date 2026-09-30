/* =========================================================
   交通：路線資料（行車時間為概估，單位：分鐘）
   來源：osaka-transit-v1.html 原型；Haruka / 關空快速改回實際分鐘數，
   「不要在市區短程搭」改由 longHaulAfter 規則處理（見 utils/transit.js）

   @typedef {Object} LineDef
   @property {string}   code        站牌上的代號（M、T、JR-O…）
   @property {string}   name        中文名
   @property {string}   en          英文名
   @property {string}   operator    營運者 id（見 OPERATORS）；之後加阪神、阪急、京阪、近鐵只要新增資料
   @property {string}   color       官方代表色
   @property {boolean} [light]      代表色偏淺，徽章文字改用深色
   @property {string[]} stations    依行車順序的日文正式站名（站名即車站 id，跨路線共用）
   @property {number}  [hop]        每站間預設分鐘數
   @property {number[]}[times]      逐段分鐘數（長度 = 站數 - 1；環狀線 = 站數），有給就優先使用
   @property {boolean} [cyclic]     環狀線（最後一站接回第一站）
   @property {{forward:string, backward:string}} [cycleLabels] 環狀線兩個方向的稱呼（forward = stations 順序）
   @property {string}  [longHaulAfter] 只能搭「至少一端在此站之後」的區間（避免市區短程被排去搭特急／機場快速）
   @property {number}  [rankPenalty] 每搭一次額外加的排序權重（分鐘），只影響排序、不算進顯示時間
   @property {string}  [note]       提示文字（顯示在路線軌道上）
   @property {string[]}[noteStations] 路段經過這些站才顯示 note（不給就一律顯示）
   @property {Object}  [timetables] 預留：依時刻表推算下一班，
                                    格式 { [站名]: { [方向終點站]: { weekday: ['05:30', …], holiday: [...] } } }
   ========================================================= */

export const OPERATORS = {
  metro: { name: '大阪地鐵', en: 'Osaka Metro' },
  jr: { name: 'JR 西日本', en: 'JR West' },
  nankai: { name: '南海電鐵', en: 'Nankai' },
  monorail: { name: '大阪單軌電車', en: 'Osaka Monorail' }
};

/** @type {Record<string, LineDef>} */
export const LINES = {
  M: {
    code: 'M', name: '御堂筋線', en: 'Midosuji', operator: 'metro', color: '#E5171F', hop: 2,
    stations: ['千里中央', '桃山台', '緑地公園', '江坂', '東三国', '新大阪', '西中島南方', '中津', '梅田', '淀屋橋', '本町', '心斎橋', 'なんば', '大国町', '動物園前', '天王寺', '昭和町', '西田辺', '長居', 'あびこ', '北花田', '新金岡', 'なかもず'],
    note: '江坂以北為北大阪急行直通運轉，同一班車不用換。',
    noteStations: ['千里中央', '桃山台', '緑地公園']
  },
  T: {
    code: 'T', name: '谷町線', en: 'Tanimachi', operator: 'metro', color: '#522886', hop: 2,
    stations: ['大日', '守口', '太子橋今市', '千林大宮', '関目高殿', '野江内代', '都島', '天神橋筋六丁目', '中崎町', '東梅田', '南森町', '天満橋', '谷町四丁目', '谷町六丁目', '谷町九丁目', '四天王寺前夕陽ヶ丘', '天王寺', '阿倍野', '文の里', '田辺', '駒川中野', '平野', '喜連瓜破', '出戸', '長原', '八尾南']
  },
  Y: {
    code: 'Y', name: '四つ橋線', en: 'Yotsubashi', operator: 'metro', color: '#0078BA', hop: 2,
    stations: ['西梅田', '肥後橋', '本町', '四ツ橋', 'なんば', '大国町', '花園町', '岸里', '玉出', '北加賀屋', '住之江公園']
  },
  C: {
    code: 'C', name: '中央線', en: 'Chuo', operator: 'metro', color: '#019A66', hop: 2,
    stations: ['夢洲', 'コスモスクエア', '大阪港', '朝潮橋', '弁天町', '九条', '阿波座', '本町', '堺筋本町', '谷町四丁目', '森ノ宮', '緑橋', '深江橋', '高井田', '長田']
  },
  S: {
    code: 'S', name: '千日前線', en: 'Sennichimae', operator: 'metro', color: '#E44D93', hop: 2,
    stations: ['野田阪神', '玉川', '阿波座', '西長堀', '桜川', 'なんば', '日本橋', '谷町九丁目', '鶴橋', '今里', '新深江', '小路', '北巽', '南巽']
  },
  K: {
    code: 'K', name: '堺筋線', en: 'Sakaisuji', operator: 'metro', color: '#814721', hop: 2,
    stations: ['天神橋筋六丁目', '扇町', '南森町', '北浜', '堺筋本町', '長堀橋', '日本橋', '恵美須町', '動物園前', '天下茶屋']
  },
  N: {
    code: 'N', name: '長堀鶴見緑地線', en: 'Nagahori Tsurumi-ryokuchi', operator: 'metro', color: '#A9CC51', light: true, hop: 2,
    stations: ['大正', 'ドーム前千代崎', '西長堀', '西大橋', '心斎橋', '長堀橋', '松屋町', '谷町六丁目', '玉造', '森ノ宮', '大阪ビジネスパーク', '京橋', '蒲生四丁目', '今福鶴見', '横堤', '鶴見緑地', '門真南']
  },
  I: {
    code: 'I', name: '今里筋線', en: 'Imazatosuji', operator: 'metro', color: '#EE7B1A', hop: 2,
    stations: ['井高野', '瑞光四丁目', 'だいどう豊里', '太子橋今市', '清水', '新森古市', '関目成育', '蒲生四丁目', '鴫野', '緑橋', '今里']
  },
  P: {
    code: 'P', name: '南港港城線', en: 'New Tram', operator: 'metro', color: '#00A3D9', hop: 2,
    stations: ['コスモスクエア', 'トレードセンター前', '中ふ頭', 'ポートタウン西', 'ポートタウン東', 'フェリーターミナル', '南港東', '南港口', '平林', '住之江公園']
  },
  O: {
    code: 'JR-O', name: 'JR 大阪環狀線', en: 'Osaka Loop', operator: 'jr', color: '#E8612C', hop: 2.5, cyclic: true,
    cycleLabels: { forward: '外回り', backward: '内回り' },
    stations: ['大阪', '天満', '桜ノ宮', '京橋', '大阪城公園', '森ノ宮', '玉造', '鶴橋', '桃谷', '寺田町', '天王寺', '新今宮', '今宮', '芦原橋', '大正', '弁天町', '西九条', '野田', '福島']
  },
  A: {
    code: 'JR-A', name: 'JR 京都線', en: 'JR Kyoto', operator: 'jr', color: '#0072BC', hop: 4,
    stations: ['新大阪', '大阪']
  },
  U: {
    code: 'JR-P', name: 'JR 夢咲線', en: 'JR Yumesaki', operator: 'jr', color: '#E8739C', hop: 2,
    stations: ['西九条', '安治川口', 'ユニバーサルシティ', '桜島'],
    note: '很多班次從 JR 大阪站直通，不一定要在西九条換車。'
  },
  R: {
    code: 'JR-R', name: 'JR 關空快速', en: 'Kansai Airport Rapid', operator: 'jr', color: '#F4A43A', light: true,
    stations: ['京橋', '大阪', '福島', '西九条', '弁天町', '大正', '新今宮', '天王寺', '日根野', 'りんくうタウン', '関西空港'],
    times: [7, 2, 3, 2.5, 2.5, 3.5, 2.5, 38, 4, 6],
    longHaulAfter: '天王寺',
    note: '列車在日根野分割車廂，請坐開往「関西空港」的車廂。'
  },
  H: {
    code: 'HA', name: 'JR 特急 Haruka', en: 'Haruka', operator: 'jr', color: '#5C7BB5',
    stations: ['新大阪', '大阪', '天王寺', '関西空港'],
    times: [4, 16, 33],
    longHaulAfter: '天王寺',
    rankPenalty: 3,
    note: '需特急券；外國旅客可買 ICOCA & HARUKA 套票。'
  },
  NK: {
    code: 'NK', name: '南海 空港線', en: 'Nankai Airport', operator: 'nankai', color: '#1E4E9C',
    stations: ['なんば', '新今宮', '天下茶屋', '堺', '泉佐野', 'りんくうタウン', '関西空港'],
    times: [3, 3, 7, 17, 3, 6],
    note: 'Rapi:t 全車指定席需加購特急券；空港急行免加價，約多 5–10 分。'
  },
  MO: {
    code: 'MO', name: '大阪單軌電車', en: 'Osaka Monorail', operator: 'monorail', color: '#3A9E8F',
    stations: ['千里中央', '少路', '柴原阪大前', '蛍池', '大阪空港'],
    times: [3, 2, 3, 3]
  }
};

/** 路線圖例分組（新增私鐵時在這裡加一組） */
export const LINE_GROUPS = [
  { title: '大阪地鐵', en: 'Osaka Metro', lines: ['M', 'T', 'Y', 'C', 'S', 'K', 'N', 'I', 'P'] },
  { title: 'JR 與機場線', en: 'JR & Airport', lines: ['O', 'A', 'U', 'R', 'H', 'NK', 'MO'] }
];

/** 同站轉乘、步行轉乘所需分鐘數；少轉乘模式每次轉乘的排序懲罰 */
export const T_TRANSFER = 5;
export const T_WALK = 8;
export const FEW_PENALTY = 14;
