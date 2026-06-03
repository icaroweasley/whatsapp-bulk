const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';
const targetInstance = 'ithalo';

async function testFetch() {
  try {
    const res = await fetch(`${API_URL}/v2/contact/fetchContacts/${targetInstance}`, {
      method: 'GET',
      headers: { 'apikey': API_KEY }
    });
    const data = await res.json();
    console.log(`v2 contacts found:`, data.length);
    if(data.length > 0) {
      console.log('Sample v2 contacts:');
      console.log(data.slice(0, 5));
    }
  } catch(e) { console.error(e) }
}
testFetch();
