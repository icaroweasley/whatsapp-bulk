async function clear() {
  const API_KEY = '947F107F707A-45CC-ABDB-E3BBFA2F24E6';
  const API_URL = 'http://127.0.0.1:8080';
  console.log('Fetching instances...');
  const res = await fetch(API_URL + '/instance/fetchInstances', { headers: { apikey: API_KEY } });
  const instances = await res.json();
  console.log('Found', instances.length);
  
  for(const i of instances) {
    const name = i.name || i.instance?.instanceName;
    console.log('Deleting', name);
    try {
      await fetch(API_URL + '/instance/logout/' + name, { method: 'DELETE', headers: { apikey: API_KEY } });
      await new Promise(r => setTimeout(r, 1000));
      await fetch(API_URL + '/instance/delete/' + name, { method: 'DELETE', headers: { apikey: API_KEY } });
    } catch(e) {
      console.log('Failed to delete', name, e.message);
    }
  }
  console.log('All done.');
}
clear();
