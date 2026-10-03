/* =========================================================
   角色對話的資料轉換
   - 台詞片段 ↔ 編輯用文字：用【】括起來的字是紅底強調
   - 劇本＋角色 → 對話元件要的格式
   ========================================================= */

/** [['好想'], ['躺平', true]] → '好想【躺平】' */
export const lineToText = (line = []) => line.map(([t, hi]) => (hi ? `【${t}】` : t)).join('');

/** '好想【躺平】' → [['好想'], ['躺平', true]]（沒配對的【】當一般文字） */
export function textToLine(text = '') {
  const out = [];
  const re = /【([^【】]*)】/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push([text.slice(last, m.index)]);
    if (m[1]) out.push([m[1], true]);
    last = re.lastIndex;
  }
  if (last < text.length) out.push([text.slice(last)]);
  return out;
}

/** 內建角色的檔名 → public/characters/ 的網址；上傳的 data URL、外部網址照原樣 */
export const charImgSrc = (img = '') =>
  (/^(data:|https?:|blob:)/.test(img) ? img : `${import.meta.env.BASE_URL}characters/${img}`);

/**
 * 把行程資料裡的劇本轉成 CharacterDialogue 要的格式
 * @returns {Array<{ key: string, charId: string, name: string, img: string, side: string, lift: string, line: Array }>}
 */
export function resolveScript(dialogue) {
  const chars = new Map((dialogue?.characters || []).map((c) => [c.id, c]));
  return (dialogue?.script || [])
    .map((l) => {
      const c = chars.get(l.charId);
      if (!c || !l.line?.length || l.hidden) return null; // 編輯器裡設為隱藏的不播
      return { key: l.id, charId: c.id, name: c.name, img: charImgSrc(c.img), side: l.side || c.side || 'right', lift: c.lift || '-2%', line: l.line };
    })
    .filter(Boolean);
}

/* ---------- 地圖關卡：每個行程可指定角色與台詞，沒指定就自動 ---------- */

// 自動台詞：依行程類別
const STAGE_LINES = {
  交通: ['出發囉！', '車子要來了，快跟上！', '移動中，記得看站名～'],
  景點: ['這裡一定要拍照打卡！', '終於到了！', '哇～好壯觀！'],
  餐廳: ['肚子好餓，開吃！', '這間我期待很久了！', '吃飽才有力氣逛！'],
  住宿: ['回血時間～', '先放行李休息一下', '今天辛苦了！'],
  購物: ['錢包準備好了嗎？', '買買買！', '行李箱還裝得下嗎…'],
  其他: ['下一關！', '繼續前進！', '衝啊！']
};

/** 自動台詞（i 是當天第幾關，讓同類別的關卡輪流說不同的話） */
export function autoStageLine(item, i = 0) {
  const lines = STAGE_LINES[item?.category] || STAGE_LINES.其他;
  return lines[i % lines.length];
}

/** 關卡的台詞片段：有自訂就用自訂（支援【】），沒有就自動 */
export const stageLine = (item, i) => textToLine(item?.say?.trim() || autoStageLine(item, i));

/** 當天的預設角色：每天輪一位 */
export const dayChar = (characters, day) => (characters.length ? characters[day % characters.length] : null);

/** 關卡的角色：有指定且角色還在就用指定的，否則用當天預設 */
export const stageChar = (characters, item, day) =>
  characters.find((c) => c.id === item?.charId) || dayChar(characters, day);
