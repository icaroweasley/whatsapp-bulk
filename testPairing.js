const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';
const instanceName = 'testpair123';
const phoneNumber = '5511999999999'; // Dummy number for testing

async function testPairing() {
  try {
    // 1. Create instance without qrcode
    const createRes = await fetch(`${API_URL}/instance/create`, {
      method: 'POST',
      headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instanceName,
        qrcode: false,
        integration: "WHATSAPP-BAILEYS"
      })
    });
    console.log('Create Response:', await createRes.text());
    
    // Wait a bit
    await new Promise(r => setTimeout(r, 2000));
    
    // 2. Request connect with number (this is usually how v2 handles it, via /instance/connect or /instance/pair)
    // Let's test /instance/connect first
    let connectRes = await fetch(`${API_URL}/instance/connect/${instanceName}?number=${phoneNumber}`, {
      method: 'GET',
      headers: { 'apikey': API_KEY }
    });
    
    if (connectRes.status === 404) {
      console.log('GET /connect failed, trying GET /instance/connect without number then pairing');
      // maybe it's /instance/pair ?
      const pairRes = await fetch(`${API_URL}/instance/pair/${instanceName}`, {
        method: 'POST',
        headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: phoneNumber })
      });
      console.log('Pair Response:', await pairRes.text());
    } else {
      console.log('Connect Response:', await connectRes.text());
    }

  } catch(e) { console.error(e) }
}
testPairing();
