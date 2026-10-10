/* 整合範例：把這個檔案改名成 CheckinRoute.jsx，接到 App 的 /checkin 路由
   需要調整的只有「從 store 取資料」那幾行（標了 TODO） */
import CheckinPage from "./CheckinPage.jsx";
// TODO: 換成 App 現有的 store hook 和「取某天行程」的函式
// import { useStore } from "../store";
// import { itemsOfDay } from "../utils/itemEditor";

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

export default function CheckinRoute() {
  // TODO: 依 App 實際寫法取值
  const trip = /* useStore(s => s.trip) */ { name: "大阪冬旅", startDate: "2026-12-21", days: 5 };
  const items = /* useStore(s => s.items) */ [];
  const day = /* useStore(s => s.ui.day) */ 0;

  const d = new Date(trip.startDate); d.setDate(d.getDate() + day);
  const tripInfo = {
    name: trip.name,
    date: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`,
    day: day + 1,
    weekday: WEEK[d.getDay()],
  };
  const stops = /* itemsOfDay(items, day) */ items
    .filter((it) => it.day === day)
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"))
    .map((it, i) => ({ id: it.id, no: i + 1, time: it.time, category: it.category || "其他", title: it.title }));

  /* key 帶 day：換日期時重新載入 */
  return <CheckinPage key={day} trip={tripInfo} stops={stops} />;
}
