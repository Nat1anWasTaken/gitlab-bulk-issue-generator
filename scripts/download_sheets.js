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
  const spreadsheetId = "1eWLXsbmsNugplU9cOrBR2_ptXP_8kHWm1ToZr2iWTkc";
  const editUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  console.log(`Fetching spreadsheet from ${editUrl}...`);
  const res = await fetch(editUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch spreadsheet edit page: ${res.statusText}`);
  }

  const html = await res.text();

  const sheets = [];
  const match = html.match(/bootstrapData\s*=\s*({.+?});/);
  if (match) {
    try {
      const data = JSON.parse(match[1]);
      const changes = data.changes || {};
      const topsnapshot = changes.topsnapshot || [];
      for (const item of topsnapshot) {
        if (Array.isArray(item) && item.length >= 2) {
          const payloadStr = item[1];
          try {
            const payload = JSON.parse(payloadStr);
            if (Array.isArray(payload) && payload.length >= 4) {
              const gid = payload[2];
              const metadata = payload[3];
              if (Array.isArray(metadata) && metadata.length > 0) {
                const metaDict = metadata[0];
                if (metaDict && metaDict["1"]) {
                  const sheetInfo = metaDict["1"];
                  if (Array.isArray(sheetInfo) && sheetInfo.length > 0) {
                    const firstItem = sheetInfo[0];
                    if (Array.isArray(firstItem)) {
                      if (firstItem.length >= 3) {
                        sheets.push({ name: firstItem[2], gid });
                      } else if (firstItem.length >= 2) {
                        sheets.push({ name: firstItem[1], gid });
                      }
                    }
                  }
                }
              }
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (e) {
      console.error("Error parsing bootstrapData JSON:", e);
    }
  }

  // Fallback to regexes if bootstrapData wasn't parsed fully
  if (sheets.length === 0) {
    const pattern = /\[\s*\d+\s*,\s*0\s*,\s*"(\d+)"\s*,\s*\[\s*\{\s*"1"\s*:\s*\[\s*\[\s*0\s*,\s*0\s*,\s*"([^"]+)"/g;
    let regexMatch;
    while ((regexMatch = pattern.exec(html)) !== null) {
      sheets.push({ name: regexMatch[2], gid: regexMatch[1] });
    }

    if (sheets.length === 0) {
      const patternWide = /"(\d+)"\s*,\s*\[\s*\{\s*"1"\s*:\s*\[\s*\[\s*\d+\s*,\s*\d+\s*,\s*"([^"]+)"/g;
      while ((regexMatch = patternWide.exec(html)) !== null) {
        sheets.push({ name: regexMatch[2], gid: regexMatch[1] });
      }
    }
  }

  // De-duplicate
  const seen = new Set();
  const finalSheets = [];
  for (const sheet of sheets) {
    if (!seen.has(sheet.name)) {
      seen.add(sheet.name);
      finalSheets.push(sheet);
    }
  }

  if (finalSheets.length === 0) {
    console.error("No sheets found! Please verify the Google Sheets URL or make sure it's public.");
    return;
  }

  console.log(`Found ${finalSheets.length} sheets:`);
  for (const sheet of finalSheets) {
    console.log(`- ${sheet.name} (GID: ${sheet.gid})`);
  }

  const targetDir = path.join(__dirname, '..', 'src', 'data', 'tables');
  fs.mkdirSync(targetDir, { recursive: true });
  console.log(`Saving sheets to ${targetDir}...`);

  for (const sheet of finalSheets) {
    const safeName = cleanFilename(sheet.name);
    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheet.gid}`;
    const targetFile = path.join(targetDir, `${safeName}.csv`);

    console.log(`Downloading sheet '${sheet.name}' from ${exportUrl}...`);
    try {
      const resCsv = await fetch(exportUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!resCsv.ok) {
        throw new Error(`Failed to download sheet ${sheet.name}: ${resCsv.statusText}`);
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
