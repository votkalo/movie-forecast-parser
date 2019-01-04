const puppeteer = require('puppeteer');

function wait(ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
}

class PagesService {

    async getPage(url) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url, {waitUntil: 'load'});
        const html = await page.evaluate(() => document.body.innerHTML);
        await browser.close();
        return {html: html}
    }

    async getInfinitePage(url) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url, {waitUntil: 'load'});
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
        await browser.close();
        return {html: html}
    }
}

module.exports = PagesService;
