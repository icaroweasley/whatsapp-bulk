const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';
const instanceName = 'distr';

async function testFetch() {
  try {
    const resContacts = await fetch(`${API_URL}/chat/findContacts/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const contactsText = await resContacts.text();
    console.log(contactsText.substring(0, 1000));
  } catch(e) { console.error(e) }
}
testFetch();
