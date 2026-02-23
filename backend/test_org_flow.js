const BASE_URL = 'http://localhost:5000/api';

async function register(name, email, password, department) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: name, email, password, department })
  });
  const data = await res.json();
  if (!res.ok && res.status !== 400) throw new Error(`Register failed: ${data.message}`);
  // If user already exists, try login
  if (res.status === 400 && data.message === 'User already exists') {
    return login(email, password);
  }
  return data;
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed: ${data.message}`);
  return data;
}

async function createPost(token, title, content) {
  const res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title, content, anonymityLevel: 1 })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Create Post failed: ${data.message}`);
  return data;
}

async function getPosts(token) {
  const res = await fetch(`${BASE_URL}/posts`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Get Posts failed: ${data.message}`);
  return data;
}

async function runTest() {
  try {
    const timestamp = Date.now();
    const org1Domain = `corp${timestamp}.com`;
    const org2Domain = `other${timestamp}.com`;

    console.log(`--- Starting Organization Isolation Test ---`);

    // 1. Register Alice (Org 1)
    console.log(`\n1. Registering Alice@${org1Domain}...`);
    const alice = await register('Alice', `alice@${org1Domain}`, 'password123', 'Engineering');
    console.log(`   Alice Org ID: ${alice.organization}`);

    // 2. Register Bob (Org 1)
    console.log(`\n2. Registering Bob@${org1Domain}...`);
    const bob = await register('Bob', `bob@${org1Domain}`, 'password123', 'Sales');
    console.log(`   Bob Org ID:   ${bob.organization}`);

    if (alice.organization !== bob.organization) {
      throw new Error('TEST FAILED: Alice and Bob should be in the same organization!');
    } else {
      console.log('   ✅ Alice and Bob are in the same organization.');
    }

    // 3. Register Charlie (Org 2)
    console.log(`\n3. Registering Charlie@${org2Domain}...`);
    const charlie = await register('Charlie', `charlie@${org2Domain}`, 'password123', 'Marketing');
    console.log(`   Charlie Org ID: ${charlie.organization}`);

    if (alice.organization === charlie.organization) {
      throw new Error('TEST FAILED: Alice and Charlie should be in DIFFERENT organizations!');
    } else {
      console.log('   ✅ Alice and Charlie are in different organizations.');
    }

    // 4. Alice creates a post
    console.log(`\n4. Alice creating post "Secret Strategy"...`);
    await createPost(alice.token, 'Secret Strategy', 'This is confidential info for Org 1.');
    console.log('   ✅ Post created.');

    // 5. Bob fetches posts
    console.log(`\n5. Bob fetching posts...`);
    const bobPosts = await getPosts(bob.token);
    const bobSeesIt = bobPosts.some(p => p.title === 'Secret Strategy');
    console.log(`   Bob sees ${bobPosts.length} posts.`);
    if (bobSeesIt) {
      console.log('   ✅ Bob sees the post (Correct).');
    } else {
      throw new Error('TEST FAILED: Bob should see Alice\'s post!');
    }

    // 6. Charlie fetches posts
    console.log(`\n6. Charlie fetching posts...`);
    const charliePosts = await getPosts(charlie.token);
    const charlieSeesIt = charliePosts.some(p => p.title === 'Secret Strategy');
    console.log(`   Charlie sees ${charliePosts.length} posts.`);
    if (!charlieSeesIt) {
      console.log('   ✅ Charlie does NOT see the post (Correct).');
    } else {
      throw new Error('TEST FAILED: Charlie should NOT see Alice\'s post!');
    }

    console.log(`\n--- TEST PASSED SUCCESSFULLY ---`);

  } catch (error) {
    console.error(`\n❌ TEST FAILED:`, error.message);
    if (error.cause) console.error(error.cause);
    process.exit(1);
  }
}

runTest();
