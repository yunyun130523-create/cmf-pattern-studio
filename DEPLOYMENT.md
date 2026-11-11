# GitHub Pages 發布準備

## 本次狀態

目標是將現有 2.0.0-alpha.3 React / TypeScript / Vite 專案原樣部署。應用程式的 src/、原 index.html、Vite 圖案建置設定及所有預設參數保持原狀。本次新增的是部署流程、公開檔案檢查及跨瀏覽器驗收設定。

GitHub 帳號已連線：yunyun130523-create。檢查時未找到同名 Repository；仍需在實際建立前再次查證。尚未建立公開儲存庫、推送程式或發布網站，等待使用者明確確認。

預定公開 Repository：https://github.com/yunyun130523-create/cmf-pattern-studio

預定 HTTPS 網站：https://yunyun130523-create.github.io/cmf-pattern-studio/

以上為預定位置，不代表已發布成功。

## 部署方式與費用

- 使用個人帳號的公開 Repository 與標準 GitHub Pages / GitHub-hosted ubuntu-latest runner；無自架伺服器、無付費 API、無自訂網域費用。
- 原 Vite base 為 ./，可直接使用專案子路徑，正式輸出為 dist/index.html。保留單檔與內嵌 Worker、示範照片的既有建置方式。
- .github/workflows/pages.yml 在 main 更新或手動執行時，依鎖定版本安裝、檢查、建置、測試，通過後上傳 dist/ 並透過 Pages OIDC 發布。
- Pull Request 僅執行建置與測試，不部署。
- 所用 GitHub Actions 均固定至官方 action 的 commit SHA；不需要新增個人 Access Token、API Key 或付費部署服務。
- 遵守 GitHub Pages 的免費服務使用條款與容量限制；此專案是純前端設計工具。

## 發布前可檢閱內容

公開清單由 scripts/check-publication.mjs 定義：應用程式原始碼、免費示範圖片與其授權、測試、工作流程、套件鎖定檔及既有使用／授權文件。現有 MIT LICENSE 會隨程式碼公開。

不包含 node_modules/、dist/、work/、本機草稿、上傳紀錄、設計 JSON／DWG、環境設定、金鑰、測試下載及截圖。部署的網站 artifact 只包含 dist/，不包含原始專案工作資料夾。

check:public 檢查已追蹤檔案是否在清單內，拒絕未核准檔案與符號連結，並掃描已知憑證格式；輸出只包含檔名、行號與類別，不列出可疑內容。自動掃描只能辨識已知格式，無法判斷設計是否受公司保密約定約束，公開前仍需由使用者確認程式與公開示範的權利。

使用者上傳的圖片與圖案仍在訪客瀏覽器內處理，不上傳 Repository 或伺服器。換至 GitHub Pages 網域後，本機儲存屬於新來源；舊版或 Notion 內的設計可透過原 JSON 匯出／匯入功能轉移。

## 測試與發布關卡

本機可執行：npm run check:public、npm run build、npm test。

Playwright 設定包含桌面 Chromium、Pixel 7 尺寸的 Chromium、iPhone 13 尺寸的 WebKit。三組情境驗證：

1. 網站在 /cmf-pattern-studio/ 子路徑載入、無水平溢出、圖案生成、原生滑桿按鍵與 SVG 下載。
2. 真正山巒 JPG 解碼上傳、Worker / Canvas 有效像素、大小／密度／對比／稀疏／三角形，以及 SVG 與 JSON 還原。
3. 真正透明 PNG 解碼、透明背景與 2× PNG 下載，讀回點陣尺寸與 Alpha。

目前受管理執行環境沒有 cua_repl.js；依 Sites 的預覽規範，不另裝瀏覽器或啟動替代預覽。因此 Playwright 僅先驗證測試收集與設定，未在本機冒稱通過桌面／手機實機驗收。取得公開授權後，GitHub Actions 會在免費公開 runner 安裝 Chromium / WebKit，執行這些驗收；未通過不部署。模擬手機瀏覽器不等同真實手機硬體測試。

## 取得使用者確認後的操作

1. 再次確認 cmf-pattern-studio 尚未被占用，依核准的公開檔案清單建立初始 Git 提交。
2. 建立公開 Repository 並推送 main，啟用 GitHub Pages 的 GitHub Actions 發布模式。
3. 等待工作流程測試與部署；必要時修正部署接線問題，保留既有產品行為。
4. 驗證 Pages 回傳的實際 HTTPS 網址，檢查首頁／子路徑／建置內容，再回報實際通過的瀏覽器測試與尚待實機確認項目。

若 GitHub 對建立 Repository、Actions／Pages 或 workflow 檔案需要額外授權，使用 GitHub 網頁的授權流程，每次只請使用者完成一個步驟；不要求在聊天中貼上 Token。
