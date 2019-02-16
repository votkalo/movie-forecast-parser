const ParseUtil = require('../util/ParseUtil');

const moviesScheduleURL = 'https://afisha.tut.by/film-';

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

const movieScheduleIdentifier = /Киноафиша /;

function createMovieSchedule(movieTitle, movieScheduleURL, cinemas) {
    return {
        title: movieTitle,
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

class MovieService {

    constructor(browser) {
        this.browser = browser;
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