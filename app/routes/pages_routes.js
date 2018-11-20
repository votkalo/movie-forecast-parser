const PagesService = require('../service/pages_service');

module.exports = function (app) {
    const pagesService = new PagesService;

    app.post('/pages', async (req, res) => {
        const url = req.body.url;
        if (!url) {
            res.status(400);
            res.send('URL can not be empty');
            return
        }
        if (req.body.infinite) {
            res.send(await pagesService.getInfinitePage(url));
            return
        }
        res.send(await pagesService.getPage(url));
    });
};

