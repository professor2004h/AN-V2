# 🖥️ MANUAL IDE WORKSPACE TESTING GUIDE

## Quick Access Information

### Student Login Credentials
- **Alice:** alice@apranova.com / Student123!
- **Bob:** bob@apranova.com / Student123!
- **Charlie:** charlie@apranova.com / Student123!

### Workspace URLs (Direct Access)
Based on running containers:
- **Alice's IDE:** http://localhost:9438
- **Charlie's IDE:** http://localhost:9064

Password for all workspaces: Check `CODE_SERVER_PASSWORD` in backend/.env

---

## 📋 COMPLETE TESTING PROCEDURE

### Test 1: Alice - Full Workflow

#### Step 1: Login & Navigate
1. Open browser: `http://localhost:3000/auth/signin`
2. Login as Alice: `alice@apranova.com` / `Student123!`
3. Verify dashboard loads
4. Click "Tasks" in sidebar
5. **VERIFY:** You see "Alice's Special Project" ONLY
6. **VERIFY:** You do NOT see Bob's or Charlie's tasks

#### Step 2: Workspace Access
1. Click "Workspace" in sidebar
2. Check workspace status
3. If status is "Stopped", click "Start Workspace"
4. Wait for status to change to "Running" (may take 10-15 seconds)
5. Click "Open Workspace" button
6. **VERIFY:** New tab opens with Code-Server IDE

#### Step 3: IDE File Creation
1. In the IDE, you should see `/workspace` directory
2. Create new file: Right-click workspace folder → New File
3. Name it: `alice_test.html`
4. Add this content:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Alice's Test Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        h1 { text-align: center; }
        .info { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; }
    </style>
</head>
<body>
    <h1>🎨 Alice's Workspace Test</h1>
    <div class="info">
        <p><strong>Student:</strong> Alice Johnson</p>
        <p><strong>Test Purpose:</strong> Verify file persistence and auto-save</p>
        <p><strong>Created:</strong> <span id="time"></span></p>
    </div>
    <script>
        document.getElementById('time').textContent = new Date().toLocaleString();
        console.log('Alice workspace loaded successfully!');
    </script>
</body>
</html>
```

5. **IMPORTANT:** Do NOT press Ctrl+S (testing auto-save)
6. Wait 3-5 seconds (Code-Server auto-saves)
7. **VERIFY:** File icon shows no unsaved indicator (dot/asterisk)

#### Step 4: Terminal Test
1. In IDE, open Terminal (Terminal → New Terminal)
2. Run these commands:
```bash
pwd                           # Should show: /workspace
ls -la                        # Should show: alice_test.html
cat alice_test.html | head -5 # Should show HTML content
echo "Alice was here" > test.txt
cat test.txt                  # Should show: Alice was here
```
3. **VERIFY:** All commands work correctly
4. Take screenshot of terminal output

#### Step 5: Persistence Test
1. Close the IDE tab (just the IDE, not the main app)
2. Go back to main Apranova tab
3. Click "Stop Workspace"
4. Wait 5 seconds
5. Click "Start Workspace"
6. Wait for "Running" status
7. Click "Open Workspace"
8. **VERIFY:** IDE opens again
9. **VERIFY:** `alice_test.html` still exists
10. **VERIFY:** `test.txt` still exists
11. Open `alice_test.html`
12. **VERIFY:** Content is exactly the same (auto-save worked!)

---

### Test 2: Bob - Isolation Test

#### Step 1: Login
1. Logout Alice (or use incognito/different browser)
2. Login as Bob: `bob@apranova.com` / `Student123!`
3. Click "Tasks"
4. **VERIFY:** See "Bob's Backend Challenge" ONLY
5. **VERIFY:** Do NOT see Alice's or Charlie's tasks

#### Step 2: Workspace & Isolation
1. Click "Workspace"
2. Start workspace if needed
3. Open IDE
4. **VERIFY:** `/workspace` is EMPTY or has different files
5. **CRITICAL:** Verify you do NOT see `alice_test.html`
6. **CRITICAL:** Verify you do NOT see Alice's `test.txt`

#### Step 3: Create Bob's Files
1. Create file: `bob_backend.js`
2. Add content:
```javascript
// Bob's Backend Optimization Script
const express = require('express');

console.log('Bob workspace initialized');

// Simulated database query optimization
function optimizeQuery(query) {
    console.log('Optimizing:', query);
    // Add indexing logic here
    return query + ' WITH INDEX';
}

