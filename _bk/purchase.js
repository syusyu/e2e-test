const fs = require('fs');
const timeout = 10000;

const excludedRequests = (request) => {
    const lists = ['image', 'stylesheet', 'script'];
    return lists.includes(request.resourceType());
};
let page;
const networkLogs = [];
const domain = '52.192.155.124';
const rootUrl = 'https://' + domain + '/bpApp/';

describe('Front Site Purchase', () => {
    beforeAll(async () => {
        page = await global.__BROWSER__.newPage();

        //Workaround to bypass ERR_CERT_AUTHORITY_INVALID
        await page.goto('https://' + domain);

        await page.setRequestInterception(true);
        page.on('console', consoleMessage => {
            if (consoleMessage.type() === 'debug') {
                console.debug(`########## ${consoleMessage.text()}`)
            }
        });
        page.on('request', request => {
            if (!excludedRequests(request)) {
                networkLogs.push({
                    ts: Date.now(),
                    network: 'request',
                    url: request.url(),
                    type: request.resourceType()
                });
            }
            request.continue();
        });
    }, timeout);

    afterAll(async () => {
        await page.close();
        fs.writeFileSync('./output/networkLogs_purchase.json', JSON.stringify(networkLogs));
    });

    describe(
        'Top page',
        () => {
            const pageCommonSelector = 'meta[http-equiv="cms_page_name"]';
            const topPageSelector = '#mainslider > .wideslider_base > .wideslider_wrap > ul.mainList';
            const loginTopLinkSelector = '#header > .header-middle > .right > ul.nav > li > a[href*="LoginTop"]';

            const expectPageShown = async (content) => {
                await page.waitForSelector(pageCommonSelector);
                const cmsPageName = await page.evaluate(pageCommonSelector => {
                    return document.querySelector(pageCommonSelector).getAttribute('content');
                }, pageCommonSelector);
                expect(cmsPageName).toEqual(content);
            };

            const expectTopPage = async () => {
                await expectPageShown('トップ');

                await page.waitForSelector(topPageSelector);
                const existsTopImages = await page.evaluate(topPageSelector => {
                    return document.querySelector(topPageSelector).children.length > 0;
                }, topPageSelector);
                expect(existsTopImages).toEqual(true);
            };

            const expectItemDetailPage = async () => {
                await expectPageShown('商品詳細');
            };

            it('Open top page', async () => {
                await page.goto(rootUrl + 'Index');
                await expectTopPage();
            }, timeout);

            it ('Login for guest member', async () => {
                //If Not login, do login here.
                const isMember = await page.evaluate(loginLinkSelector => {
                    const node = document.querySelector(loginLinkSelector);
                    return !node;
                }, loginTopLinkSelector);

                if (!isMember) {
                    await page.click(loginTopLinkSelector);
                    const loginBtnSelector = 'a[data-action-url$="Login"]';
                    await page.waitForSelector(loginBtnSelector);
                    await page.type('input[name="userId"]', 'okabe@worksap.co.jp');
                    await page.type('input[name="password"]', 'okabe1111');
                    await page.click(loginBtnSelector);
                    await expectTopPage();
                }
            }, timeout);


        }
    , timeout);

}, timeout);


