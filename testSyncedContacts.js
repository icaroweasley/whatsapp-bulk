const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';
const targetInstance = 'ithalo';

async function testFetch() {
  try {
    const res = await fetch(`${API_URL}/chat/findContacts/${targetInstance}`, {
      method: 'POST',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    
    // Filter out groups and lids to find standard contacts
    const standardContacts = data.filter(c => 
      c.remoteJid && c.remoteJid.includes('@s.whatsapp.net') && c.remoteJid !== '0@s.whatsapp.net'
    );
    
    console.log(`Total contacts returned: ${data.length}`);
    console.log(`Standard contacts found: ${standardContacts.length}`);
    
    if (standardContacts.length > 0) {
      console.log('Sample standard contacts:');
      console.log(standardContacts.slice(0, 5));
    } else {
      console.log('No standard contacts found. Let us see the first 5 of any type:');
      console.log(data.slice(0, 5));
    }
    
  } catch(e) { console.error(e) }
}
testFetch();
