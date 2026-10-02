/* =========================================================
   角色對話劇本（CharacterDialogue.jsx 讀取）
   新增角色或台詞只改這裡；立繪放在 public/characters/
   - name：名字牌（每個字一個小方塊）
   - img：public/characters/ 底下的檔名（已去背的 WebP）
   - side：立繪從哪一側切入，'left' | 'right'
   - lift：立繪往上抬的距離（橫幅圖用），預設 '-2%'
   - line：台詞片段 [文字, 是否紅底強調]，文字裡的 \n 會換行
   ========================================================= */
export const DIALOGUE_SCRIPT = [
  {
    name: '永清', img: 'char-yongqing-v1.webp', side: 'right',
    line: [['好想'], ['躺平', true], ['喔⋯⋯\n哪邊可以'], ['睡覺', true], ['阿？']]
  },
  {
    name: '榮哥', img: 'char-rongge-v1.webp', side: 'left', lift: '12%',
    line: [['哪邊有'], ['塔', true], ['？\n來日本不能不看'], ['塔', true], ['吧！']]
  },
  {
    name: '柚子', img: 'char-yuzu-v1.webp', side: 'right', lift: '12%',
    line: [['來日本當然是要來看'], ['動漫', true], ['、\n買'], ['手辦', true], ['、'],
      ['漫畫', true], ['阿！\n當然'], ['芙莉蓮展', true], ['也要去！']]
  }
];
