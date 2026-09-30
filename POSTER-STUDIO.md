# Posterr

A static, dependency-free TV and movie poster editor for GitHub Pages.

## Run

Use a static server (ES modules and SVG fetching require HTTP):

```sh
python -m http.server 5173 --bind 127.0.0.1
```

Open http://127.0.0.1:5173. No install or build is required.

## TMDB connection

The editor opens with an empty canvas. Click **Show a random sample** to choose a random TMDB title with artwork (a connection is required). The supplied templates are never used as samples.

Click **TMDB connection** and enter your own API Read Access Token or v3 API key from https://www.themoviedb.org/settings/api. By default it is retained only for the browser session; **Remember on this device** stores it in localStorage. Disconnect clears both. No credential is included in the repository.

Search returns title, year, and poster thumbnails. The editor prefers posters tagged with `iso_639_1: null`. This is TMDB's language-neutral metadata, not a guarantee that the actual pixels contain no text. When unavailable, the ordinary poster is used and the status explains the fallback. Disable the language-neutral filter to browse other posters. Title logos initially prefer English. The title-layer language menu filters the gallery by language, language-neutral, or all languages. Missing title logos can be uploaded.

TV layouts place the channel/service logo at the top left. Movie layouts place it beneath the title. A recognized TV network or movie production company supplies the default mark. If none matches the local SVG bank, region-specific streaming providers are checked; the suggested service can always be replaced. This does not establish exclusive distribution or original-release provenance. Provider availability is supplied by JustWatch via TMDB.

## Editing

The interface uses neutral white accents in dark mode and neutral black accents in light mode. The header theme switch saves your choice in this browser. Layer and visibility icons use inline SVGs. Search channels, services, and studios in the service layer to browse selectable logo previews; the separate logo library is searchable too.

- One sidebar contains four layers: poster, bottom gradient, title logo, service/studio SVG. TV/movie selection and TMDB search share the top row with export.
- Select the poster or title layer to browse TMDB artwork and show its upload button.
- Ctrl+Z / Cmd+Z undoes poster edits; Ctrl+Y or Ctrl+Shift+Z / Cmd+Shift+Z redoes them. Undo also has a toolbar button. Text inputs keep their native text undo behavior.
- Hide/show any layer; select a layer to edit its properties.
- Upload JPG/PNG/WebP posters and transparent PNG/WebP or SVG title logos.
- Sliders adjust title and service logo size and position. Each layer has a **Center horizontally** button. Canvas arrow keys move the selected logo; Shift moves it farther. Cursor dragging is disabled.
- The enlarged, borderless preview retains the 2:3 export ratio. Service logos use visible-artwork bounds with SVG padding removed. Individual TV and movie presets match the supplied placement references; TV marks align at the top left and movie marks at the bottom center. Unreferenced brands use a general preset. Selecting a brand or resetting the layout reapplies its preset; sliders allow manual changes.
- Prime and Prime Video are separate marks. Netflix uses the N + SERIES lockup, Paramount+ uses its script wordmark, and CBS includes its wordmark. Disney and Disney · Pixar are additional movie variants. Apple TV defaults to black, A24 to pink, and Prime to blue; Netflix and Marvel Studios preserve their multicolor artwork.
- Recolor service SVGs or retain original colors. Black/white logo interiors become transparent cutouts when recolored, so lettering remains legible.
- Adjust gradient color, height, fade spread, and opacity.
- Export a PNG at 1000 Ã— 1500 (2:3). Artwork of another ratio is center-cropped.
- Upload a custom SVG directly from the service layer to save it in the library and select it immediately. Add named SVG logos in the separate logo library. Custom logos persist in this browser, with JSON export/import for backups. Only path/shape SVGs are supported; script, external resources, embedded images, and text elements are removed. Convert lettering to paths before upload.
- The random sample uses TMDB discovery and the same separate artwork/logo layers as a searched title.

## GitHub Pages

1. Upload `index.html`, `style.css`, `app.js`, `.nojekyll`, and `assets/` to your repository.
2. In **Settings â†’ Pages**, choose **Deploy from a branch**.
3. Select your branch and **/ (root)**, then save.

All asset paths are relative, so repository subpaths work. There is no backend, build process, or server-side secret. Each user enters their own TMDB credential. A shared private credential would require an external proxy because GitHub Pages cannot hide secrets. Uploads and custom logos stay on the device; only TMDB searches and image requests leave the browser. Google Fonts supplies the optional interface fonts; system fonts provide the fallback.

## Bundled logos

49 locally bundled SVGs include every requested channel and studio: Netflix, Hulu, Prime, Prime Video, Adult Swim, Viceland, Disney, Disney · Pixar, Apple TV+, HBO, Paramount+, NBC, CBS, Cartoon Network, DC, A24, FX, AMC, FOX, ABC, BBC, Channel 4, Disney+, Peacock, HBO Max, Crave, Illico+, Walt Disney Pictures, Pixar, Marvel Studios, Lucasfilm, 20th Century Studios, Searchlight Pictures, Universal Pictures, Focus Features, Illumination, DreamWorks Animation, Warner Bros. Pictures, New Line Cinema, Warner Bros. Pictures Animation, Columbia Pictures, TriStar Pictures, Sony Pictures Classics, Sony Pictures Animation, Paramount Pictures, Republic Pictures, Nickelodeon Movies, Miramax, and Lionsgate.

The original bank uses [Simple Icons](https://github.com/simple-icons/simple-icons) versions 11 and 5 (CC0 package), plus the Cartoon Network and A24 assets from Wikimedia Commons. The expanded bank is sourced from the SVG references on Wikimedia article pages, with Illico+ sourced directly from its official website and Lionsgate from CDNLogo. Exact file and page references are recorded in `assets/logo-sources.json`. Brand marks remain their owners' trademarks.

## Verification

`node --check app.js` checks syntax. `node tests/integration.cjs` checks blank startup, contextual uploads, undo/redo, random discovery, custom SVG additions from the service layer, all 49 asset files, title-language filtering, horizontal centering and undo, per-brand placement presets, TMDB authentication, language-neutral selection, missing-artwork fallback, provider matching, and stale selection handling with mocked API responses. Real TMDB search requires a user credential and is not verified by those mocked checks.

The editor fits the viewport with a compact header and a scrolling layer sidebar. The service layer offers a diagonal contrast gradient beneath its logo, off by default. Enable it to reveal color, height, fade spread, and opacity controls. The gradient follows the logo and is included in PNG exports and undo history.

The logo contrast gradient is a continuous 45-degree corner fade across the poster, with no rectangular crop. It anchors to the corner nearest the logo and fades toward the artwork; height sets its reach, while fade spread controls the transition.
