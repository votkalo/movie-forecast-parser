const ScheduleService = require('../service/schedule_service');

module.exports = function (app, browser) {
    const scheduleService = new ScheduleService(browser);

    app.get('/schedule/movies/:alternativeLocalityName/today', async (req, res) => {
        const alternativeLocalityName = req.params.alternativeLocalityName;
        if (!alternativeLocalityName) {
            res.status(400);
            res.send('alternativeLocalityName can not be empty');
            return
        }
        res.send(await scheduleService.getMoviesSchedule(alternativeLocalityName));
    });
};

