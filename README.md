# Foundry VTT automatic release action

This action connects to the FoundryVTT website via puppeteer,
logs in and creates a new release for the given module using
the information found inside the given module.json file.

## Inputs
## `manifest-path`
**Required** Location of the module.json file which contains all relevant information.

## `package-id`
**Required** ID of the package in the Foundry VTT package manager.

## `fvtt-username`
**Required** Your FVTT username used to administrate your package.

## `fvtt-password`
**Required** Your FVTT password used to administrate your package.

## Example usage

```yaml
uses: eXaminator/foundry-auto-release@1.0.0
with:
    manifest-path: './dist/module.json'
    package-id: ${{ secrets.FVTT_PACKAGE_ID }}
    fvtt-username: ${{ secrets.FVTT_USERNAME }}
    fvtt-password: ${{ secrets.FVTT_PASSWORD }}
```

## Warning
**Never** pass your password or username in plain text! Always use GitHub secrets for this!