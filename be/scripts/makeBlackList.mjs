import {parseStringPromise} from 'xml2js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configurations = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'configurations.json'), 'utf8')
);


const getUrlsFromSitemap = async()=> {
  try {
    const response = await fetch(configurations.makeBlackList.sitemapUrl);
    const xmlText = await response.text();
    const parsedXml = await parseStringPromise(xmlText);
    return parsedXml.urlset.url.map(urlEntry => urlEntry.loc[0]);

  } catch (error) {
    console.error('Error fetching or parsing sitemap:', error);
    throw error;
  }
}
const sanitizeUrlsToSearch = (urls) => {
    const searches= [];
    for (const url of urls) {
        const splittedUrl = url.split('/')
        const situationIndex = splittedUrl.indexOf('bsf')+ 1;
        const responseIndex = splittedUrl.indexOf('brf') + 1;
        const searchQueryIndex = splittedUrl.indexOf('sq') + 1;
        if (situationIndex > 0 && responseIndex > 0 && searchQueryIndex > 0) {
            const situationId = splittedUrl[situationIndex];
            const searchQuery = splittedUrl[searchQueryIndex];
            const responseId = splittedUrl[responseIndex];
            searches.push({situationId, responseId, searchQuery});
        }
    }
    return searches
}

const retrieveEmptyResults = async (searches)=>{
    const emptyResults = [];
    let counter = 0;
    for (const search of searches) {
        const response = await fetch(configurations.makeBlackList.searchUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(search),
        });
        counter += 1;
        const {data} = await response.json();
        if (!data || data.length === 0 || (Array.isArray(data) && data.length === 0)) {
            emptyResults.push(search);
        }
        if (counter % 1000 === 0) {
            console.log(`Processed ${counter} searches...`);
        }
    }
    return emptyResults;
}

const buildBlackList = (emptyResults) => {
    const blackList = {};
    for (const emptyResult of emptyResults){
        const responseId = emptyResult.responseId;
        if (!blackList[responseId]) blackList[responseId] = [];
        blackList[responseId].push(emptyResult.situationId);
    }
    return blackList;

}
const saveBlackListToJSON = (blackList) => {
    const jsonContent = JSON.stringify(blackList, null, 2);
    fs.writeFileSync(configurations.makeBlackList.outputFile, jsonContent, 'utf8');
    console.log(`Black list saved to ${configurations.makeBlackList.outputFilePath}`);
}


const urls = await getUrlsFromSitemap()
const searches = sanitizeUrlsToSearch(urls)
const emptyResults = await retrieveEmptyResults(searches)
const blackList = buildBlackList(emptyResults);
saveBlackListToJSON(blackList);
