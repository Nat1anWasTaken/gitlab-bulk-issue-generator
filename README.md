# GitLab 批量開卡工具

這是一個用來批量產生 GitLab Issue 開卡連結的前端工具。它會把試算表資料或內建 CSV 表格，套用到 Issue 範本中，然後一次產生多個可開啟的 GitLab Issue URL。

## How It Works

1. 選擇一個 GitLab 專案的 `/-/issues/new` 開卡網址。
2. 載入資料來源：
   - 由 Google Sheets 同步到 GitHub repository 的內建 CSV 表格
   - 或由使用者上傳的 CSV 檔
3. 使用 `{{變數名稱}}` 把表格欄位帶入標題、描述、指派人、標籤與關聯卡片 ID。
4. 系統即時預覽每筆資料產生的 Issue 內容與網址。
5. 勾選要建立的項目，批量以分頁或視窗開啟 GitLab Issue。

## 更新資料

1. 更新試算表資料：
   - 到 GitHub Actions 執行 [`Sync Google Sheets`](./.github/workflows/sync_sheets.yml)
   - 該流程會從 [Google Sheets](https://docs.google.com/spreadsheets/d/1eWLXsbmsNugplU9cOrBR2_ptXP_8kHWm1ToZr2iWTkc/edit?usp=sharing) 同步資料
2. 更新專案選單：
   - 修改 [src/data/projects.json](/Users/nathan/Developments/gitlab-bulk-issue-generator/src/data/projects.json)
   - 推送到 `main` 後，GitHub Actions 的 [`Deploy GitHub Pages`](./.github/workflows/deploy_pages.yml) 會自動幫你部署

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
