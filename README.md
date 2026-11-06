# Clean Image Saver

Right-click any image on the web and save it as **PNG, JPG or WebP**.

- Converts images locally, inside your browser: nothing is uploaded anywhere.
- Collects no data: no analytics, no tracking, no ads, no servers.
- Asks permission for a website only the first time you save an image from it.
- English and Italian.

## How it works

`sfondo.js` (the background service worker) adds the right-click menu, downloads the image from its own site,
draws it on an `OffscreenCanvas`, converts it with `convertToBlob` and saves it with the `downloads` API.
`impostazioni.html` is the settings page (ask where to save, JPG/WebP quality).

## Install from source

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose this folder.

## Privacy

See [docs/privacy.html](docs/privacy.html).

## License

MIT, see [LICENSE](LICENSE).
