const devices = require('puppeteer/DeviceDescriptors');
const iPhone7 = devices['iPhone 7'];
const searchURL = 'https://www.kinopoisk.ru/index.php?kp_query=';

function createMoviePreview(title, originalTitle, year, posterURL, genres, countries, rating, sourceURL) {
    return {
        title: title,
        originalTitle: originalTitle,
        year: year,
        posterURL: posterURL,
        genres: genres,
        countries: countries,
        rating: rating,
        sourceURL: sourceURL
    }
}

function parseMoviePreviewPosterURL(style) {
    if (style) {
        return style
            .replace('background-image:url(', 'https:')
            .replace(')', '')
            .replace('120', '360');
    }
    return null;
}

async function selectElement(element, selector) {
    try {
        return await element.$eval(selector, node => node.innerText)
    } catch (error) {
        return null
    }
}

async function selectElementStyle(element, selector) {
    try {
        return await element.$eval(selector, node => node.getAttribute('style'));
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

class MoviesService {

    constructor(browser) {
        this.browser = browser;
    }

    async searchMovies(searchLine) {
        const page = await this.browser.newPage();
        await page.emulate(iPhone7);
        await page.goto(searchURL + searchLine);

        const elements = await page.$$('a.movie-snippet');
        const movies = [];

        for (let index = 0; index < elements.length; index++) {
            movies.push(
                createMoviePreview(
                    await selectElement(elements[index], 'div.movie-snippet__title'),
                    await selectElement(elements[index], 'h3.movie-snippet__original-title'),
                    await selectElement(elements[index], 'span.movie-snippet__year'),
                    parseMoviePreviewPosterURL(await selectElementStyle(elements[index], 'div.movie-snippet__image-wrap > div')),
                    await selectElement(elements[index], 'div.movie-snippet__description'),
                    await selectElement(elements[index], 'div.movie-snippet__countries'),
                    await selectElement(elements[index], 'span.movie-snippet__rating-value'),
                    await selectElementProperty(elements[index], 'href')
                )
            );
        }
        await page.close();
        return {movies: movies}
    }

}

module.exports = MoviesService;
