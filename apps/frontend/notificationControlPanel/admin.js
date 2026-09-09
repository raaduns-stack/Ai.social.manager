const auditData = [
  { id: "101", status: "SENT", type: "ANNOUNCEMENT", title: "New Feature Launch", channel: "BOTH", timestamp: new Date().toISOString() },
  { id: "102", status: "SENT", type: "SUBSCRIPTION", title: "Renewal Alert", channel: "EMAIL", timestamp: new Date().toISOString() },
  { id: "103", status: "FAILED", type: "PUBLISHING", title: "Twitter Post Failed", channel: "IN_APP", timestamp: new Date().toISOString() }
];

const tabDispatchBtn = document.getElementById('tab-dispatch-btn');
const tabHistoryBtn = document.getElementById('tab-history-btn');
const dispatchView = document.getElementById('dispatch-view');
const historyView = document.getElementById('history-view');

const form = document.getElementById('announcement-form');
const tableBody = document.getElementById('audit-table-body');
const searchInput = document.getElementById('search-input');
const typeFilter = document.getElementById('type-filter');

tabDispatchBtn.addEventListener('click', () => switchTab('DISPATCH'));
tabHistoryBtn.addEventListener('click', () => switchTab('HISTORY'));

function switchTab(tab) {
  if (tab === 'DISPATCH') {
    tabDispatchBtn.classList.add('active');
    tabHistoryBtn.classList.remove('active');
    dispatchView.classList.remove('hidden');
    historyView.classList.add('hidden');
  } else {
    tabHistoryBtn.classList.add('active');
    tabDispatchBtn.classList.remove('active');
    historyView.classList.remove('hidden');
    dispatchView.classList.add('hidden');
    renderTable();
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('announcement-title').value;
  const message = document.getElementById('announcement-message').value;
  const channel = document.getElementById('announcement-channel').value;

  auditData.unshift({
    id: String(Date.now()),
    status: 'SENT',
    type: 'ANNOUNCEMENT',
    title,
    channel,
    timestamp: new Date().toISOString()
  });

  alert('Announcement Dispatched!');
  form.reset();
});

searchInput.addEventListener('input', renderTable);
typeFilter.addEventListener('change', renderTable);

function renderTable() {
  const query = searchInput.value.toLowerCase();
  const filter = typeFilter.value;

  const filtered = auditData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(query);
    const matchesFilter = filter === 'ALL' || item.type === filter;
    return matchesSearch && matchesFilter;
  });

  tableBody.innerHTML = '';
  filtered.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="status-pill ${item.status.toLowerCase()}">${item.status}</span></td>
      <td><strong>${item.type}</strong></td>
      <td>${item.title}</td>
      <td>${item.channel}</td>
      <td>${new Date(item.timestamp).toLocaleString()}</td>
    `;
    tableBody.appendChild(tr);
  });
}