const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';
const instanceName = 'testpair456';

async function testConnect() {
  try {
    let connectRes = await fetch(`${API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': API_KEY }
    });
    const d = await connectRes.json();
    console.log('Keys:', Object.keys(d));
    if(d.pairingCode) console.log('PairingCode:', d.pairingCode);
    if(d.code) console.log('Code:', d.code);
  } catch(e) { console.error(e) }
}
testConnect();
