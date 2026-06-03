const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://evolution:C3lvl%40rz1nh0@localhost:5432/evolution'
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT * FROM "Contact" LIMIT 5');
  console.log(res.rows);
  await client.end();
}
run();
