// <c-splash-scene> : 3D jacket (three.js) that auto-rotates, spins faster with
// the scroll velocity (Lenis) and moves its camera along the scroll progress.
// Adapted from the workshop SplashCanvas module:
//   - Web Component instead of a modujs module (creates its own <canvas>)
//   - ResizeObserver instead of the RESIZE_END custom event
//   - ScrollTrigger (scrub) instead of data-scroll-module-progress
//   - window.lenis instead of window.locomotiveScrollData
//   - camera.lookAt() instead of OrbitControls (zoom/rotate were disabled anyway)
//
// Attributes (all optional):
//   data-src     URL of the .glb model
//   data-envmap  URL of the equirectangular environment map

import {
    Group,
    EquirectangularReflectionMapping,
    PerspectiveCamera,
    Scene,
    SRGBColorSpace,
    TextureLoader,
    WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const ASSETS_BASE =
    'https://cdn.jsdelivr.net/gh/Victor-Sin/workshop-web-flow-test@webflow-v0.1.0/webflow/assets/3d/';
const DEFAULT_SRC = ASSETS_BASE + 'redjacket.optimized.glb';
const DEFAULT_ENVMAP = ASSETS_BASE + 'envmap.jpg';
const DRACO_DECODER_PATH = 'https://www.gstatic.com/draco/v1/decoders/';

const CAMERA_FROM = { x: 15, y: 25, z: 15 };
const CAMERA_TO = { x: 15, y: -5, z: 15 };

if (!customElements.get('c-splash-scene')) {
    class SplashScene extends HTMLElement {
        connectedCallback() {
            this.boot();
        }

        disconnectedCallback() {
            this.destroy();
        }

        boot() {
            if (!this.isConnected || this._booted) return;
            this._booted = true;
            this.init();
        }

        init() {
            const canvas = (this._canvas = document.createElement('canvas'));
            this.appendChild(canvas);

            this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });

            this.scene = new Scene();
            this.wrapper = new Group();
            this.scene.add(this.wrapper);

            this.camera = new PerspectiveCamera(30, 1, 0.01, 100);
            this.camera.position.set(CAMERA_FROM.x, CAMERA_FROM.y, CAMERA_FROM.z);
            this.camera.lookAt(0, 0, 0);
            this.scene.add(this.camera);

            this._observer = new ResizeObserver(() => this.resize());
            this._observer.observe(this);
            this.resize();

            this.initScrollTrigger();
            this.loadModel();
            this.render();
        }

        // Camera travels from above to below the jacket while the element crosses the viewport
        initScrollTrigger() {
            const { gsap, ScrollTrigger } = window;
            if (!gsap || !ScrollTrigger) return;
            gsap.registerPlugin(ScrollTrigger);

            this.tl = gsap.timeline({
                scrollTrigger: {
                    trigger: this,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            });
            this.tl.fromTo(
                this.camera.position,
                { ...CAMERA_FROM },
                { ...CAMERA_TO, ease: 'none' },
            );
        }

        loadModel() {
            const gltfLoader = new GLTFLoader();
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
            gltfLoader.setDRACOLoader(dracoLoader);
            this._dracoLoader = dracoLoader;

            const src = this.dataset.src || DEFAULT_SRC;
            const envUrl = this.dataset.envmap || DEFAULT_ENVMAP;

            gltfLoader.load(
                src,
                (gltf) => {
                    if (!this._booted) return; // element removed while loading

                    // Environment map instead of lights, for realistic reflections
                    const envMap = new TextureLoader().load(envUrl);
                    envMap.mapping = EquirectangularReflectionMapping;
                    envMap.colorSpace = SRGBColorSpace;
                    this._envMap = envMap;

                    gltf.scene.traverse((node) => {
                        if (node.isMesh) {
                            node.material.envMap = envMap;
                            node.material.envMapIntensity = 2;
                        }
                    });

                    this.wrapper.add(gltf.scene);
                },
                undefined,
                (error) => console.error('c-splash-scene: model failed to load', error),
            );
        }

        resize() {
            if (!this.renderer || !this.camera) return;
            const { width, height } = this.getBoundingClientRect();
            if (!width || !height) return;

            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            // false: CSS keeps control of the canvas display size
            this.renderer.setSize(width, height, false);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }

        // Base spin + extra spin proportional to the scroll velocity, in the scroll direction
        scrollMotion() {
            const lenis = window.lenis;
            const velocity = lenis?.velocity ?? 0;
            const direction = lenis?.direction ?? 1;
            return (0.01 + Math.abs(velocity * 0.005)) * (direction || 1);
        }

        render() {
            if (!this._booted || !this.renderer) return;

            this.wrapper.rotation.y += this.scrollMotion();
            this.camera.lookAt(0, 0, 0);
            this.renderer.render(this.scene, this.camera);

            this._raf = requestAnimationFrame(() => this.render());
        }

        destroy() {
            this._booted = false;

            if (this._raf) cancelAnimationFrame(this._raf);
            this._raf = null;

            this._observer?.disconnect();
            this._observer = null;

            this.tl?.scrollTrigger?.kill();
            this.tl?.kill();
            this.tl = null;

            this.scene?.traverse((node) => {
                if (!node.isMesh) return;
                node.geometry?.dispose();
                const materials = Array.isArray(node.material) ? node.material : [node.material];
                materials.forEach((material) => material?.dispose());
            });
            this._envMap?.dispose();
            this._envMap = null;
            this._dracoLoader?.dispose();
            this._dracoLoader = null;

            if (this.renderer) {
                this.renderer.dispose();
                this.renderer.forceContextLoss();
            }
            this.renderer = null;
            this.scene = null;

            this._canvas?.remove();
            this._canvas = null;
        }
    }

    customElements.define('c-splash-scene', SplashScene);
}
