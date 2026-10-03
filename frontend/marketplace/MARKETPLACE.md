# Marketplace setup and verification

The marketplace runs on port **5174** and the Provider application on **5173**.
Start both applications for the property-owner signup flow. Customer signup stays
at `/register`; `/signup` on the marketplace redirects to Provider signup.

Copy `.env.example` into your local environment configuration as needed:

- `VITE_PROVIDER_URL`: Provider application's origin. Set this to its deployed URL
  in production. The local fallback uses the current hostname with port 5173.
- `VITE_SUPPORT_EMAIL`: Contact page email; defaults to the existing project
  address, `support@manzil.af`.
- `VITE_MAP_TILE_URL` and `VITE_MAP_ATTRIBUTION`: Optional tile provider settings.
  The default is OpenStreetMap's standard tile service. For production traffic,
  review [the tile usage policy](https://operations.osmfoundation.org/policies/tiles/)
  and configure a suitable tile service and its required attribution.

The map uses [Leaflet](https://leafletjs.com/reference), property coordinates from
the marketplace API, clickable price markers and property links. Invalid or
missing coordinates are excluded from markers but properties remain in the list.

About, Help, Contact, Terms, Privacy and Cancellation Policy have complete local
content in English, Dari and Pashto. A published CMS version for the selected
language replaces the local page content. An unavailable CMS does not make these
pages disappear. Custom owner-authored property descriptions, policies, room
names and reviews remain as supplied by the backend; standard catalog labels are
translated by the marketplace.

Verification commands, run from `frontend/marketplace`:

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd run test:marketplace
```

The regression script verifies translation key parity, all six information pages
in all three languages without CMS data, Provider links, 404 content, galleries
with more than three images and empty galleries, and catalog fallback behavior.
It uses server rendering and does not replace browser checks of image dialogs,
map tiles or mobile layouts.
