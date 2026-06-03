const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';
const instanceName = 'testpair999';
const phoneNumber = '556792630045';

async function testPairing() {
  try {
    const createRes = await fetch(`${API_URL}/instance/create`, {
      method: 'POST',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        number: phoneNumber,
        integration: "WHATSAPP-BAILEYS"
      })
    });
    console.log('Create Response:', await createRes.text());
    
    await new Promise(r => setTimeout(r, 2000));
    
    let connectRes = await fetch(`${API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: { 'apikey': API_KEY }
    });
    const d = await connectRes.json();
    console.log('PairingCode:', d.pairingCode);
  } catch(e) { console.error(e) }
}
testPairing();
