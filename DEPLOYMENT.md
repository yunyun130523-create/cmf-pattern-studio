# GitHub Pages 部署

正式網站：https://yunyun130523-create.github.io/cmf-pattern-studio/

公開 Repository：https://github.com/yunyun130523-create/cmf-pattern-studio

首次成功的驗收與發布：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/42966047757

## 圖案設計由 A 漸變到 B（已發布）

版本 2.0.0-alpha.34：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44708141041

- 原始碼提交：0c3b32fcf5ccb4fddc6517abca38c52c6052ed45。
- 384 項測試、66 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 圖案設計移除 A+B 相加開關與聯集說明，顯示起始 A→結束 B 漸變箭頭。選擇 B 或加入 B 圖案時啟用形狀過渡，並由既有輪廓相容性檢查判定是否可插值。
- 一般圖案及圖片點陣可在 uniform 固定尺寸下獨立啟用形狀漸變；仍保留選取無漸變卡片時的原有重設行為。固定尺寸下的自訂形狀方向控制點也能操作。
- 舊相加設計從瀏覽器或 JSON 載入圖案模式時轉為 combine=false、可相容時 morph=true；保留 A、B、比例與尺寸。電腦車縫的獨立合併設定及已開啟車縫的舊設計不轉換；進入圖案設計時才套用新的 A→B 邏輯。
- 驗證固定尺寸下的一般／圖片實際輪廓變形、舊專案載入、A／B 比例獨立及 JSON 還原。原生瀏覽器確認 A→B 匯出及固定尺寸恢復，同時回歸車縫 A+B 合併與 PNG／SVG／JSON。桌面視覺檢查顯示菱形逐步變成圓形。
- 正式站 HTTP 200，4,469,381 bytes，與本機已測建置逐位元組一致；SHA256：26043c2bdce449916a301a51f564ae2d918c9b0778414338e9e6890ffa9a9a07。

## 預覽資源穩定性、錯誤恢復與圖片 A／B 變形（已發布）

版本 2.0.0-alpha.33：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44704743475

- 原始碼提交：1be0ba03bbe098698c8a6ee979a7a4f5e4fedc13。
- 380 項測試、66 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 修正影像替換時先 close 舊 ImageBitmap、React 尚未提交新影像的時序風險；改為提交後釋放舊／略過的影像，卸載時釋放所有影像，忽略並釋放已卸載 Worker 的延遲回覆。
- Canvas 重用暫存表面，完成後才替換預覽；失效的 GPU bitmap 回退至 packed 向量，失敗保留上一版。支援 contextlost／contextrestored 提示及重畫，背景提交失敗會清除忙碌狀態並顯示錯誤。
- React 根節點新增 RecoveryBoundary，渲染例外顯示下載既有 JSON 備份與恢復已存設計的入口；不清除瀏覽器資料。只在本機 sessionStorage 記錄錯誤名稱、訊息與時間。
- 圖片水平／垂直變形改以實際取樣後可見點陣的邊界為 A／B 錨點；中央小圖不再只取全畫布中段的形狀。自訂方向保留畫布座標，沿用共用形狀過渡曲線與起終比例，尺寸明暗計算獨立。
- 測試覆蓋提交前不釋放、略過與卸載後資源釋放、失效影像回退、繪圖錯誤保留畫面、例外後備份及恢復、水平／垂直完整端點、自訂方向與 SVG／JSON 一致。
- 原生瀏覽器用中央小 PNG 啟用 A／B 變形並調整 B 旋轉，確認 SVG 改變；連續調整 36 次、模擬 GPU bitmap drawImage 失敗、三次關閉／重啟圖片模式後仍可操作且沒有 pageerror／crash。這是瀏覽器與手機尺寸模擬，並非重現使用者實體裝置的所有崩潰；尚不能確認使用者所有白頁／分頁崩潰皆由同一原因造成。
- 正式站 HTTP 200，4,469,469 bytes，與本機已測建置逐位元組一致；SHA256：3170939722a5a0d24adfaf4ef2c494f486c2128f0e9f5a00f1f2e25257827a39。

## 圖片模式漸變按鈕實際生效（已發布）

版本 2.0.0-alpha.32：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44699411929

