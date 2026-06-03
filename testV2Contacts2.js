const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';
const targetInstance = 'ithalo';

async function testFetch() {
  try {
    const res = await fetch(`${API_URL}/v2/contact/fetchContacts/${targetInstance}`, {
      method: 'GET',
      headers: { 'apikey': API_KEY }
    });
    const text = await res.text();
    console.log(`v2 contacts string start:`, text.substring(0, 150));
  } catch(e) { console.error(e) }
}
testFetch();
