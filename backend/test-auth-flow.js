const API_URL = 'http://localhost:5000/api/auth';

const testUser = {
  fullName: 'Integration Test User',
  email: `test${Date.now()}@example.com`,
  password: 'password123',
  department: 'QA'
};

async function testAuth() {
  try {
    console.log('Testing Registration...');
    const regRes = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(regData.message || 'Registration failed');
    console.log('Registration Success:', regData.email);

    console.log('Testing Login...');
    const loginRes = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(loginData.message || 'Login failed');
    console.log('Login Success:', loginData.token ? 'Token received' : 'No token');

  } catch (error) {
    console.error('Auth Test Failed:', error.message);
    process.exit(1);
  }
}

testAuth();
