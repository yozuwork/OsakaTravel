// PixelBuilding.jsx v1 — 地圖關卡旁的像素建築（角色抵達時才出現）
// 用法：在 MapPage 的 qm-node 裡，label 後面加上
//   {t === arrivedIndex && !walking && <PixelBuilding item={e} labelLeft={c} />}
// labelLeft = 標籤是否在左側（建築就放另一側）

const PAL = {
  "k": "#1e2a45",
  "w": "#ffffff",
  "r": "#d9453c",
  "R": "#b8352d",
  "p": "#f2b8b3",
  "g": "#4fa38c",
  "G": "#2f7464",
  "y": "#f2b33d",
  "s": "#c3c6d1",
  "S": "#8b90a3",
  "b": "#8cc4ec",
  "n": "#4a5470",
  "c": "#f6e7c8",
  "o": "#9a6a45",
  "t": "#6bb36f",
  "T": "#3f8a52"
};

// 16×16，每格一個字元，對應上面的色票；"." 為透明
const ART = {
  "castle": [
    ".......yy.......",
    "......kggk......",
    ".....kggggk.....",
    "....kkkkkkkk....",
    ".....kwwwwk.....",
    ".....kwkkwk.....",
    "...kgggggggGk...",
    "..kkkkkkkkkkkk..",
    "....kwwwwwwk....",
    "....kwkwwkwk....",
    "..kgggggggggGk..",
    ".kkkkkkkkkkkkkk.",
    "...kwwwkkwwwk...",
    "..ksssssssssSk..",
    ".ksSssSssSssSSk.",
    "kkkkkkkkkkkkkkkk"
  ],
  "temple": [
    ".......kk.......",
    "......kyyk......",
    "....kkkkkkkk....",
    "..kknnnnnnnnkk..",
    ".knnnnnnnnnnnnk.",
    "kkkkkkkkkkkkkkkk",
    "..kyyyyyyyyyyk..",
    "..krwwwrrwwwrk..",
    "..krwwwrrwwwrk..",
    "..krwwwrrwwwrk..",
    "..krrrrkkrrrrk..",
    "..krwwrkkrwwrk..",
    "..krwwrkkrwwrk..",
    ".kkkkkkkkkkkkkk.",
    "ksssssssssssssSk",
    "kkkkkkkkkkkkkkkk"
  ],
  "torii": [
    "................",
    "kkkkkkkkkkkkkkkk",
    "krrrrrrrrrrrrrRk",
    ".kkkkkkkkkkkkkk.",
    "...krk....krk...",
    ".kkkkkkkkkkkkkk.",
    ".krrrrrrrrrrrRk.",
    ".kkkrkkkkkkrkkk.",
    "...krk....krk...",
    "...krk....krk...",
    "...krk....krk...",
    "...krk....krk...",
    "...krk....krk...",
    "..kkkkk..kkkkk..",
    "..kSSSk..kSSSk..",
    "kkkkkkkkkkkkkkkk"
  ],
  "hotel": [
    ".....kkkkkk.....",
    ".....krwwrk.....",
    "..kkkkkkkkkkkk..",
    "..kwwwwwwwwwwk..",
    "..kwbbwbbwbbwk..",
    "..kwbbwbbwbbwk..",
    "..kwwwwwwwwwwk..",
    "..kwbbwbbwbbwk..",
    "..kwbbwbbwbbwk..",
    "..kwwwwwwwwwwk..",
    "..kwbbwbbwbbwk..",
    ".kkkkkkkkkkkkkk.",
    ".krrrrrrrrrrrRk.",
    "..kwwwkkkkwwwk..",
    "..kwwwkbbkwwwk..",
    "kkkkkkkkkkkkkkkk"
  ],
  "station": [
    ".......kk.......",
    "......kwwk......",
    ".....kwwkwk.....",
    ".....kwwwwk.....",
    "......kwwk......",
    ".kkkkkkkkkkkkkk.",
    "krrrrrrrrrrrrrRk",
    "kkkkkkkkkkkkkkkk",
    ".kwwwwwwwwwwwwk.",
    ".kwbbwbbwbbwbbk.",
    ".kwwwwwwwwwwwwk.",
    ".kwwwkkkkkkwwwk.",
    ".kwwwkbbbbkwwwk.",
    ".kwwwkbbbbkwwwk.",
    "kkkkkkkkkkkkkkkk",
    "kSkSkSkSkSkSkSkk"
  ],
  "airport": [
    "................",
    ".kk.......kkkkk.",
    ".krk.....kbbbbbk",
    "kkrrkkk..kbbbbbk",
    ".krrrrrk.kkkkkkk",
    "kkrrkkk...kwwwk.",
    ".krk......kwrwk.",
    ".kk.......kwwwk.",
    "..........kwwwk.",
    ".kkkkkkkk.kwrwk.",
    ".kwwwwwwk.kwwwk.",
    ".kwbbwbbk.kwwwk.",
    ".kwbbwbbk.kwrwk.",
    ".kwwwwwwk.kwwwk.",
    ".kwwkkwwk.kwwwk.",
    "kkkkkkkkkkkkkkkk"
  ],
  "bus": [
    "................",
    "................",
    "................",
    "..kkkkkkkkkkkk..",
    ".kwwwwwwwwwwwwk.",
    ".kwbbbwbbbwbbbk.",
    ".kwbbbwbbbwbbbk.",
    ".kwbbbwbbbwbbbk.",
    ".kwwwwwwwwwwwwk.",
    ".krrrrrrrrrrrrk.",
    ".kwwwwwwwwwwwwk.",
    ".kywwwwwwwwwwyk.",
    ".kkkkkkkkkkkkkk.",
    "..kkkk....kkkk..",
    "..kSSk....kSSk..",
    "...kk......kk..."
  ],
  "wheel": [
    "......kkkk......",
    "....kkrkkykk....",
    "...kk..kk..kk...",
    "..ky.k.kk.k.rk..",
    "..k...kkkk...k..",
    ".kk...kkkk...kk.",
    ".krkkkkyykkkkyk.",
    ".kk...kkkk...kk.",
    "..k...kkkk...k..",
    "..kr.k.kk.k.yk..",
    "...kk.kkkk.kk...",
    "....kkkrrkkk....",
    ".....kk..kk.....",
    "....kk....kk....",
    "...kk......kk...",
    "kkkkkkkkkkkkkkkk"
  ],
  "tower": [
    ".......kk.......",
    ".......kk.......",
    "......kyyk......",
    "......kwwk......",
    ".....kkkkkk.....",
    ".....krrrRk.....",
    ".....kwbbwk.....",
    ".....kkkkkk.....",
    "......kwwk......",
    ".....kwkkwk.....",
    ".....kwkkwk.....",
    "....kwk..kwk....",
    "....kwk..kwk....",
    "...kwk....kwk...",
    "..kwwk....kwwk..",
    "kkkkkkkkkkkkkkkk"
  ],
  "park": [
    "................",
    "...kkkk.........",
    "..kttttk...kkk..",
    ".kttTtttk.kttTk.",
    ".ktttttTkkttttTk",
    ".kTtttttkktTtttk",
    "..kTTttk.kktTTk.",
    "...kkkk....kkk..",
    "....ko.......ko.",
    "....ko..kk...ko.",
    "....ko.kwwk..ko.",
    "....ko.kwwk..ko.",
    ".kkkkkkkkkkkkkk.",
    ".koooooooooooook",
    ".kok........kok.",
    "kkkkkkkkkkkkkkkk"
  ],
  "food": [
    "................",
    "................",
    "..kkkkkkkkkkkk..",
    ".knnnnnnnnnnnnk.",
    "kkkkkkkkkkkkkkkk",
    ".kccccccccccccck",
    ".kccccccccccccck",
    ".krrrkrrrkrrrrrk",
    ".krrrkrrrkrrrkrk",
    ".krrrkrrrkrrrkyk",
    ".kcckkkccckkckrk",
    ".kcckbkcccbkckyk",
    ".kcckbkcccbkckkk",
    ".kcckbkcccbkck..",
    "kkkkkkkkkkkkkkkk",
    "................"
  ],
  "shop": [
    "................",
    ".kkkkkkkkkkkkkk.",
    ".kwwwwwwwwwwwwk.",
    ".kwrrrrrrrrrrwk.",
    ".kwwwwwwwwwwwwk.",
    "kkkkkkkkkkkkkkkk",
    "krwrwrwrwrwrwrwk",
    "kkkkkkkkkkkkkkkk",
    ".kwwwwwwwwwwwwk.",
    ".kbbbbkwwkbbbbk.",
    ".kbybbkwwkbypbk.",
    ".kbbbbkbbkbbbbk.",
    ".kbbbbkbbkbbbbk.",
    ".kkkkkkbbkkkkkk.",
    ".kwwwwkbbkwwwwk.",
    "kkkkkkkkkkkkkkkk"
  ],
  "house": [
    "................",
    "................",
    "...........kk...",
    "......kk...kSk..",
    ".....krrk..kSk..",
    "....krrrrk.kSk..",
    "...krrrrrrkkkk..",
    "..krrrrrrrrrrk..",
    ".krrrrrrrrrrrrk.",
    "kkkkkkkkkkkkkkkk",
    ".kwwwwwwwwwwwwk.",
    ".kwbbwwwwkkkkwk.",
    ".kwbbwwwwkcckwk.",
    ".kwwwwwwwkcykwk.",
    ".kwwwwwwwkcckwk.",
    "kkkkkkkkkkkkkkkk"
  ]
};

