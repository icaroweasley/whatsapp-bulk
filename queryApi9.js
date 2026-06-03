const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';
const instanceName = 'distr';

async function testFetch() {
  const endpoints = [
    { path: `/chat/findContacts/${instanceName}`, method: 'POST', body: {} },
    { path: `/v2/contact/fetchContacts/${instanceName}`, method: 'GET' },
    { path: `/chat/findChats/${instanceName}`, method: 'POST', body: {} },
    { path: `/v2/chat/findChats/${instanceName}`, method: 'GET' }
  ];

  for (const ep of endpoints) {
    try {
      const options = { method: ep.method, headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' } };
      if (ep.method === 'POST') options.body = JSON.stringify(ep.body);
      const res = await fetch(API_URL + ep.path, options);
      const text = await res.text();
      console.log(`${ep.path} -> Status ${res.status}, Length: ${text.length}`);
      if (res.status === 200) {
        try {
          const data = JSON.parse(text);
          console.log(`  Items: ${Array.isArray(data) ? data.length : (data.contacts ? data.contacts.length : (data.chats ? data.chats.length : 'unknown'))}`);
        } catch(e) {}
      }
    } catch(e) { console.log(e); }
  }
}
testFetch();
