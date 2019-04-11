const ParseUtil = require('../util/ParseUtil');

const moviesScheduleURL = 'https://afisha.tut.by/day-';

const movieSchedulePageIdentifierSelector = 'h1.title_page';
const movieScheduleClickSelector = 'ul#sort-type > li:nth-child(2)';

const movieScheduleMovieSelector = 'div#schedule-table > div.b-film-info';
const movieScheduleMovieTitleSelector = 'div.name > a';
const movieScheduleMovieTitleParameterSelector = 'innerText';
const movieScheduleMovieURLParameterSelector = 'href';

const movieSelector = 'table > tbody > tr > td.post.b-event-post';
const movieOriginalTitleSelector = 'div.sub_title';
const movieYearSelector = 'table.movie_info > tbody > tr > td.year';

const movieScheduleCinemaSelector = 'li.b-film-list__li';
const movieScheduleCinemaNameSelector = 'div.film-name > a';
const movieScheduleCinemaNameParameterSelector = 'innerText';
const movieScheduleCinemaURLParameterSelector = 'href';
const movieScheduleSessionSelector = 'li.lists__li';
const movieScheduleSessionTimeParameterSelector = 'innerText';
const movieScheduleSession3DSelector = 'a > div.time-label > i.label-icon';

const movieScheduleIdentifier = /Киноафиша /;

function createMovieSchedule(movieTitle, movieOriginalTitle, movieYear, movieScheduleURL, cinemas) {
    return {
        title: movieTitle,
        originalTitle: movieOriginalTitle,
        year: movieYear,
        scheduleURL: movieScheduleURL,
        cinemas: cinemas
    }
}

function createMovieScheduleCinema(name, cinemaScheduleURL, sessions) {
    return {
        name: name,
        scheduleURL: cinemaScheduleURL,
        sessions: sessions
    }
}

function createMovieScheduleSession(time, is3D) {
    return {
        time: time,
        is3D: is3D
    }
}

async function parseMovieSchedule(element, browser) {
    const movieScheduleMovieTitle = await ParseUtil.selectElement(element, movieScheduleMovieTitleSelector);
    if (!movieScheduleMovieTitle) {
        return null
    }
    const cinemasElementsPromises = await element.$$(movieScheduleCinemaSelector);
    const cinemas = await Promise.all(cinemasElementsPromises.map(element => parseMovieScheduleCinema(element)));
    const movieScheduleMovieURL = await ParseUtil.selectElementProperty(movieScheduleMovieTitle, movieScheduleMovieURLParameterSelector);
    const page = await browser.newPage();
    await page.goto(movieScheduleMovieURL);
    const movieElement = await ParseUtil.selectElement(page, movieSelector);
    const movieSchedule = createMovieSchedule(
        await ParseUtil.selectElementProperty(movieScheduleMovieTitle, movieScheduleMovieTitleParameterSelector),
        ParseUtil.notEmptyOrNull(await ParseUtil.selectElementInnerText(movieElement, movieOriginalTitleSelector)),
        ParseUtil.notEmptyOrNull(await ParseUtil.selectElementInnerText(movieElement, movieYearSelector)),
        movieScheduleMovieURL,
        cinemas
    );
    await page.close();
    return movieSchedule
}

async function parseMovieScheduleCinema(element) {
    const cinemaNameElement = await ParseUtil.selectElement(element, movieScheduleCinemaNameSelector);
    const sessionsElementsPromises = await element.$$(movieScheduleSessionSelector);
    const sessions = await Promise.all(sessionsElementsPromises.map(element => parseMovieScheduleSession(element)));
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

function createScheduleURL(alternativeLocalityName, date) {
    return `${moviesScheduleURL}${alternativeLocalityName}/film/${date.getFullYear()}/${addZero(date.getMonth() + 1)}/${addZero(date.getDate())}`
}

function toLocalDateFormat(date) {
    return `${date.getFullYear()}-${addZero(date.getMonth() + 1)}-${addZero(date.getDate())}`
}

function addZero(value) {
    return ('0' + value).slice(-2)
}

class MovieService {

    constructor(browser) {
        this.browser = browser;
    }

    async getMoviesSchedule(alternativeLocalityName) {
        const page = await this.browser.newPage();
        const date = new Date();
        await page.goto(createScheduleURL(alternativeLocalityName, date));
        if (!movieScheduleIdentifier.test(await ParseUtil.selectElementInnerText(page, movieSchedulePageIdentifierSelector))) {
            return [];
        }
        await Promise.all([
            page.waitForNavigation(),
            page.click(movieScheduleClickSelector)
        ]);
        const elements = await page.$$(movieScheduleMovieSelector);
        const moviesSchedulePromises = elements.map(element => parseMovieSchedule(element, this.browser));
        let moviesSchedule = await Promise.all(moviesSchedulePromises);
        await page.close();
        moviesSchedule = moviesSchedule.filter(moviesSchedule => moviesSchedule);
        moviesSchedule.forEach(moviesSchedule => moviesSchedule["date"] = toLocalDateFormat(date));
        return moviesSchedule;
    }
}

module.exports = MovieService;