# Shopora — Improvement Notes

This document describes what changed, why, and how to verify it. The existing
architecture, database, migrations and API contracts were kept; nothing was
rebuilt from scratch.

---

## 1. Root causes that were found

Before changing anything, the existing frontend and backend were inspected.
Four concrete defects explain the symptoms you described.

| Symptom | Actual cause |
|---|---|
| **Categories link does nothing** | `App.jsx` rendered `<Link to="/categories">` but there was **no `<Route path="/categories">`**, so the router matched nothing and painted a blank page. There was also no categories endpoint on the API. |
| **Login state resets / behaves oddly on refresh** | `App.jsx` had a `useEffect` that read `performance.getEntriesByType("navigation")` and **deleted `shoporaUser` from localStorage on every reload**. That is a workaround, not a fix: it logs you out on refresh instead of validating the session. |
| **User A can see User B's cart / orders** | `cartId` was read from localStorage (`loggedInUser?.cartId`) and sent straight to the API, and **no endpoint checked that the cart or order belonged to the caller**. A stale `cartId` therefore read and mutated someone else's cart. `OrdersController.CreateOrder` had the same hole — it resolved the cart from the client-supplied `CartId`. |
| **Product ids could mismatch the database** | The frontend fetched products from `https://fakestoreapi.com/products` directly, while cart items and order items reference product ids from **your SQL Server table**. Separately, `ImportProducts` deserialised FakeStore's nested `rating: { rate, count }` into a flat model, so every imported product had `RatingRate = 0`. |

Two dead files were also found and removed, both of which were latent bugs:
`shopora/src/pages/Cart.jsx` (hardcoded `const cartId = 2`) and the duplicate
`shopora/src/pages/Login.jsx`.

---

## 2. Backend changes (`Shopora.API`)

**No models were changed and no migration was added.** The database schema is
untouched. All changes are additive or are ownership checks.

### `ProductsController.cs`
- `GET /api/products` now accepts optional `?category=` and `?search=` filters.
- **New:** `GET /api/products/categories` — the real distinct categories from
  the `Products` table. This is what the navbar uses, so categories can never
  drift from the catalogue.
- **New:** `GET /api/products/{id}/related?take=4`.
- `POST /api/products/import` now maps through a `FakeStoreProduct` DTO, so
  `RatingRate` and `RatingCount` are populated correctly instead of being 0.

### `CartController.cs`
- **New:** `GET /api/cart/user/{userId}` — resolves the cart belonging to a user,
  creating one if the account has none. **This is the fix for stale cart ids:**
  the frontend now asks "what is *this user's* cart?" instead of remembering a
  `CartId` from a previous session.
- Every cart read and mutation accepts an optional `?userId=` and returns
  **403** when the cart does not belong to that user.
- `AddToCart` now clamps quantity to a minimum of 1.

### `AuthController.cs`
- **New:** `GET /api/auth/me/{userId}` — re-validates a remembered session
  against the database and returns the authoritative account details plus the
  correct `cartId`.
- **New:** private `EnsureCartAsync(user)` — login and `/me` guarantee the
  account has a cart, so older accounts can no longer log in with a null
  `cartId`.

### `OrdersController.cs`
- `CreateOrder` resolves the cart **from the user**, not from the client-supplied
  `CartId`.
- `GET /api/orders/{id}` and `PUT /api/orders/{id}/pay` accept an optional
  `?userId=` and return **403** for another user's order.

### `Program.cs`
- CORS widened to the common Vite ports (`5173`, `5174`, `4173`, `127.0.0.1`).

> Note: an explicit `StatusCode(403, …)` is used rather than `Forbid()`, because
> no authentication scheme is registered and `Forbid()` would throw.

---

## 3. Frontend changes (`shopora`)

The 1,011-line `App.jsx` was split into a conventional structure. `App.jsx` is
now only providers and routes.

```
src/
  api/client.js              every API call, in one place
  config/store.js            currency, seller/carrier, delivery window
  context/AuthContext.jsx    session validation + pending-action replay
  context/CartContext.jsx    cart bound to the signed-in user
  context/CatalogContext.jsx products + categories
  context/ToastContext.jsx   "Added to cart" feedback
  hooks/                     useAddToCart, useClickOutside
  components/                Navbar, Footer, AuthPrompt, ProductCard,
                             CheckoutSteps, OrderSummaryPanel, OrderDetailView,
                             States, Rating, QuantityStepper, StatusBadge,
                             RouteHelpers
  pages/                     Home, Products, ProductDetails, Categories, Cart,
                             Checkout, Payment, OrderConfirmation, Orders,
                             OrderDetails, Profile, Login, Register, NotFound
```

### Guest vs authenticated
- The whole storefront is public. Home, products, product details, categories
  and search need no account.
- Protected pages (`/checkout`, `/payment`, `/orders`, `/profile`,
  `/order-confirmation`) are wrapped in `<RequireAuth>`.
- `/cart` deliberately is **not** redirected — it invites a guest to sign in
  instead of bouncing them.

### Session handling (the refresh fix)
`AuthContext` trusts **only the user id** from localStorage. On every startup it
calls `GET /api/auth/me/{userId}`:
- valid → the user object and `cartId` are taken from the **server**;
- 404 → the stored session is cleared and the visitor becomes a guest;
- network error → the visitor stays a guest without the stored id being
  destroyed, so the next successful load restores the session.

