# AI CMF Pattern Studio

汽車內裝 CMF 團隊使用的本機參數化紋理工作台。React 19 + TypeScript + Vite，無後端、無登入、無付費 API。

## GitHub Pages 自動部署

現有網站可由 GitHub Pages 免費託管。.github/workflows/pages.yml 已準備 main 更新後的檢查、建置、桌面／手機瀏覽器驗收與自動發布。首次公開與發布需由專案擁有者確認；目前預定位置及完整狀態見 DEPLOYMENT.md。

## 直接使用

用最新版 Chrome 或 Edge 開啟交付檔 `AI-CMF-Pattern-Studio.html`。網站的 JavaScript、樣式、圖示與 DWG 背景處理器都已內嵌，不需安裝 Node.js，也不需連網。

ZIP 中另有 `AI-CMF-Pattern-Studio.html`，可解壓後開啟。請勿在文字編輯器內預覽 HTML；請使用瀏覽器。

## 圖片轉點陣 · 2.0.0-alpha.3

左側新增「圖片轉點陣」：可上傳 JPG／PNG／DWG 或載入山巒 JPG 範例，調整圖片裁切、位置、明暗與幾何點陣。完整保留／稀疏模式、五種排列、自訂 SVG、HEX／RGB、透明背景、Canvas／Worker 預覽與真正向量 SVG 匯出。JSON v4 保存可重現結果所需的取樣與設定。詳見 IMAGE-HALFTONE.md 的操作、CAD 限制與測試範圍。

## 自訂圖案更新 · 2.0.0-alpha.2

形狀列新增「＋」：SVG 安全向量解析、PNG 透明／黑白輪廓向量化、真正 DWG 本機解析；具備預覽、命名、刪除、IndexedDB 圖案庫、自訂寬高及原有參數化排列。單一凸封閉輪廓可與內建或另一個自訂圖案連續變形，多輪廓／孔洞／凹形會明確限制 Morph。JSON v3 保存所有幾何，仍相容舊版專案。詳見 CUSTOM-SHAPES.md 的格式限制與測試界線。

## v2.0 第一階段 · 2.0.0-alpha.1

已加入水平／垂直／自訂方向變形、起終尺寸與旋轉、位置／旋轉／尺寸／密度隨機控制、規則／隨機混合，以及七種畫布控制點。v1 JSON 可自動遷移。盤點、測試與後續階段見 V2-STAGE1.md。本版尚未實作圖片半色調、完整 Hybrid／橢圓場與其餘 v2 整合項目。

## macOS 淺色介面 v1.0.2

白色控制面板、霧灰工作區、玻璃工具列與 Apple Blue 控制項。僅修改 UI，圖案、材料配色、參數與功能均保留。詳見 LIGHT-UI.md。

## Shape Morphing 修正版 v1.0.1

形狀改為獨立依水平位置，以 96 個對應頂點連續插值，完整保留 0% 起始圖形與 100% 目標圖形。形狀區提供五階段對照及「六角形 → 三角形示範」。原變形程度滑桿改為過渡線性度，避免終點變形不完整。詳細原因及驗證見 SHAPE-MORPHING-FIX.md。

## 第一階段

- macOS 風格淺色繁體中文介面，左側參數、右側 SVG 即時預覽。
- 圓形、三角形、正方形、菱形、六角形、長方形；可連續變形。
- 水平、垂直、中心擴散、不規則漸變；畫布控制點可拖曳，亦可用方向鍵微調。
- 最小／最大尺寸、獨立／連動間距、密度、旋轉、長寬比、錯列排列、位置擾動及漸變曲線。
- 圖案及背景配色、色碼輸入、不透明度、畫布尺寸。
- 隨機探索、Seed 重現、四組 CMF 紋理預設。
- PNG（1×／2×／3×）、SVG、JSON、真正的 DWG R2000、額外的 DXF 匯出。
- JSON 專案匯入與驗證、瀏覽器自動儲存、復原／重做、預覽縮放、網格及全螢幕。

