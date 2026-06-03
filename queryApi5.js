const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';

async function checkInstances() {
  try {
    const res = await fetch(`${API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: { 'apikey': API_KEY }
    });
    console.log(await res.text());
  } catch(e) { console.error(e) }
}
checkInstances();
