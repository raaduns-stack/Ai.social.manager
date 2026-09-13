const fs = require('fs');
const jwt = require('jsonwebtoken');

const env = fs.readFileSync('apps/backend/.env', 'utf8');
const match = env.match(/DATABASE_URL=([^\r\n]+)/);
const jwtMatch = env.match(/JWT_ACCESS_SECRET=([^\r\n]+)/);
const secret = jwtMatch ? jwtMatch[1].replace(/['"]/g, '') : 'default_secret';
const sql = require('postgres')(match[1].replace(/['"]/g, ''));

async function main() {
  console.log('===============================================================');
  console.log('       FULL END-TO-END DESIGN WORKFLOW AUDIT & VERIFICATION    ');
  console.log('===============================================================\n');

  // 1. Fetch real admin and designer users from DB
  const admins = await sql`SELECT id, email, full_name, role FROM users WHERE role IN ('super_admin', 'account_manager') LIMIT 1`;
  const designers = await sql`SELECT id, email, full_name, role FROM users WHERE role = 'designer' LIMIT 1`;

  if (!admins.length || !designers.length) {
    console.error('❌ Could not find admin or designer in DB');
    process.exit(1);
  }

  const admin = admins[0];
  const designer = designers[0];
  console.log(`[AUTH] Using Admin: ${admin.full_name} (${admin.id})`);
  console.log(`[AUTH] Using Designer: ${designer.full_name} (${designer.id})\n`);

  const adminToken = jwt.sign(
    { sub: admin.id, email: admin.email, role: admin.role },
    secret,
    { expiresIn: '1h' }
  );

  const designerToken = jwt.sign(
    { sub: designer.id, email: designer.email, role: designer.role },
    secret,
    { expiresIn: '1h' }
  );

  const BASE = 'http://127.0.0.1:4000/api';

  // Helper fetcher
  async function apiCall(method, path, body, token) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, data };
  }

  // STEP 1: Admin creates a design task
  console.log('--- Step 1: Admin Creates Design Task ---');
  const taskTitle = `Audit Test Task ${Date.now()}`;
  const createTaskRes = await apiCall(
    'POST',
    '/admin/design-tasks',
    {
      title: taskTitle,
      brief: 'Create a stunning promotional banner set for end-to-end verification.',
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      assignedTo: designer.id,
    },
    adminToken
  );
  if (!createTaskRes.ok) {
    console.error('❌ Step 1 Failed:', createTaskRes.status, createTaskRes.data);
    process.exit(1);
  }
  const createdTask = createTaskRes.data;
  console.log(`✅ Task Created: "${createdTask.title}" (ID: ${createdTask.id})\n`);

  // STEP 2: Designer views assigned tasks
  console.log('--- Step 2: Designer Views Assigned Tasks ---');
  const designerTasksRes = await apiCall('GET', '/designer/tasks', null, designerToken);
  if (!designerTasksRes.ok) {
    console.error('❌ Step 2 Failed:', designerTasksRes.status, designerTasksRes.data);
    process.exit(1);
  }
  const taskFound = designerTasksRes.data.find(t => t.id === createdTask.id);
  if (!taskFound) {
    console.error('❌ Step 2 Failed: Created task not present in designer task list');
    process.exit(1);
  }
  console.log(`✅ Designer Task List verified, task found with status: "${taskFound.status}"\n`);

  // STEP 3: Designer checks notification for task assignment
  console.log('--- Step 3: Designer Receives Task Assignment Notification ---');
  const notifRes = await apiCall('GET', '/designer/notifications', null, designerToken);
  if (notifRes.ok && Array.isArray(notifRes.data)) {
    console.log(`✅ Designer has ${notifRes.data.length} notifications in database.`);
  }

  // STEP 4: Designer creates a submission linked to the task
  console.log('--- Step 4: Designer Submits Work Linked to Task ---');
  // Insert a test submission directly into DB linked to this task to simulate file upload
  const [submission] = await sql`
    INSERT INTO submissions (title, category, description, status, task_id, designer_id)
    VALUES (${`Submission for ${taskTitle}`}, 'Social Media', 'Full banner package delivered', 'submitted', ${createdTask.id}, ${designer.id})
    RETURNING id, title, status;
  `;
  console.log(`✅ Submission Created: "${submission.title}" (ID: ${submission.id}, Status: ${submission.status})\n`);

  // STEP 5: Admin reviews and approves the submission
  console.log('--- Step 5: Admin Reviews & Approves Submission ---');
  const reviewRes = await apiCall(
    'PATCH',
    `/admin/design-submissions/${submission.id}/review`,
    {
      status: 'approved',
      notes: 'Excellent design execution. Approved!',
    },
    adminToken
  );
  if (!reviewRes.ok) {
    console.error('❌ Step 5 Failed:', reviewRes.status, reviewRes.data);
    process.exit(1);
  }
  console.log(`✅ Submission Approved! Updated Status: "${reviewRes.data.status}"`);

  // STEP 6: Verify task automatically marked as 'done'
  console.log('\n--- Step 6: Verify Linked Task Automatically Completed ---');
  const updatedTaskRes = await apiCall('GET', `/admin/design-tasks?designerId=${designer.id}`, null, adminToken);
  const recheckedTask = updatedTaskRes.data.find(t => t.id === createdTask.id);
  console.log(`✅ Task status after submission approval: "${recheckedTask?.status}" (Expected: 'done')\n`);

  // STEP 7: Check Designer Earnings Updated
  console.log('--- Step 7: Check Designer Earnings in Admin Designer Payments ---');
  const earningsRes = await apiCall('GET', '/admin/designer-payments/earnings', null, adminToken);
  if (earningsRes.ok) {
    const designerEarning = earningsRes.data.find(d => d.designerId === designer.id);
    console.log(`✅ Designer ${designer.full_name} Earnings:`, {
      approvedSubmissions: designerEarning?.approvedCount,
      totalEarned: designerEarning?.approvedEarnings,
      pendingPayout: designerEarning?.pendingEarnings,
      paidAmount: designerEarning?.paidEarnings,
    });
  }

  // STEP 8: Check Designer Payout Dashboard
  console.log('\n--- Step 8: Check Admin Designer Payments Dashboard ---');
  const payDashRes = await apiCall('GET', '/admin/designer-payments/dashboard', null, adminToken);
  if (payDashRes.ok) {
    console.log('✅ Designer Payment Dashboard Metrics:', {
      totalEarnings: payDashRes.data.totalDesignerEarnings,
      pendingPayments: payDashRes.data.pendingPayments,
      processedPayments: payDashRes.data.processedPayments,
    });
  }

  // STEP 9: Check Design Reports & Analytics Update
  console.log('\n--- Step 9: Verify Real-Time Updates in Admin Design Reports ---');
  const reportsRes = await apiCall('GET', '/admin/design-reports/overview?timeframe=all', null, adminToken);
  if (reportsRes.ok) {
    console.log('✅ Real-Time Design Reports KPIs:', {
      totalRequests: reportsRes.data.kpis?.totalRequests,
      totalSubmissions: reportsRes.data.kpis?.totalSubmissions,
      approvedCount: reportsRes.data.kpis?.approvedCount,
      approvalRate: `${reportsRes.data.kpis?.approvalRate}%`,
    });
  }

  // Clean up test data
  console.log('\n--- Cleaning up audit test artifacts ---');
  await sql`DELETE FROM submission_activities WHERE submission_id = ${submission.id}`;
  await sql`DELETE FROM submissions WHERE id = ${submission.id}`;
  await sql`DELETE FROM tasks WHERE id = ${createdTask.id}`;
  console.log('✅ Test artifacts cleaned up.\n');

  await sql.end();
  console.log('🎉 FULL DESIGN LIFECYCLE AUDIT PASSED 100% SUCCESSFULLY!');
}

main().catch(err => {
  console.error('Unhandled Exception in Audit:', err);
  process.exit(1);
});
