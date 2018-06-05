const timeout = 5000;

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

describe(
    '/spa-manager/index.html',
    () => {
        let page;
        beforeAll(async () => {
            page = await global.__BROWSER__.newPage();
            page.on('console', consoleMessage => {
                if (consoleMessage.type() === 'debug') {
                    console.debug(`########## ${consoleMessage.text()}`)
                }
            });
            await page.goto('https://syusyu.github.io/spa-manager/src/index.html');
            await sleep(1000);
        }, timeout);

        afterAll(async () => {
            await page.close()
        });


        it('Load list page', async () => {
            //Evaluate subtitle
            const subTitle = await page.evaluate(() => {
                return document.querySelector('.list.visible > h3').textContent;
            });
            expect(subTitle).toContain('プランの変更予約をする');

            //Evaluate device list
            const deviceLabels = await page.evaluate(() => {
                return Array.from(document.querySelector('#devices')).filter(e => e.getAttribute('data-bind-id').includes('$')).map(e => e.label);
            });
            expect(deviceLabels.sort()).toEqual(["Please select", "Device title1 of plan1", "Device title2 of plan1"].sort());

        });

        it('Pop up question', async () => {
            await page.click('#show-popup-warning');

            //Evaluate warning
            const warningTitle = await page.evaluate(() => {
                return document.querySelector('.modal.warning.visible > .spa-modal > .spa-modal-container > .spa-modal-contents-title > p.spa-modal-contents-title-left ').textContent;
            });
            expect(warningTitle).toEqual('注意事項');

            //Close popup
            //See https://github.com/GoogleChrome/puppeteer/issues/684
            const selector = '#close-popup-warning';
            const Frame = await page.frames()[0];
            await Frame.$eval(selector, el => el.click());
        });

        it ('Go to confirm page', async () => {
            await page.click('[data-action-click-id="next-to-confirm"]');

            const subTitle = await page.evaluate(() => {
                return document.querySelector('.confirm.visible > h3').textContent;
            });
            expect(subTitle).toContain('変更内容の確認');
        });
    },
    timeout
);