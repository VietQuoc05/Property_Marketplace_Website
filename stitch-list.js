// stitch-list.js
// Retrieves a list of Stitch projects using the Google Auth Library and node-fetch.

const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');
const actualFetch = fetch.default || fetch;

async function main() {
  // Obtain an ADC (Application Default Credentials) access token.
  const auth = new GoogleAuth();
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  // Build the JSON‑RPC request payload.
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'list_projects',
      arguments: {}
    }
  };

  // Send the request to the Stitch MCP endpoint.
  const response = await actualFetch('https://stitch.googleapis.com/mcp', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.token}`,
      'Content-Type': 'application/json',
      'x-goog-user-project': 'haven-property-login'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch(err => {
  console.error('Error fetching Stitch projects:', err);
});
