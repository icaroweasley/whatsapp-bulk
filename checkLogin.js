async function checkLogin() {
  const res = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ithalobrandao', password: '123456' })
  });
  const data = await res.json();
  console.log(data);
}
checkLogin();