const cache = {};
function paths(kind) {
  if (cache[kind]) return cache[kind];
  const acc = {};
  ART[kind].forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x], s = x;
      while (x < row.length && row[x] === ch) x++;
      if (ch !== '.') (acc[ch] ||= []).push(`M${s} ${y}h${x - s}v1h-${x - s}z`);
    }
  });
  return (cache[kind] = Object.entries(acc).map(([c, d]) => [c, d.join('')]));
}

// 依行程標題 / 地點 / 分類猜建築種類
export function buildingKind(e){let s=`${e.title||``} ${e.place||``}`,c=e.category||``,h=(...a)=>a.some(t=>s.toLowerCase().includes(t.toLowerCase()));
if(h(`旅館`,`飯店`,`酒店`,`民宿`,`hotel`,`入住`,`退房`,`ホテル`)||c===`住宿`)return`hotel`;
if(c===`交通`){let ti=e.title||``;if(/站|駅|電鐵|地鐵|JR|rapi|新幹線|捷運|地下鐵/i.test(ti))return`station`;if(h(`機場`,`空港`,`航廈`,`航空`,`KIX`,`TPE`,`ITM`,`起飛`))return`airport`;if(h(`巴士`,`公車`,`客運`,`bus`,`バス`))return`bus`;return`station`}
if(h(`天守閣`,`大阪城`,`城`))return`castle`;
if(h(`神社`,`稻荷`,`大社`,`鳥居`,`神宮`))return`torii`;
if(h(`寺`,`院`,`佛`))return`temple`;
if(h(`環球`,`影城`,`樂園`,`USJ`,`ユニバーサル`,`摩天輪`,`遊樂`))return`wheel`;
if(h(`通天閣`,`塔`,`タワー`,`tower`,`展望`))return`tower`;
if(h(`公園`,`瀑布`,`滝`,`山`,`森`,`花園`))return`park`;
if(c===`餐廳`||h(`餐`,`吃`,`拉麵`,`燒肉`,`壽司`,`咖啡`,`居酒屋`,`食`))return`food`;
if(c===`購物`||h(`商店街`,`百貨`,`逛`,`購物`,`藥妝`,`outlet`))return`shop`;
if(c===`景點`)return`temple`;return`house`}

export default function PixelBuilding({ item, labelLeft }) {
  const kind = buildingKind(item);
  return (
    <span className={`qm-bldg ${labelLeft ? 'is-right' : 'is-left'}`} data-kind={kind} aria-hidden="true">
      <span className="qm-bldg__spark" />
      <svg className="qm-bldg__art" viewBox="0 0 16 16" shapeRendering="crispEdges">
        {paths(kind).map(([c, d]) => <path key={c} d={d} fill={PAL[c]} />)}
      </svg>
      <span className="qm-bldg__ground" />
    </span>
  );
}
