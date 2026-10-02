/* 待辦／行李／住宿的新增邏輯（文字、語音新增共用） */
import { updateTrip } from '../../stores/tripStore';
import { uid } from '../../utils/helpers';

/** 新增待辦（可一次多筆） */
export function addTodos(texts) {
  updateTrip((s) => { texts.forEach((text) => s.todos.push({ id: uid(), text, done: false })); });
}

/** 新增項目到分類清單（預設行李）的指定分類；gid 為 null 時建立「新分類」 */
export function addBagItems(gid, texts, listKey = 'bag') {
  updateTrip((s) => {
    let grp = gid && s[listKey].find((x) => x.id === gid);
    if (!grp) { grp = { id: uid(), name: '新分類', items: [] }; s[listKey].push(grp); }
    texts.forEach((text) => grp.items.push({ id: uid(), text, done: false }));
  });
}

export const EMPTY_STAY = { name: '', address: '', checkIn: '', checkInTime: '', checkOut: '', checkOutTime: '', orderNo: '', roomType: '', phone: '', platform: '', photo: '' };

/** 新增住宿 */
export function addStay(data) {
  updateTrip((s) => { s.stays.push({ ...EMPTY_STAY, ...data, id: uid() }); });
}
