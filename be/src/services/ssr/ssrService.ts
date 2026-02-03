import puppeteer, {Browser} from 'puppeteer';
import logger from '../logger/logger';
import blockedAnalyticsDomains from '../../assets/blockAnalytics.json';

let browserInstance: Browser | null = null;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getBrowser = async (): Promise<Browser> => {
    if (!browserInstance || !browserInstance.isConnected()) {
        browserInstance = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        });

        browserInstance.on('disconnected', () => {
            browserInstance = null;
            logger.log({
                service: 'SSR Service',
                message: 'Browser disconnected',
            });
        });
    }

    return browserInstance;
};

const renderPage = async (url: string): Promise<{html: string, fail:boolean}>  => {
    const browser = await getBrowser();
    const page = await browser.newPage();
    let noPage = false;
    await page.setRequestInterception(true);

    page.on('request', (request) => {
        const blockAnalytics = blockedAnalyticsDomains.some(domain => request.url().includes(domain));
        if(blockAnalytics) return request.abort();
        request.continue();
    })

    try {
        await page.setUserAgent(
            'KolSherutBot/1.0'
        );

        page.on('response', async (response) => {
            const requestUrl = response.url();
            const status = response.status();
            if (status !== 404 || !requestUrl.includes('/search')) return;
            logger.error({
                service: 'SSR Service',
                message: `no results found on this search page`,
            });
            noPage = true;

        });


        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 40000,
        });

        // await delay(2000);

        const content = await page.content();

        logger.log({
            service: 'SSR Service',
            message: `Successfully rendered page: ${url}`,
        });
        return {html:content, fail: noPage};
    } catch (error) {
        logger.error({
            service: 'SSR Service',
            message: `Failed to render page: ${url}`,
            payload: error,
        });
        throw error;
    } finally {
        await page.close().catch(() => {
        });
    }
};

const closeBrowser = async (): Promise<void> => {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
        logger.log({
            service: 'SSR Service',
            message: 'Browser instance closed',
        });
    }
};

export {renderPage, closeBrowser};
