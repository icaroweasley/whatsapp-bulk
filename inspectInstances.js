const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';

async function inspectInstances() {
  try {
    const res = await fetch(`${API_URL}/instance/fetchInstances`, {
      headers: { 'apikey': API_KEY }
    });
    const instances = await res.json();
    console.log(instances[0]);
  } catch (err) {
    console.error(err);
  }
}
inspectInstances();
