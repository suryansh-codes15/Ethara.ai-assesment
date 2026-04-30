const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'sri.suryansh016@gmail.com',
      password: 'password'
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.log('ERROR STATUS:', err.response?.status);
    console.log('ERROR DATA:', err.response?.data);
  }
}

test();
