// <c-collection-product> : staggered parallax on the product list items.
// Each [data-product="item"] starts shifted up (--py) and settles to 0 while
// the [data-product="container"] scrolls into view.
//
// Expected markup:
//   [data-product="container"]
//     <c-collection-product>  (wraps the Webflow Collection List)
//       [data-product="item"] x N   (CMS items, may render after the element is connected)

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

const MOBILE_QUERY = '(max-width: 767px)';
const OFFSET_STEP = 150; // px between two consecutive items

if (!customElements.get('c-collection-product')) {
    class CollectionProduct extends HTMLElement {
        connectedCallback() {
            this.init();
        }

        disconnectedCallback() {
            this._booted = false;
            this.stopObserving();
            if (this._onLoad) {
                window.removeEventListener('load', this._onLoad);
                this._onLoad = null;
            }
            if (this.mobile && this.onMedia) {
                this.mobile.removeEventListener('change', this.onMedia);
            }
            this.killTimeline();
        }

        // Items can be injected after connection: wait for them
        observeItems() {
            if (this._observer) return;
            this._observer = new MutationObserver(() => {
                if (this.querySelector('[data-product="item"]')) this.init();
            });
            this._observer.observe(this, { childList: true, subtree: true });
        }

        stopObserving() {
            if (!this._observer) return;
            this._observer.disconnect();
            this._observer = null;
        }

        init() {
            if (!this.isConnected) return;
            if (this._booted) {
                this.computeTl();
                return;
            }

            this.container = this.closest('[data-product="container"]');
            if (!this.container) return;

            this.items = Array.from(this.querySelectorAll('[data-product="item"]'));
            if (!this.items.length) {
                this.observeItems();
                return;
            }
            this.stopObserving();

            this._booted = true;
            this.tl = null;
            this._itemCount = this.items.length;

            this.mobile = window.matchMedia(MOBILE_QUERY);
            this.onMedia = this.computeTl.bind(this);
            this.mobile.addEventListener('change', this.onMedia);

            gsap.registerPlugin(ScrollTrigger);

            this._onLoad = this.onLoad.bind(this);
            window.addEventListener('load', this._onLoad);

            this.computeTl();
        }

        // Late CMS items: rebuild if the item count changed
        onLoad() {
            if (!this.isConnected || !this._booted) return;
            const count = this.querySelectorAll('[data-product="item"]').length;
            if (count === this._itemCount) return;
            this.items = Array.from(this.querySelectorAll('[data-product="item"]'));
            this._itemCount = this.items.length;
            this.computeTl();
        }

        killTimeline() {
            if (!this.tl) return;
            this.tl.scrollTrigger?.kill();
            this.tl.kill();
            this.tl = null;
        }

        computeTl() {
            this.killTimeline();
            if (!this._booted || !this.isConnected || !this.items?.length) return;

            // No parallax on mobile
            if (this.mobile.matches) {
                gsap.set(this.items, { '--py': 0 });
                return;
            }

            const container = this.closest('[data-product="container"]');
            if (!container) return;

            this.tl = gsap.timeline({
                scrollTrigger: {
                    trigger: container,
                    start: 'top bottom',
                    end: 'bottom bottom',
                    scrub: true,
                },
            });

            this.items.forEach((item, index) => {
                gsap.set(item, { '--py': -OFFSET_STEP + index * OFFSET_STEP });
                this.tl.to(
                    item,
                    { '--py': 0, ease: 'none', duration: 1, immediateRender: false },
                    0,
                );
            });
        }
    }

    customElements.define('c-collection-product', CollectionProduct);
}
