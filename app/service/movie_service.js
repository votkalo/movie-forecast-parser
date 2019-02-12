const ParseUtil = require('../util/ParseUtil');

const devices = require('puppeteer/DeviceDescriptors');
const iPhone7 = devices['iPhone 7'];

const searchURL = 'https://www.kinopoisk.ru/index.php?kp_query=';
const movieURL = 'https://www.kinopoisk.ru/film/';
const moviesScheduleURL = 'https://afisha.tut.by/film-';

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

const movieSchedulePageIdentifierSelector = 'h1.title_page';
const movieScheduleClickSelector = 'ul#sort-type > li:nth-child(2)';
const movieScheduleMovieSelector = 'div#schedule-table > div.b-film-info';
const movieScheduleMovieTitleSelector = 'div.name > a';
const movieScheduleMovieTitleParameterSelector = 'innerText';
const movieScheduleMovieURLParameterSelector = 'href';
const movieScheduleCinemaSelector = 'li.b-film-list__li';
const movieScheduleCinemaNameSelector = 'div.film-name > a';
const movieScheduleCinemaNameParameterSelector = 'innerText';
const movieScheduleCinemaURLParameterSelector = 'href';
const movieScheduleSessionSelector = 'li.lists__li';
const movieScheduleSessionTimeParameterSelector = 'innerText';
const movieScheduleSession3DSelector = 'a > div.time-label > i.label-icon';

const prefixImageURL = 'https://st.kp.yandex.net/images/';
const prefixBigImageURL = `${prefixImageURL}film_big/`;
const prefixSmallImageURL = `${prefixImageURL}film_iphone/iphone_`;
const imageExtension = '.jpg';
const postfixSmallImageURL = `?width=120`;

const notRatingIdentifier = /%/;
const searchIdentifier = /Поиск:/;
const durationIdentifier = /:/;
const movieScheduleIdentifier = /Киноафиша /;

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

function createMovieSchedule(movieTitle, movieScheduleURL, cinemas) {
    return {
        movieTitle: movieTitle,
        movieScheduleURL: movieScheduleURL,
        cinemas: cinemas
    }
}

function createMovieScheduleCinema(name, cinemaScheduleURL, sessions) {
    return {
        name: name,
        cinemaScheduleURL: cinemaScheduleURL,
        sessions: sessions
    }
}

function createMovieScheduleSession(time, is3D) {
    return {
        time: time,
        is3D: is3D
    }
}

async function parseMoviePreview(element) {
    let kinopoiskRating = getKinopoiskRatingValue(await ParseUtil.selectElementInnerText(element, searchRatingSelector));
    const sourceURL = await ParseUtil.selectElementProperty(element, searchSourceURLParameterSelector);
    const kinopoiskMovieId = parseKinopoiskMovieId(sourceURL);
    return createMovie(
        await ParseUtil.selectElementInnerText(element, searchTitleSelector),
        notEmptyOrNull(await ParseUtil.selectElementInnerText(element, searchOriginalTitleSelector)),
        notEmptyOrNull(await ParseUtil.selectElementInnerText(element, searchYearSelector)),
        notEmptyOrNull(await ParseUtil.selectElementInnerText(element, searchGenresSelector)),
        notEmptyOrNull(await ParseUtil.selectElementInnerText(element, searchCountriesSelector)),
        notEmptyOrNull(kinopoiskRating),
        kinopoiskMovieId,
        createKinopoiskMovieBigPosterURL(kinopoiskMovieId),
        createKinopoiskMovieSmallPosterURL(kinopoiskMovieId),
        sourceURL
    )
}

async function parseMovieSchedule(element) {
    const movieTitleElement = await ParseUtil.selectElement(element, movieScheduleMovieTitleSelector);
    if (!movieTitleElement) {
        return null
    }
    const cinemas = [];
    const cinemasElements = await element.$$(movieScheduleCinemaSelector);
    for (let index = 0; index < cinemasElements.length; index++) {
        cinemas.push(await parseMovieScheduleCinema(cinemasElements[index]));
    }
    return createMovieSchedule(
        await ParseUtil.selectElementProperty(movieTitleElement, movieScheduleMovieTitleParameterSelector),
        await ParseUtil.selectElementProperty(movieTitleElement, movieScheduleMovieURLParameterSelector),
        cinemas
    )
}

async function parseMovieScheduleCinema(element) {
    const cinemaNameElement = await ParseUtil.selectElement(element, movieScheduleCinemaNameSelector);
    const sessions = [];
    const sessionsElements = await element.$$(movieScheduleSessionSelector);
    for (let index = 0; index < sessionsElements.length; index++) {
        sessions.push(await parseMovieScheduleSession(sessionsElements[index]));
    }
    return createMovieScheduleCinema(
        await ParseUtil.selectElementProperty(cinemaNameElement, movieScheduleCinemaNameParameterSelector),
        await ParseUtil.selectElementProperty(cinemaNameElement, movieScheduleCinemaURLParameterSelector),
        sessions
    )
}

async function parseMovieScheduleSession(element) {
    return createMovieScheduleSession(
        parseMovieScheduleSessionTime(await ParseUtil.selectElementProperty(element, movieScheduleSessionTimeParameterSelector)),
        !!(await ParseUtil.selectElementInnerText(element, movieScheduleSession3DSelector))
    )
}

function parseMovieScheduleSessionTime(timeString) {
    return timeString.replace('\n3D', '');
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
    return sourceURL.replace(/^\D+/g, '');
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
        if (!searchIdentifier.test(await ParseUtil.selectElementInnerText(page, searchPageIdentifierSelector))) {
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
        if (!(await ParseUtil.selectElementInnerText(page, movieTitleSelector))) {
            return null;
        }
        const movie = createMovie(
            await ParseUtil.selectElementInnerText(page, movieTitleSelector),
            notEmptyOrNull(await ParseUtil.selectElementInnerText(page, movieOriginalTitleSelector)),
            notEmptyOrNull(await ParseUtil.selectElementInnerText(page, movieYearSelector)),
            notEmptyOrNull(await ParseUtil.selectElementInnerText(page, movieGenresSelector)),
            notEmptyOrNull(parseKinopoiskMovieCountries(await ParseUtil.selectElementInnerText(page, movieCountriesSelector))),
            notEmptyOrNull(getKinopoiskRatingValue(await ParseUtil.selectElementInnerText(page, movieRatingSelector))),
            kinopoiskMovieId,
            createKinopoiskMovieBigPosterURL(kinopoiskMovieId),
            createKinopoiskMovieSmallPosterURL(kinopoiskMovieId),
            sourceURL
        );
        await page.close();
        return movie;
    }

    async getMoviesSchedule(alternativeLocalityName) {
        const page = await this.browser.newPage();
        await page.goto(moviesScheduleURL + alternativeLocalityName);
        const moviesSchedule = [];
        if (!movieScheduleIdentifier.test(await ParseUtil.selectElementInnerText(page, movieSchedulePageIdentifierSelector))) {
            return moviesSchedule;
        }
        await Promise.all([
            page.waitForNavigation(),
            page.click(movieScheduleClickSelector)
        ]);
        const elements = await page.$$(movieScheduleMovieSelector);
        for (let index = 0; index < elements.length; index++) {
            const movieSchedule = await parseMovieSchedule(elements[index]);
            if (movieSchedule) {
                moviesSchedule.push(movieSchedule);
            }
        }
        await page.close();
        return moviesSchedule;
    }
}

module.exports = MovieService;
