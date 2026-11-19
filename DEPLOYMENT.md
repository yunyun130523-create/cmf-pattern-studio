# GitHub Pages 部署

正式網站：https://yunyun130523-create.github.io/cmf-pattern-studio/

公開 Repository：https://github.com/yunyun130523-create/cmf-pattern-studio

首次成功的驗收與發布：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/42966047757

## 整片泡棉壓縫的最新驗證

版本 2.0.0-alpha.19：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44437093114

- 功能提交：c3f09451bfcddb2fa6698c2e90bbf3d174a3ce05；驗證提交：fe0e9edc04b57a164ea66a9785805d230539d42f。
- 326 項測試、54 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 以整片泡棉距離／恢復高度取代局部輪廓 Alpha 膨起。縫線壓低，圖案內外、窄接帶與間隙都隆起，保留幾何、mm 尺寸、雙針兩色、細皮紋與 JSON 相容性。
- 原生 PNG 驗收分別量測圖案內部、窄帶與圖案外間隙，三者明暗跨度均顯著高於平面。SVG 使用簡化的封閉向量等高面，不嵌入圖片，預覽與匯出一致。
- 高度幾何快取及資料量上限避免過量等高線；多次重建的複合 UI 流程設定 15 秒等待上限，保留全部功能斷言。首輪流程 5 秒超時後，修正等待設定並完整重跑通過。
- 正式站 HTTP 200，3,943,771 bytes，與已測建置逐位元組一致；SHA256：f355bb37153a6a34b545ec8517e9afba87fffa97c853cbe668d226cbdab1fc75。
- 實際渲染預覽：https://yunyun130523-create.github.io/cmf-pattern-studio/foam-relief-preview.png 。310,724 bytes，HTTP 200，與提交圖檔一致；SHA256：c3687afe281fb2f4207f2549157b6e854f4b17b69e3bbe45c6de79ced2ffebc2。

## 連接處一起蓬鬆的歷史驗證

版本 2.0.0-alpha.18：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44429648960

- 原始碼提交：d2000a91eed7a2446c8a18144da0e0454462d109。
- 324 項測試、54 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 局部截面高度讓窄接帶與中央寬區都形成弧面，涵蓋連續帶及長條合併輪廓。旋轉光源、細皮紋、縫線與尺寸保持原設定；蓬鬆 0 可回到平面。
- 原生 PNG 像素驗收確認窄帶與寬區的明暗跨度都明顯高於平面；SVG 保留漸層／剪裁與向量幾何，不嵌入圖片；JSON 還原保留相同蓬鬆效果。
- 正式站 HTTP 200，3,941,780 bytes，與已測建置逐位元組一致；SHA256：900c02c88a9c8c26531963ab5e2ea4f636d6528c40028636993a4f84de575a67。

## 車縫連續帶與 mm 尺寸的歷史驗證

版本 2.0.0-alpha.17：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44270123066 （第二次執行）

- 原始碼提交：e0240d5c9e023bf040c24775e0919b0570b0c412；主功能提交：4b1a5c6e46c15ad62af8a6ccbf17732d4541dab7。
- 321 項測試、51 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 驗證菱形＋橫向連續帶真正接通整列，正間距下也沒有帶內垂直端點縫線；橫、豎長方形使用實際 mm 寬高，合併不壓回 A 的外框。
- SVG 外框使用 mm、PNG 匯出正常、JSON 保存連續帶及 mm 尺寸／位移並還原；舊百分比專案換算後維持幾何尺寸。切換輪廓會結束區塊選取。
- 初次執行在 Ubuntu 瀏覽器依賴套件下載階段長時間等待，取消後重跑，第二次安裝、完整驗收及部署全部成功。
- 正式站 HTTP 200，3,938,476 bytes，與已測建置逐位元組一致；SHA256：dda00ba9fb939a4cf69663e428f2635326277f6494ac604c3ad3be2a6874e5ca。

## 車縫並列形狀與操作流程的歷史驗證

版本 2.0.0-alpha.16：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44265725667

- 原始碼提交：5be215390a9f3ed3c1484e252c5f23dc8ac61425。
- 316 項測試、48 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 驗證車縫 A／B 左右並列、手機整頁不溢出、B 可先調再合併、置中重設保留尺寸、B 自訂 SVG 上傳不覆蓋 A 與原 Pattern。
- SVG／PNG 匯出、JSON 還原、雙針、蓬鬆、Gradient Pattern、相鄰區塊及零間距自動合併回歸全部通過。沿用原有聯集幾何與尺寸參數，沒有新增必填 JSON 欄位。
- 正式站 HTTP 200，3,935,344 bytes，與已測建置逐位元組一致；SHA256：f9f8fc9c027dd1c2dfc26e7de13123cabd588a805bd2bc63e7f907fe1b9daff9。

## 並列相加圖形與橫／豎的歷史驗證

版本 2.0.0-alpha.15：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44262860516

- 原始碼提交：44d5d5b19e4bea4f8c9dc1838151172c15e4ad43。
- 314 項測試、45 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 驗證 A／B 卡片左右並列、整頁不溢出、橫加豎真正聯集、兩端比例獨立、SVG／PNG 匯出及 JSON 還原；B 新增自訂 SVG 不覆蓋 A。
- 保留舊六種輪廓及 Morph 的取樣；直向圖形先對齊輪廓對應後插值，回歸測試確認所有形狀組合沒有自交。
- 正式站 HTTP 200，3,931,637 bytes，與已測建置逐位元組一致；SHA256：aa963ce1dabbd439d3b728fe230a37b8ab2d79f283f0e77a81d909d1dcab243a。

