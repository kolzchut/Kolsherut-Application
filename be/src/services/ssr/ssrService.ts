import puppeteer, {Browser} from 'puppeteer';
import logger from '../logger/logger';
import blockedAnalyticsDomains from '../../assets/blockAnalytics.json';
import vars from '../../vars';

let browserInstance: Browser | null = null;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getBrowser = async (): Promise<Browser> => {
    if (!browserInstance || !browserInstance.isConnected()) {
        browserInstance = await puppeteer.launch(vars.ssr.puppeteerLaunchOptions as any);

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

const renderPage = async (url: string): Promise<{ html: string; fail: boolean }> => {
    const browser = await getBrowser();
    const page = await browser.newPage();
    let noPage = false;
    await page.setRequestInterception(true);

    page.on('request', (request) => {
        const blockAnalytics = blockedAnalyticsDomains.some(domain => request.url().includes(domain));
        if (blockAnalytics) {
            return request.abort();
        }
        request.continue();
    });

    try {
        await page.setUserAgent(vars.ssr.userAgent);

        page.on('response', async (response) => {
            try {
                const requestUrl = response.url();
                const status = response.status();
                if (status !== 404 || !vars.ssr.routesToBlock.some(route => requestUrl.includes(route))) return;
                logger.error({
                    service: 'SSR Service',
                    message: `no results found on this search page`,
                });
                noPage = true;
            } catch (e) {
            }
        });


        await page.goto(url, vars.ssr.pageGotoOptions as any);

        // await delay(2000);

        const content = await page.content();

        logger.log({
            service: 'SSR Service',
            message: `Successfully rendered page: ${url}`,
        });

        return { html: content, fail: noPage };
    } catch (error) {
        logger.error({
            service: 'SSR Service',
            message: `Failed to render page: ${url}`,
            payload: error,
        });
        throw error;
    } finally {
        await page.close().catch(() => {});
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
