const puppeteer = require('puppeteer');

function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

class PagesService {

    async getPage(link) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(link, {waitUntil: 'load'});
        const html = await page.evaluate(() => document.body.innerHTML);
        return {html: html}
    }

    async getInfinitePage(link) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(link, {waitUntil: 'load'});
        const bodyHandle = await page.$('body');
        const {height} = await bodyHandle.boundingBox();
        await bodyHandle.dispose();
        const viewportHeight = page.viewport().height;
        let viewportIncr = 0;
        while (viewportIncr + viewportHeight < height) {
            await page.evaluate(_viewportHeight => {
                window.scrollBy(0, _viewportHeight);
            }, viewportHeight);
            await wait(500);
            viewportIncr = viewportIncr + viewportHeight;
        }
        const html = await page.evaluate(() => document.body.innerHTML);
        return {html: html}
    }
}

module.exports = PagesService;
