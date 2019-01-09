function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

class PagesService {

    constructor(browser) {
        this.browser = browser;
    }

    async getPage(url) {
        const page = await this.browser.newPage();
        await page.goto(url);
        const html = await page.evaluate(() => document.body.innerHTML);
        await page.close();
        return {html: html}
    }

    async getInfinitePage(url) {
        const page = await this.browser.newPage();
        await page.goto(url);
        const bodyHandle = await page.$('body');
        const {height} = await bodyHandle.boundingBox();
        await bodyHandle.dispose();
        const viewportHeight = page.viewport().height;
        let currentScrollHeight = 0;
        do {
            currentScrollHeight += viewportHeight;
            await page.evaluate(currentScrollHeight => {
                window.scrollBy(0, currentScrollHeight);
            }, currentScrollHeight);
            await wait(500);
        } while (currentScrollHeight < height);
        const html = await page.evaluate(() => document.body.innerHTML);
        await page.close();
        return {html: html}
    }
}

module.exports = PagesService;
