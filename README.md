# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Google Indexing API bulk-submit script

`scripts/index-urls.js` reads every URL from the live sitemap (`https://www.trademarco.com/sitemap.xml`) and submits each one to Google's Indexing API so Google recrawls it faster than waiting on normal sitemap crawl cadence, instead of clicking "Request Indexing" by hand in Search Console for every product page.

### 1. Create a Google Cloud Service Account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and select (or create) a project.
2. **APIs & Services → Library** → search **"Web Search Indexing API"** → click **Enable**.
3. **APIs & Services → Credentials → Create Credentials → Service Account**. Give it any name (e.g. `sitemap-indexer`), no special roles needed.
4. Open the new service account → **Keys → Add Key → Create new key → JSON**. This downloads a `.json` key file — treat it like a password, never commit it.

### 2. Add the Service Account as a Search Console owner

The Indexing API only accepts requests from an identity that owns the property in Search Console — a service account is not automatically trusted just because it can call the API.

1. Open the downloaded JSON key file and copy the `client_email` value (looks like `sitemap-indexer@your-project.iam.gserviceaccount.com`).
2. In [Search Console](https://search.google.com/search-console) → select the `trademarco.com` property → **Settings → Users and permissions → Add user**.
3. Paste the service account's email and set its permission to **Owner** (Full access is required — a lower "Restricted" role cannot call the Indexing API).

### 3. Install & run

```bash
npm install google-auth-library   # first time only
```

Place the downloaded key as `service-account.json` in the project root (already gitignored), then:

```bash
node scripts/index-urls.js                 # sends up to 200 not-yet-submitted URLs
node scripts/index-urls.js --dry-run        # preview what would be sent, no API calls
node scripts/index-urls.js --limit=50       # override the daily cap
node scripts/index-urls.js --key=./other.json  # use a different key file path
node scripts/index-urls.js --reset          # forget submission history, resend everything
```

Google's Indexing API allows 200 publish requests/day by default. The script tracks which URLs have already been submitted successfully in `scripts/.index-urls-state.json` (also gitignored), so if the sitemap has more than 200 URLs, running it again on a later day automatically continues with whatever wasn't sent yet — no need to track progress manually.
