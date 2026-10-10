# 打卡明信片 v1（React 版完整原始碼）

功能和 Demo v11 一樣：行程蓋章、網頁相機拍照（一站可拍多張）、10 種明信片版型（直式／橫式）、
明信片蓋章（郵戳／打卡印／票根章，印上真實時間）、手寫留言、匯出當日 A4 PDF。

## 方式一：先單獨跑起來看
```
npm install
npm run dev
```
打開終端機顯示的網址。用手機測相機時要用 https 或 localhost（可用 `npm run dev -- --host` 加上 https 憑證，或部署後再測）。

## 方式二：放進我的旅行規劃 App
1. 把 `src/checkin/` 整個資料夾複製到 App 的 `src/` 底下。
2. 安裝 PDF 套件：`npm install jspdf@2.5.1`
3. 把 `CheckinRoute.example.jsx` 改名成 `CheckinRoute.jsx`，照 TODO 改成從 store 取 trip、items、ui.day。
4. 在路由加上 `/checkin` → `<CheckinRoute />`，tabbar 的「打卡」連到 `/checkin`。
5. App 本身已經有頁首的話，可以傳 `header={false}` 把打卡頁自己的標題關掉。

## 檔案
| 檔案 | 內容 |
|---|---|
| `checkin/CheckinPage.jsx` | 打卡頁、相機、明信片檢視、PDF 預覽（React） |
| `checkin/engine.js` | 影像效果、10 種版型、印章、PDF 報表（純 canvas） |
| `checkin/storage.js` | IndexedDB 存取 |
| `checkin/checkin.css` | 樣式，全部 `ck-` 前綴，不會影響 App 其他頁面；字型用 @import 自動載入 |
| `checkin/CheckinRoute.example.jsx` | 接 store 的範例 |

## 資料格式
- `trip`：`{ name, date: "2026.12.23", day: 3, weekday: "三" }`
- `stops`：`[{ id, no, time, category, title }]`，`id` 請用行程 item 的 id（照片和章都是用它對應）
- 照片、明信片、章都存在瀏覽器的 IndexedDB（資料庫名稱 `checkin-postcards`），不會上傳。
