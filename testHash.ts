import bcrypt from 'bcryptjs';

async function test() {
  const hash = '$2b$10$KeTwBFdXadi7EjfJYKYUKufspJvjBD4ECFrmMeoFSmFgVFQUWjno6';
  const isValid = await bcrypt.compare('123456', hash);
  console.log('IsValid:', isValid);
}
test();
