# Quick Test Guide - Workspace Enhancements

## 🚀 Quick Start Testing

### Prerequisites
- Backend running: `npm run dev` in `e:\AN-V2\backend`
- Frontend running: `npm run dev` in `e:\AN-V2\frontend`
- Alice's workspace reset

### Reset Alice's Workspace
```powershell
cd e:\AN-V2\backend
npx tsx reset-alice-workspace.ts
```

---

## Test 1: Real-Time Provisioning Progress (5 min)

1. Open: http://localhost:3000
2. Login: alice@apranova.com / Student123!
3. Go to: Workspace page
4. Click: "Provision Workspace"
5. **Watch for:**
   - ✅ Progress bar appears
   - ✅ Percentage updates (0% → 100%)
   - ✅ Messages change ("Creating container..." → "Installing Python..." → "Workspace ready!")
   - ✅ Estimated time shown
   - ✅ Takes ~3-4 minutes

**Expected:** Smooth progress updates, no errors, workspace ready at 100%

---

## Test 2: Auto-Save Configuration (2 min)

1. After provisioning, click "Open"
2. In Code-Server, create file: `test-autosave.txt`
3. Type: "Testing auto-save"
4. Wait 2 seconds (don't press Ctrl+S)
5. **Check:** No asterisk (*) on file tab

**Expected:** File auto-saves without manual action

### Verify Settings File
```powershell
Get-Content "E:\AN-V2\backend\workspace-data\210bdd1a-8546-40db-9d99-0083c07232a8\.local\share\code-server\User\settings.json"
```

**Expected Output:**
```json
{
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  ...
}
```

---

## Test 3: Fast Subsequent Access (1 min)

1. In workspace page, click "Stop Workspace"
2. Wait for status: "Stopped"
3. Click "Start Workspace"
4. **Measure time:** Should be <5 seconds

**Expected:** Workspace starts quickly, no tool reinstallation

---

## Test 4: Auto-Termination (16 min)

1. With workspace running, close the browser tab
2. Wait 16 minutes
3. Check container status:
   ```powershell
   docker ps -a | Select-String "codeserver-210bdd1a"
   ```

**Expected:** Container shows "Exited" status (stopped automatically)

---

## Test 5: Delete Restrictions (1 min)

### As Student:
1. Login as Alice
2. Go to workspace page
3. **Verify:** NO delete button visible

### As Admin:
1. Login as admin (admin@apranova.com / Admin123!)
2. Go to student management
3. **Verify:** CAN delete student workspaces

---

## Quick Verification Commands

### Check Workspace Status
```powershell
docker ps -a | Select-String "codeserver"
```

### Check Auto-Save Settings
```powershell
npx tsx test-autosave-config.ts
```

### Check Database Status
```powershell
# In backend directory
npx tsx -e "
import { supabaseAdmin } from './src/lib/supabase';
const { data } = await supabaseAdmin
  .from('students')
  .select('workspace_status, workspace_last_activity')
  .eq('id', '210bdd1a-8546-40db-9d99-0083c07232a8')
  .single();
console.log(data);
"
```

---

## Expected Timeline

| Test | Duration | Total Time |
|------|----------|------------|
| Reset workspace | 10 sec | 0:10 |
| Real-time provisioning | 3-4 min | 4:10 |
| Auto-save test | 2 min | 6:10 |
| Stop/start test | 1 min | 7:10 |
| Delete restriction test | 1 min | 8:10 |
| Auto-termination test | 16 min | 24:10 |

**Total Testing Time:** ~25 minutes

---

## Success Criteria Checklist

- [ ] Progress bar shows 0% → 100%
- [ ] Progress messages update in real-time
- [ ] Estimated time remaining is displayed
- [ ] Provisioning completes in 3-4 minutes
- [ ] Auto-save works without manual config
- [ ] Settings file exists and contains correct values
- [ ] Stop/start takes <5 seconds
- [ ] Workspace auto-stops after 15 min inactivity
- [ ] Students cannot see delete button
- [ ] Students get 403 if they try to delete via API
- [ ] Admins can delete student workspaces

---

## Troubleshooting

### Issue: Progress not showing
**Solution:** Check browser console for errors, verify backend is running

### Issue: Auto-save not working
**Solution:** Check settings file exists, verify mount is `/home/coder` not `/home/coder/project`

### Issue: Slow subsequent access
**Solution:** Verify tools are in mounted volume, check Docker container status

### Issue: Workspace not auto-stopping
**Solution:** Check cleanup job is running, verify heartbeat is working

---

## Quick Reset (If Needed)

```powershell
# Stop and remove container
docker stop codeserver-210bdd1a
docker rm codeserver-210bdd1a

# Reset database
cd e:\AN-V2\backend
npx tsx reset-alice-workspace.ts

# Start fresh test
```

---

**Ready to test!** Follow the tests in order for best results. 🚀
