const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';
const instanceName = 'd';

async function testFetch() {
  try {
    const resContacts = await fetch(`${API_URL}/chat/findContacts/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const contactsData = await resContacts.json();
    console.log('Contacts length:', contactsData.length);
    console.log('First 5 contacts:', JSON.stringify(contactsData.slice(0, 5), null, 2));
  } catch(e) { console.error(e) }
}
testFetch();
