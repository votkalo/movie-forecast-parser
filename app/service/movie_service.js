const ParseUtil = require('../util/ParseUtil');

const devices = require('puppeteer/DeviceDescriptors');
const iPhone7 = devices['iPhone 7'];

const searchURL = 'https://www.kinopoisk.ru/index.php?kp_query=';
const movieURL = 'https://www.kinopoisk.ru/film/';

const searchPageIdentifierSelector = 'span.breadcrumbs__text';
const searchMovieSelector = 'a.movie-snippet';
const searchTitleSelector = 'div.movie-snippet__title';
const searchOriginalTitleSelector = 'h3.movie-snippet__original-title';
const searchYearSelector = 'span.movie-snippet__year';
const searchGenresSelector = 'div.movie-snippet__description';
const searchCountriesSelector = 'div.movie-snippet__countries';
const searchRatingSelector = 'span.movie-snippet__rating-value';
const searchSourceURLParameterSelector = 'href';

const movieTitleSelector = 'h1.movie-header__title';
const movieOriginalTitleSelector = 'h2.movie-header__original-title';
const movieYearSelector = 'span.movie-header__years';
const movieGenresSelector = 'p.movie-header__genres';
const movieCountriesSelector = 'p.movie-header__production';
const movieRatingSelector = 'span.movie-rating__value';

const prefixImageURL = 'https://st.kp.yandex.net/images/';
const prefixBigImageURL = `${prefixImageURL}film_big/`;
const prefixSmallImageURL = `${prefixImageURL}film_iphone/iphone_`;
const imageExtension = '.jpg';
const postfixSmallImageURL = `?width=120`;

const notRatingIdentifier = /%/;
const searchIdentifier = /Поиск:/;
const durationIdentifier = /:/;

function createMovie(title, originalTitle, year, genres, countries, kinopoiskRating, kinopoiskMovieId, bigPosterURL, smallPosterURL, sourceURL) {
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

async function parseMoviePreview(element) {
    let kinopoiskRating = getKinopoiskRatingValue(await ParseUtil.selectElementInnerText(element, searchRatingSelector));
    const sourceURL = await ParseUtil.selectElementProperty(element, searchSourceURLParameterSelector);
    const kinopoiskMovieId = parseKinopoiskMovieId(sourceURL);
    return createMovie(
        await ParseUtil.selectElementInnerText(element, searchTitleSelector),
        ParseUtil.notEmptyOrNull(await ParseUtil.selectElementInnerText(element, searchOriginalTitleSelector)),
        ParseUtil.notEmptyOrNull(await ParseUtil.selectElementInnerText(element, searchYearSelector)),
        ParseUtil.notEmptyOrNull(await ParseUtil.selectElementInnerText(element, searchGenresSelector)),
        ParseUtil.notEmptyOrNull(await ParseUtil.selectElementInnerText(element, searchCountriesSelector)),
        ParseUtil.notEmptyOrNull(kinopoiskRating),
        kinopoiskMovieId,
        createKinopoiskMovieBigPosterURL(kinopoiskMovieId),
        createKinopoiskMovieSmallPosterURL(kinopoiskMovieId),
        sourceURL
    )
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

function parseKinopoiskMovieId(sourceURL) {
    if (!sourceURL) {
        return null;
    }
    return sourceURL.replace(/\D+/g, '');
}

function parseKinopoiskMovieCountries(countryDurationLine) {
    if (!countryDurationLine) {
        return null;
    }
    return countryDurationLine.split(', ')
        .filter(string => !durationIdentifier.test(string))
        .join(", ");
}

function getKinopoiskRatingValue(kinopoiskRating) {
    if (notRatingIdentifier.test(kinopoiskRating)) {
        return null
    }
    return kinopoiskRating
}

class MovieService {

    constructor(browser) {
        this.browser = browser;
    }

    async searchMovies(searchQuery) {
        const page = await this.browser.newPage();
        await page.emulate(iPhone7);
        await page.goto(searchURL + searchQuery);
        if (!searchIdentifier.test(await ParseUtil.selectElementInnerText(page, searchPageIdentifierSelector))) {
            return [];
        }
        const elements = await page.$$(searchMovieSelector);
        const elementsPromises = elements.map(element => parseMoviePreview(element));
        const movies = await Promise.all(elementsPromises);
        await page.close();
        return movies;
    }

    async getMovie(kinopoiskMovieId) {
        const sourceURL = movieURL + kinopoiskMovieId;
        const page = await this.browser.newPage();
        await page.emulate(iPhone7);
        await page.goto(sourceURL);
        if (!(await ParseUtil.selectElementInnerText(page, movieTitleSelector))) {
            return null;
        }
        const movie = createMovie(
            await ParseUtil.selectElementInnerText(page, movieTitleSelector),
            ParseUtil.notEmptyOrNull(await ParseUtil.selectElementInnerText(page, movieOriginalTitleSelector)),
            ParseUtil.notEmptyOrNull(await ParseUtil.selectElementInnerText(page, movieYearSelector)),
            ParseUtil.notEmptyOrNull(await ParseUtil.selectElementInnerText(page, movieGenresSelector)),
            ParseUtil.notEmptyOrNull(parseKinopoiskMovieCountries(await ParseUtil.selectElementInnerText(page, movieCountriesSelector))),
            ParseUtil.notEmptyOrNull(getKinopoiskRatingValue(await ParseUtil.selectElementInnerText(page, movieRatingSelector))),
            kinopoiskMovieId,
            createKinopoiskMovieBigPosterURL(kinopoiskMovieId),
            createKinopoiskMovieSmallPosterURL(kinopoiskMovieId),
            sourceURL
        );
        await page.close();
        return movie;
    }
}

module.exports = MovieService;
