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

    app.get('/movies/:kinopoiskMovieId', async (req, res) => {
        const kinopoiskMovieId = req.params.kinopoiskMovieId;
        if (!kinopoiskMovieId) {
            res.status(400);
            res.send('kinopoiskMovieId can not be empty');
            return
        }
        const movie = await movieService.getMovie(kinopoiskMovieId);
        if (!movie) {
            res.status(404);
            res.send(`Movie with ${kinopoiskMovieId} not found`);
            return
        }
        res.send(movie);
    });

};

