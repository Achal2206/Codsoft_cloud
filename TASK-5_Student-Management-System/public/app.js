// CodSoft Task 5: Cloud Student Management System Client Application

let currentRole = 'admin'; // 'admin' | 'teacher' | 'student'
let allStudents = [];
let allCourses = [];
let activeTeacherCourseId = 'CS301';
let activeStudentId = 'STU-2026-001';

// DOM Elements - Navigation & Roles
const btnRoleAdmin = document.getElementById('btnRoleAdmin');
const btnRoleTeacher = document.getElementById('btnRoleTeacher');
const btnRoleStudent = document.getElementById('btnRoleStudent');
const navAvatar = document.getElementById('navAvatar');
const navUserName = document.getElementById('navUserName');
const navUserRole = document.getElementById('navUserRole');

// Role Views
const viewAdmin = document.getElementById('viewAdmin');
const viewTeacher = document.getElementById('viewTeacher');
const viewStudent = document.getElementById('viewStudent');

// Admin Elements
const adminTotalStudents = document.getElementById('adminTotalStudents');
const adminTotalCourses = document.getElementById('adminTotalCourses');
const adminAvgCgpa = document.getElementById('adminAvgCgpa');
const adminWarningCount = document.getElementById('adminWarningCount');

const tabAdminStudents = document.getElementById('tabAdminStudents');
const tabAdminCourses = document.getElementById('tabAdminCourses');
const tabAdminAnalytics = document.getElementById('tabAdminAnalytics');
const panelAdminStudents = document.getElementById('panelAdminStudents');
const panelAdminCourses = document.getElementById('panelAdminCourses');
const panelAdminAnalytics = document.getElementById('panelAdminAnalytics');

const adminStudentSearch = document.getElementById('adminStudentSearch');
const adminStudentsTableBody = document.getElementById('adminStudentsTableBody');
const adminCoursesTableBody = document.getElementById('adminCoursesTableBody');
const warningStudentsList = document.getElementById('warningStudentsList');
const gradeChartCanvas = document.getElementById('gradeChartCanvas');
const btnExportReport = document.getElementById('btnExportReport');

// Modals Admin
const addStudentModal = document.getElementById('addStudentModal');
const btnOpenAddStudentModal = document.getElementById('btnOpenAddStudentModal');
const btnCloseAddStudentModal = document.getElementById('btnCloseAddStudentModal');
const formAddStudent = document.getElementById('formAddStudent');

const addCourseModal = document.getElementById('addCourseModal');
const btnOpenAddCourseModal = document.getElementById('btnOpenAddCourseModal');
const btnCloseAddCourseModal = document.getElementById('btnCloseAddCourseModal');
const formAddCourse = document.getElementById('formAddCourse');

// Teacher Elements
const teacherCourseSelect = document.getElementById('teacherCourseSelect');
const tabTeacherAttendance = document.getElementById('tabTeacherAttendance');
const tabTeacherGrades = document.getElementById('tabTeacherGrades');
const panelTeacherAttendance = document.getElementById('panelTeacherAttendance');
const panelTeacherGrades = document.getElementById('panelTeacherGrades');
const attendanceDatePicker = document.getElementById('attendanceDatePicker');
const attendanceRosterBody = document.getElementById('attendanceRosterBody');
const btnSaveAttendance = document.getElementById('btnSaveAttendance');
const gradesRosterBody = document.getElementById('gradesRosterBody');
const btnSaveGrades = document.getElementById('btnSaveGrades');

// Student Elements
const studentViewName = document.getElementById('studentViewName');
const studentViewSub = document.getElementById('studentViewSub');
const studentViewCgpa = document.getElementById('studentViewCgpa');
const studentViewStatus = document.getElementById('studentViewStatus');
const studentCoursesGrid = document.getElementById('studentCoursesGrid');

// Toast
const toastContainer = document.getElementById('toastContainer');

