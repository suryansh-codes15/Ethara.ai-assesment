const axios = require('axios');

async function testSignup() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/signup', {
      name: 'Test User',
      email: 'test' + Date.now() + '@example.com',
      password: 'password123',
      role: 'member'
    });
    console.log('✅ Signup successful:', res.data);
  } catch (err) {
    console.error('❌ Signup failed:', err.response?.status, err.response?.data);
  }
}

testSignup();
