import { ADMIN_COLORS } from "../../theme";
import { Notice, card } from "./ui";

// Setup steps for the Search Console connection, shown wherever its data
// would appear while it isn't connected. Explains exactly what is missing.
export default function GscSetup({ status }) {
  return (
    <div style={{ ...card, fontSize: 13, lineHeight: 1.65 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: ADMIN_COLORS.navy, marginBottom: 8 }}>Connect Google Search Console</div>
      {status?.configured && !status.connected && (
        <div style={{ marginBottom: 12 }}>
          <Notice tone="error" title="Credentials are set but Google refused the request">{status.error}</Notice>
        </div>
      )}
      {status?.invalid && <div style={{ marginBottom: 12 }}><Notice tone="error">{status.invalid}</Notice></div>}
      {status?.missing?.length > 0 && (
        <p style={{ margin: "0 0 10px" }}>Missing environment variables: <code>{status.missing.join(", ")}</code>.</p>
      )}
      <p style={{ margin: "0 0 10px" }}>
        Search data is read server-side with a Google service account, so no Google login or token ever reaches the browser. The access is read-only.
      </p>
      <ol style={{ margin: 0, paddingLeft: 20 }}>
        <li>In Google Cloud Console (any project), enable the <strong>Google Search Console API</strong>.</li>
        <li>Create a <strong>service account</strong> (IAM &amp; Admin → Service Accounts) and add a <strong>JSON key</strong>. No roles are needed.</li>
        <li>In Search Console → Settings → <strong>Users and permissions</strong>, add the service account&rsquo;s email as a user with <strong>Restricted</strong> permission.</li>
        <li>In Vercel → the trademarco-llc project → Settings → Environment Variables, add for Production:
          <ul style={{ margin: "4px 0" }}>
            <li><code>GSC_SERVICE_ACCOUNT_JSON</code> — the whole JSON key file contents (mark as Sensitive)</li>
            <li><code>GSC_PROPERTY</code> — the property exactly as Search Console names it: <code>sc-domain:trademarco.com</code> for a domain property, or <code>https://www.trademarco.com/</code> for a URL-prefix property</li>
          </ul>
        </li>
        <li>Redeploy. This screen then shows live data.</li>
      </ol>
      {status?.serviceAccount && <p style={{ margin: "10px 0 0", color: ADMIN_COLORS.medGray }}>Service account in use: <code>{status.serviceAccount}</code> · property: <code>{status.property}</code></p>}
    </div>
  );
}
