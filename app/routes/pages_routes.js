const LinksService = require('../service/links_service');

module.exports = function (app) {

    app.post('/links', async (req, res) => {
        const linkService = new LinksService;
        res.send(await linkService.savePages(req.body.link))
    });
};

