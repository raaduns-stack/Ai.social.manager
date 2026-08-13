const axios = require('axios');

async function test() {
  try {
    // 1. Login as admin
    const loginRes = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'naanmadayil@gmail.com',
      password: 'Password123!',
    });
    const token = loginRes.data.accessToken;
    console.log('Login successful. Token acquired.');

    // 2. Fetch all activity logs (no filter)
    const resAll = await axios.get('http://localhost:4000/api/admin/activity-logs', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('All logs count:', resAll.data.data.length, 'Total meta:', resAll.data.meta);
    if (resAll.data.data.length > 0) {
      console.log('Sample log:', resAll.data.data[0]);
    }

    // 3. Fetch activity logs with module=Auth
    const resAuth = await axios.get('http://localhost:4000/api/admin/activity-logs?module=Auth', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Auth logs count:', resAuth.data.data.length, 'Total meta:', resAuth.data.meta);

    // 4. Fetch activity logs with module=Users
    const resUsers = await axios.get('http://localhost:4000/api/admin/activity-logs?module=Users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Users logs count:', resUsers.data.data.length, 'Total meta:', resUsers.data.meta);

  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

test();
