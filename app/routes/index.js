const pagesRoutes = require('./pages_routes');
const moviesRoutes = require('./movies_routes.js');

module.exports = function(app, browser) {
    pagesRoutes(app, browser);
    moviesRoutes(app, browser);
};