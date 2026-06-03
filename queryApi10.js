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
    
    // Contar com e sem nome
    let comNome = 0;
    let semNome = 0;
    
    for (let c of contactsData) {
      if (c.pushName || c.name || c.verifiedName) {
        comNome++;
      } else {
        semNome++;
      }
    }
    
    console.log(`Total: ${contactsData.length}`);
    console.log(`Com Nome: ${comNome}`);
    console.log(`Sem Nome: ${semNome}`);
    
    console.log('Primeiros 5 sem nome:');
    console.log(contactsData.filter(c => !(c.pushName || c.name || c.verifiedName)).slice(0, 5).map(c => c.remoteJid));

    console.log('Primeiros 5 com nome:');
    console.log(contactsData.filter(c => (c.pushName || c.name || c.verifiedName)).slice(0, 5).map(c => `${c.pushName || c.name} - ${c.remoteJid}`));

  } catch(e) { console.error(e) }
}
testFetch();
