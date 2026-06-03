const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';
const instanceName = 'distribuidora';

async function testFetch() {
  try {
    const resContacts = await fetch(`${API_URL}/chat/findContacts/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const contactsData = await resContacts.json();
    
    const adauto = contactsData.filter(c => (c.pushName || c.name || c.verifiedName || '').toLowerCase().includes('adauto'));
    console.log('Adauto matches:', JSON.stringify(adauto.map(c => c.pushName || c.name || c.verifiedName), null, 2));

    const adele = contactsData.filter(c => (c.pushName || c.name || c.verifiedName || '').toLowerCase().includes('adele'));
    console.log('Adele matches:', JSON.stringify(adele.map(c => c.pushName || c.name || c.verifiedName), null, 2));

  } catch(e) { console.error(e) }
}
testFetch();
