import { createRoot } from "react-dom/client";
import CheckinPage from "./checkin/CheckinPage.jsx";

/* 示範資料：整合進 App 時，改成從 store 取當天行程（見 README） */
const trip = { name: "大阪冬旅", date: "2026.12.23", day: 3, weekday: "三" };
const stops = [
  ["08:30", "交通", "旅館出發"], ["09:30", "交通", "抵達箕面萱野"], ["10:00", "景點", "勝尾寺"], ["11:30", "交通", "前往大阪城"],
  ["12:00", "景點", "天守閣 大阪城公園"], ["13:30", "餐廳", "黑門市場午餐"], ["15:00", "景點", "通天閣"], ["17:00", "購物", "心齋橋商店街"],
].map(([time, category, title], i) => ({ id: "demo-" + (i + 1), no: i + 1, time, category, title }));

createRoot(document.getElementById("root")).render(<CheckinPage trip={trip} stops={stops} />);
