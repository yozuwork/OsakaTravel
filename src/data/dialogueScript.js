/* =========================================================
   角色對話：預設角色與劇本
   實際使用的資料存在行程資料 state.dialogue（會跟帳號同步），可在「編輯對話」修改；
   這裡是第一次使用、或按「恢復預設」時的內容
   ========================================================= */

/**
 * 角色（頭像）
 * - img：內建角色是 public/characters/ 底下的檔名；自己新增的角色是上傳後的圖片（data URL）
 * - side：預設從哪一側切入，'left' | 'right'
 * - lift：立繪往上抬的距離（橫幅圖用），預設 '-2%'
 * - builtin：內建角色不能刪除
 */
export const DEFAULT_CHARACTERS = [
  { id: 'yongqing', name: '永清', img: 'char-yongqing-v1.webp', side: 'right', lift: '-2%', builtin: true },
  { id: 'rongge', name: '榮哥', img: 'char-rongge-v1.webp', side: 'left', lift: '12%', builtin: true },
  { id: 'yuzu', name: '柚子', img: 'char-yuzu-v1.webp', side: 'right', lift: '12%', builtin: true }
];

/**
 * 劇本：依序播放
 * - charId：說話的角色
 * - side：這一句從哪一側切入（沒填就用角色預設）
 * - line：台詞片段 [文字, 是否紅底強調]，文字裡的 \n 會換行
 */
export const DEFAULT_DIALOGUE_SCRIPT = [
  { id: 'l1', charId: 'yongqing', line: [['好想'], ['躺平', true], ['喔⋯⋯\n哪邊可以'], ['睡覺', true], ['阿？']] },
  { id: 'l2', charId: 'yongqing', line: [['對了，可以去'], ['無印良品', true], ['嗎？\n沒有'], ['無印良品', true], ['怎麼能叫日本行呢！']] },
  { id: 'l3', charId: 'rongge', line: [['哪邊有'], ['塔', true], ['？\n來日本不能不看'], ['塔', true], ['吧！']] },
  {
    id: 'l4', charId: 'yuzu',
    line: [['來日本當然是要來看'], ['動漫', true], ['、\n買'], ['手辦', true], ['、'],
      ['漫畫', true], ['阿！\n當然'], ['芙莉蓮展', true], ['也要去！']]
  }
];

export const defaultDialogue = () => ({
  characters: DEFAULT_CHARACTERS.map((c) => ({ ...c })),
  script: DEFAULT_DIALOGUE_SCRIPT.map((l) => ({ ...l, line: l.line.map((seg) => [...seg]) }))
});
