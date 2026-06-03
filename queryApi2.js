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
    const contactsData = await resContacts.json();
    console.log('/chat/findContacts array length:', Array.isArray(contactsData) ? contactsData.length : 'not array');
    
    const resFetch = await fetch(`${API_URL}/v2/contact/fetchContacts/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': API_KEY }
    });
    const fetchText = await resFetch.text();
    try {
      const fetchData = JSON.parse(fetchText);
      let count = 0;
      if (Array.isArray(fetchData)) count = fetchData.length;
      else if (fetchData.contacts) count = fetchData.contacts.length;
      console.log('/v2/contact/fetchContacts length:', count);
    } catch(e) { console.log('v2/contact/fetchContacts failed to parse JSON', fetchText.substring(0, 50)); }

  } catch(e) { console.error(e) }
}
testFetch();