## 零間距自動合併的歷史驗證

版本 2.0.0-alpha.14：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/43395778574

- 297 項測試、42 項桌面／手機尺寸 Chromium 與 WebKit 驗收全部通過。
- 驗證零間距方格為單一分區，畫布內沒有分隔線段；六角加長方形也會合併，孔洞與分離輪廓保留。
- 實際 PNG 驗收確認零間距沒有內部紅色車縫線，正間距恢復獨立分區，JSON 匯入還原自動合併。
- 正式站 HTTP 200，HTML 與已測建置逐位元組一致；SHA256：58955a14bea38d800688fba7f05c768616c770595d7ab68a57d0ac046d6b59ae。

## 分區合併與雷射材質的歷史驗證

版本 2.0.0-alpha.13：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/43389312175

- 292 項測試、39 項桌面／手機尺寸 Chromium 與 WebKit 驗收全部通過。
- 真正點選相接區塊並確認合併後分區數減少、內部縫線移除；雙針兩色有實際路徑與 SVG 色彩。
- 車縫面板的不規則切回水平已驗證，隨機欄位歸零；藍色控制點可直接操作，JSON 保存合併及兩色。
- 三種雷射材質有真實 Canvas 像素，方向會改變圖案，高度 PNG 與 JSON 還原通過。
- 正式站 HTTP 200，HTML 與已測建置逐位元組一致；SHA256：058790ce98b0fec8be7411f08df3dcd44ff7a16c3cb0acb8b2e1e870a995094e。

## 整潔車縫與圓角版本的歷史驗證

版本 2.0.0-alpha.12：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/43380105672

- 283 項測試、33 項桌面／手機尺寸 Chromium 與 WebKit 驗收全部通過。
- 驗證共線去重、X 接點聯集、不自交雙針輪廓、針距、幾何圓角與高蓬鬆值還原。
- 真正下載比較 100% 與 300% 蓬鬆 PNG，確認像素改變；UI 區塊移除、頂部 JSON、SVG／PNG／JSON 及分頁切換均通過。
- 正式站 HTTP 200，HTML 與已測建置逐位元組一致；SHA256：b0fb716d491cc644cde91a1ad1f04ce467b92f4977b22a19ee7de71321a52cc0。

## 蓬鬆細皮紋與形狀聯集的歷史驗證

版本 2.0.0-alpha.11：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/43374619792

- 278 項測試、30 項桌面／手機尺寸 Chromium 與 WebKit 驗收全部通過。
- 驗證真布林聯集、移除內部邊線、水平／垂直前後對齊、分離輪廓、合併後 Pattern 避縫及 JSON 還原。
- 真正下載平面與蓬鬆細皮紋 PNG，比對確認渲染像素改變；SVG 保留外輪廓與程序材質 filter／pattern，未以原始圖片取代向量。
- 正式站 HTTP 200，HTML 與已測建置逐位元組一致；SHA256：d64b38c4f4929f2e73fc94e62d7bd18fd36631806d6111769e5b5224f0f4f2c5。

## Gradient Pattern 車縫合成的歷史驗證

版本 2.0.0-alpha.10：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/43371389607

- 272 項測試、27 項桌面／手機尺寸 Chromium 與 WebKit 驗收全部通過。
- 獨立分頁順序、帶入 Gradient Pattern、避縫留白、每格重複、回圖案分頁即時同步，以及合成 SVG／PNG／JSON 已驗收。
- 正式站 HTTP 200，HTML 與已測建置逐位元組一致；SHA256：da3964637a1c7e53d3eee2c2458ea161aaaa511ee71b5b1f996bef2fbfad33cd。

## 車縫圖案庫與雙針版本的歷史驗證

版本 2.0.0-alpha.9：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/43362810251

- 268 項測試、24 項桌面／手機尺寸 Chromium 與 WebKit 驗收全部通過。
- 驗證六種輪廓、雙針連續封閉針跡及線距、自訂凹形／孔洞、Seed 重現、SVG 真正向量與 JSON 還原。
- 原車縫 PNG／SVG／JSON 及原 Pattern 驗收持續通過。
- 正式站 HTTP 200，HTML 與已測建置逐位元組一致；SHA256：13297f8bb8a871e3f49f6284cf250c0c4205b4455f9b1819bb1d5a549c058190。

## 車縫試用版本的歷史驗證

版本 2.0.0-alpha.8：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/43361001019

- 258 項測試、21 項桌面／手機尺寸 Chromium 與 WebKit 驗收全部通過。
- 車縫共邊去重、參數與雙排線、原 Pattern 恢復、SVG／PNG 真正下載、JSON 還原已驗證。
- 原圖片點陣測試改為等候 Canvas 實際繪圖，避免在 Worker 回傳但尚未繪圖時檢查。
- 正式站 HTTP 200，HTML 與已測建置逐位元組一致；SHA256：dc053c2b1e871c2fa1a70db57056ab7aa89aa7bd3176e5ec2cd118d55f9ad165。

## 漸變範圍版本的歷史驗證

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
