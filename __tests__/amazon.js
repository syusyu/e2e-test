const fs = require('fs');
const config = require('config');
const timeout = 10000;

const excludedRequests = (request) => {
    const lists = ['image', 'stylesheet', 'script'];
    return lists.includes(request.resourceType());
};
let page;
const networkLogs = [];
const rootUrl = 'https://www.amazon.co.jp/';

describe('Amazon', () => {
    beforeAll(async () => {
        page = await global.__BROWSER__.newPage();

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
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8'
        });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36')
    }, timeout);

    afterAll(async () => {
        await page.close();
        fs.writeFileSync('./output/networkLogs_amazon.json', JSON.stringify(networkLogs));
    });

    describe(
        'Top page',
        () => {
            const topPageSelector = '#pageContent[role="main"]';
            const loginStatusSelector = '#nav-link-accountList > span.nav-line-3';
            const loginTopLinkHoverSelector = '#nav-link-accountList';
            const loginBtnSelector = '#continue';
            const loginPassBtnSelector = '#signInSubmit';
            const itemDetailPageSelector = '#productTitle';
            const itemDetailCartBtnSelector = '#add-to-cart-button';
            const cartTopPageSelector = '#hlb-ptc-btn-native';
            const cartConfirmPageSelector = 'input[name="placeYourOrder1"]';


            const expectTopPage = async () => {
                await page.waitForSelector(topPageSelector);
                const existsTopImages = await page.evaluate(topPageSelector => {
                    return document.querySelector(topPageSelector).children.length > 0;
                }, topPageSelector);
                expect(existsTopImages).toEqual(true);
            };
            const expectItemDetailPage = async () => {
                await page.waitForSelector(itemDetailPageSelector);
                const itemDetailTxt = await page.evaluate(itemDetailPageSelector => {
                    return document.querySelector(itemDetailPageSelector).textContent;
                }, itemDetailPageSelector);
                expect(itemDetailTxt).toContain('オヤスミマン');

                await page.waitForSelector(itemDetailCartBtnSelector);
                const cartBtnTxt = await page.evaluate(itemDetailCartBtnSelector => {
                    return document.querySelector(itemDetailCartBtnSelector).value;
                }, itemDetailCartBtnSelector);
                expect(cartBtnTxt).toContain('カートに入れる');

            };
            const expectCartTopPage = async () => {
                await page.waitForSelector(cartTopPageSelector);
                const checkoutTxt = await page.evaluate(cartTopPageSelector => {
                    return document.querySelector(cartTopPageSelector).textContent;
                }, cartTopPageSelector);
                expect(checkoutTxt).toContain('レジに進む');
            };
            const expectCartConfirmPage = async () => {
                await page.waitForSelector(cartConfirmPageSelector);
                const checkoutTxt = await page.evaluate(cartConfirmPageSelector => {
                    return document.querySelector(cartConfirmPageSelector).value;
                }, cartConfirmPageSelector);
                expect(checkoutTxt).toEqual('注文を確定する');
            };

            it('Open top page', async () => {
                await page.goto(rootUrl);
                await expectTopPage();
            }, timeout);

            it ('Login for guest member', async () => {
                //If Not login, do login here.
                const isMember = await page.evaluate(loginStatusSelector => {
                    const loginStatusText = document.querySelector(loginStatusSelector).textContent;
                    return loginStatusText !== 'サインイン';
                }, loginStatusSelector);

                await expectTopPage();

                if (!isMember) {
                    await page.click(loginTopLinkHoverSelector);
                    await page.waitForSelector(loginBtnSelector);
                    await page.type('#ap_email', config.amazon.email);
                    await page.click(loginBtnSelector);
                    await page.waitForSelector(loginPassBtnSelector);
                    await page.type('#ap_password', config.amazon.password);
                    await page.click(loginPassBtnSelector);
                    await expectTopPage();
                }
            }, timeout);

            it('Open item detail page', async () => {
                await page.goto(rootUrl + 'gp/product/B001H54EZO/');
                await expectItemDetailPage();
            }, timeout);

            it ('Put item to cart and show cart top', async () => {
                await page.click(itemDetailCartBtnSelector);
                await expectCartTopPage();
            });

            it ('Show cart confirm page', async () => {
                await page.click(cartTopPageSelector);
                await expectCartConfirmPage();
            });

            // it ('Change delivery date and time', async () => {
            //
            // });
        }
    , timeout);

}, timeout);


