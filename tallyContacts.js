const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';
const targetInstance = 'ithalo';

async function tallyContacts() {
  try {
    const res = await fetch(`${API_URL}/chat/findContacts/${targetInstance}`, {
      method: 'POST',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await res.json();
    
    let lidCount = 0;
    let gusCount = 0;
    let snetCount = 0;
    let otherCount = 0;
    
    data.forEach(c => {
      const jid = c.remoteJid || '';
      if (jid.includes('@lid')) lidCount++;
      else if (jid.includes('@g.us')) gusCount++;
      else if (jid.includes('@s.whatsapp.net')) snetCount++;
      else otherCount++;
    });
    
    console.log(`LID: ${lidCount}, G.US: ${gusCount}, S.WHATSAPP.NET: ${snetCount}, OTHER: ${otherCount}`);
    
    if (snetCount > 0) {
      console.log('Sample SNET contacts:', data.filter(c => c.remoteJid && c.remoteJid.includes('@s.whatsapp.net')).slice(0, 5));
    }
    
    // Check Chats as well
    const chatRes = await fetch(`${API_URL}/chat/findChats/${targetInstance}`, {
      method: 'POST',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const chatData = await chatRes.json();
    
    let chatLid = 0, chatGus = 0, chatSnet = 0, chatOther = 0;
    chatData.forEach(c => {
      const jid = c.remoteJid || '';
      if (jid.includes('@lid')) chatLid++;
      else if (jid.includes('@g.us')) chatGus++;
      else if (jid.includes('@s.whatsapp.net')) chatSnet++;
      else chatOther++;
    });
    
    console.log(`CHATS -> LID: ${chatLid}, G.US: ${chatGus}, S.WHATSAPP.NET: ${chatSnet}, OTHER: ${chatOther}`);
    
  } catch(e) { console.error(e) }
}
tallyContacts();
