const fs = require('fs');
const config = require('config');

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

        // await page.goto('https://' + domain);
        await page.setRequestInterception(true);
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

        page.on('console', consoleMessage => {
            if (consoleMessage.type() === 'debug') {
                console.debug(`########## ${consoleMessage.text()}`)
            }
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
            const cartBtnSelector = '.buyBtn > a > img';
            const checkoutBtnSelector = '#mainBtn';
            const cartNextBtnSelector = 'img.cart_next_btn';
            const cartAddressTypeRegisterSelector = '#addrInputType_SELECT_EXIST';
            const cartAddressOptDelDaySelector = '#delDaySelect_-0-0-0';

            const expectTopPage = async () => {
                await page.waitForSelector(topPageSelector);

                const existsTopImages = await page.evaluate(topPageSelector => {
                    return document.querySelector(topPageSelector).children.length > 0;
                }, topPageSelector);
                expect(existsTopImages).toEqual(true);
            };
            const expectItemDetailPage = async () => {
                await page.waitForSelector(cartBtnSelector);

                const alt = await page.$eval(cartBtnSelector, e => e.alt);
                expect(alt).toEqual('カートに入れる');
            };
            const expectCartTopPage = async () => {
                await page.waitForSelector(checkoutBtnSelector);

                const url = await page.$eval(checkoutBtnSelector, e => e.getAttribute('data-action-url'));
                expect(url).toContain('/cart/address');
            };
            const expectCartAddress = async() => {
                await page.waitForSelector(cartAddressTypeRegisterSelector);

                const radio = await page.$eval(cartAddressTypeRegisterSelector, e => e.value);
                expect(radio).toEqual('SELECT_EXIST');
            };
            const expectCartAddressOption = async() => {
                await page.waitForSelector(cartAddressOptDelDaySelector);

                const hasOption = await page.$eval(cartAddressOptDelDaySelector, e => e.children.length > 0);
                expect(hasOption).toEqual(true);
            };
            const expectCartPayment = async() => {
                await waitPage('支払い(カート)');
                // await expectCartNextButton();
            };

            it('Top page', async () => {
                await page.goto(rootUrl + 'Index');
                await expectTopPage();
            }, timeout);

            it ('Do login', async () => {
                await page.waitForSelector(loginTopLinkSelector);
                //If Not login, do login here.
                const isMember = await page.evaluate(loginLinkSelector => {
                    const node = document.querySelector(loginLinkSelector);
                    return !node;
                }, loginTopLinkSelector);

                if (!isMember) {
                    await page.click(loginTopLinkSelector);
                    const loginBtnSelector = 'a[data-action-url$="Login"]';
                    await page.waitForSelector(loginBtnSelector);
                    await page.type('input[name="userId"]', config.purchase.email);
                    await page.type('input[name="password"]', config.purchase.password);
                    await page.click(loginBtnSelector);
                    await expectTopPage();
                }
            }, timeout);

            it('Item detail page', async () => {
                await page.goto(rootUrl + 'ItemDetail?cmId=292');
                await expectItemDetailPage();
            }, timeout);

            it('Put an item to cart and redirect to Cart top', async () => {
                await page.click(cartBtnSelector);
                await expectCartTopPage();
            }, timeout);

            it ('CartAddress after checkout', async () => {
                await page.click(checkoutBtnSelector);
                await expectCartAddress();
            }, timeout);

            it ('CartAddressOpt after CartAddress', async () => {
                await page.click(cartNextBtnSelector);
                await expectCartAddressOption();
            }, timeout);

            // it ('/cart/payment', async () => {
            //     await page.click(cartNextBtnSelector);
            //     await expectCartPayment();
            // }, timeout);
        }
    , timeout);

}, timeout);


