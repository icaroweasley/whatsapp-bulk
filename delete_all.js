const url = "http://163.176.37.93:8081/instance/fetchInstances";
const apiKey = "CHARLIE_WHATSAPP_BULK_2026";

fetch(url, { headers: { apikey: apiKey } })
  .then(res => res.json())
  .then(async instances => {
     console.log("Found " + instances.length + " instances.");
     for (let i of instances) {
        const name = i.name || i.instance?.instanceName;
        console.log("Deleting " + name);
        await fetch(`http://163.176.37.93:8081/instance/delete/${name}`, {
           method: 'DELETE',
           headers: { apikey: apiKey }
        });
     }
     console.log("All instances deleted.");
  })
  .catch(console.error);
