const PagesService = require('../service/pages_service');

module.exports = function (app) {

    app.post('/links', async (req, res) => {
        const pagesService = new PagesService;
        res.send(await pagesService.savePage(req.body.link))
    });
};

