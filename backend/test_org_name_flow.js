const BASE_URL = 'http://localhost:5000/api';

async function register(name, email, password, department, orgName) {
  const body = { fullName: name, email, password, department };
  if (orgName) body.organizationName = orgName;

  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok && res.status !== 400) throw new Error(`Register failed: ${data.message}`);
  return { status: res.status, data };
}

async function login(email, password, orgName) {
  const body = { email, password };
  if (orgName) body.organizationName = orgName;

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function getOrg(token, orgId) {
  const res = await fetch(`${BASE_URL}/organizations/${orgId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  return data;
}

async function runTest() {
  try {
    const timestamp = Date.now();
    const customOrgName = `MyCustomOrg_${timestamp}`;
    const email = `dave${timestamp}@test.com`;
    const password = 'password123';

    console.log(`--- Starting Organization Name Input Test ---`);

    // 1. Register with Custom Org Name
    console.log(`\n1. Registering Dave with orgName="${customOrgName}"...`);
    const regRes = await register('Dave', email, password, 'Engineering', customOrgName);

    if (regRes.status !== 201) {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    }
    console.log(`   ✅ Registered successfully.`);
    const user = regRes.data;
    const orgId = user.organization;

    // Verify Org Name
    console.log(`\n2. Verifying Organization Name...`);
    // Need to login to get token to fetch org details
    const loginRes = await login(email, password);
    const token = loginRes.data.token;

    const orgData = await getOrg(token, orgId);
    console.log(`   Org Name in DB: "${orgData.name}"`);

    if (orgData.name === customOrgName) {
      console.log(`   ✅ Organization name matches custom input.`);
    } else {
      throw new Error(`TEST FAILED: Expected org name "${customOrgName}", got "${orgData.name}"`);
    }

    // 3. Login with correct Org Name
    console.log(`\n3. Login with correct Org Name...`);
    const loginCorrect = await login(email, password, customOrgName);
    if (loginCorrect.status === 200) {
      console.log(`   ✅ Login successful.`);
    } else {
      throw new Error(`TEST FAILED: Login with correct org name failed: ${JSON.stringify(loginCorrect.data)}`);
    }

    // 4. Login with WRONG Org Name
    console.log(`\n4. Login with WRONG Org Name...`);
    const loginWrong = await login(email, password, "WrongCorp");
    if (loginWrong.status === 401) {
      console.log(`   ✅ Login rejected as expected: ${loginWrong.data.message}`);
    } else {
      throw new Error(`TEST FAILED: Login with wrong org name SHOULD fail, but got status ${loginWrong.status}`);
    }

    // 5. Login WITHOUT Org Name
    console.log(`\n5. Login WITHOUT Org Name...`);
    const loginNone = await login(email, password);
    if (loginNone.status === 200) {
      console.log(`   ✅ Login successful (optional field).`);
    } else {
      throw new Error(`TEST FAILED: Login without org name failed: ${JSON.stringify(loginNone.data)}`);
    }

    console.log(`\n--- TEST PASSED SUCCESSFULLY ---`);

  } catch (error) {
    console.error(`\n❌ TEST FAILED:`, error.message);
    if (error.cause) console.error(error.cause);
    process.exit(1);
  }
}

runTest();
