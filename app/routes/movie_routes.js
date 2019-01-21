const MovieService = require('../service/movie_service');

module.exports = function (app, browser) {
    const movieService = new MovieService(browser);

    app.post('/movies/search', async (req, res) => {
        const searchQuery = req.body.searchQuery;
        if (!searchQuery) {
            res.status(400);
            res.send('searchQuery can not be empty');
            return
        }
        res.send(await movieService.searchMovies(searchQuery));
    });
};

