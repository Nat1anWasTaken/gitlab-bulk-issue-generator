import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cleanFilename(name) {
  // Keep alphanumeric, hyphens, underscores
  let cleaned = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
  // Remove consecutive underscores
  cleaned = cleaned.replace(/_+/g, '_');
  return cleaned.replace(/^_+|_+$/g, '');
}

async function downloadSheets() {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  if (!spreadsheetId) {
    throw new Error("Missing SPREADSHEET_ID environment variable");
  }
  if (!apiKey) {
    throw new Error("Missing GOOGLE_SHEETS_API_KEY environment variable");
  }

  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;

  console.log(`Fetching spreadsheet metadata from Google Sheets API...`);
  const res = await fetch(metaUrl);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch spreadsheet metadata: ${res.statusText}. Details: ${errorText}`);
  }

  const data = await res.json();
  const sheets = data.sheets || [];

  if (sheets.length === 0) {
    console.error("No sheets found in the spreadsheet.");
    return;
  }

  console.log(`Found ${sheets.length} sheets:`);
  const finalSheets = sheets.map(s => ({
    name: s.properties.title,
    gid: s.properties.sheetId
  }));

  for (const sheet of finalSheets) {
    console.log(`- ${sheet.name} (GID: ${sheet.gid})`);
  }

  const targetDir = path.join(__dirname, '..', 'src', 'data', 'tables');
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(targetDir)) {
    if (entry.endsWith('.csv')) {
      fs.unlinkSync(path.join(targetDir, entry));
    }
  }
  console.log(`Saving sheets to ${targetDir}...`);

  for (const sheet of finalSheets) {
    const safeName = cleanFilename(sheet.name);
    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheet.gid}`;
    const targetFile = path.join(targetDir, `${safeName}.csv`);

    console.log(`Downloading sheet '${sheet.name}' from ${exportUrl}...`);
    try {
      const resCsv = await fetch(exportUrl);
      if (!resCsv.ok) {
        throw new Error(`Failed to download CSV: ${resCsv.statusText}`);
      }
      const csvContent = await resCsv.text();
      fs.writeFileSync(targetFile, csvContent, 'utf-8');
      console.log(`Saved to ${targetFile}`);
    } catch (e) {
      console.error(`Error downloading sheet '${sheet.name}':`, e);
    }
  }
}

downloadSheets().catch(console.error);
