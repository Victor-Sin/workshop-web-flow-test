# Webflow external files

Web Components and styles loaded by the Webflow "Home Copy" page from jsDelivr, instead of hand-written code embeds. Based on the Locomotive workshop [Bringing a One-Page Design to Life](https://one-page-to-life.workshops.locomotive.ca/).

`gsap`, `ScrollTrigger` and `lenis` (`window.lenis`) are provided globally by the Webflow site.

## Structure

- `webflow/src/components/` : `c-grid-mosaic`, `c-collection-product`, `c-splash-scene` (three.js jacket)
- `webflow/src/styles/home.css` : shared styles
- `webflow/dist/` : built files (committed, served by jsDelivr)
- `webflow/assets/3d/` : jacket model (`.glb`) and environment map

## Build and release

```bash
npm install
npm run build:webflow
git add webflow && git commit -m "..."
git tag webflow-vX.Y.Z && git push origin main webflow-vX.Y.Z
```

Files are served at `https://cdn.jsdelivr.net/gh/Victor-Sin/workshop-web-flow-test@<tag>/webflow/dist/<file>`. Always point Webflow at a tag, not `@main` (jsDelivr caches branches for up to 12 h). When releasing a new tag, update the tag in the Webflow loader embed and in the default asset URLs of `c-splash-scene.js`.

## Usage in Webflow

Add a single embed inside `<main>` of the page:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Victor-Sin/workshop-web-flow-test@webflow-v0.1.1/webflow/dist/home.css">
<script type="module" src="https://cdn.jsdelivr.net/gh/Victor-Sin/workshop-web-flow-test@webflow-v0.1.1/webflow/dist/c-grid-mosaic.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/gh/Victor-Sin/workshop-web-flow-test@webflow-v0.1.1/webflow/dist/c-collection-product.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/gh/Victor-Sin/workshop-web-flow-test@webflow-v0.1.1/webflow/dist/c-splash-scene.js"></script>
```

It must live in `<main>` so that the Swup scripts plugin re-runs it on page transitions.

## Credits

### 3D Jacket Model
[Sketchfab](https://sketchfab.com/3d-models/jacket-c3d2b183d3534979ad43493b4634c034) model by [ypushkar30](https://sketchfab.com/ypushkar30) under the [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) license.
The original model has been slightly altered to better fit this project (changed color from black to red).
