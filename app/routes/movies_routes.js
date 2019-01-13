const MoviesService = require('../service/movies_service');

module.exports = function (app, browser) {
    const moviesService = new MoviesService(browser);

    app.post('/movies/search', async (req, res) => {
        const searchQuery = req.body.searchQuery;
        if (!searchQuery) {
            res.status(400);
            res.send('searchQuery can not be empty');
            return
        }
        res.send(await moviesService.searchMovies(searchQuery));
    });
};