// Init
document.addEventListener('DOMContentLoaded', () => {
  attendanceDatePicker.value = new Date().toISOString().split('T')[0];

  setupEventListeners();
  loadAdminData();
});

function setupEventListeners() {
  // Role switcher buttons
  btnRoleAdmin.addEventListener('click', () => switchRole('admin'));
  btnRoleTeacher.addEventListener('click', () => switchRole('teacher'));
  btnRoleStudent.addEventListener('click', () => switchRole('student'));

  // Admin sub-tabs
  tabAdminStudents.addEventListener('click', () => {
    setActiveAdminSubTab(tabAdminStudents, panelAdminStudents);
  });
  tabAdminCourses.addEventListener('click', () => {
    setActiveAdminSubTab(tabAdminCourses, panelAdminCourses);
    loadAdminCourses();
  });
  tabAdminAnalytics.addEventListener('click', () => {
    setActiveAdminSubTab(tabAdminAnalytics, panelAdminAnalytics);
    loadAnalytics();
  });

  // Admin Modals
  btnOpenAddStudentModal.addEventListener('click', () => addStudentModal.style.display = 'flex');
  btnCloseAddStudentModal.addEventListener('click', () => addStudentModal.style.display = 'none');
  btnOpenAddCourseModal.addEventListener('click', () => addCourseModal.style.display = 'flex');
  btnCloseAddCourseModal.addEventListener('click', () => addCourseModal.style.display = 'none');

  formAddStudent.addEventListener('submit', handleAddStudent);
  formAddCourse.addEventListener('submit', handleAddCourse);
  adminStudentSearch.addEventListener('input', () => renderAdminStudentsTable());

  btnExportReport.addEventListener('click', exportCsvReport);

  // Teacher Sub Tabs
  tabTeacherAttendance.addEventListener('click', () => {
    tabTeacherAttendance.classList.add('active');
    tabTeacherGrades.classList.remove('active');
    panelTeacherAttendance.style.display = 'block';
    panelTeacherGrades.style.display = 'none';
  });

  tabTeacherGrades.addEventListener('click', () => {
    tabTeacherGrades.classList.add('active');
    tabTeacherAttendance.classList.remove('active');
    panelTeacherGrades.style.display = 'block';
    panelTeacherAttendance.style.display = 'none';
    loadTeacherGradesRoster();
  });

  teacherCourseSelect.addEventListener('change', (e) => {
    activeTeacherCourseId = e.target.value;
    loadTeacherAttendanceRoster();
    loadTeacherGradesRoster();
  });

  attendanceDatePicker.addEventListener('change', loadTeacherAttendanceRoster);
  btnSaveAttendance.addEventListener('click', saveAttendanceSession);
  btnSaveGrades.addEventListener('click', saveGradesSession);

  // Backdrop modal close
  [addStudentModal, addCourseModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  });
}

// Switch Role
function switchRole(role) {
  currentRole = role;
  [btnRoleAdmin, btnRoleTeacher, btnRoleStudent].forEach(b => b.classList.remove('active'));

  viewAdmin.style.display = 'none';
  viewTeacher.style.display = 'none';
  viewStudent.style.display = 'none';

  if (role === 'admin') {
    btnRoleAdmin.classList.add('active');
    viewAdmin.style.display = 'block';
    navAvatar.textContent = '👨‍💼';
    navUserName.textContent = 'Dr. Arvind Mehta';
    navUserRole.textContent = 'Administrator';
    loadAdminData();
  } else if (role === 'teacher') {
    btnRoleTeacher.classList.add('active');
    viewTeacher.style.display = 'block';
    navAvatar.textContent = '👩‍🏫';
    navUserName.textContent = 'Prof. Ananya Sharma';
    navUserRole.textContent = 'Faculty Head';
    loadTeacherModule();
  } else if (role === 'student') {
    btnRoleStudent.classList.add('active');
    viewStudent.style.display = 'block';
    navAvatar.textContent = '👨‍🎓';
    navUserName.textContent = 'Alex Rivera';
    navUserRole.textContent = 'Student (CS-301)';
    loadStudentPortal();
  }
}

