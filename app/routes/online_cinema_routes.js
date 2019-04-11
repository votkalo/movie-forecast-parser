const IviService = require('../service/ivi_service');

module.exports = function (app, browser) {
    const IVI_CINEMA_NAME = 'IVI';

    const iviService = new IviService(browser);

    app.post('/online-cinemas/:cinemaName/search', async (req, res) => {
        const movieInfo = req.body;
        const error = validateMovieInfo(movieInfo);
        if (error) {
            res.status(400);
            res.send(error);
            return;
        }
        try {
            const result = await onlineCinemaFactoryMethod(req.params.cinemaName, movieInfo);
            if (!result) {
                res.status(404);
                res.send(`Movie ${movieInfo.title}(${movieInfo.year}) not found`);
                return;
            }
            res.send(result);
        } catch (e) {
            res.status(404);
            res.send(e.message);
        }
    });

    function validateMovieInfo(movieInfo) {
        if (!movieInfo) {
            return 'movieInfo can not be empty';
        }
        if (!movieInfo.title) {
            return 'movieInfo title can not be empty';
        }
        return '';
    }

    async function onlineCinemaFactoryMethod(cinemaName, movieInfo) {
        switch (cinemaName) {
            case IVI_CINEMA_NAME:
                return await iviService.searchMovie(movieInfo);
            default:
                throw new OnlineCinemaNotFoundException('Unknown online cinema name');
        }
    }

    function OnlineCinemaNotFoundException(message) {
        this.message = message;
    }

};