const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';
const instanceName = 'testpair1234';
const phoneNumber = '5511999999999';

async function testPairing() {
  try {
    const createRes = await fetch(`${API_URL}/instance/create`, {
      method: 'POST',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instanceName,
        qrcode: false, // Ensure we don't generate QR code
        integration: "WHATSAPP-BAILEYS"
      })
    });
    console.log('Create Response:', await createRes.text());
    
    await new Promise(r => setTimeout(r, 2000));
    
    const pairRes = await fetch(`${API_URL}/instance/pair/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: phoneNumber })
    });
    console.log('Pair POST Response:', await pairRes.text());
  } catch(e) { console.error(e) }
}
testPairing();