function setActiveAdminSubTab(tabBtn, panel) {
  [tabAdminStudents, tabAdminCourses, tabAdminAnalytics].forEach(b => b.classList.remove('active'));
  [panelAdminStudents, panelAdminCourses, panelAdminAnalytics].forEach(p => p.style.display = 'none');
  tabBtn.classList.add('active');
  panel.style.display = 'block';
}

// ================= ADMIN MODULE =================
async function loadAdminData() {
  try {
    const [resStud, resCourse, resStats] = await Promise.all([
      fetch('/api/students'),
      fetch('/api/courses'),
      fetch('/api/analytics')
    ]);

    const dataStud = await resStud.json();
    const dataCourse = await resCourse.json();
    const dataStats = await resStats.json();

    if (dataStud.success) {
      allStudents = dataStud.students;
      adminTotalStudents.textContent = allStudents.length;
      renderAdminStudentsTable();
    }

    if (dataCourse.success) {
      allCourses = dataCourse.courses;
      adminTotalCourses.textContent = allCourses.length;
    }

    if (dataStats.success) {
      adminAvgCgpa.textContent = dataStats.summary.averageCgpa;
      adminWarningCount.textContent = dataStats.summary.warningCount;
    }
  } catch (e) {
    showToast('Failed to connect to cloud database.', 'error');
  }
}

function renderAdminStudentsTable() {
  const q = adminStudentSearch.value.toLowerCase().trim();
  const filtered = allStudents.filter(s => 
    s.name.toLowerCase().includes(q) || 
    s.rollNo.toLowerCase().includes(q) ||
    s.department.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    adminStudentsTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:2rem;">No students found matching query.</td></tr>`;
    return;
  }

  adminStudentsTableBody.innerHTML = filtered.map(s => {
    const isWarning = s.status === 'Academic Warning' || s.cgpa < 2.5;
    return `
      <tr>
        <td><strong style="color:#818cf8;">${s.rollNo}</strong></td>
        <td>
          <div style="font-weight:600;">${s.name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${s.email}</div>
        </td>
        <td>${s.department}</td>
        <td>Semester ${s.semester}</td>
        <td><strong style="color:#38bdf8; font-size:1rem;">${s.cgpa.toFixed(2)}</strong></td>
        <td>
          <span class="badge ${isWarning ? 'warning' : 'success'}">
            ${s.status}
          </span>
        </td>
        <td style="text-align: right;">
          <button class="btn-danger" onclick="deleteStudent('${s.id}')">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function handleAddStudent(e) {
  e.preventDefault();
  const name = document.getElementById('newStudentName').value;
  const email = document.getElementById('newStudentEmail').value;
  const rollNo = document.getElementById('newStudentRoll').value;
  const department = document.getElementById('newStudentDept').value;
  const semester = document.getElementById('newStudentSem').value;

  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, rollNo, department, semester })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Student ${name} added!`, 'success');
      formAddStudent.reset();
      addStudentModal.style.display = 'none';
      loadAdminData();
    }
  } catch (err) {
    showToast('Failed to add student.', 'error');
  }
}

async function deleteStudent(id) {
  if (!confirm('Are you sure you want to remove this student record from cloud database?')) return;
  try {
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Student record deleted.', 'success');
      loadAdminData();
    }
  } catch (e) {
    showToast('Delete failed.', 'error');
  }
}

