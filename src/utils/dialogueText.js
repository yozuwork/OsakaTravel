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
      if (!c || !l.line?.length) return null;
      return { key: l.id, charId: c.id, name: c.name, img: charImgSrc(c.img), side: l.side || c.side || 'right', lift: c.lift || '-2%', line: l.line };
    })
    .filter(Boolean);
}
