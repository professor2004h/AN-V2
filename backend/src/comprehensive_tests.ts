import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:3000';
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

interface TestResult {
    name: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    message: string;
    details?: any;
}

const results: TestResult[] = [];

function logTest(name: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, details?: any) {
    results.push({ name, status, message, details });
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    console.log(`${icon} ${name}: ${message}`);
    if (details) console.log('   Details:', JSON.stringify(details, null, 2));
}

async function testStudentLogin(email: string, password: string, studentName: string) {
    try {
        const response = await axios.post(`${API_URL}/auth/signin`, { email, password });
        const token = response.data.session?.access_token;

        if (!token) {
            logTest(`${studentName} Login`, 'FAIL', 'No token received');
            return null;
        }

        logTest(`${studentName} Login`, 'PASS', 'Successfully logged in');
        return token;
    } catch (error: any) {
        logTest(`${studentName} Login`, 'FAIL', error.response?.data?.message || error.message);
        return null;
    }
}

async function testDataIsolation(token: string, studentName: string, expectedTaskTitle: string) {
    try {
        const response = await axios.get(`${API_URL}/students/me/tasks`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const tasks = response.data;
        const taskTitles = tasks.map((t: any) => t.title);

        // Check if student sees their own task
        const hasOwnTask = taskTitles.includes(expectedTaskTitle);

        // Check if student sees other students' tasks
        const otherTasks = [
            "Alice's Special Project",
            "Bob's Backend Challenge",
            "Charlie's First Assignment"
        ].filter(t => t !== expectedTaskTitle);

        const seesOtherTasks = otherTasks.some(t => taskTitles.includes(t));

        if (hasOwnTask && !seesOtherTasks) {
            logTest(`${studentName} Data Isolation`, 'PASS', `Sees only own task: "${expectedTaskTitle}"`, { taskTitles });
            return true;
        } else if (!hasOwnTask) {
            logTest(`${studentName} Data Isolation`, 'FAIL', `Cannot see own task: "${expectedTaskTitle}"`, { taskTitles });
            return false;
        } else {
            logTest(`${studentName} Data Isolation`, 'FAIL', `Can see other students' tasks`, { taskTitles });
            return false;
        }
    } catch (error: any) {
        logTest(`${studentName} Data Isolation`, 'FAIL', error.response?.data?.message || error.message);
        return false;
    }
}

async function testWorkspaceProvisioning(token: string, studentName: string) {
    try {
        // Provision workspace
        const provisionResponse = await axios.post(`${API_URL}/workspaces/provision`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const workspace = provisionResponse.data;

        if (!workspace.url) {
            logTest(`${studentName} Workspace Provision`, 'FAIL', 'No workspace URL returned', workspace);
            return null;
        }

        logTest(`${studentName} Workspace Provision`, 'PASS', `Workspace provisioned at ${workspace.url}`, {
            status: workspace.status,
            url: workspace.url
        });

        return workspace;
    } catch (error: any) {
        // If already provisioned, try to get existing workspace
        if (error.response?.status === 409 || error.response?.data?.message?.includes('already')) {
            try {
                const statusResponse = await axios.get(`${API_URL}/workspaces/status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                logTest(`${studentName} Workspace Provision`, 'PASS', 'Workspace already exists', statusResponse.data);
                return statusResponse.data;
            } catch (err: any) {
                logTest(`${studentName} Workspace Provision`, 'FAIL', err.response?.data?.message || err.message);
                return null;
            }
        }

        logTest(`${studentName} Workspace Provision`, 'FAIL', error.response?.data?.message || error.message);
        return null;
    }
}

async function testWorkspaceStatus(token: string, studentName: string) {
    try {
        const response = await axios.get(`${API_URL}/workspaces/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const workspace = response.data;
        logTest(`${studentName} Workspace Status`, 'PASS', `Status: ${workspace.status}`, workspace);
        return workspace;
    } catch (error: any) {
        logTest(`${studentName} Workspace Status`, 'FAIL', error.response?.data?.message || error.message);
        return null;
    }
}

async function testWorkspaceStart(token: string, studentName: string) {
    try {
        const response = await axios.post(`${API_URL}/workspaces/start`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        logTest(`${studentName} Workspace Start`, 'PASS', 'Workspace started successfully', response.data);

        // Wait a bit for container to fully start
        await new Promise(resolve => setTimeout(resolve, 3000));

        return response.data;
    } catch (error: any) {
        if (error.response?.data?.message?.includes('already running')) {
            logTest(`${studentName} Workspace Start`, 'PASS', 'Workspace already running');
            return true;
        }
        logTest(`${studentName} Workspace Start`, 'FAIL', error.response?.data?.message || error.message);
        return null;
    }
}

async function testWorkspaceStop(token: string, studentName: string) {
    try {
        const response = await axios.post(`${API_URL}/workspaces/stop`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        logTest(`${studentName} Workspace Stop`, 'PASS', 'Workspace stopped successfully');

        // Wait a bit for container to fully stop
        await new Promise(resolve => setTimeout(resolve, 2000));

        return response.data;
    } catch (error: any) {
        logTest(`${studentName} Workspace Stop`, 'FAIL', error.response?.data?.message || error.message);
        return null;
    }
}

async function runComprehensiveTests() {
    console.log('\n🧪 APRANOVA LMS - COMPREHENSIVE AUTOMATED TESTS\n');
    console.log('='.repeat(60));
    console.log('\n');

    const students = [
        { name: 'Alice', email: 'alice@apranova.com', password: 'Student123!', expectedTask: "Alice's Special Project" },
        { name: 'Bob', email: 'bob@apranova.com', password: 'Student123!', expectedTask: "Bob's Backend Challenge" },
        { name: 'Charlie', email: 'charlie@apranova.com', password: 'Student123!', expectedTask: "Charlie's First Assignment" }
    ];

    // Phase 1: Login & Data Isolation Tests
    console.log('\n📋 PHASE 1: LOGIN & DATA ISOLATION\n');

    const tokens: { [key: string]: string } = {};

    for (const student of students) {
        const token = await testStudentLogin(student.email, student.password, student.name);
        if (token) {
            tokens[student.name] = token;
            await testDataIsolation(token, student.name, student.expectedTask);
        }
    }

    // Phase 2: Workspace Provisioning Tests
    console.log('\n\n🖥️  PHASE 2: WORKSPACE PROVISIONING\n');

    for (const student of students) {
        if (tokens[student.name]) {
            await testWorkspaceProvisioning(tokens[student.name], student.name);
            await testWorkspaceStatus(tokens[student.name], student.name);
        }
    }

    // Phase 3: Workspace Lifecycle Tests
    console.log('\n\n🔄 PHASE 3: WORKSPACE LIFECYCLE (START/STOP)\n');

    for (const student of students) {
        if (tokens[student.name]) {
            await testWorkspaceStart(tokens[student.name], student.name);
            await testWorkspaceStatus(tokens[student.name], student.name);
            await testWorkspaceStop(tokens[student.name], student.name);
            await testWorkspaceStatus(tokens[student.name], student.name);
            // Restart to verify it works
            await testWorkspaceStart(tokens[student.name], student.name);
        }
    }

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('\n📊 TEST SUMMARY\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed} (${((failed / total) * 100).toFixed(1)}%)`);
    console.log(`⏭️  Skipped: ${skipped} (${((skipped / total) * 100).toFixed(1)}%)`);

    console.log('\n\n📝 MANUAL VERIFICATION REQUIRED:\n');
    console.log('1. Open each student\'s workspace IDE in browser');
    console.log('2. Create HTML files in /workspace directory');
    console.log('3. Verify files persist after stop/start (auto-save test)');
    console.log('4. Verify workspace isolation (no cross-student files)');
    console.log('\nSee COMPREHENSIVE_VERIFICATION_REPORT.md for detailed steps.\n');

    if (failed === 0) {
        console.log('✨ All automated tests PASSED! System ready for manual IDE verification.\n');
    } else {
        console.log('⚠️  Some tests FAILED. Review errors above before proceeding.\n');
    }
}

runComprehensiveTests().catch(console.error);
