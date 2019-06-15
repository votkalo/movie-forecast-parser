const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const app = express();

const port = 8999;

puppeteer.launch().then((browser) => {
    console.log('Browser created');
    app.use(bodyParser.json());
    require('./app/routes')(app, browser);
    app.listen(port, () => {
        console.log('We are live on ' + port);
    });
});

