const movieRoutes = require('./movie_routes');
const localityRoutes = require('./locality_routes');
const scheduleRoutes = require('./schedule_routes');
const onlineCinemaRoutes = require('./online_cinema_routes');

module.exports = function(app, browser) {
    movieRoutes(app, browser);
    localityRoutes(app, browser);
    scheduleRoutes(app, browser);
    onlineCinemaRoutes(app, browser);
};