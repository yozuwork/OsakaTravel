（貼給本地 Claude Code 用）

我在 `_drafts/checkin-module-v1/` 放了一個已經做好、可以直接用的打卡功能 React 模組（說明在它的 README.md）。
請「直接使用」這份程式碼，不要重寫、不要刪減功能，10 種版型、蓋章、留言、PDF 都要保留。

要做的事只有整合：
1. 把 `_drafts/checkin-module-v1/src/checkin/` 複製到 `src/checkin/`。
2. `npm install jspdf@2.5.1`。
3. 參考 `CheckinRoute.example.jsx` 建立 `src/checkin/CheckinRoute.jsx`：改成用 App 現有的 store 取 trip、items、ui.day，並用地圖頁取當天行程的同一個函式排序 items。
4. 在路由加 `/checkin`，tabbar 的「打卡」連過去；App 已有頁首就傳 `header={false}`。
5. 在打卡頁上方沿用地圖頁的日期切換（day-tabs）。
6. `npm run build` 沒錯誤後，列出你改了哪些檔案。

除了上面這些，engine.js、CheckinPage.jsx、checkin.css 的內容不要改；真的需要改時先問我。
