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
    let kinopoiskRating = getKinopoiskRatingValue(await ParseUtil.selectElement(element, searchRatingSelector));
    const sourceURL = await ParseUtil.selectElementProperty(element, searchSourceURLParameterSelector);
    const kinopoiskMovieId = parseKinopoiskMovieId(sourceURL);
    return createMovie(
        await ParseUtil.selectElement(element, searchTitleSelector),
        notEmptyOrNull(await ParseUtil.selectElement(element, searchOriginalTitleSelector)),
        notEmptyOrNull(await ParseUtil.selectElement(element, searchYearSelector)),
        notEmptyOrNull(await ParseUtil.selectElement(element, searchGenresSelector)),
        notEmptyOrNull(await ParseUtil.selectElement(element, searchCountriesSelector)),
        notEmptyOrNull(kinopoiskRating),
        kinopoiskMovieId,
        createKinopoiskMovieBigPosterURL(kinopoiskMovieId),
        createKinopoiskMovieSmallPosterURL(kinopoiskMovieId),
        sourceURL
    )
}

function notEmptyOrNull(value) {
    if (value === '') {
        return null
    }
    return value
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
    return sourceURL.slice(30, -1)
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
        const movies = [];
        if (!searchIdentifier.test(await ParseUtil.selectElement(page, searchPageIdentifierSelector))) {
            return movies;
        }
        const elements = await page.$$(searchMovieSelector);
        for (let index = 0; index < elements.length; index++) {
            movies.push(await parseMoviePreview(elements[index]));
        }
        await page.close();
        return movies;
    }

    async getMovie(kinopoiskMovieId) {
        const sourceURL = movieURL + kinopoiskMovieId;
        const page = await this.browser.newPage();
        await page.emulate(iPhone7);
        await page.goto(sourceURL);
        if (!(await ParseUtil.selectElement(page, movieTitleSelector))) {
            return null;
        }
        const movie = createMovie(
            await ParseUtil.selectElement(page, movieTitleSelector),
            notEmptyOrNull(await ParseUtil.selectElement(page, movieOriginalTitleSelector)),
            notEmptyOrNull(await ParseUtil.selectElement(page, movieYearSelector)),
            notEmptyOrNull(await ParseUtil.selectElement(page, movieGenresSelector)),
            notEmptyOrNull(parseKinopoiskMovieCountries(await ParseUtil.selectElement(page, movieCountriesSelector))),
            notEmptyOrNull(getKinopoiskRatingValue(await ParseUtil.selectElement(page, movieRatingSelector))),
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
