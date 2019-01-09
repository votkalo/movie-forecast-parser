const MoviesService = require('../service/movies_service');

module.exports = function (app, browser) {
    const moviesService = new MoviesService(browser);

    app.post('/movies/search', async (req, res) => {
        const searchLine = req.body.searchLine;
        if (!searchLine) {
            res.status(400);
            res.send('searchLine can not be empty');
            return
        }
        res.send(await moviesService.searchMovies(searchLine));
    });
};

