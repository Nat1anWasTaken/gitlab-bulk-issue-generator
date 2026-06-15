# GitLab 批量開卡工具

這是一個用來批量產生 GitLab Issue 開卡連結的前端工具。它會把試算表資料或上傳的 CSV 表格，套用到 Issue 範本中，然後一次產生多個可開啟的 GitLab Issue URL。

## How It Works

1. 選擇一個 GitLab 專案，或在「自訂 URL」輸入 GitLab `/-/issues/new` 開卡網址。
2. 載入資料來源：
   - 使用者開啟頁面時從 Google Sheets 即時載入的表格
   - 或由使用者上傳的 CSV 檔
3. 使用 `{{變數名稱}}` 把表格欄位帶入標題、描述、指派人、標籤與關聯卡片 ID。
4. 系統即時預覽每筆資料產生的 Issue 內容與網址。
5. 勾選要建立的項目，批量以分頁或視窗開啟 GitLab Issue。

## 更新資料

1. 更新試算表資料：
   - 直接修改 [Google Sheets](https://docs.google.com/spreadsheets/d/1eWLXsbmsNugplU9cOrBR2_ptXP_8kHWm1ToZr2iWTkc/edit?usp=sharing)
   - 使用者下次開啟頁面或按下「重新整理」時，瀏覽器會重新載入最新資料
2. 更新專案選單：
   - 直接修改 [專案表 Google Sheets](https://docs.google.com/spreadsheets/d/1wUzja51QdLAJ5e6o0Vl2pLJYNbya8xlhvb3TeV2rXIA/edit?usp=sharing)
   - 專案表會在使用者開啟頁面時即時載入；按下「重新整理」會重新抓取最新專案清單
   - 專案表欄位可使用 `name`、`Name` 或 `專案名稱` 作為顯示名稱，並使用 `issueNewUrl`、`issue_new_url`、`url`、`URL`、`GitLab URL` 或 `開卡 URL` 作為 GitLab 開卡網址
   - 若要更換資料來源，修改 [src/data/sheets.json](/Users/nathan/Developments/gitlab-bulk-issue-generator/src/data/sheets.json) 的 `projects` 設定，推送到 `main` 後由 GitHub Actions 的 [`Deploy GitHub Pages`](./.github/workflows/deploy_pages.yml) 自動部署

## 專案選擇器行為

- 預設會使用上次選擇的專案；若沒有紀錄，會使用專案表中的第一個專案。
- 下拉選單會依目前的 GitLab 開卡 URL 自動對應到專案名稱；如果 URL 不在專案表內，會顯示「其他」。
- 選擇專案會把「自訂 URL」更新為該專案的 GitLab 開卡網址。
- 選擇「其他」不會清空目前 URL，會把焦點移到「自訂 URL」並選取既有內容，方便直接覆蓋。
- 「重新整理」會重新載入專案表，載入時按鈕會停用並顯示載入提示；載入失敗時會在選擇器下方顯示錯誤訊息。
- 「專案表」按鈕會在新分頁開啟目前設定的專案表 Google Sheets。

## 本地開發

```bash
pnpm install
pnpm dev
```

Build for production:

```bash
pnpm build
```

## 授權條款

MIT Licens  詳閱 [LICENSE](/Users/nathan/Developments/gitlab-bulk-issue-generator/LICENSE)
