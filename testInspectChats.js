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
    
    // find a few LID chats that have pushName null
    const noNameLids = data.filter(c => c.remoteJid && c.remoteJid.includes('@lid') && !c.pushName);
    const withNameLids = data.filter(c => c.remoteJid && c.remoteJid.includes('@lid') && c.pushName);
    
    console.log('--- NO PUSHNAME ---');
    console.log(noNameLids.slice(0, 3));
    
    console.log('--- WITH PUSHNAME ---');
    console.log(withNameLids.slice(0, 1));
    
  } catch(e) { console.error(e) }
}
testFetch();
