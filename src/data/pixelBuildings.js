/* =========================================================
   地圖關卡的像素建築（16×16）
   新增建築：在 BUILDING_ART 加一組 16 行、每行 16 字的圖，
   字元對應 BUILDING_PALETTE 的顏色，"." 是透明；再到 utils/buildingKind.js 加判斷
   ========================================================= */

/** 色票：每個字元一種顏色 */
export const BUILDING_PALETTE = {
  k: '#1e2a45', // 深藍（線條）
  w: '#ffffff', // 白
  r: '#d9453c', // 紅
  R: '#b8352d', // 深紅
  p: '#f2b8b3', // 淡紅
  g: '#4fa38c', // 綠
  G: '#2f7464', // 深綠
  y: '#f2b33d', // 黃
  s: '#c3c6d1', // 淺灰
  S: '#8b90a3', // 灰
  b: '#8cc4ec', // 淺藍（窗）
  n: '#4a5470', // 藍灰（屋頂）
  c: '#f6e7c8', // 米色
  o: '#9a6a45', // 木頭
  t: '#6bb36f', // 樹葉
  T: '#3f8a52' // 深樹葉
};

/** 16×16 像素圖，key 是建築種類 */
export const BUILDING_ART = {
  castle: [
    '.......yy.......',
    '......kggk......',
    '.....kggggk.....',
    '....kkkkkkkk....',
    '.....kwwwwk.....',
    '.....kwkkwk.....',
    '...kgggggggGk...',
    '..kkkkkkkkkkkk..',
    '....kwwwwwwk....',
    '....kwkwwkwk....',
    '..kgggggggggGk..',
    '.kkkkkkkkkkkkkk.',
    '...kwwwkkwwwk...',
    '..ksssssssssSk..',
    '.ksSssSssSssSSk.',
    'kkkkkkkkkkkkkkkk'
  ],
  temple: [
    '.......kk.......',
    '......kyyk......',
    '....kkkkkkkk....',
    '..kknnnnnnnnkk..',
    '.knnnnnnnnnnnnk.',
    'kkkkkkkkkkkkkkkk',
    '..kyyyyyyyyyyk..',
    '..krwwwrrwwwrk..',
    '..krwwwrrwwwrk..',
    '..krwwwrrwwwrk..',
    '..krrrrkkrrrrk..',
    '..krwwrkkrwwrk..',
    '..krwwrkkrwwrk..',
    '.kkkkkkkkkkkkkk.',
    'ksssssssssssssSk',
    'kkkkkkkkkkkkkkkk'
  ],
  torii: [
    '................',
    'kkkkkkkkkkkkkkkk',
    'krrrrrrrrrrrrrRk',
    '.kkkkkkkkkkkkkk.',
    '...krk....krk...',
    '.kkkkkkkkkkkkkk.',
    '.krrrrrrrrrrrRk.',
    '.kkkrkkkkkkrkkk.',
    '...krk....krk...',
    '...krk....krk...',
    '...krk....krk...',
    '...krk....krk...',
    '...krk....krk...',
    '..kkkkk..kkkkk..',
    '..kSSSk..kSSSk..',
    'kkkkkkkkkkkkkkkk'
  ],
  hotel: [
    '.....kkkkkk.....',
    '.....krwwrk.....',
    '..kkkkkkkkkkkk..',
    '..kwwwwwwwwwwk..',
    '..kwbbwbbwbbwk..',
    '..kwbbwbbwbbwk..',
    '..kwwwwwwwwwwk..',
    '..kwbbwbbwbbwk..',
    '..kwbbwbbwbbwk..',
    '..kwwwwwwwwwwk..',
    '..kwbbwbbwbbwk..',
    '.kkkkkkkkkkkkkk.',
    '.krrrrrrrrrrrRk.',
    '..kwwwkkkkwwwk..',
    '..kwwwkbbkwwwk..',
    'kkkkkkkkkkkkkkkk'
  ],
  station: [
    '.......kk.......',
    '......kwwk......',
    '.....kwwkwk.....',
    '.....kwwwwk.....',
    '......kwwk......',
    '.kkkkkkkkkkkkkk.',
    'krrrrrrrrrrrrrRk',
    'kkkkkkkkkkkkkkkk',
    '.kwwwwwwwwwwwwk.',
    '.kwbbwbbwbbwbbk.',
    '.kwwwwwwwwwwwwk.',
    '.kwwwkkkkkkwwwk.',
    '.kwwwkbbbbkwwwk.',
    '.kwwwkbbbbkwwwk.',
    'kkkkkkkkkkkkkkkk',
    'kSkSkSkSkSkSkSkk'
  ],
  airport: [
    '................',
    '.kk.......kkkkk.',
    '.krk.....kbbbbbk',
    'kkrrkkk..kbbbbbk',
    '.krrrrrk.kkkkkkk',
    'kkrrkkk...kwwwk.',
    '.krk......kwrwk.',
    '.kk.......kwwwk.',
    '..........kwwwk.',
    '.kkkkkkkk.kwrwk.',
    '.kwwwwwwk.kwwwk.',
    '.kwbbwbbk.kwwwk.',
    '.kwbbwbbk.kwrwk.',
    '.kwwwwwwk.kwwwk.',
    '.kwwkkwwk.kwwwk.',
    'kkkkkkkkkkkkkkkk'
  ],
  bus: [
    '................',
    '................',
    '................',
    '..kkkkkkkkkkkk..',
    '.kwwwwwwwwwwwwk.',
    '.kwbbbwbbbwbbbk.',
    '.kwbbbwbbbwbbbk.',
    '.kwbbbwbbbwbbbk.',
    '.kwwwwwwwwwwwwk.',
    '.krrrrrrrrrrrrk.',
    '.kwwwwwwwwwwwwk.',
    '.kywwwwwwwwwwyk.',
    '.kkkkkkkkkkkkkk.',
    '..kkkk....kkkk..',
    '..kSSk....kSSk..',
    '...kk......kk...'
  ],
  wheel: [
    '......kkkk......',
    '....kkrkkykk....',
    '...kk..kk..kk...',
    '..ky.k.kk.k.rk..',
    '..k...kkkk...k..',
    '.kk...kkkk...kk.',
    '.krkkkkyykkkkyk.',
    '.kk...kkkk...kk.',
    '..k...kkkk...k..',
    '..kr.k.kk.k.yk..',
    '...kk.kkkk.kk...',
    '....kkkrrkkk....',
    '.....kk..kk.....',
    '....kk....kk....',
    '...kk......kk...',
    'kkkkkkkkkkkkkkkk'
  ],
  tower: [
    '.......kk.......',
    '.......kk.......',
    '......kyyk......',
    '......kwwk......',
    '.....kkkkkk.....',
    '.....krrrRk.....',
    '.....kwbbwk.....',
    '.....kkkkkk.....',
    '......kwwk......',
    '.....kwkkwk.....',
    '.....kwkkwk.....',
    '....kwk..kwk....',
    '....kwk..kwk....',
    '...kwk....kwk...',
    '..kwwk....kwwk..',
    'kkkkkkkkkkkkkkkk'
  ],
  park: [
    '................',
    '...kkkk.........',
    '..kttttk...kkk..',
    '.kttTtttk.kttTk.',
    '.ktttttTkkttttTk',
    '.kTtttttkktTtttk',
    '..kTTttk.kktTTk.',
    '...kkkk....kkk..',
    '....ko.......ko.',
    '....ko..kk...ko.',
    '....ko.kwwk..ko.',
    '....ko.kwwk..ko.',
    '.kkkkkkkkkkkkkk.',
    '.koooooooooooook',
    '.kok........kok.',
    'kkkkkkkkkkkkkkkk'
  ],
  food: [
    '................',
    '................',
    '..kkkkkkkkkkkk..',
    '.knnnnnnnnnnnnk.',
    'kkkkkkkkkkkkkkkk',
    '.kccccccccccccck',
    '.kccccccccccccck',
    '.krrrkrrrkrrrrrk',
    '.krrrkrrrkrrrkrk',
    '.krrrkrrrkrrrkyk',
    '.kcckkkccckkckrk',
    '.kcckbkcccbkckyk',
    '.kcckbkcccbkckkk',
    '.kcckbkcccbkck..',
    'kkkkkkkkkkkkkkkk',
    '................'
  ],
  shop: [
    '................',
    '.kkkkkkkkkkkkkk.',
    '.kwwwwwwwwwwwwk.',
    '.kwrrrrrrrrrrwk.',
    '.kwwwwwwwwwwwwk.',
    'kkkkkkkkkkkkkkkk',
    'krwrwrwrwrwrwrwk',
    'kkkkkkkkkkkkkkkk',
    '.kwwwwwwwwwwwwk.',
    '.kbbbbkwwkbbbbk.',
    '.kbybbkwwkbypbk.',
    '.kbbbbkbbkbbbbk.',
    '.kbbbbkbbkbbbbk.',
    '.kkkkkkbbkkkkkk.',
    '.kwwwwkbbkwwwwk.',
    'kkkkkkkkkkkkkkkk'
  ],
  house: [
    '................',
    '................',
    '...........kk...',
    '......kk...kSk..',
    '.....krrk..kSk..',
    '....krrrrk.kSk..',
    '...krrrrrrkkkk..',
    '..krrrrrrrrrrk..',
    '.krrrrrrrrrrrrk.',
    'kkkkkkkkkkkkkkkk',
    '.kwwwwwwwwwwwwk.',
    '.kwbbwwwwkkkkwk.',
    '.kwbbwwwwkcckwk.',
    '.kwwwwwwwkcykwk.',
    '.kwwwwwwwkcckwk.',
    'kkkkkkkkkkkkkkkk'
  ]
};