const testQuery = 'SELECT * FROM users WHERE active = true';
console.log('Original:', testQuery);
console.log('Optimized:', optimizeQuery(testQuery));
```

3. Wait for auto-save
4. In terminal, run:
```bash
ls -la                    # Should show bob_backend.js
node bob_backend.js       # Should execute the script
```

5. **VERIFY:** Script runs successfully
6. **VERIFY:** Still no Alice files visible

---

### Test 3: Charlie - Complete Isolation

#### Step 1: Login & Verify
1. Logout Bob
2. Login as Charlie: `charlie@apranova.com` / `Student123!`
3. Click "Tasks"
4. **VERIFY:** See "Charlie's First Assignment" ONLY

#### Step 2: Workspace Isolation
1. Navigate to Workspace
2. Start workspace
3. Open IDE
4. **VERIFY:** Empty workspace
5. **CRITICAL:** No Alice files
6. **CRITICAL:** No Bob files

#### Step 3: Charlie's First File
1. Create: `hello_world.py`
2. Add content:
```python
#!/usr/bin/env python3
"""
Charlie's First Python Script
Testing workspace functionality
"""

def main():
    print("=" * 50)
    print("Hello from Charlie's Workspace!")
    print("=" * 50)
    print()
    print("Student: Charlie Davis")
    print("Assignment: Setup workspace")
    print("Status: ✅ Complete!")
    print()
    
    # Test file operations
    with open('charlie_notes.txt', 'w') as f:
        f.write('Charlie workspace is working!\n')
        f.write('File persistence test\n')
    
    with open('charlie_notes.txt', 'r') as f:
        print("File contents:")
        print(f.read())

if __name__ == '__main__':
    main()
```

3. In terminal:
```bash
python3 hello_world.py
ls -la
cat charlie_notes.txt
```

4. **VERIFY:** Script runs successfully
5. **VERIFY:** `charlie_notes.txt` was created
6. **VERIFY:** No other students' files visible

---

## ✅ Success Criteria

### Data Isolation ✓
- [ ] Alice sees only her task
- [ ] Bob sees only his task  
- [ ] Charlie sees only his task
- [ ] No cross-student task visibility

### Workspace Isolation ✓
- [ ] Alice's files NOT visible to Bob or Charlie
- [ ] Bob's files NOT visible to Alice or Charlie
- [ ] Charlie's files NOT visible to Alice or Bob
- [ ] Each student has separate `/workspace` directory

### File Persistence ✓
- [ ] Alice's files persist after workspace restart
- [ ] Bob's files persist after workspace restart
- [ ] Charlie's files persist after workspace restart
- [ ] Auto-save works (no Ctrl+S needed)

### IDE Functionality ✓
- [ ] Code-Server IDE loads for all students
- [ ] Terminal works in all workspaces
- [ ] File creation works
- [ ] File editing works
- [ ] Syntax highlighting works
- [ ] Multiple file types supported (HTML, JS, Python)

---

## 🐛 Troubleshooting

### Issue: Workspace won't start
**Solution:** 
```bash
# Check Docker containers
docker ps -a | grep codeserver

# Restart specific container
docker restart codeserver-<student_id>
```

### Issue: IDE shows 404
**Solution:** Wait 10-15 seconds after clicking "Start Workspace" before clicking "Open Workspace"

### Issue: Files not persisting
**Solution:** 
```bash
# Check volumes
docker volume ls | grep student-workspace

# Inspect volume
docker volume inspect student-workspace-<student_id>
```

### Issue: Can't access IDE
**Solution:** Check if port is accessible:
```bash
# Test Alice's workspace
curl http://localhost:9438

# Test Charlie's workspace  
curl http://localhost:9064
```

---

## 📊 Expected Results Summary

| Test | Expected Result | Status |
|------|----------------|--------|
| Alice login | ✅ Success | ⏳ Test |
| Alice sees own task only | ✅ Isolation | ⏳ Test |
| Alice workspace starts | ✅ Running | ⏳ Test |
| Alice IDE accessible | ✅ Opens | ⏳ Test |
| Alice file creation | ✅ Works | ⏳ Test |
| Alice auto-save | ✅ Works | ⏳ Test |
| Alice persistence | ✅ Files remain | ⏳ Test |
| Bob login | ✅ Success | ⏳ Test |
| Bob sees own task only | ✅ Isolation | ⏳ Test |
| Bob workspace isolated | ✅ No Alice files | ⏳ Test |
| Bob file creation | ✅ Works | ⏳ Test |
| Charlie login | ✅ Success | ⏳ Test |
| Charlie sees own task only | ✅ Isolation | ⏳ Test |
| Charlie workspace isolated | ✅ No other files | ⏳ Test |
| Charlie file creation | ✅ Works | ⏳ Test |

---

## 🎯 Final Verification

After completing all tests, verify:

1. **3 separate Docker containers running:**
```bash
docker ps | grep codeserver
# Should show 3 containers with different student IDs
```

2. **3 separate persistent volumes:**
```bash
docker volume ls | grep student-workspace
# Should show 3 volumes
```

3. **All students can login and access only their data**

4. **All workspaces are isolated (no cross-contamination)**

5. **Files persist across workspace restarts**

---

**Testing Time Estimate:** 20-30 minutes for complete verification

**Status:** Ready to begin manual testing
