/* =========================================================
   明信片用的字型（index.html 的 Google Fonts 連結載入）
   canvas 畫字前要先 document.fonts.load，最多等 2.5 秒，沒載到就用後面的 fallback
   ========================================================= */

export const LEX = '"Lexend","Noto Sans TC",sans-serif';
export const SANS = '"Noto Sans TC","Lexend",sans-serif';
export const PIX = '"DotGothic16","Noto Sans TC",monospace';
export const HAND = '"LXGW WenKai TC","Noto Sans TC",sans-serif';
export const SERIF_TC = '"Noto Serif TC","Noto Sans TC",serif';
export const SCRIPT = '"Caveat","LXGW WenKai TC","Noto Sans TC",cursive';
export const TYPE = '"Special Elite","LXGW WenKai TC","Noto Sans TC",monospace';

const FONTS = [
  '400 50px "DotGothic16"', '700 48px "Noto Serif TC"', '500 21px "Noto Serif TC"', '700 36px "LXGW WenKai TC"',
  '600 60px "Caveat"', '400 24px "Special Elite"', '900 80px "Noto Sans TC"', '800 28px "Noto Sans TC"',
  '800 40px "Lexend"', '900 60px "Lexend"'
];
const SAMPLE = '大阪冬旅勝尾寺天守閣通天閣站打卡OSAKA STAGE0123456789';

let fontsReady = null;

function loadFonts() {
  if (!fontsReady) {
    fontsReady = Promise.all(FONTS.map((f) => document.fonts.load(f, SAMPLE).catch(() => {}))).then(() => {});
  }
  return fontsReady;
}

/** 等字型載入（最多 2.5 秒） */
export const fontsOk = () => Promise.race([loadFonts(), new Promise((r) => setTimeout(r, 2500))]);
