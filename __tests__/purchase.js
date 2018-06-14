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
            const topPageSelector = '#mainslider > .wideslider_base > .wideslider_wrap > ul.mainList';
            const loginTopLinkSelector = '#header > .header-middle > .right > ul.nav > li > a[href*="LoginTop"]';
            const cartBtnSelector = '.buyBtn > a > img';
            const checkoutBtnSelector = '#mainBtn';
            const cartNextBtnOfAddressSelector = 'a.cart_next_link[data-action-url$="/cart/addresschk"]';
            const cartNextBtnOfAddressOptSelector = 'a.cart_next_link[data-action-url$="/cart/addressoptchk"]';
            const cartNextBtnOfPaymentSelector = 'a.cart_next_link[data-action-url$="/cart/paymentchk"]';
            const cartNextBtnOfConfirmtSelector = 'a.cart_next_link[data-action-url$="/cart/thankyou"]';
            const cartAddressTypeRegisterSelector = '#addrInputType_SELECT_EXIST';
            const cartAddressOptDelDaySelector = '#delDaySelect_-0-0-0';
            const cartPaymentCodSelector = '#payMethodKb_CASH_ON_DELIVERY';
            const cartPaymentCodOptionSelector = 'input[name="paymentCodOption"][value="1"]';
            const cartPaymentAgreeSelector = '#agree';
            const cartConfirmTotalPriceSelector = 'p.totalprice';

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
                await page.waitForSelector(cartPaymentCodSelector);

                const cvVal = await page.$eval(cartPaymentCodSelector, e => e.value);
                expect(cvVal).toEqual('CASH_ON_DELIVERY');
            };
            const expectCartConfirm = async() => {
                await page.waitForSelector(cartConfirmTotalPriceSelector);

                const hasYen = await page.$eval(cartConfirmTotalPriceSelector, e => e.textContent);
                expect(hasYen).toContain('円');
            };
            const expectCartThankyou = async () => {
                const thankyouText = await page.$eval("#EC_cart", e => e.innerHTML);
                expect(thankyouText).toContain('ご注文ありがとうございました');
            };


            it('Top', async () => {
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

            it('Item Detail page', async () => {
                await page.goto(rootUrl + 'ItemDetail?cmId=270');
                await expectItemDetailPage();
            }, timeout);

            it('Item Detail -> Cart Top', async () => {
                await page.click(cartBtnSelector);
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
                await expectCartTopPage();
            }, timeout);

            it ('Cart Top -> Cart Address', async () => {
                await page.waitForSelector(checkoutBtnSelector);
                await page.click(checkoutBtnSelector);
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
                await expectCartAddress();
            }, timeout);

            it ('Cart Address -> Cart AddressOpt', async () => {
                await page.waitForSelector(cartNextBtnOfAddressSelector);
                await page.click(cartNextBtnOfAddressSelector);
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
                await expectCartAddressOption();
            }, timeout);

            it ('Cart AddressOpt -> Cart Payment', async () => {
                await page.waitForSelector(cartNextBtnOfAddressOptSelector);
                await page.click(cartNextBtnOfAddressOptSelector);
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
                await expectCartPayment();
            }, timeout);

            it ('Cart Payment -> Cart Confirm', async () => {
                await page.waitForSelector(cartPaymentCodSelector);
                await page.click(cartPaymentCodSelector);

                await page.waitForSelector(cartPaymentCodOptionSelector);
                await page.click(cartPaymentCodOptionSelector);

                await page.waitForSelector(cartPaymentAgreeSelector);
                await page.click(cartPaymentAgreeSelector);

                await page.waitForSelector(cartNextBtnOfPaymentSelector);
                await page.click(cartNextBtnOfPaymentSelector);
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
                await expectCartConfirm();
            }, timeout);

            it ('Cart Confirm -> Thank you', async () => {
                await page.waitForSelector(cartNextBtnOfConfirmtSelector);
                await page.click(cartNextBtnOfConfirmtSelector);
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
                await expectCartThankyou();
            });
        }
    , 60000);

}, 120000);


