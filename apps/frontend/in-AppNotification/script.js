const notifications = [
  {
    id: "1",
    type: "APPROVAL",
    title: "New Content Ready for Review",
    message: "Your post 'Summer Promotion' is ready for review.",
    isRead: false,
    timestamp: new Date().toISOString(),
    reviewUrl: "#"
  },
  
  {
    id: "2",
    type: "PUBLISHING",
    title: "Post Published Successfully",
    message: "Your post was successfully published to Twitter.",
    isRead: false,
    timestamp: new Date().toISOString()
  }
];

let activeFilter = 'ALL';

const bellBtn = document.getElementById('bell-btn');
const drawer = document.getElementById('notification-drawer');
const closeBtn = document.getElementById('close-drawer-btn');
const unreadBadge = document.getElementById('unread-badge');
const headerUnreadCount = document.getElementById('header-unread-count');
const listContainer = document.getElementById('notification-list');
const filterAllBtn = document.getElementById('filter-all-btn');
const filterUnreadBtn = document.getElementById('filter-unread-btn');
const markAllReadBtn = document.getElementById('mark-all-read-btn');

bellBtn.addEventListener('click', () => drawer.classList.toggle('hidden'));
closeBtn.addEventListener('click', () => drawer.classList.add('hidden'));

filterAllBtn.addEventListener('click', () => {
  activeFilter = 'ALL';
  filterAllBtn.classList.add('active');
  filterUnreadBtn.classList.remove('active');
  render();
});

filterUnreadBtn.addEventListener('click', () => {
  activeFilter = 'UNREAD';
  filterUnreadBtn.classList.add('active');
  filterAllBtn.classList.remove('active');
  render();
});

markAllReadBtn.addEventListener('click', () => {
  notifications.forEach(n => n.isRead = true);
  render();
});

function render() {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  unreadBadge.textContent = unreadCount;
  unreadBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
  headerUnreadCount.textContent = `${unreadCount} new`;

  const filtered = notifications.filter(n => activeFilter === 'UNREAD' ? !n.isRead : true);
  listContainer.innerHTML = '';

  if (filtered.length === 0) {
    listContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">No notifications</div>`;
    return;
  }

  filtered.forEach(item => {
    const div = document.createElement('div');
    div.className = `item ${item.isRead ? '' : 'unread'}`;
    div.onclick = () => {
      item.isRead = true;
      render();
    };

    div.innerHTML = `
      <div class="item-content">
        <h4>${item.title}</h4>
        <p>${item.message}</p>
        ${item.reviewUrl ? `<a href="${item.reviewUrl}" class="action-link">Review Content &rarr;</a>` : ''}
        <span class="item-time">${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    `;
    listContainer.appendChild(div);
  });
}

render();