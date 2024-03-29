import { createRequire } from 'module';
import puppeteer from 'puppeteer';
import { decode } from 'querystring';
import { readFile } from 'fs/promises';

const require = createRequire(import.meta.url);

export default async function createRelease(manifestPath, packageId, username, password) {
    console.log('Release Foundry VTT package', { manifestPath, packageId });

    const data = await readFile(manifestPath);
    const moduleData = JSON.parse(data.toString());

    const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 }); // Make sure this is wide enough to allow the TinyMCE toolbar to be visible

    if (process.env.NODE_ENV === 'development') {
        page.on('console', (message) =>
            console.log(`${message.type().substring(0, 3).toUpperCase()} ${message.text()}`),
        )
            .on('pageerror', ({ message }) => console.log(message))
            .on('response', (response) => console.log(`    ${response.status()} ${response.url()}`))
            .on('requestfailed', (request) => console.log(`    ${request.failure().errorText} ${request.url()}`));
    }

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
    await page.click('#privacy-policy-prompt button[name="agree"]');

    await page.click('#login-form [for="login-toggle"]');
    await new Promise((r) => setTimeout(r, 50)); // Wait for the form to be visible
    await editField('#login-form input[name="login_username"]', username);
    await editField('#login-form input[name="login_password"]', password);
    await page.click('#login-form button[name="login"]');
    await page.waitForSelector('#login-welcome');

    console.log('Modify package data...');
    await page.goto(`https://foundryvtt.com/admin/packages/package/${packageId}/change/`);
    const id = await page.$eval('tr.dynamic-versions:not(.has_original)', (e) => e.id);

    await editField('#id_name', moduleData.name);
    await editField('#id_title', moduleData.title);
    await editField('#id_url', moduleData.url);
    await editField(`#id_${id}-version`, moduleData.version);
    await editField(`#id_${id}-manifest`, moduleData.manifest);
    await editField(`#id_${id}-notes`, `${moduleData.url}/releases/tag/${moduleData.version}`);
    await editField(
        `#id_${id}-required_core_version`,
        moduleData.compatibility.minimum ?? moduleData.minimumCoreVersion,
    );
    await editField(
        `#id_${id}-compatible_core_version`,
        moduleData.compatibility.verified ?? moduleData.compatibleCoreVersion,
    );

    await page.waitForSelector('#id_description + .tox-tinymce button[title="Source code"]');
    await page.click('#id_description + .tox-tinymce button[title="Source code"]');
    await page.waitForSelector('.tox-dialog textarea');
    await editField('.tox-dialog textarea', moduleData.description);
    await page.click('.tox-dialog button[title="Save"]');

    if (process.env.NODE_ENV === 'development') {
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            request.abort();
            console.log('Request', request.url(), decode(request.postData()));
        });
    }

    await page.click('[name="_continue"]');
    await page.waitForNavigation({ waitUntil: 'load' });

    console.log('Done!');

    await browser.close();
}