A stale `cartId` can no longer be used, because the cart is always resolved from
the server for the current user id.

### Action replay after login
`requireAuth({ message, action })` stores what the visitor was doing, shows the
login/register modal, and replays the action on success. A guest who clicks
**Add to Cart** signs in and the product is added automatically — no second
click.

### Other work
- **Navbar** — brand, Home, Products, working Categories dropdown (from the API),
  search, cart with a live count badge, and a profile dropdown with View
  Profile / My Orders / Logout (or Login / Create Account for guests). Mobile
  gets a drawer, not a shrunken desktop bar.
- **Product details** — redesigned: sticky gallery with click-to-zoom on the
  left; category, title, rating, price, availability, quantity, Add to Cart and
  Buy Now on the right; full description, product information, ratings and
  related products below.
- **Checkout** — Cart → Shipping → Payment → Confirmation, with the current step
  highlighted on all four pages.
- **Design system** — `App.css` rewritten around tokens (colour, radius, shadow,
  motion). Loading skeletons, empty states, error states and toasts throughout.
  Animations are short and subtle, and `prefers-reduced-motion` is respected.
- **Logout** clears the session, clears cart state, and returns you to the public
  store as a guest.

---

## 4. Things deliberately *not* faked

- **Payment.** The UI separates *"Payment method selected"* from *"Payment
  completed"*. Bank Transfer is labelled as a test flow that marks the order paid
  in your database — it does not claim a gateway processed anything.
- **Shipping/carrier.** Your schema has no carrier or tracking fields, so none
  were invented. Seller, carrier, method and the delivery lead time live in
  `src/config/store.js` with comments saying which API field should replace each
  one. The delivery window is computed from the **real** order date and is always
  labelled an estimate.
- **Reviews.** Your `Product` stores an average and a count, not review text, so
  the page shows exactly that and says written reviews are not collected yet.
- **Currency.** Your catalogue is FakeStore data priced in USD and
  `DeliveryCharge` is `5.00m`, so prices are still shown in `$`. Your brief used
  `Rs.` examples — relabelling dollars as rupees would be wrong, so instead
  `STORE.currency` in `src/config/store.js` is a single switch. Changing it means
  also converting the prices in the database.

---

## 5. How to run

```bash
# Backend
cd Shopora.API
dotnet run                  # http://localhost:5256

# Seed the catalogue ONCE if the Products table is empty
curl -X POST http://localhost:5256/api/products/import

# Frontend (node_modules in the zip was built on Windows — reinstall)
cd shopora
rm -rf node_modules         # on Windows: rmdir /s /q node_modules
npm install
npm run dev                 # http://localhost:5173
```

To point the frontend at a different API, create `shopora/.env`:

```
VITE_API_URL=http://localhost:5256/api
```

---

## 6. Verification checklist

I could not execute this myself — see section 7 — so please walk through it.

**Guest**
- [ ] Open `/` without logging in; the store loads and you are not forced to log in.
- [ ] Browse products, open a product, open Categories in the navbar.
- [ ] Click a category → only that category's products are shown; the URL reads `/products?category=…`.
- [ ] Search from the navbar → `/products?search=…` shows matches.
- [ ] Click **Add to Cart** as a guest → the sign-in modal appears.

**Auth and action replay**
- [ ] Register from that modal → the product is added automatically and the cart badge updates.
- [ ] Log out, log back in from the modal on a different product → same behaviour.
- [ ] Register a brand-new account from `/register`.

**The stale-state bugs**
- [ ] While logged in, refresh the browser → **you stay logged in** and the cart count is correct.
- [ ] Log out → refresh → you are a guest and the cart badge is empty.
- [ ] Log in as User A, add items, log out, log in as User B → **B's cart is B's own**, not A's.
- [ ] As User B, open `/orders/{an order id belonging to A}` → "This order belongs to a different account."

**Checkout**
- [ ] Cart → quantity +/- and Remove work, totals update.
- [ ] Proceed to Shipping → the step bar shows step 2; fields prefill from the account.
- [ ] Place order → Payment (step 3); choose Cash on Delivery and confirm.
- [ ] Confirmation (step 4) shows the order number, estimated delivery, items, address, payment and shipping method.
- [ ] Try Bank Transfer on another order → it is clearly labelled as a test flow.

**Account**
- [ ] `/orders` lists only your orders, newest first, with images and statuses.
- [ ] Click an order → full details; Print Receipt produces a clean page.
- [ ] `/profile` shows name, email, phone, customer id and member-since.
- [ ] Logout returns you to the public store.

**Responsive** — check the navbar drawer, category list, product grid, product
details, cart, checkout and orders at desktop, tablet and phone widths.

---

## 7. What I could not verify

I was unable to run either application in my environment, so **the checklist
above has not been executed**:

- The bundled `node_modules` was installed on Windows (`lightningcss-win32-x64-msvc`,
  and the Linux `rolldown` native binding is absent), and my sandbox had no
  network access to reinstall. `npm run build` therefore could not run.
- No .NET SDK was available, so the API could not be compiled or started.

What I did verify statically across all 36 JS/JSX files and every `.cs` file:
brackets and JSX tags balance; every local import resolves to a real file and to
a real export; no unused imports; every `className` used in JSX has a matching
rule in `App.css`; no component reads `localStorage` or hardcodes the API URL
outside the two modules that should.

Static checks are not a substitute for a compiler. Please run
`npm install && npm run build` first — if anything is wrong, it will surface
there.
