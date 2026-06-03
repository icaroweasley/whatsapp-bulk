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
    let contactsData = await resContacts.json();
    if (!Array.isArray(contactsData)) contactsData = contactsData.contacts || [];

    const resChats = await fetch(`${API_URL}/chat/findChats/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    let chatsData = await resChats.json();
    if (!Array.isArray(chatsData)) chatsData = chatsData.chats || [];

    const mergedRawData = [...contactsData, ...chatsData];

    console.log(`Raw contacts: ${contactsData.length}`);
    console.log(`Raw chats: ${chatsData.length}`);
    console.log(`Merged: ${mergedRawData.length}`);

    const formattedContacts = mergedRawData.filter((c) => {
        const remoteJid = String(c.remoteJid || c.id || '').toLowerCase();
        const contactId = String(c.id || '').toLowerCase();
        if (remoteJid.includes('g.us') || contactId.includes('g.us')) return false;
        if (remoteJid.includes('broadcast') || contactId.includes('broadcast')) return false;
        return true;
      }).map((c) => {
        let actualNumber = '';
        let rawId = c.remoteJid || c.id || c.number || '';
        
        actualNumber = typeof rawId === 'string' ? rawId.split('@')[0] : String(rawId);
        actualNumber = actualNumber.replace(/\D/g, '');
        
        if (typeof rawId === 'string' && !rawId.includes('@') && actualNumber.length >= 14 && !actualNumber.startsWith('55')) {
          rawId = actualNumber + '@lid';
        }
        
        let pushName = c.pushName || c.name || c.verifiedName;
        if (!pushName && c.lastMessage?.pushName && !['Você', 'You'].includes(c.lastMessage.pushName)) {
           if (!/^\\d+$/.test(c.lastMessage.pushName)) {
             pushName = c.lastMessage.pushName;
           }
        }
        
        return {
          id: rawId,
          pushName: pushName,
          name: c.name,
          number: actualNumber,
          status: 'pending'
        };
      }).filter((c) => {
        if (!c.number) return false;
        if (!c.number.startsWith('55')) return false;
        
        const lowerId = String(c.id).toLowerCase();
        if (lowerId.includes('g.us') || lowerId.includes('broadcast') || lowerId.includes('lid')) return false;
        
        return c.number.length >= 12;
      });

      const uniqueContactsMap = new Map();
      formattedContacts.forEach(c => {
        if (uniqueContactsMap.has(c.id)) {
          const existing = uniqueContactsMap.get(c.id);
          uniqueContactsMap.set(c.id, {
            ...existing,
            name: existing.name || c.name,
            pushName: existing.pushName || c.pushName
          });
        } else {
          uniqueContactsMap.set(c.id, c);
        }
      });
      
      const finalContacts = Array.from(uniqueContactsMap.values());
      console.log(`Final output length: ${finalContacts.length}`);
      
      const numDesconhecido = finalContacts.filter(c => !c.pushName && !c.name).length;
      console.log(`Desconhecidos in final: ${numDesconhecido}`);

  } catch(e) { console.error(e) }
}
testFetch();