- 原始碼提交：1ffe7117b7c2e6c3d3976ae1aec03b9187aea63b。
- 374 項測試、63 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 原因：圖片運算只在 halftone.layout=gradient 時套用漸變場，上方卡片原本只更新 mode；預設 stagger 等排列會忽略場，造成選取變色但圖案不變。
- 修正共享模式切換：啟用中的圖片點陣會同步切入漸變排列；規則模式清除圖片殘留的位置、旋轉與尺寸隨機。保留來源、裁切、點尺寸、間距與其他圖片參數，一般幾何及車縫不更動未使用的圖片設定。
- 回歸五種模式及重複切換的實際輪廓、無漸變等尺寸、隨機還原、SVG／JSON 一致。原生上傳後在三種瀏覽器逐一切換六次，直接比對 Canvas 像素變化，並核對 JSON 模式及來源 ID。
- 正式站 HTTP 200，4,464,803 bytes，與本機已測建置逐位元組一致；SHA256：50acd8632ab5314e0087c72960c69ca91190fbb05af50f4769aa36a0612ed387。

## 漸變與圖片入口並列、移除三項明暗滑桿（已發布）

版本 2.0.0-alpha.31：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44696749009

- 移除滑桿提交：2a889fead4e5d440be6b15453bcabfe19781a1f7；同區並列提交：465d024af4beb9d8d4ac43daea5c34af4f7c5839。
- 370 項測試、63 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 五種漸變模式與圖片轉點陣入口在同一個兩欄區域並列。保留圖片上傳區後立即銜接 A／B 幾何形狀，收合後也只有一組形狀控制。
- 移除圖片亮度、圖片對比、Gamma 三個 UI 滑桿；不改引擎與舊 JSON 明暗參數。既有圖片專案可還原，新上傳使用原本預設值。
- 既有 UI 與原生檔案上傳驗收檢查三個控制不存在、入口位於同一模式區、圖片／形狀順序正確，並驗證密度調整、SVG 及 JSON 還原。
- 正式站 HTTP 200，4,464,633 bytes，與本機已測建置逐位元組一致；SHA256：b2ae9f180ae29972cb1c25dce23eeb47a68c05ff926abe900be73f32bc5077f0。

## 圖案設計操作順序調整（已發布）

版本 2.0.0-alpha.29：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44690808184

- 原始碼提交：3892c5c3c64ef8860ba99af34b4c958e182a3fcc。
- 正式流程 370 項測試、63 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 圖片入口移為圖案來源，圖片上傳區後立即接 A／B 幾何形狀及比例旋轉；再依序排列、點陣尺寸與明暗、來源預覽及裁切、色彩、漸變。一般幾何模式同樣先選形狀與網格尺寸再設漸變。
- 共用單一形狀控制，圖片設定收合後仍可調整形狀，展開沿用既有選擇；不改引擎或 JSON 格式。驗證原生上傳、顯示順序、收合／展開、形狀同步及 JSON 還原，桌面與手機尺寸無水平溢出。
- 本機首次同時執行建置與驗收時曾出現頁面載入失敗及一項 5 秒測試超時；建置完成、獨立重跑後全部通過，未調寬測試時限。正式流程沒有失敗或重試。
- 正式站 HTTP 200，4,465,169 bytes，與本機已測建置逐位元組一致；SHA256：592f974b3735a99c7da7d134c6449cd20bbfe609acefa8944a92b63d312c1344。

## 圖片轉點陣入口整合（已發布）

版本 2.0.0-alpha.28：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44672360722

- 原始碼提交：ab9b1f9f5f0461a56f4925981c3d14274e46a750。
- 369 項測試、63 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 圖案設計的漸變模式區新增圖片轉點陣上傳按鍵，直接開啟原生檔案選擇器。主導覽移除圖片分頁，四個分頁保持並排。
- 圖片設定在同頁展開，可收合、重開及更換來源；保留預覽、裁切、明暗、排列、顏色及匯出。舊圖片 JSON 自動開啟圖案設計及圖片設定；取消或解碼失敗保留原設計。
- 實際瀏覽器經由 filechooser 上傳 JPG／PNG，驗證收合後仍保留預覽、重開設定、修改及 JSON 還原。桌面與手機尺寸沒有水平溢出。
- 正式站 HTTP 200，4,464,586 bytes，與本機已測建置逐位元組一致；SHA256：b38a1465c5ac5bac2978fac2997653e4fcd03eb9ee3532a70b001aadd227bc4d。

## 圖片點陣隨機排列還原修正（已發布）

