const LocalityService = require('../service/locality_service');

module.exports = function (app, browser) {
    const localityService = new LocalityService(browser);

    app.get('/localities', async (req, res) => {
        res.send(await localityService.getLocalities());
    });
};