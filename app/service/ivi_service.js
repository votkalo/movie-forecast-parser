const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
const xhttp = new XMLHttpRequest();

const ParseUtil = require('../util/ParseUtil');

const searchURL = 'https://www.ivi.ru/search/?q=';
const movieIdReplacer = '{id}';
const movieDescriptionURL = `https://www.ivi.ru/watch/${movieIdReplacer}/description`;

const movieSelector = '#result-video > ul > li';
const movieIdSelector = 'div > div';
const movieIdParameterSelector = 'data-hru';
const movieTitleSelector = 'a > span.title > span.name';
const movieShieldSelector = 'a > span.title > span.shield';
const movieShieldImageSelector = 'img';
const movieShieldImagePropertySelector = 'src';
const moviePriceInfoSelector = '#js-pay-price';
const movieSubscriptionSelector = 'div.ivi-button-container > a[data-purchase-type="subscription"]';

const movieFreeWatchIdentifier = /shield-free/;
const moviePreOrderIdentifier = /shield-pre-order/;

function fillMovieInfo(movieInfo, isPreOrder = false, price = 0, currency = '', isAllowBySubscription = false) {
    movieInfo['price'] = price;
    movieInfo['currency'] = currency;
    movieInfo['isAllowBySubscription'] = isAllowBySubscription;
    movieInfo['isPreOrder'] = isPreOrder;
    return movieInfo;
}

async function findMovieIdentifier(movieInfo, elements) {
    for (let index = 0; index < elements.length; index++) {
        const title = await ParseUtil.selectElementInnerText(elements[index], movieTitleSelector);
        if (removeAllExceptDigitsLetters(movieInfo.title) !== removeAllExceptDigitsLetters(title)) {
            continue;
        }
        const movieShield = await ParseUtil.selectElement(elements[index], movieShieldSelector);
        if (!movieShield) {
            continue;
        }
        const id = await ParseUtil.selectPropertyFromElement(elements[index], movieIdSelector, movieIdParameterSelector);
        const year = parseMovieYear(getMovieDescription(id));
        if (movieInfo.year.toString() === year.toString()) {
            const imageShieldSrc = await ParseUtil.selectPropertyFromElement(movieShield, movieShieldImageSelector, movieShieldImagePropertySelector);
            return {
                iviMovieId: id,
                isFree: movieFreeWatchIdentifier.test(imageShieldSrc),
                isPreOrder: moviePreOrderIdentifier.test(imageShieldSrc)
            };
        }
    }
    return null;
}

async function prepareMovieInfo(movieInfo, movieIdentifier, page) {
    if (!movieIdentifier) {
        return null
    } else if (movieIdentifier.isFree && movieIdentifier.iviMovieId) {
        return fillMovieInfo(movieInfo);
    } else if (movieIdentifier.isPreOrder && movieIdentifier.iviMovieId) {
        return fillMovieInfo(movieInfo, true);
    } else if (movieIdentifier.iviMovieId) {
        await page.goto(movieDescriptionURL.replace(movieIdReplacer, movieIdentifier.iviMovieId));
        const fullPriceInfo = await ParseUtil.selectElementInnerText(page, moviePriceInfoSelector);
        const isAllowBySubscription = !!(await ParseUtil.selectElementInnerText(page, movieSubscriptionSelector));
        return fillMovieInfo(movieInfo, false, parsePrice(fullPriceInfo), parsePriceCurrency(fullPriceInfo), isAllowBySubscription);
    }
    return null;
}

function getMovieDescription(iviMovieId) {
    xhttp.open('GET', `https://www.ivi.ru/ajax/info/${iviMovieId}?type=json`, false);
    xhttp.send();
    const result = xhttp.responseText;
    xhttp.abort();
    return result;

}

function parseMovieYear(movieDescription) {
    return JSON.parse(movieDescription).video.year;
}

function removeAllExceptDigitsLetters(value) {
    return value.replace(/[\s\\\-'"@#$%^&*()+=<>/`~!?;:.,_]+/g, '').toLowerCase();
}

function parsePriceCurrency(fullPriceInfo) {
    return fullPriceInfo ? fullPriceInfo.replace(/[^a-zA-Z]+/g, '') : '';
}

function parsePrice(fullPriceInfo) {
    return fullPriceInfo ? fullPriceInfo.replace(/[^\d.]+/g, '') : 0;
}

class IviService {

    constructor(browser) {
        this.browser = browser;
    }

    async searchMovie(movieInfo) {
        const page = await this.browser.newPage();
        await page.goto(searchURL + movieInfo.title);
        const elements = await page.$$(movieSelector);
        const movieIdentifier = await findMovieIdentifier(movieInfo, elements);
        movieInfo = await prepareMovieInfo(movieInfo, movieIdentifier, page);
        await page.close();
        return movieInfo;
    }

}

module.exports = IviService;
