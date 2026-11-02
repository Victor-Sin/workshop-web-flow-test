import esbuild from 'esbuild';

// Builds the Webflow external files (Web Components + CSS) into webflow/dist.
// gsap, ScrollTrigger and lenis are provided globally by the Webflow site.
const result = await esbuild.build({
    entryPoints: {
        'c-grid-mosaic': 'webflow/src/components/c-grid-mosaic.js',
        'c-collection-product': 'webflow/src/components/c-collection-product.js',
        'c-splash-scene': 'webflow/src/components/c-splash-scene.js',
        'home': 'webflow/src/styles/home.css',
    },
    outdir: 'webflow/dist',
    bundle: true,
    minify: true,
    format: 'esm',
    target: ['es2020'],
    legalComments: 'none',
    logLevel: 'info',
    metafile: true,
});

for (const [file, output] of Object.entries(result.metafile.outputs)) {
    console.log(`${file}  ${(output.bytes / 1024).toFixed(1)} KB`);
}
