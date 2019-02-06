const movieRoutes = require('./movie_routes');
const localityRoutes = require('./locality_routes');

module.exports = function(app, browser) {
    movieRoutes(app, browser);
    localityRoutes(app, browser);
};