版本 2.0.0-alpha.27：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44664642169

- 原始碼提交：1c32bddcddf29274ab0005b33d94435bda3e4b21。
- 368 項測試、63 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 原因：選取 random 時會將 jitter 設成 100，但選回規則排列只改 layout，未清除隨機轉換。統一排列切換規則，matrix／stagger／hex／gradient 同時清除 jitter、randomRotation、randomSize。
- 舊專案中已殘留隨機值的規則排列會顯示「恢復規則排列」，可直接修復目前選項。維持圖片、其他參數與 JSON 相容，手動隨機滑桿仍可操作。
- 四種規則模式的原始幾何、SVG 與 JSON 有精確回歸；實際瀏覽器 JPG 上傳後切換、手動擾動、一鍵還原、匯出及重新匯入皆通過。
- 正式站 HTTP 200，4,462,992 bytes，與本機已測建置逐位元組一致；SHA256：c8a0bf76a94d199e45a3d0b35d27758d83446fa7169aeb49f09d7b5108346373。

## 水平／垂直中心間距下限 0 mm（已發布）

版本 2.0.0-alpha.26：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44652062998

- 原始碼提交：28452b6bf15e42fb1e234213709b51e84b2dae09。
- 366 項測試、63 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 圖案、車縫孔紋與圖片點陣的中心間距介面及 JSON 驗證皆接受 0。共享網格計算將零軸明確折疊為一列／一行，兩軸零時為單一中心圖案，避免除零與無限迴圈。一般正間距維持原尺度。
- 修正 Morph 零軸計算、零間距輔助網格及極小數字顯示。保留密度運算預算，對極小正數使用穩定計算，不設正數的固定輸入下限。
- 實際瀏覽器驗證獨立調整、單／雙軸 0、開啟網格、SVG／PNG／JSON、重新開啟。其他車縫、圖片、材質及大尺寸功能完整回歸。
- 正式站 HTTP 200，4,462,743 bytes，與本機已測建置逐位元組一致；SHA256：b4e6241b74c64b6d73c85d9c02fd6952d3f779d9ad4134791c1fad3e56ac02c9。

## 無漸變、mm 長度與取消圖案尺寸固定上限（已發布）

版本 2.0.0-alpha.25：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44500855167

- 無漸變提交：d2cd4e970013c6578c0d24398069ce335d744648；mm／尺寸提交：9ea9bbbf0c70bd8db46300bfd9254d3efbf3715c；發布驗證提交：1fe94e34ed9dacd423f916ae4118e60a84ed5853。
- 361 項測試、63 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- uniform 模式固定尺寸、方向與形狀，沿用同一預覽與匯出幾何；原有四種模式仍可切換，JSON 保存新模式。
- 長度介面集中換算 mm，原 JSON 座標不重新縮放。最大／起終／點尺寸取消固定上限，以有限正數驗證、保留最小≤最大關係；直接輸入數值與滑桿共用同一物理長度。
- 實際操作 80 mm 圖案及 100 mm 間距，檢查 SVG mm 外框、JSON、舊設計聚焦離開不改變幾何、儲存重開、漸變車縫、零間距 PNG 及上傳 CAD 匯出。
- 發布環境固定為 Playwright 支援的 Ubuntu 24.04。慢速下載由 /etc/apt/apt-mirrors.txt 的區域來源造成；診斷確認 mirror+file 間接來源後，改為官方 HTTPS URIs。暫時診斷工作流程已刪除，保留完整驗收，安裝成功後正常發布。
- 正式站 HTTP 200，4,460,172 bytes，與本機已測建置逐位元組一致；SHA256：11019604b7781562dbfb877587df1d06e2df4d02531ef8d91a77a80557f8f514。

## 獨立間距與 A／B 圖形旋轉（已發布）

版本 2.0.0-alpha.23：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44474859237