## 操作提示

「色彩與畫布」頁籤提供配色、畫布尺寸與 JSON 專案存取。右上角「匯出 PNG／SVG」會開啟匯出面板；面板中亦有 JSON、DWG、DXF。

圖案密度調整保留的元素比例；中心間距決定網格密度。相同參數與 Seed 會生成相同結果。控制點會影響漸變範圍，中心擴散的起點代表中心、終點代表半徑。文字數值在有效範圍內即時套用，離開欄位時校正超限值。

復原：Ctrl / ⌘ Z。重做：Ctrl / ⌘ Shift Z。控制點：方向鍵移動 1%，Shift + 方向鍵移動 5%。

本機儲存可能因瀏覽器隱私設定、搬移 HTML 或清除瀏覽資料而失效。使用 JSON 匯出備份完整設計。單機版本沒有多人同步。

## CAD 與輸出規格

- DWG 是 AC1015 / AutoCAD R2000 二進位格式，由免費 MIT 授權的 acad-ts 寫入，於 Web Worker 中運算。
- 每個圖案是一條封閉的 96 節點多段線，位於 PATTERN 圖層；畫布邊界在 BOUNDARY 圖層。CAD 不輸出背景、填色或預覽控制點。
- CAD 原點為左下角，保持與預覽相同的視覺方向；可選毫米（96 px = 25.4 mm）或無單位。
- 96 節點輪廓屬幾何近似，不等同原生 CAD 圓弧。請於量產前確認比例、最小孔徑、連橋與加工公差。
- SVG 與 PNG 保留配色及不透明度。PNG 使用瀏覽器的 SVG 點陣化能力；最大片幅 2400 × 1800 px，3× 輸出為 7200 × 5400 px。
- 高密度保護會調整中心間距，使元素數量約不超過 12,000 個，介面會清楚提示。預覽與所有輸出使用同一組幾何，不會偷偷輸出不同版本。
- 圖案可刻意重疊，畫面上的覆蓋率為各圖案面積加總比例，不扣除重疊面積。

## 測試與驗證範圍

TypeScript 檢查與 Vite 正式建置、自動幾何測試、React DOM 互動測試、JSON／SVG／DXF 檔案驗證、DWG 寫入及兩個讀取器的驗證，以及正式 HTML 在模擬 DOM 的啟動測試。

目前執行環境未提供 `cua_repl.js` 瀏覽器控制工具，依 Sites 的受管理預覽規範，未另行啟動替代瀏覽器或伺服器。因此尚未進行真實 Chrome／Edge 視覺驗收；PNG 瀏覽器點陣化、作業系統下載、原生選色器與全螢幕仍需真實瀏覽器確認。互動測試中的 PNG 點陣化與 Web Worker 啟動採用替身；DWG 真實產出另有獨立讀回測試。

## 第二階段擴充

`src/engine.ts` 已定義 `TextPatternProvider` 與 `SolidExportProvider` 介面。AI 文字生成與 STEP / STP 目前未啟用。未串接 API、未要求金鑰、不會將資料傳送至第三方服務。

## 開發者備註

需求：Node.js 20.19+ 或 22.12+。原始碼位於 `source/`（ZIP 內）或目前專案根目錄。

```sh
npm ci
npm run dev
```

Vite 終端機顯示的網址即為本機開發預覽。正式建置及完整測試：

```sh
npm run build
npm test
```

`dist/index.html` 為單檔網站，可直接開啟或置於任意靜態主機。`production.test.ts` 使用正式建置，因此請先執行 build。

## 開源技術

- React / React DOM：MIT
- Vite / TypeScript / vite-plugin-singlefile：MIT
- Lucide：ISC
- acad-ts：MIT（真正的 DWG 寫入）
- LibreDWG Web：GPL-3.0，僅為開發測試的獨立讀取器，不包含在交付網站內。

詳細依賴與鎖定版本見 package.json、package-lock.json。應用本身採 MIT 授權。
