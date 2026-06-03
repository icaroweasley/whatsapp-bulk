const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';
const instanceName = 'testpair123';
const phoneNumber = '5511999999999';

async function testPairing() {
  try {
    const pairRes = await fetch(`${API_URL}/instance/connect/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: phoneNumber })
    });
    console.log('Connect POST Response:', await pairRes.text());
  } catch(e) { console.error(e) }
}
testPairing();
