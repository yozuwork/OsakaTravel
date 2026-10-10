/* =========================================================
   依行程猜地圖關卡要顯示的像素建築種類（純函式，不依賴 React）
   回傳值對應 data/pixelBuildings.js 的 BUILDING_ART key
   ========================================================= */

/** 依序比對，先對到的優先；test 收到「標題＋地點」 */
const KEYWORD_KINDS = [
  ['wheel', ['環球', '影城', '樂園', 'USJ', 'ユニバーサル', '摩天輪', '遊樂']], // 要在 castle 前面：「環球影城」也含「城」
  ['castle', ['天守閣', '大阪城', '城']],
  ['torii', ['神社', '稻荷', '大社', '鳥居', '神宮']],
  ['temple', ['寺', '院', '佛']],
  ['tower', ['通天閣', '塔', 'タワー', 'tower', '展望']],
  ['park', ['公園', '瀑布', '滝', '山', '森', '花園']]
];

const HOTEL = ['旅館', '飯店', '酒店', '民宿', 'hotel', '入住', '退房', 'ホテル'];
const STATION = /站|駅|電鐵|地鐵|JR|rapi|新幹線|捷運|地下鐵/i;
const AIRPORT = ['機場', '空港', '航廈', '航空', 'KIX', 'TPE', 'ITM', '起飛'];
const BUS = ['巴士', '公車', '客運', 'bus', 'バス'];
const FOOD = ['餐', '吃', '拉麵', '燒肉', '壽司', '咖啡', '居酒屋', '食'];
const SHOP = ['商店街', '百貨', '逛', '購物', '藥妝', 'outlet'];

/**
 * @param {{ title?: string, place?: string, category?: string }} item
 * @returns {'hotel'|'station'|'airport'|'bus'|'castle'|'torii'|'temple'|'wheel'|'tower'|'park'|'food'|'shop'|'house'}
 */
export function buildingKind(item) {
  const text = `${item.title || ''} ${item.place || ''}`.toLowerCase();
  const has = (words) => words.some((w) => text.includes(w.toLowerCase()));
  const cat = item.category || '';

  if (cat === '住宿' || has(HOTEL)) return 'hotel';
  if (cat === '交通') {
    // 車站只看標題：地點常寫成「○○駅」，但行程可能是搭飛機或巴士
    if (STATION.test(item.title || '')) return 'station';
    if (has(AIRPORT)) return 'airport';
    if (has(BUS)) return 'bus';
    return 'station';
  }
  const hit = KEYWORD_KINDS.find(([, words]) => has(words));
  if (hit) return hit[0];
  if (cat === '餐廳' || has(FOOD)) return 'food';
  if (cat === '購物' || has(SHOP)) return 'shop';
  if (cat === '景點') return 'temple';
  return 'house';
}
