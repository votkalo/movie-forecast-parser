const devices = require('puppeteer/DeviceDescriptors');
const iPhone7 = devices['iPhone 7'];

const searchURL = 'https://www.kinopoisk.ru/index.php?kp_query=';

const searchPageIdentifierSelector = 'span.breadcrumbs__text';
const movieSelector = 'a.movie-snippet';
const titleSelector = 'div.movie-snippet__title';
const originalTitleSelector = 'h3.movie-snippet__original-title';
const yearSelector = 'span.movie-snippet__year';
const genresSelector = 'div.movie-snippet__description';
const countriesSelector = 'div.movie-snippet__countries';
const ratingSelector = 'span.movie-snippet__rating-value';
const sourceURLParameterSelector = 'href';

const prefixImageURL = 'https://st.kp.yandex.net/images/';
const prefixBigImageURL = `${prefixImageURL}film_big/`;
const prefixSmallImageURL = `${prefixImageURL}film_iphone/iphone_`;
const imageExtension = '.jpg';
const postfixSmallImageURL = `?width=120`;

const notRatingIdentifier = /%/;
const searchIdentifier = /Поиск:/;

function createMoviePreview(title, originalTitle, year, genres, countries, kinopoiskRating, kinopoiskMovieId, bigPosterURL, smallPosterURL, sourceURL) {
    return {
        title: title,
        originalTitle: originalTitle,
        year: year,
        genres: genres,
        countries: countries,
        kinopoiskRating: kinopoiskRating,
        kinopoiskMovieId: kinopoiskMovieId,
        bigPosterURL: bigPosterURL,
        smallPosterURL: smallPosterURL,
        sourceURL: sourceURL
    }
}

function createKinopoiskMovieBigPosterURL(kinopoiskMovieId) {
    if (!kinopoiskMovieId) {
        return null;
    }
    return `${prefixBigImageURL}${kinopoiskMovieId}${imageExtension}`;
}

function createKinopoiskMovieSmallPosterURL(kinopoiskMovieId) {
    if (!kinopoiskMovieId) {
        return null;
    }
    return `${prefixSmallImageURL}${kinopoiskMovieId}${imageExtension}${postfixSmallImageURL}`;
}

async function selectElement(element, selector) {
    try {
        return await element.$eval(selector, node => node.innerText)
    } catch (error) {
        return null
    }
}

async function selectElementProperty(element, property) {
    try {
        return await (await element.getProperty(property)).jsonValue()
    } catch (error) {
        return null
    }
}

function parseKinopoiskMovieId(sourceURL) {
    if (!sourceURL) {
        return null;
    }
    return sourceURL.slice(30, -1)
}

function getKinopoiskRatingValue(kinopoiskRating) {
    if (notRatingIdentifier.test(kinopoiskRating)) {
        return null
    }
    return kinopoiskRating
}

class MoviesService {

    constructor(browser) {
        this.browser = browser;
    }

    async searchMovies(searchQuery) {
        const page = await this.browser.newPage();
        await page.emulate(iPhone7);
        await page.goto(searchURL + searchQuery);

        const movies = [];

        if (!searchIdentifier.test(await selectElement(page,searchPageIdentifierSelector))) {
            return movies;
        }

        const elements = await page.$$(movieSelector);

        for (let index = 0; index < elements.length; index++) {
            let kinopoiskRating = getKinopoiskRatingValue(await selectElement(elements[index], ratingSelector));
            const sourceURL = await selectElementProperty(elements[index], sourceURLParameterSelector);
            const kinopoiskMovieId = parseKinopoiskMovieId(sourceURL);
            movies.push(
                createMoviePreview(
                    await selectElement(elements[index], titleSelector),
                    await selectElement(elements[index], originalTitleSelector),
                    await selectElement(elements[index], yearSelector),
                    await selectElement(elements[index], genresSelector),
                    await selectElement(elements[index], countriesSelector),
                    kinopoiskRating,
                    kinopoiskMovieId,
                    createKinopoiskMovieBigPosterURL(kinopoiskMovieId),
                    createKinopoiskMovieSmallPosterURL(kinopoiskMovieId),
                    sourceURL
                )
            );
        }
        await page.close();
        return movies;
    }

}

module.exports = MoviesService;
