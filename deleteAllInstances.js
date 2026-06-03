const API_URL = 'http://localhost:8081';
const API_KEY = 'CHARLIE_WHATSAPP_BULK_2026';

async function deleteAllInstances() {
  try {
    const res = await fetch(`${API_URL}/instance/fetchInstances`, {
      headers: {
        'apikey': API_KEY
      }
    });
    
    if (!res.ok) {
      console.error('Failed to fetch instances', await res.text());
      return;
    }
    
    const instances = await res.json();
    console.log(`Found ${instances.length} instances to delete.`);
    
    for (const inst of instances) {
      const name = inst.name;
      console.log(`Deleting instance: ${name}`);
      
      const delRes = await fetch(`${API_URL}/instance/logout/${name}`, {
        method: 'DELETE',
        headers: { 'apikey': API_KEY }
      });
      console.log(`Logout ${name}: ${delRes.status}`);

      const delRes2 = await fetch(`${API_URL}/instance/delete/${name}`, {
        method: 'DELETE',
        headers: { 'apikey': API_KEY }
      });
      console.log(`Deleted ${name}: ${delRes2.status}`);
    }
    
    console.log('All instances deleted.');
  } catch (err) {
    console.error('Error:', err);
  }
}

deleteAllInstances();
