const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';
const instanceName = 'testpair456';

async function testConnect() {
  try {
    let connectRes = await fetch(`${API_URL}/instance/connect/${instanceName}?number=5511999999999`, {
      method: 'GET',
      headers: { 'apikey': API_KEY }
    });
    const d = await connectRes.json();
    console.log('PairingCode:', d.pairingCode);
  } catch(e) { console.error(e) }
}
testConnect();