- 間距提交：f8aaae35c9a0ad0ebcb766ff69917f53e3c45be4；旋轉提交：dbae07e30762750565400a6c1bfee3402aef3749；發布驗證提交：3e02d145b5168909a8627f4dfee7fd4967ba6b0b。
- 353 項測試、63 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 開放 CAD 與封閉幾何均使用獨立橫／直向 mm 間距，0 貼齊，負值重疊；舊 spacing 專案保持原排列。實際週期、單軸合併、原線保留、漸變與 JSON 皆有回歸。
- A／B 先依實際寬高縮放再各自旋轉、對齊與相加。上傳線路不補封口，連續帶旋轉後仍延伸，整片旋轉另行保留。角度與間距均更新幾何快取並清除失效區塊選取。
- 桌面／手機實際上傳 CAD，調整 A＝90°、B＝−30°、橫距＝3 mm、直距＝−2 mm，再驗證漸變與 SVG／PNG／JSON。零間距 PNG 仍無內部分隔線，JSON 檢查改為兩個獨立間距欄位，保留全部幾何／像素斷言。存檔斷言等待上限改為 5 秒，以容納 350 ms debounce、圖案庫載入及泡棉計算；正式流程全數通過。
- 正式站 HTTP 200，4,456,296 bytes，與本機已測建置逐位元組一致；SHA256：d997de247a5608c6d6efc647c2cb32d4b8a567c76709f6836a67536dabde9388。

## 開放車縫漸變合成修正（已發布）

版本 2.0.0-alpha.22：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44468767356

- 原始碼提交：0979eabb2c3b0cfcdfaae00d770b546a87221e5a。
- 345 項測試、63 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 原因：開放線路以雙點線段保存，原合成邏輯要求孔紋中心在封閉格內，導致全部被排除。修正為開放線路的整張畫布模式使用整片皮革，每格模式使用旋轉／錯位後的排列單元；獨立於泡棉線段資料，沒有補封口。
- 驗證原線保留、縫邊距離、雙針、方向切換、旋轉／錯位的每格重複，以及實際 DWG 上傳、SVG／PNG／JSON 匯出。封閉格的區域限制保持原行為。
- 正式站 HTTP 200，4,453,444 bytes，與本機已測建置逐位元組一致；SHA256：c9d45648363b08d3dc260e5d37a9abed94bf5b8ef75c2180be3d31f3a1c7910f。

## 開放 CAD 原線車縫與圖示刪除（已發布）

版本 2.0.0-alpha.21：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44465243270

- 原始碼提交：ed6f10926175241c137b775b11bc10d80be78d48。
- 342 項測試、63 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 真正 DWG 開放線段、圓弧與 T 分岔可匯入，不強制封閉。JSON／本機圖案庫保存獨立 stitchPaths，車縫沿原線生成，保留開口，不用填色外框當車縫線。原有封閉圖案保持相容。
- 單一橫／豎線不除以零；L 形沒有斜向封口線。單／雙針、泡棉、SVG／PNG／JSON 與實際 DWG 背景處理器流程均驗證。
- A／B 上傳圖示皆能直接刪除，清除所有失效選取，支援復原及重新開啟後保持刪除。本機完整測試首次有一項既有 UI 流程因 5 秒等待超時，單獨重跑 16 項全部通過；正式 CI 完整 342 項通過，未放寬斷言。
- 正式站 HTTP 200，4,453,078 bytes，與已測建置逐位元組一致；SHA256：fbb755144c63fd9f7da1c333fc8a521a93c0dc315d48921846cb45e4d63e86c4。

## 圖示記憶、直向連續帶與圖片縫線銳利度（已發布）

版本 2.0.0-alpha.20：https://github.com/yunyun130523-create/cmf-pattern-studio/actions/runs/44451563449

- 發布原始碼提交：8f4fa476909cc5129a2bbecb9953a12b480b79e2。使用者明確確認發布後推送 main。
- 337 項測試、60 項桌面 Chromium、Android Chromium 與 iPhone WebKit 驗收全部通過。
- 圖案設計重複長方形整併，保留舊專案幾何；上傳 PNG／JPG／SVG／DWG，預覽後手動記住縮圖，A／B 與電腦車縫共用，本機儲存及 JSON 備份保留。
- 直向連續帶真正接通整欄，正間距也移除帶內端點縫線，保留 mm 尺寸、泡棉及 SVG／PNG／JSON。
- 圖片預設去除像素階梯並保留尖角；已儲存 PNG／JPEG 在車縫生成時先依來源尺寸整理，再做比例與 mm 轉換，不改寫圖案庫，也不整理原生 SVG／DWG。
- 正式站 HTTP 200，3,948,850 bytes，與本機已測建置逐位元組一致；SHA256：a23a5d0c8a0fa70ffccf83926fed152327f0e6326b08ed987c324480c3d0cfa0。

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
