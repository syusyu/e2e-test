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
            await sleep(2000);
        }, timeout);

        afterAll(async () => {
            await page.close()
        });


        it('Load list page', async () => {
            const subTitle = await page.evaluate(() => {
                return document.querySelector('.list.visible > h3').textContent;
            });
            expect(subTitle).toContain('プランの変更予約をする');

            const deviceLabels = await page.evaluate(() => {
                return Array.from(document.querySelector('#devices')).filter(e => e.getAttribute('data-bind-id').includes('$')).map(e => e.label);
            });
            expect(deviceLabels.sort()).toEqual(["Please select", "Device title1 of plan1", "Device title2 of plan1"].sort());
        })
    },
    timeout
);