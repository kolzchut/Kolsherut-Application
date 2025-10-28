const fs = require("fs");
const path = require("path");


const NEW_LINE_REGEX = /\n(?=(?:(?:[^"]*"){2})*[^"]*$)/;
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
    const rows = data.trim().split(NEW_LINE_REGEX);
    const headers = rows.shift().split(",");
    return rows.map(row => {
        const values = row.split(",");
        values[2] = values[2].split('\n').map(val=> val.trim().replace('"', ''));
        const obj = {};
        headers.forEach((header, i) => {
            obj[header] = values[i];
        });
        return obj;
    });
};

const refineData = (parsed) =>
    parsed
        .filter(row => row["synonyms"] && row["id"])

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
};

// Run the script
processAllCSVs(rawDir, outputDir);
