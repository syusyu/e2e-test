const timeout = 5000;

const sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

let page;

beforeAll(async () => {
    page = await global.__BROWSER__.newPage();
    page.on('console', consoleMessage => {
        if (consoleMessage.type() === 'debug') {
            console.debug(`########## ${consoleMessage.text()}`)
        }
    });
}, timeout);

afterAll(async () => {
    await page.close()
});

describe(
    '/spa-manager/change',
    () => {

        const expectListPage = async () => {
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
        };

        const expectPopupDialog = async () => {
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
        };

        const expectConfirmPage = async ()  => {
            const subTitle = await page.evaluate(() => {
                return document.querySelector('.confirm.visible > h3').textContent;
            });
            expect(subTitle).toContain('変更内容の確認');
        };

        const expectCompletion = async () => {
            await page.waitFor('.complete.visible > h3');
            const subTitle = await page.evaluate(() => {
                return document.querySelector('.complete.visible > h3').textContent;
            });
            expect(subTitle).toContain('変更予約が完了しました。');
        };

        it ('Open list page', async () => {
            await page.goto('https://syusyu.github.io/spa-manager/src/index.html');
            await page.waitFor('.list.visible > h3');
            await expectListPage();
        });
        it ('Open popup dialog', async () => {
            await page.click('#show-popup-warning');
            await expectPopupDialog();
        });
        it ('Go to confirm page', async () => {
            await page.click('[data-action-click-id="next-to-confirm"]');
            await expectConfirmPage();
        });
        it ('Go back to list page', async () => {
            await page.click('.confirm.visible > .box-for-btn > a[data-action-click-id="back-to-list"]');
            await expectListPage();
        });
        it ('Go to confirm page again', async () => {
            await page.click('[data-action-click-id="next-to-confirm"]');
            await expectConfirmPage();
        });
        it ('Complete change-plan', async () => {
            await page.click('.confirm.visible > .box-for-btn > a[data-action-click-dbupdate-id="update"]');
            await expectCompletion();
        });
    },
    timeout
);

describe(
    '/spa-manager/cancel',
    () => {
        beforeAll(async () => {
            await page.goto('https://syusyu.github.io/spa-manager/src/index.html');
            await page.waitFor('.list.visible > h3');
        }, timeout);

        const expectCancelInitPage = async ()  => {
            const subTitle = await page.evaluate(() => {
                return document.querySelector('.cancel.visible > h3').textContent;
            });
            expect(subTitle).toContain('プラン変更をキャンセルする');

            const dateAmount = await page.evaluate(() => {
                const cols = document.querySelectorAll('table.tbl_history > tbody > tr:nth-child(2)[data-bind-replaced-key="HISTORY.history_list"] > td');
                return Array.from(cols).map(e => e.textContent);
            });
            expect(dateAmount).toEqual(['2017/1/25', '2G']);
        };

        it ('Open cancel init page', async () => {
            await page.click('[data-action-click-id="cancel-init"]');
            await expectCancelInitPage();
        });
    },
    timeout
);