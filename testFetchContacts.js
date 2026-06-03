const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';
const targetInstance = 'ithalo';

async function testFetch() {
  try {
    const res = await fetch(`${API_URL}/chat/findChats/${targetInstance}`, {
      method: 'POST',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    console.log('CHATS:', data.slice(0, 5).map(c => ({ id: c.id, remoteJid: c.remoteJid, name: c.name, pushName: c.pushName })));
  } catch(e) { console.error(e) }

  try {
    const res = await fetch(`${API_URL}/chat/findContacts/${targetInstance}`, {
      method: 'POST',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    console.log('CONTACTS:', data.slice(0, 5).map(c => ({ id: c.id, remoteJid: c.remoteJid, name: c.name, pushName: c.pushName })));
  } catch(e) { console.error(e) }
}
testFetch();
