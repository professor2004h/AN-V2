import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Test credentials
const ADMIN_EMAIL = 'admin@apranova.com';
const ADMIN_PASSWORD = 'Admin123!';

let adminToken = '';

// Helper function to login and get token
async function loginAsAdmin() {
  try {
    const response = await axios.post(`${API_URL}/auth/signin`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    adminToken = response.data.session.access_token;
    console.log('✅ Logged in as Admin');
    return adminToken;
  } catch (error: any) {
    console.error('❌ Failed to login as admin:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to make authenticated requests
async function apiCall(method: string, endpoint: string, data?: any) {
  try {
    const response = await axios({
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      data,
    });
    return response.data;
  } catch (error: any) {
    console.error(`❌ API call failed: ${method} ${endpoint}`, error.response?.data || error.message);
    throw error;
  }
}

async function createTestData() {
  console.log('\n🚀 Starting Test Data Creation...\n');

  try {
    // Step 1: Login as admin
    await loginAsAdmin();

    // Step 2: Create batches
    console.log('\n📦 Creating Test Batches...');
    const batch1 = await apiCall('POST', '/admin/batches', {
      name: 'Batch 2024-Q1 Data Professional',
      track: 'data_professional',
      startDate: '2024-01-15',
      endDate: '2024-04-15',
      maxStudents: 30,
    });
    console.log(`✅ Created batch: ${batch1.name} (ID: ${batch1.id})`);

    const batch2 = await apiCall('POST', '/admin/batches', {
      name: 'Batch 2024-Q2 Full Stack',
      track: 'full_stack_dev',
      startDate: '2024-04-15',
      endDate: '2024-07-15',
      maxStudents: 25,
    });
    console.log(`✅ Created batch: ${batch2.name} (ID: ${batch2.id})`);

    // Step 3: Get trainer ID
    console.log('\n👨‍🏫 Getting Trainer Info...');
    const trainers = await apiCall('GET', '/admin/trainers');
    const trainer = trainers.find((t: any) => t.email === 'trainer@apranova.com');
    if (!trainer) {
      throw new Error('Trainer not found');
    }
    console.log(`✅ Found trainer: ${trainer.full_name} (ID: ${trainer.id})`);

    // Step 4: Create students
    console.log('\n👨‍🎓 Creating Test Students...');
    const student1 = await apiCall('POST', '/admin/students', {
      fullName: 'Alice Johnson',
      email: 'alice@apranova.com',
      password: 'Student123!',
      track: 'data_professional',
      batchId: batch1.id,
      trainerId: trainer.id,
    });
    console.log(`✅ Created student: Alice Johnson (alice@apranova.com)`);

    const student2 = await apiCall('POST', '/admin/students', {
      fullName: 'Bob Smith',
      email: 'bob@apranova.com',
      password: 'Student123!',
      track: 'full_stack_dev',
      batchId: batch2.id,
      trainerId: trainer.id,
    });
    console.log(`✅ Created student: Bob Smith (bob@apranova.com)`);

    // Step 5: Login as trainer to create tasks
    console.log('\n👨‍🏫 Logging in as Trainer...');
    const trainerLoginResponse = await axios.post(`${API_URL}/auth/signin`, {
      email: 'trainer@apranova.com',
      password: 'Trainer123!',
    });
    const trainerToken = trainerLoginResponse.data.session.access_token;
    console.log('✅ Logged in as Trainer');

    // Step 6: Create tasks
    console.log('\n📝 Creating Test Tasks...');
    
    const task1 = await axios.post(
      `${API_URL}/tasks`,
      {
        title: 'Complete Python Basics Module',
        description: 'Learn Python fundamentals including variables, data types, loops, and functions',
        studentId: student1.user_id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        priority: 'high',
      },
      {
        headers: { Authorization: `Bearer ${trainerToken}` },
      }
    );
    console.log(`✅ Created task: ${task1.data.title} (Priority: high)`);

    const task2 = await axios.post(
      `${API_URL}/tasks`,
      {
        title: 'Setup Development Environment',
        description: 'Install VS Code, Python, and required libraries',
        studentId: student1.user_id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        priority: 'medium',
      },
      {
        headers: { Authorization: `Bearer ${trainerToken}` },
      }
    );
    console.log(`✅ Created task: ${task2.data.title} (Priority: medium)`);

    const task3 = await axios.post(
      `${API_URL}/tasks`,
      {
        title: 'Read Course Documentation',
        description: 'Review the course syllabus and learning objectives',
        studentId: student2.user_id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        priority: 'low',
      },
      {
        headers: { Authorization: `Bearer ${trainerToken}` },
      }
    );
    console.log(`✅ Created task: ${task3.data.title} (Priority: low)`);

    console.log('\n✅ Test Data Creation Complete!\n');
    
    // Print summary
    printSummary(batch1, batch2, student1, student2, trainer);
    
  } catch (error: any) {
    console.error('\n❌ Test data creation failed:', error.message);
    process.exit(1);
  }
}

function printSummary(batch1: any, batch2: any, student1: any, student2: any, trainer: any) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST DATA SUMMARY');
  console.log('='.repeat(80));
  
  console.log('\n👥 USER ACCOUNTS:');
  console.log('─'.repeat(80));
  console.log('Super Admin:');
  console.log('  Email: superadmin@apranova.com');
  console.log('  Password: SuperAdmin123!');
  console.log('  Dashboard: /superadmin');
  
  console.log('\nAdmin:');
  console.log('  Email: admin@apranova.com');
  console.log('  Password: Admin123!');
  console.log('  Dashboard: /admin');
  
  console.log('\nTrainer:');
  console.log('  Email: trainer@apranova.com');
  console.log('  Password: Trainer123!');
  console.log('  Dashboard: /trainer');
  
  console.log('\nStudent 1 (Data Professional):');
  console.log('  Name: Alice Johnson');
  console.log('  Email: alice@apranova.com');
  console.log('  Password: Student123!');
  console.log('  Track: Data Professional');
  console.log(`  Batch: ${batch1.name}`);
  console.log('  Dashboard: /student');
  
  console.log('\nStudent 2 (Full Stack Developer):');
  console.log('  Name: Bob Smith');
  console.log('  Email: bob@apranova.com');
  console.log('  Password: Student123!');
  console.log('  Track: Full Stack Developer');
  console.log(`  Batch: ${batch2.name}`);
  console.log('  Dashboard: /student');
  
  console.log('\n📦 BATCHES:');
  console.log('─'.repeat(80));
  console.log(`1. ${batch1.name} (${batch1.start_date} to ${batch1.end_date})`);
  console.log(`2. ${batch2.name} (${batch2.start_date} to ${batch2.end_date})`);
  
  console.log('\n📝 TASKS CREATED:');
  console.log('─'.repeat(80));
  console.log('1. Complete Python Basics Module (Alice) - Priority: HIGH');
  console.log('2. Setup Development Environment (Alice) - Priority: MEDIUM');
  console.log('3. Read Course Documentation (Bob) - Priority: LOW');
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 READY TO TEST!');
  console.log('='.repeat(80));
  console.log('\nNext Steps:');
  console.log('1. Login as alice@apranova.com to test student workflow');
  console.log('2. Login as trainer@apranova.com to test trainer workflow');
  console.log('3. Login as admin@apranova.com to test admin workflow');
  console.log('4. Test workspace provisioning for students');
  console.log('5. Test submission and review workflow');
  console.log('\n');
}

// Run the script
createTestData();

