// <c-grid-mosaic> : items of a grid converge toward its center while scrolling.
// Adapted from the workshop FancyGallery module. Progress is driven by a
// ScrollTrigger (scrub) instead of locomotive-scroll, and motion is exposed
// through CSS custom properties (--mx, --my, --rot, --sc, --op) so the
// Webflow styles stay in charge of the final transform.
//
// Expected markup:
//   [data-grid-mosaic="track"]  (ancestor, scroll range)
//     <c-grid-mosaic>
//       [data-grid-mosaic="grid"]
//         [data-grid-mosaic="item"] x N

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

const MOBILE_QUERY = '(max-width: 767px)';
const SINGLE_DURATION = 1; // base timing unit
const CSS_VARS = ['--mx', '--my', '--rot', '--sc', '--op'];

function debounce(fn, wait) {
    let timer;
    return () => {
        clearTimeout(timer);
        timer = setTimeout(fn, wait);
    };
}

if (!customElements.get('c-grid-mosaic')) {
    class GridMosaic extends HTMLElement {
        connectedCallback() {
            this.init();
        }

        disconnectedCallback() {
            this._booted = false;
            this._gen = (this._gen || 0) + 1;
            this.killTimeline();
            if (this._listening) {
                window.removeEventListener('resize', this.onResize);
                this._mobile.removeEventListener('change', this.onResize);
                this._listening = false;
            }
        }

        init() {
            if (!this.isConnected) return;
            if (this._booted) {
                this.computeTl();
                return;
            }

            this.$grid = this.querySelector('[data-grid-mosaic="grid"]');
            this.$items = Array.from(this.querySelectorAll('[data-grid-mosaic="item"]'));
            this.$track = this.closest('[data-grid-mosaic="track"]') || this.parentElement;
            if (!this.$grid || !this.$items.length) return;

            this._booted = true;
            this.tl = null;
            this._mobile = window.matchMedia(MOBILE_QUERY);

            gsap.registerPlugin(ScrollTrigger);

            // Sizes are computed in pixels, so recompute on resize
            this.onResize = this.onResize || debounce(() => this.computeTl(), 200);
            if (!this._listening) {
                window.addEventListener('resize', this.onResize);
                this._mobile.addEventListener('change', this.onResize);
                this._listening = true;
            }

            this.computeTl();
        }

        clearItems() {
            this.$items.forEach((item) => {
                CSS_VARS.forEach((name) => item.style.removeProperty(name));
                item.style.zIndex = '';
            });
        }

        killTimeline() {
            if (!this.tl) return;
            this.tl.scrollTrigger?.kill();
            this.tl.kill();
            this.tl = null;
        }

        computeTl() {
            if (!this._booted || !this.$grid || !this.isConnected) return;

            // Get rid of the old timeline and reset everything
            this.killTimeline();
            this.clearItems();

            // Simplified layout on mobile: no grid animation
            if (this._mobile.matches) return;

            const generation = (this._gen = (this._gen || 0) + 1);

            // RAF so the cleared styles are applied before measuring
            requestAnimationFrame(() => {
                if (generation !== this._gen || !this.isConnected) return;

                const gridBox = this.$grid.getBoundingClientRect();
                if (!gridBox.width || !gridBox.height) return;

                this.tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: this.$track,
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: true,
                    },
                });

                this.$items.forEach((item, i) => {
                    const itemBox = item.getBoundingClientRect();

                    // Offset from the item center to the grid center, in % of the grid
                    const dx = gridBox.left + gridBox.width / 2 - (itemBox.left + itemBox.width / 2);
                    const dy = gridBox.top + gridBox.height / 2 - (itemBox.top + itemBox.height / 2);
                    const x = (dx / gridBox.width) * 100;
                    const y = (dy / gridBox.height) * 100;

                    // The greater the index, the longer the duration (everyone starts together)
                    const duration = SINGLE_DURATION + 0.3 * i;

                    let rotateZ = 0;
                    let opacity = 1;

                    if (i === 0) {
                        // First item stays on top and fully visible
                        item.style.zIndex = '2';
                    } else {
                        // Organic look: random start rotation, fades out with distance
                        rotateZ = Math.random() * 30 - 15;
                        opacity = 0.2;
                    }

                    gsap.set(item, { '--mx': 0, '--my': 0, '--rot': rotateZ, '--sc': 1, '--op': 1 });

                    this.tl.to(
                        item,
                        { '--mx': x, '--my': y, '--rot': 0, '--sc': 1, duration, ease: 'power2.inOut' },
                        0,
                    );

                    this.tl.to(
                        item,
                        { '--op': opacity, duration: duration * 0.8, ease: 'power1.in' },
                        0,
                    );
                });
            });
        }
    }

    customElements.define('c-grid-mosaic', GridMosaic);

    window.addEventListener('load', () => {
        document.querySelectorAll('c-grid-mosaic').forEach((el) => el.computeTl());
    });
}
