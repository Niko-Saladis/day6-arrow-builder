// Parent Shopify origin for secure postMessage
export const PARENT_ORIGIN = 'https://dev.daysixgear.com';

export function addToShopifyCart(variantId, cfg) {
  if (!window.parent) return;
  window.parent.postMessage(
    {
      type: 'ADD_TO_CART',
      variantId,
      quantity: 1,
      properties: {
        fletch: cfg.fourFletch ? '4-fletch' : '3-fletch',
        vane_primary: cfg.vaneColor,
        vane_secondary: cfg.secondaryVaneColor,
        nock: cfg.nockColor,
        wrap: cfg.wrapColor
      }
    },
    PARENT_ORIGIN
  );
}

export function postResize() {
  const h = document.documentElement.scrollHeight;
  if (window.parent) {
    window.parent.postMessage({ type: 'RESIZE', height: h }, PARENT_ORIGIN);
  }
}
