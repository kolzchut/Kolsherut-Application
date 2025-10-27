const fs = require("fs");
const path = require("path");

// Input and output directories
const rawDir = path.join(__dirname, "../public/synonyms");
const outputDir = path.join(__dirname, "../src/assets/synonyms");

// Ensure output directory exists
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Read all CSV files from a directory
const readCSVFiles = (dir) =>
    fs.readdirSync(dir).filter(file => file.endsWith(".csv"));

// Parse CSV text into array of objects
const parseCSV = (data) => {
    const rows = data.trim().split("\n");
    const headers = rows[0].split(",");
    return rows.slice(1).map(row => {
        const values = row.split(",");
        const obj = {};
        headers.forEach((header, i) => {
            obj[header.trim()] = values[i]?.trim();
        });
        return obj;
    });
};

// Clean synonyms field
const cleanSynonyms = (s) => {
    if (!s) return s;
    // Remove leading/trailing quotes
    s = s.replace(/^"+|"+$/g, "");
    // Replace double double-quotes inside with single
    s = s.replace(/""/g, '"');
    return s;
};

// Refine parsed data (keep rows with "synonyms" and "id")
const refineData = (parsed) =>
    parsed
        .filter(row => row["synonyms"] && row["id"])
        .map(row => ({
            ...row,
            synonyms: cleanSynonyms(row["synonyms"])
        }));

// Save refined data as JSON
const saveJSON = (data, fileName, outputDir) => {
    const jsonFileName = fileName.replace(/\.csv$/i, ".json");
    const jsonFilePath = path.join(outputDir, jsonFileName);
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), "utf8");
    console.log(`💾 Saved JSON: ${jsonFileName}`);
};

// Main function to process all CSVs
const processAllCSVs = (rawDir, outputDir) => {
    ensureDir(outputDir);
    const files = readCSVFiles(rawDir);
    const allData = [];

    files.forEach(file => {
        const filePath = path.join(rawDir, file);
        const csvText = fs.readFileSync(filePath, "utf8");
        const parsed = parseCSV(csvText);
        const refined = refineData(parsed);

        console.log(`✅ Refined ${file}: ${refined.length} rows`);
        allData.push({ file, data: refined });

        saveJSON(refined, file, outputDir);
    });

    console.log("✅ All files refined and saved!");
    return allData;
};

// Run the script
processAllCSVs(rawDir, outputDir);