async function loadAdminCourses() {
  try {
    const res = await fetch('/api/courses');
    const data = await res.json();
    if (data.success) {
      allCourses = data.courses;
      adminCoursesTableBody.innerHTML = allCourses.map(c => `
        <tr>
          <td><strong style="color:#818cf8;">${c.code}</strong></td>
          <td><strong style="color:#fff;">${c.title}</strong></td>
          <td>${c.instructor}</td>
          <td>${c.credits} Credits</td>
          <td>${c.schedule}</td>
          <td><span class="badge info">${c.room}</span></td>
        </tr>
      `).join('');
    }
  } catch (e) {}
}

async function handleAddCourse(e) {
  e.preventDefault();
  const code = document.getElementById('newCourseCode').value;
  const title = document.getElementById('newCourseTitle').value;
  const instructor = document.getElementById('newCourseInstructor').value;
  const credits = document.getElementById('newCourseCredits').value;
  const schedule = document.getElementById('newCourseSchedule').value;

  try {
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, title, instructor, credits, schedule })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Course ${code} registered!`, 'success');
      formAddCourse.reset();
      addCourseModal.style.display = 'none';
      loadAdminCourses();
    }
  } catch (e) {}
}

// Analytics Dashboard & Chart (Bonus Feature)
async function loadAnalytics() {
  try {
    const res = await fetch('/api/analytics');
    const data = await res.json();

    if (data.success) {
      drawGradeChart(data.gradeDistribution);

      // Warning List
      warningStudentsList.innerHTML = data.warningStudents.map(s => `
        <div class="warning-item">
          <div>
            <strong>${s.name} (${s.rollNo})</strong>
            <div>${s.department} • CGPA: <strong style="color:#ef4444;">${s.cgpa.toFixed(2)}</strong></div>
          </div>
          <span class="badge warning">${s.status}</span>
        </div>
      `).join('');
    }
  } catch (e) {
    console.error(e);
  }
}

function drawGradeChart(grades) {
  const ctx = gradeChartCanvas.getContext('2d');
  ctx.clearRect(0, 0, gradeChartCanvas.width, gradeChartCanvas.height);

  const labels = Object.keys(grades);
  const values = Object.values(grades);
  const maxValue = Math.max(...values, 5);

  const barWidth = 42;
  const gap = 20;
  const startX = 35;
  const baseLineY = 200;
  const chartHeight = 150;

  // Draw axis
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(25, baseLineY);
  ctx.lineTo(380, baseLineY);
  ctx.stroke();

  labels.forEach((label, i) => {
    const val = values[i];
    const h = (val / maxValue) * chartHeight;
    const x = startX + i * (barWidth + gap);
    const y = baseLineY - h;

    // Gradient bar
    const grad = ctx.createLinearGradient(0, y, 0, baseLineY);
    grad.addColorStop(0, '#4f46e5');
    grad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barWidth, h);

    // Value text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(val, x + barWidth / 2, y - 6);

    // Label text
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText(label, x + barWidth / 2, baseLineY + 16);
  });
}

function exportCsvReport() {
  let csv = 'Roll No,Name,Email,Department,Semester,CGPA,Status\n';
  allStudents.forEach(s => {
    csv += `"${s.rollNo}","${s.name}","${s.email}","${s.department}","${s.semester}","${s.cgpa}","${s.status}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CodSoft_Student_Report_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  showToast('Academic report exported to CSV.', 'info');
}

// ================= TEACHER MODULE =================
async function loadTeacherModule() {
  try {
    const res = await fetch('/api/courses');
    const data = await res.json();
    if (data.success) {
      allCourses = data.courses;
      teacherCourseSelect.innerHTML = allCourses.map(c => `
        <option value="${c.id}">${c.code} - ${c.title}</option>
      `).join('');
      activeTeacherCourseId = allCourses[0].id;
      loadTeacherAttendanceRoster();
    }
  } catch (e) {}
}

