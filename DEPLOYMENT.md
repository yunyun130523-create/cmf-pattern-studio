# GitHub Pages 部署

正式網站：https://yunyun130523-create.github.io/cmf-pattern-studio/

公開 Repository：https://github.com/yunyun130523-create/cmf-pattern-studio

首次成功的驗收與發布：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/42966047757

## 已確認的結果

- 使用者已明確同意公開發布，並完成 Repository、GitHub Connector 與 Pages 授權設定。
- GitHub Pages Source 為 GitHub Actions，HTTPS 已啟用；正式網址回應 HTTP 200。
- 上線 HTML 的 SHA256 與原本本機正式建置完全一致：ee818981deffda9f30c4facd0e69b1eeffe41dad60a1ae45ad396f047b0e49c8。
- 27 個既有應用程式來源檔、原 Vite 設定與入口 HTML 保持原樣；功能、介面、幾何演算法及預設參數未變更。
- 184 項原有自動測試及正式建置通過。
- 桌面 Chromium、Pixel 7 尺寸 Chromium、iPhone 13 尺寸 WebKit，共 9 項真正瀏覽器驗收通過；屬於瀏覽器與手機尺寸模擬，不是實體手機硬體測試。

第一次瀏覽器驗收曾在 Canvas 背景繪圖完成前讀取像素；已修正測試等待條件，第二次全部通過。此修正只涉及驗收程式，沒有改動產品繪圖或運算程式。

## 自動更新

.github/workflows/pages.yml 在 main 更新或手動執行時：

1. 使用 Node.js 24 及 package-lock.json 安裝依賴。
2. 執行公開檔案檢查、TypeScript／Vite 建置與原有測試。
3. 在 GitHub runner 安裝 Chromium／WebKit，對 /cmf-pattern-studio/ 子路徑執行跨瀏覽器驗收。
4. 全部通過後，只上傳 dist/ 並以 Pages OIDC 發布 HTTPS 網站。

Pull Request 只測試，不發布。建置或測試失敗時不替換既有網站。工作流程使用官方 Actions 的固定 commit SHA，無需自行提供 API Key 或個人 Access Token。

原 Vite base 為 ./，dist/index.html 保留內嵌程式、Worker 與示範照片。使用免費公開 Repository、GitHub Pages 與標準 GitHub-hosted ubuntu-latest runner，沒有付費伺服器或付費 API。

純文件修正若使用 [skip ci] 提交訊息，可避免重跑與網站內容無關的流程；一般程式碼更新照常自動測試與發布。

## 已通過的瀏覽器驗收

- 桌面與手機尺寸載入、無水平溢出、幾何生成、原生滑桿按鍵與 SVG 下載。
- 真正山巒 JPG 解碼上傳、Worker／Canvas 實際像素、大小／密度／對比／稀疏／三角形切換，以及向量 SVG 與 JSON 還原。
- 真正透明 PNG 解碼、透明背景與 2× PNG 下載，讀回點陣尺寸及 Alpha。

上述測試使用 GitHub Actions 的真實瀏覽器。正式站的 HTML 另以 HTTPS 下載與已測版本逐位元組比對，相同。

## 公開清單與資料隱私

scripts/check-publication.mjs 限定可公開檔案，拒絕未核准檔案與符號連結，並掃描已知憑證格式；只輸出檔名、行號與類別，不輸出可疑內容。現有 MIT LICENSE 與示範圖片授權隨原始碼公開。

work/、node_modules/、dist/、本機環境設定、金鑰、上傳紀錄、設計檔及測試下載不加入 Repository。部署 artifact 僅包含正式建置 dist/。

使用者上傳的圖片與圖案仍在訪客瀏覽器內處理，不上傳 Repository 或轉檔服務。瀏覽器儲存屬於各自網域；舊離線版或 Notion 中的設計，可以原 JSON 匯出／匯入功能轉移。
