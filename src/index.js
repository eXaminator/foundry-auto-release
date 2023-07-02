import createRelease from './createRelease.js';

const [, , manifestPath, packageId, username, password] = process.argv;

if (!manifestPath) throw new Error('Missing argument 1: Manifest path');
if (!packageId) throw new Error('Missing argument 2: Package id');
if (!username) throw new Error('Missing argument 3: Username');
if (!password) throw new Error('Missing argument 4: Password');

try {
    await createRelease(manifestPath, packageId, username, password);
} catch (error) {
    console.error(error);
    process.exit(1);
}
