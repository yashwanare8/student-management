const form = document.getElementById("studentForm");
const msg = document.getElementById("message");
const tbody = document.getElementById("tableBody");
const fields = ["studentId", "name", "email", "department", "semester", "contact"];
let editingId = null;

const show = (text, ok = true) => {
  msg.textContent = text;
  msg.className = ok ? "ok" : "err";
};

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function loadStudents(search = "") {
  try {
    const res = await fetch(`${API_URL}${search ? "?search=" + encodeURIComponent(search) : ""}`);
    const { data } = await res.json();
    tbody.innerHTML = data.length
      ? data.map((s) => `
        <tr>
          <td>${esc(s.studentId)}</td><td>${esc(s.name)}</td><td>${esc(s.email)}</td>
          <td>${esc(s.department)}</td><td>${esc(s.semester)}</td><td>${esc(s.contact)}</td>
          <td>
            <button onclick="editStudent('${esc(s.studentId)}')">Edit</button>
            <button class="danger" onclick="deleteStudent('${esc(s.studentId)}')">Delete</button>
          </td>
        </tr>`).join("")
      : `<tr><td colspan="7">No records found</td></tr>`;
  } catch {
    show("Cannot reach the server", false);
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {};
  fields.forEach((f) => (body[f] = document.getElementById(f).value.trim()));
  body.semester = Number(body.semester);

  const url = editingId ? `${API_URL}/${editingId}` : API_URL;
  try {
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    show(data.message, data.success);
    if (data.success) { resetForm(); loadStudents(); }
  } catch {
    show("Cannot reach the server", false);
  }
});

async function editStudent(id) {
  const res = await fetch(`${API_URL}/${id}`);
  const { data } = await res.json();
  fields.forEach((f) => (document.getElementById(f).value = data[f] ?? ""));
  document.getElementById("studentId").disabled = true;
  document.getElementById("formTitle").textContent = "Edit Student";
  document.getElementById("saveBtn").textContent = "Update Student";
  document.getElementById("cancelBtn").hidden = false;
  editingId = id;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteStudent(id) {
  if (!confirm(`Delete student ${id}?`)) return;
  const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  const data = await res.json();
  show(data.message, data.success);
  loadStudents();
}

function resetForm() {
  form.reset();
  editingId = null;
  document.getElementById("studentId").disabled = false;
  document.getElementById("formTitle").textContent = "Add Student";
  document.getElementById("saveBtn").textContent = "Add Student";
  document.getElementById("cancelBtn").hidden = true;
}

document.getElementById("cancelBtn").onclick = resetForm;
document.getElementById("searchBtn").onclick = () => loadStudents(document.getElementById("search").value.trim());
document.getElementById("resetBtn").onclick = () => { document.getElementById("search").value = ""; loadStudents(); };

loadStudents();
