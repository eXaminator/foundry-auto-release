import { createRequire } from 'module';
import puppeteer from 'puppeteer';
import { decode } from 'querystring';

const require = createRequire(import.meta.url);

export default async function createRelease(manifestPath, packageId, username, password) {
    console.log('Release Foundry VTT package', { manifestPath, packageId });

    const moduleData = require(manifestPath);

    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    async function editField(selector, value) {
        console.log(`Set ${selector}...`);
        await page.evaluate((sel) => {
            const element = document.querySelector(sel);
            element.value = '';
        }, selector);
        await page.type(selector, value);
    }

    console.log('Try to login...');
    await page.goto('https://foundryvtt.com', { waitUntil: 'load' });

    await page.click('[for="modal-login-trigger"]');
    await editField('[name="login_username"]', username);
    await editField('[name="login_password"]', password);
    await page.click('#login-login');
    await page.waitForSelector('#login-welcome');

    console.log('Modify package data...');
    await page.goto(`https://foundryvtt.com/admin/packages/package/${packageId}/change/`);
    const id = await page.$eval('tr.dynamic-versions:not(.has_original)', e => e.id);

    await editField('#id_name', moduleData.name);
    await editField('#id_title', moduleData.title);
    await editField('#id_url', moduleData.url);
    await editField(`#id_${id}-version`, moduleData.version);
    await editField(`#id_${id}-manifest`, moduleData.manifest);
    await editField(`#id_${id}-notes`, `${moduleData.url}/releases/tag/${moduleData.version}`);
    await editField(`#id_${id}-required_core_version`, moduleData.minimumCoreVersion);
    await editField(`#id_${id}-compatible_core_version`, moduleData.compatibleCoreVersion);

    await page.click('#id_description + .tox-tinymce button[title="Source code"]');
    await page.waitForSelector('.tox-dialog textarea');
    await editField('.tox-dialog textarea', moduleData.description);
    await page.click('.tox-dialog button[title="Save"]');

    if (process.env.NODE_ENV === 'development') {
        await page.setRequestInterception(true);
        page.on('request', request => {
            request.abort();
            console.log('Request', request.url(), decode(request.postData()));
        });
    }

    await page.click('[name="_continue"]');
    await page.waitForNavigation({ waitUntil: 'load' });

    console.log('Done!');

    await browser.close();
}