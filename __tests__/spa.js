const timeout = 5000;

describe(
    '/spa-manager/index.html',
    () => {
        let page;
        beforeAll(async () => {
            page = await global.__BROWSER__.newPage()
            await page.goto('https://syusyu.github.io/spa-manager/src/index.html')
        }, timeout);

        afterAll(async () => {
            await page.close()
        });


        it('Load list page', async () => {
            let text = await page.evaluate(() => document.body.textContent);
            expect(text).toContain('プランの変更予約をする');

            let elm = await page.$('#devices');
            console.log('### elem=' + elm);
        })
    },
    timeout
)