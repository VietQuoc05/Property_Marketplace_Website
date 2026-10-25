// summary.js
// Retrieves Stitch projects and prints a clean summary (name, ID, screen count, last modified).

const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');
const actualFetch = fetch.default || fetch;

async function main() {
  const auth = new GoogleAuth();
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'list_projects',
      arguments: {}
    }
  };

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

  // Projects are typically located in data.result.content (array)
  const projects = (data.result && data.result.content) || [];

  if (projects.length === 0) {
    console.log('No projects found or an error occurred.');
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  console.log('Stitch Projects Summary');
  console.log('--------------------------');
  projects.forEach(p => {
    const name = p.title || p.name || p.projectName || 'Unnamed';
    const idMatch = name.match(/projects\/(\d+)/) || (p.id && p.id.match(/projects\/(\d+)/));
    const id = idMatch ? idMatch[1] : (p.id || 'N/A');
    const screenCount = (p.screenInstances && p.screenInstances.length) || 0;
    const lastModified = p.updateTime || p.lastModified || 'N/A';
    console.log(`Name: ${name}`);
    console.log(`  ID: ${id}`);
    console.log(`  Screens: ${screenCount}`);
    console.log(`  Last Modified: ${lastModified}`);
    console.log('');
  });
}

main().catch(err => {
  console.error('Error fetching Stitch projects:', err);
});
