import { useTripStore, updateTrip } from '../../stores/tripStore';
import { toast } from '../../stores/uiStore';
import { openForm } from '../../components/form/openForm';
import { CATEGORIES } from '../../data/constants';
import { addDays, mdw } from '../../utils/date';
import { uid } from '../../utils/helpers';
import { placeItem, timeIndex } from '../../utils/itinerary';

function itemFields(trip, it) {
  const dayOptions = Array.from({ length: trip.days }, (_, i) => ({ value: i, label: `D${i + 1} · ${mdw(addDays(trip.startDate, i))}` }));
  return [
    { name: 'day', label: '日期', type: 'select', options: dayOptions, value: it.day, full: true },
    { name: 'time', label: '時間', type: 'time', value: it.time },
    { name: 'category', label: '類別', type: 'select', options: CATEGORIES.map((c) => c.id), value: it.category || '交通' },
    { name: 'title', label: '標題', value: it.title, placeholder: '例如：大阪城天守閣', required: true, full: true },
    { name: 'place', label: '地點', value: it.place, placeholder: '例如：大阪城公園駅', full: true },
    { name: 'note', label: '備註', type: 'textarea', value: it.note, placeholder: '換票、轉乘、訂位資訊…', full: true }
  ];
}

/**
 * 新增／編輯行程
 * @param {string|null} id 既有行程 id；null 為新增
 * @param {object} [preset] 預填資料（例如從收集箱加入）
 * @param {{ copy?: boolean }} [opts] copy：從既有行程複製成新行程
 */
export function openItemForm(id, preset, { copy = false } = {}) {
  const { trip, items, ui } = useTripStore.getState();
  const existing = id ? items.find((x) => x.id === id) : null;
  const it = existing ? { ...existing } : { day: ui.day, time: '', category: '交通', title: '', place: '', note: '', ...preset };

  openForm({
    title: copy ? '複製行程' : preset ? '加入行程' : existing ? '編輯行程' : '新增行程',
    submitText: preset && !copy ? '加入行程' : '儲存',
    fields: itemFields(trip, it),
    onSave: (v) => {
      const data = { ...it, ...v, day: parseInt(v.day, 10) };
      updateTrip((s) => {
        const target = existing && s.items.find((x) => x.id === id);
        const itemId = target ? id : uid();
        // 新增或換日期時，依時間插入當天順序
        const index = !target || target.day !== data.day ? timeIndex(s.items, data.day, data.time, itemId) : null;
        if (target) Object.assign(target, data);
        else s.items.push({ ...data, id: itemId });
        if (index !== null) placeItem(s, itemId, index);
        s.ui.day = data.day;
      });
      toast(copy ? `已複製到 D${data.day + 1}` : preset ? `已加入 D${data.day + 1} 行程` : existing ? '已更新行程' : '已新增行程');
    },
    onDelete: existing ? () => {
      updateTrip((s) => { s.items = s.items.filter((x) => x.id !== id); });
      toast('已刪除行程');
    } : undefined
  });
}
