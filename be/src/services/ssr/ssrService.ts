import puppeteer, { Browser } from 'puppeteer';
import logger from '../logger/logger';

let browserInstance: Browser | null = null;

const getBrowser = async (): Promise<Browser> => {
    if (browserInstance && browserInstance.isConnected()) {
        return browserInstance;
    }

    browserInstance = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
        ],
    });

    return browserInstance;
};

const renderPage = async (url: string): Promise<string> => {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000,
        });

        const content = await page.content();

        logger.log({
            service: 'SSR Service',
            message: `Successfully rendered page: ${url}`,
        });

        return content;
    } catch (error) {
        logger.error({
            service: 'SSR Service',
            message: `Failed to render page: ${url}`,
            payload: error,
        });
        throw error;
    } finally {
        await page.close();
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

export { renderPage, closeBrowser };
