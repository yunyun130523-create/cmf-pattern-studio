# GitHub Pages 部署

正式網站：https://yunyun130523-create.github.io/cmf-pattern-studio/

公開 Repository：https://github.com/yunyun130523-create/cmf-pattern-studio

首次成功的驗收與發布：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/42966047757

## 漸變範圍版本的最新驗證

版本 2.0.0-alpha.7：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/43190722442

- 252 項測試、18 項桌面／手機尺寸 Chromium 與 WebKit 驗收全部通過。
- PNG 與 SVG 範圍上傳、實際輪廓漸變、向量 SVG 輸出與 JSON 幾何還原通過。
- 本機驗證包含透明孔洞、反轉、移動、縮放、閾值、圖片點陣與邊界容納。
- 正式站 HTTP 200，HTML 與已測建置逐位元組一致；SHA256：aada328fc6fc62a7c96e0e796fa6288f13f4e7df448c23d189f53f779c418136。

## Pattern 紋理版本的歷史驗證

版本 2.0.0-alpha.6：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/43141475925

- 246 項測試、15 項桌面 Chromium／手機尺寸 Chromium 與 WebKit 驗收全部通過。
- 高光平面與髮絲方向性高度、獨立 Pattern 紋理、專用圖片上傳、四種貼圖及 JSON 還原驗證通過。
- 正式網站 HTTP 200，HTML 與本機已測建置逐位元組一致，SHA256：a08d4ecdeaf81dd3d808299d55e3672d553bf1484c38e476203bc0d569300bfe。

## 咬花材質版本的歷史驗證

版本 2.0.0-alpha.5：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/43138420598

- 已取得推送與部署確認，完成咬花功能發布。
- 242 項測試與 15 項桌面／手機尺寸瀏覽器驗收全部通過。
- 咬花像素、參數、Pattern 凹刻、高度／法線／粗糙度 PNG 與 JSON 還原通過。
- 正式網站 HTTP 200，HTML 與本機建置逐位元組一致，SHA256：df93b52ee9fce6ea04155641fd7821e1589f36d08914d9890ad77deacfbca1a3。
- 保留原圖案演算法，咬花以獨立 Worker 產生材質與資料貼圖。

## 圖形比例版本的歷史驗證

版本 2.0.0-alpha.4：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/42981477694

- 已取得本次推送與部署確認，完成圖形比例功能發布。
- 221 項測試與 12 項桌面／手機尺寸瀏覽器驗收全部通過。
- SVG／PNG／JSON 比例保留與不同 Morph 端點驗收通過。
- 正式 HTTPS 網址回應 HTTP 200，HTML 與本機建置完全一致，SHA256 為 0fa0f1c59e772c02e43d59e6bef706fbaeae4b707d34a661a6951b3c676dd1b7。
- 圖片亮度取樣、漸變場及排列演算法保留；新增比例在共用形狀輪廓處套用。

## 首次上線的歷史結果

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