async function loadTeacherAttendanceRoster() {
  const date = attendanceDatePicker.value;
  try {
    const [resStud, resAtt] = await Promise.all([
      fetch('/api/students'),
      fetch(`/api/attendance?courseId=${activeTeacherCourseId}&date=${date}`)
    ]);

    const dataStud = await resStud.json();
    const dataAtt = await resAtt.json();

    const enrolledStudents = dataStud.students.filter(s => s.enrolledCourses.includes(activeTeacherCourseId));
    const attMap = {};
    if (dataAtt.logs) {
      dataAtt.logs.forEach(l => attMap[l.studentId] = l.status);
    }

    attendanceRosterBody.innerHTML = enrolledStudents.map(s => {
      const currentStatus = attMap[s.id] || 'present';
      return `
        <tr data-student-id="${s.id}">
          <td><strong style="color:#818cf8;">${s.rollNo}</strong></td>
          <td><strong>${s.name}</strong></td>
          <td>${s.department}</td>
          <td style="text-align: center;">
            <div class="att-btn-group">
              <button class="att-pill present ${currentStatus === 'present' ? 'active' : ''}" onclick="setAttendanceStatus(this, 'present')">Present</button>
              <button class="att-pill late ${currentStatus === 'late' ? 'active' : ''}" onclick="setAttendanceStatus(this, 'late')">Late</button>
              <button class="att-pill absent ${currentStatus === 'absent' ? 'active' : ''}" onclick="setAttendanceStatus(this, 'absent')">Absent</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (e) {}
}

function setAttendanceStatus(btn, status) {
  const group = btn.closest('.att-btn-group');
  group.querySelectorAll('.att-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

async function saveAttendanceSession() {
  const date = attendanceDatePicker.value;
  const rows = attendanceRosterBody.querySelectorAll('tr');
  const records = [];

  rows.forEach(r => {
    const studentId = r.dataset.studentId;
    const activeBtn = r.querySelector('.att-pill.active');
    let status = 'present';
    if (activeBtn) {
      if (activeBtn.classList.contains('absent')) status = 'absent';
      else if (activeBtn.classList.contains('late')) status = 'late';
    }
    records.push({ studentId, status });
  });

  try {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId: activeTeacherCourseId,
        date,
        records
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
    }
  } catch (e) {
    showToast('Failed to save attendance.', 'error');
  }
}

async function loadTeacherGradesRoster() {
  try {
    const [resStud, resGrades] = await Promise.all([
      fetch('/api/students'),
      fetch(`/api/grades?courseId=${activeTeacherCourseId}`)
    ]);

    const dataStud = await resStud.json();
    const dataGrades = await resGrades.json();

    const enrolled = dataStud.students.filter(s => s.enrolledCourses.includes(activeTeacherCourseId));
    const gradeMap = {};
    if (dataGrades.grades) {
      dataGrades.grades.forEach(g => gradeMap[g.studentId] = g);
    }

    gradesRosterBody.innerHTML = enrolled.map(s => {
      const g = gradeMap[s.id] || { assignmentScore: 85, midtermScore: 80, finalScore: 85, totalScore: 83.25, letterGrade: 'A-' };
      return `
        <tr data-student-id="${s.id}">
          <td><strong style="color:#818cf8;">${s.rollNo}</strong></td>
          <td><strong>${s.name}</strong></td>
          <td>
            <input type="number" class="grade-input inp-assign" value="${g.assignmentScore}" min="0" max="100" oninput="calculateRowGrade(this)">
          </td>
          <td>
            <input type="number" class="grade-input inp-midterm" value="${g.midtermScore}" min="0" max="100" oninput="calculateRowGrade(this)">
          </td>
          <td>
            <input type="number" class="grade-input inp-final" value="${g.finalScore}" min="0" max="100" oninput="calculateRowGrade(this)">
          </td>
          <td><strong class="total-score-val" style="color:#38bdf8;">${g.totalScore}</strong></td>
          <td><span class="badge success letter-grade-val">${g.letterGrade}</span></td>
        </tr>
      `;
    }).join('');
  } catch (e) {}
}

function calculateRowGrade(input) {
  const row = input.closest('tr');
  const a = parseFloat(row.querySelector('.inp-assign').value) || 0;
  const m = parseFloat(row.querySelector('.inp-midterm').value) || 0;
  const f = parseFloat(row.querySelector('.inp-final').value) || 0;

  const total = Math.round((a * 0.25 + m * 0.35 + f * 0.4) * 10) / 10;
  row.querySelector('.total-score-val').textContent = total;

  let letter = 'F';
  if (total >= 93) letter = 'A+';
  else if (total >= 88) letter = 'A';
  else if (total >= 83) letter = 'A-';
  else if (total >= 78) letter = 'B+';
  else if (total >= 73) letter = 'B';
  else if (total >= 68) letter = 'B-';
  else if (total >= 63) letter = 'C+';
  else if (total >= 55) letter = 'C';
  else if (total >= 45) letter = 'D';

  const badge = row.querySelector('.letter-grade-val');
  badge.textContent = letter;
  badge.className = `badge ${['D', 'F'].includes(letter) ? 'warning' : 'success'} letter-grade-val`;
}

async function saveGradesSession() {
  const rows = gradesRosterBody.querySelectorAll('tr');
  let savedCount = 0;

  for (const row of rows) {
    const studentId = row.dataset.studentId;
    const a = row.querySelector('.inp-assign').value;
    const m = row.querySelector('.inp-midterm').value;
    const f = row.querySelector('.inp-final').value;

    try {
      await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          courseId: activeTeacherCourseId,
          assignmentScore: a,
          midtermScore: m,
          finalScore: f
        })
      });
      savedCount++;
    } catch (e) {}
  }

  showToast(`Grades committed for ${savedCount} students to Cloud DB!`, 'success');
}

// ================= STUDENT MODULE =================
async function loadStudentPortal() {
  try {
    const res = await fetch(`/api/student-portal/${activeStudentId}`);
    const data = await res.json();

    if (data.success) {
      const s = data.student;
      studentViewName.textContent = s.name;
      studentViewSub.textContent = `Roll No: ${s.rollNo} | ${s.department} (Semester ${s.semester})`;
      studentViewCgpa.textContent = s.cgpa.toFixed(2);
      studentViewStatus.textContent = s.status;
      studentViewStatus.className = `badge ${s.status === 'Academic Warning' ? 'warning' : 'success'}`;

      studentCoursesGrid.innerHTML = data.courses.map(item => {
        const c = item.course;
        const att = item.attendance;
        const g = item.grade || { letterGrade: 'Pending', gradePoints: 0, totalScore: '-' };
        const isAttWarning = att.isWarning;

        return `
          <div class="course-card glass-panel">
            <div class="course-card-top">
              <div>
                <span class="course-code-tag">${c.code} (${c.credits} Credits)</span>
                <h3 class="course-title">${c.title}</h3>
                <p class="course-meta">👨‍🏫 ${c.instructor} • 📍 ${c.room}</p>
                <p class="course-meta">🕒 ${c.schedule}</p>
              </div>
              <span class="badge ${g.letterGrade.startsWith('A') ? 'success' : 'info'}" style="font-size:0.9rem; padding:0.3rem 0.6rem;">
                Grade: ${g.letterGrade}
              </span>
            </div>

            <div class="course-stats-row">
              <div class="stat-item">
                <label>Attendance Rate</label>
                <strong style="color:${isAttWarning ? '#ef4444' : '#10b981'};">
                  ${att.percentage}%
                </strong>
                ${isAttWarning ? '<div style="color:#ef4444; font-size:0.7rem; font-weight:700;">⚠️ Low Attendance</div>' : ''}
              </div>
              <div class="stat-item">
                <label>Weighted Score</label>
                <strong style="color:#38bdf8;">${g.totalScore} / 100</strong>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (e) {
    showToast('Failed to load student portal.', 'error');
  }
}

// Toast helper
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}
