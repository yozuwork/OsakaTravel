import { BUILDING_ART, BUILDING_PALETTE } from '../../data/pixelBuildings';
import { buildingKind } from '../../utils/buildingKind';
import { cx } from '../../utils/helpers';

/* =========================================================
   地圖關卡旁的像素建築：角色抵達、停下來時才顯示，出現時由下往上蓋起來
   放在標籤的另一側（標籤在左 → 建築在右）
   ========================================================= */

const pathCache = {};

/** 每個顏色一條 path：同一列連續同色的格子合併成一個矩形（依建築種類快取） */
function artPaths(kind) {
  if (pathCache[kind]) return pathCache[kind];
  const byColor = {};
  BUILDING_ART[kind].forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      const ch = row[x], start = x;
      while (x < row.length && row[x] === ch) x++;
      if (ch !== '.') (byColor[ch] ||= []).push(`M${start} ${y}h${x - start}v1h-${x - start}z`);
    }
  });
  // 多段要串成一個字串；直接把陣列塞進 d 會變成逗號分隔，圖會壞掉
  return (pathCache[kind] = Object.entries(byColor).map(([ch, d]) => [ch, d.join('')]));
}

/**
 * @param {object} p
 * @param {object} p.item 行程
 * @param {boolean} p.labelLeft 標籤是否在節點左側（建築就放右側）
 * @param {number} [p.room] 節點中心到路線區邊緣、建築那一側的距離；空間不夠時建築往節點靠，不超出畫面
 */
export default function PixelBuilding({ item, labelLeft, room }) {
  const kind = buildingKind(item);
  return (
    <span className={cx('qm-bldg', labelLeft ? 'is-right' : 'is-left')} data-kind={kind} aria-hidden="true"
      style={room ? { '--room': `${room}px` } : undefined}>
      <span className="qm-bldg__spark" />
      <svg className="qm-bldg__art" viewBox="0 0 16 16" shapeRendering="crispEdges">
        {artPaths(kind).map(([ch, d]) => <path key={ch} d={d} fill={BUILDING_PALETTE[ch]} />)}
      </svg>
      <span className="qm-bldg__ground" />
    </span>
  );
}
