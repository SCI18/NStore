# NStore

A static, no-build-step online store for clothing and wigs, with EN/FR language packs and WhatsApp/email checkout.

## Structure

```
NStore/
├── index.html            Main page
├── css/styles.css         All styling
├── js/
│   ├── config.js          EDIT ME: WhatsApp number, order email, currency
│   ├── i18n.js            Language pack loader (lang/en.json, lang/fr.json)
│   ├── app.js             Product grid, swatch filter, product modal
│   └── cart.js            Cart drawer + checkout link building
├── lang/en.json           English text
├── lang/fr.json           French text
├── data/products.json     Product catalog
└── images/
    ├── sample/            Placeholder SVGs (delete once you swap in real photos)
    └── ...                Your real product images go here
```

## First thing to edit: `js/config.js`

```js
window.STORE_CONFIG = {
  whatsappNumber: "15551234567", // digits only, country code, no + or spaces
  orderEmail: "orders@yourstore.com",
  currencySymbol: "$",
  defaultLang: "en"
};
```

## Adding your real products

Open `data/products.json`. Each product looks like:

```json
{
  "id": "cw-005",
  "category": "clothing",
  "image": "images/your-photo.jpg",
  "price": 45.00,
  "name": { "en": "Product name", "fr": "Nom du produit" },
  "description": { "en": "...", "fr": "..." },
  "options": [
    { "type": "size", "label": { "en": "Size", "fr": "Taille" }, "values": ["S", "M", "L"] }
  ]
}
```

- `category` is either `"clothing"` or `"wigs"` (drives the swatch-rail filter).
- `image` should point at a file inside `images/` — put your actual product photos there and reference them here. You said you already have photos in `NStore/images/`; just point each product's `image` field at the right filename.
- `options` is optional — use it for size (clothing) or length/color (wigs). Leave it out (`"options": []`) for a product with no variants.
- Once you're using real photos, you can delete `images/sample/` and the sample products in `products.json`.

## Editing the language packs

`lang/en.json` and `lang/fr.json` hold all the static site text (nav, hero, buttons, cart labels). Product names/descriptions live in `products.json` instead, since they're per-product.

## Local preview

No build step needed — just serve the folder:

```bash
cd NStore
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

To preview over a public URL with your existing cloudflared setup:

```bash
cloudflared tunnel --url http://localhost:8080
```

## Deploying (GitHub + Cloudflare Pages, same as webutility)

```bash
cd NStore
git add .
git commit -m "Initial NStore build"
git branch -M main   # already done, but harmless if repeated
git remote add origin https://github.com/<your-username>/NStore.git
git push -u origin main
```

Then in the Cloudflare dashboard:
1. **Workers & Pages → Create → Pages → Connect to Git**
2. Select the `NStore` repo, branch `main`
3. Build settings: **Framework preset: None**, **Build command: (leave blank)**, **Build output directory: /**
4. Deploy — you'll get a `nstore.pages.dev` URL, and every push to `main` auto-deploys.

## Notes

- Cart and language preference are stored in the browser's `localStorage`, per visitor — there's no backend or database.
- Checkout doesn't take payment; it opens a pre-filled WhatsApp chat or email with the order summary so you can confirm sizing, delivery, and payment directly with the customer.
- Everything is plain HTML/CSS/JS, so there's nothing to build or compile before deploying.
