const chalk = require('chalk');
const puppeteer = require('puppeteer');
const fs = require('fs');
const mkdirp = require('mkdirp');
const os = require('os');
const path = require('path');

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup');

module.exports = async function() {
    console.log(chalk.green('Setup Puppeteer'));
    const browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        headless: false,
    });
    // const browser = await puppeteer.launch({ignoreHTTPSErrors: true});
    global.__BROWSER__ = browser;
    mkdirp.sync(DIR);
    fs.writeFileSync(path.join(DIR, 'wsEndpoint'), browser.wsEndpoint());
}