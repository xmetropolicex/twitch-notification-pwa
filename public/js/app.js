// Twitch API Ayarları
const TWITCH_CLIENT_ID = 'YOUR_CLIENT_ID'; // Twitch Developer Console'dan alınacak
const TWITCH_REDIRECT_URI = window.location.origin; // Uygulama URL'i
const TWITCH_SCOPE = 'user:read:follows';

// DOM Elementleri
const loginScreen = document.getElementById('login-screen');
const appContent = document.getElementById('app-content');
const loginButton = document.getElementById('login-button');
const logoutButton = document.getElementById('logout-button');
const streamersList = document.getElementById('streamers-list');
const notificationsList = document.getElementById('notifications-list');
const noNotifications = document.getElementById('no-notifications');
const clearNotificationsButton = document.getElementById('clear-notifications');
const pwaInstallPrompt = document.getElementById('pwa-install-prompt');
const pwaInstallButton = document.getElementById('pwa-install');
const pwaCancelButton = document.getElementById('pwa-cancel');

// Değişkenler
let deferredPrompt; // PWA kurulum promptu
let followedStreamers = []; // Takip edilen yayıncılar
let liveStreamers = []; // Aktif yayın yapan yayıncılar
let notifications = []; // Bildirimler
let accessToken = null; // Twitch API erişim tokeni
let checkInterval = null; // Yayıncıları kontrol etme zamanlayıcısı

// Yerel Depolama Anahtarları
const STORAGE_AUTH_TOKEN = 'twitch_auth_token';
const STORAGE_NOTIFICATIONS = 'twitch_notifications';
const STORAGE_PWA_PROMPT_DISMISSED = 'pwa_prompt_dismissed';

// PWA Kurulum
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Kullanıcı daha önce prompt'u reddetmemişse göster
  const promptDismissed = localStorage.getItem(STORAGE_PWA_PROMPT_DISMISSED) === 'true';
  if (!promptDismissed) {
    pwaInstallPrompt.classList.remove('hidden');
  }
});

pwaInstallButton.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    console.log('Kullanıcı PWA kurulumunu kabul etti');
  } else {
    console.log('Kullanıcı PWA kurulumunu reddetti');
  }
  
  deferredPrompt = null;
  pwaInstallPrompt.classList.add('hidden');
});

pwaCancelButton.addEventListener('click', () => {
  pwaInstallPrompt.classList.add('hidden');
  localStorage.setItem(STORAGE_PWA_PROMPT_DISMISSED, 'true');
});

// Uygulama Başlangıcı
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  // Localstorage'dan bildirimleri yükle
  loadNotifications();
  
  // Auth token kontrolü
  accessToken = localStorage.getItem(STORAGE_AUTH_TOKEN);
  
  if (accessToken) {
    validateToken()
      .then(valid => {
        if (valid) {
          showApp();
          fetchFollowedStreamers();
        } else {
          showLogin();
        }
      })
      .catch(() => showLogin());
  } else {
    // URL'den auth token kontrolü (Twitch yönlendirmesinden sonra)
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.slice(1));
      accessToken = params.get('access_token');
      
      if (accessToken) {
        localStorage.setItem(STORAGE_AUTH_TOKEN, accessToken);
        // URL'i temizle
        window.history.replaceState({}, document.title, window.location.pathname);
        showApp();
        fetchFollowedStreamers();
      } else {
        showLogin();
      }
    } else {
      showLogin();
    }
  }
  
  // Event Listeners
  loginButton.addEventListener('click', login);
  logoutButton.addEventListener('click', logout);
  clearNotificationsButton.addEventListener('click', clearNotifications);
}

// UI Fonksiyonları
function showLogin() {
  loginScreen.classList.remove('hidden');
  appContent.classList.add('hidden');
  
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

function showApp() {
  loginScreen.classList.add('hidden');
  appContent.classList.remove('hidden');
  
  // Her 2 dakikada bir yayın durumu kontrolü
  if (!checkInterval) {
    checkLiveStatus();
    checkInterval = setInterval(checkLiveStatus, 2 * 60 * 1000);
  }
}

// Twitch API Fonksiyonları
function login() {
  const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(TWITCH_REDIRECT_URI)}&response_type=token&scope=${TWITCH_SCOPE}`;
  window.location.href = authUrl;
}

function logout() {
  localStorage.removeItem(STORAGE_AUTH_TOKEN);
  accessToken = null;
  followedStreamers = [];
  liveStreamers = [];
  
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  
  showLogin();
}

async function validateToken() {
  try {
    const response = await fetch('https://id.twitch.tv/oauth2/validate', {
      headers: {
        'Authorization': `OAuth ${accessToken}`
      }
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    return false;
  }
}

async function fetchFollowedStreamers() {
  try {
    const userId = await getUserId();
    if (!userId) return;
    
    let followedUsers = [];
    let cursor = null;
    let hasMorePages = true;
    
    // Tüm takip edilen yayıncıları al (pagination ile)
    while (hasMorePages) {
      const url = `https://api.twitch.tv/helix/users/follows?from_id=${userId}&first=100${cursor ? `&after=${cursor}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'Client-ID': TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) throw new Error('Yayıncı bilgileri alınamadı');
      
      const data = await response.json();
      followedUsers = [...followedUsers, ...data.data];
      
      if (data.pagination && data.pagination.cursor) {
        cursor = data.pagination.cursor;
      } else {
        hasMorePages = false;
      }
    }
    
    // Yayıncı detaylarını al
    if (followedUsers.length > 0) {
      const userIds = followedUsers.map(follow => follow.to_id);
      followedStreamers = await fetchUserDetails(userIds);
      renderStreamersList();
      checkLiveStatus();
    }
  } catch (error) {
    console.error('Takip edilen yayıncılar alınırken hata:', error);
  }
}

async function getUserId() {
  try {
    const response = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) throw new Error('Kullanıcı bilgileri alınamadı');
    
    const data = await response.json();
    return data.data[0].id;
  } catch (error) {
    console.error('Kullanıcı ID alınırken hata:', error);
    return null;
  }
}

async function fetchUserDetails(userIds) {
  try {
    // API sınırlaması nedeniyle 100'er kullanıcı olarak böl
    const userChunks = [];
    for (let i = 0; i < userIds.length; i += 100) {
      userChunks.push(userIds.slice(i, i + 100));
    }
    
    let allUsers = [];
    
    for (const chunk of userChunks) {
      const userIdParams = chunk.map(id => `id=${id}`).join('&');
      const response = await fetch(`https://api.twitch.tv/helix/users?${userIdParams}`, {
        headers: {
          'Client-ID': TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) throw new Error('Yayıncı detayları alınamadı');
      
      const data = await response.json();
      allUsers = [...allUsers, ...data.data];
    }
    
    return allUsers;
  } catch (error) {
    console.error('Yayıncı detayları alınırken hata:', error);
    return [];
  }
}

async function checkLiveStatus() {
  if (!followedStreamers.length) return;
  
  try {
    // Takip edilen yayıncıların ID'lerini al
    const userIds = followedStreamers.map(streamer => streamer.id);
    
    // API sınırlaması nedeniyle 100'er kullanıcı olarak böl
    const userChunks = [];
    for (let i = 0; i < userIds.length; i += 100) {
      userChunks.push(userIds.slice(i, i + 100));
    }
    
    let currentLiveStreamers = [];
    
    for (const chunk of userChunks) {
      const userIdParams = chunk.map(id => `user_id=${id}`).join('&');
      const response = await fetch(`https://api.twitch.tv/helix/streams?${userIdParams}`, {
        headers: {
          'Client-ID': TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) throw new Error('Yayın bilgileri alınamadı');
      
      const data = await response.json();
      currentLiveStreamers = [...currentLiveStreamers, ...data.data];
    }
    
    // Önceden aktif olmayan ama şimdi aktif olan yayıncılar için bildirim oluştur
    const previousLiveIds = liveStreamers.map(stream => stream.user_id);
    const newLiveStreams = currentLiveStreamers.filter(stream => !previousLiveIds.includes(stream.user_id));
    
    if (newLiveStreams.length > 0) {
      for (const stream of newLiveStreams) {
        const streamer = followedStreamers.find(s => s.id === stream.user_id);
        if (streamer) {
          createNotification(streamer, stream);
        }
      }
    }
    
    // Canlı yayıncılar listesini güncelle
    liveStreamers = currentLiveStreamers;
    
    // UI'ı güncelle
    renderStreamersList();
  } catch (error) {
    console.error('Canlı yayın kontrolü sırasında hata:', error);
  }
}

// Bildirim Fonksiyonları
function createNotification(streamer, stream) {
  const notification = {
    id: Date.now(),
    streamerId: streamer.id,
    streamerName: streamer.display_name,
    streamerImage: streamer.profile_image_url,
    title: stream.title,
    game: stream.game_name,
    url: `https://twitch.tv/${streamer.login}`,
    timestamp: new Date().toISOString()
  };
  
  // Bildirimi kaydet
  notifications.unshift(notification);
  saveNotifications();
  
  // UI'ı güncelle
  renderNotifications();
  
  // Web bildirimi göster (izin alınmışsa)
  showWebNotification(notification);
}

function showWebNotification(notification) {
  // Bildirim izni kontrolü
  if (Notification.permission === 'granted') {
    const notificationOptions = {
      body: `${notification.streamerName} yayında: ${notification.title}`,
      icon: notification.streamerImage,
      badge: '/icons/icon-192x192.png',
      data: {
        url: notification.url
      }
    };
    
    const webNotification = new Notification('Twitch Bildirim', notificationOptions);
    
    webNotification.onclick = function() {
      window.open(notification.url);
    };
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

function removeNotification(notificationId) {
  notifications = notifications.filter(notification => notification.id !== notificationId);
  saveNotifications();
  renderNotifications();
}

function clearNotifications() {
  notifications = [];
  saveNotifications();
  renderNotifications();
}

function saveNotifications() {
  // Maksimum 50 bildirim sakla
  notifications = notifications.slice(0, 50);
  localStorage.setItem(STORAGE_NOTIFICATIONS, JSON.stringify(notifications));
}

function loadNotifications() {
  const savedNotifications = localStorage.getItem(STORAGE_NOTIFICATIONS);
  if (savedNotifications) {
    try {
      notifications = JSON.parse(savedNotifications);
    } catch (e) {
      notifications = [];
    }
  }
  renderNotifications();
}

// Render Fonksiyonları
function renderStreamersList() {
  if (!followedStreamers.length) {
    streamersList.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-2">Takip edilen yayıncı yok</p>';
    return;
  }
  
  // Aktif yayındakileri önce göster
  const sortedStreamers = [...followedStreamers].sort((a, b) => {
    const aIsLive = liveStreamers.some(stream => stream.user_id === a.id);
    const bIsLive = liveStreamers.some(stream => stream.user_id === b.id);
    
    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;
    return a.display_name.localeCompare(b.display_name);
  });
  
  streamersList.innerHTML = sortedStreamers.map(streamer => {
    const stream = liveStreamers.find(s => s.user_id === streamer.id);
    const isLive = !!stream;
    
    return `
      <div class="flex items-center p-2 rounded-md ${isLive ? 'bg-gray-50 dark:bg-gray-700' : ''}">
        <img src="${streamer.profile_image_url}" alt="${streamer.display_name}" class="w-10 h-10 rounded-full mr-2">
        <div class="flex-1">
          <div class="flex items-center">
            <span class="font-medium text-gray-800 dark:text-white">${streamer.display_name}</span>
            ${isLive ? '<span class="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">CANLI</span>' : ''}
          </div>
          ${isLive ? `<p class="text-sm text-gray-600 dark:text-gray-300">${stream.title}</p>` : ''}
        </div>
        ${isLive ? `<a href="https://twitch.tv/${streamer.login}" target="_blank" class="text-purple-600 text-sm">İzle</a>` : ''}
      </div>
    `;
  }).join('');
}

function renderNotifications() {
  if (!notifications.length) {
    noNotifications.classList.remove('hidden');
    notificationsList.innerHTML = '';
    return;
  }
  
  noNotifications.classList.add('hidden');
  
  notificationsList.innerHTML = notifications.map(notification => {
    const date = new Date(notification.timestamp);
    const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('tr-TR');
    
    return `
      <div class="relative bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
        <button class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200" 
                data-notification-id="${notification.id}">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
        <div class="flex items-start">
          <img src="${notification.streamerImage}" alt="${notification.streamerName}" class="w-8 h-8 rounded-full mr-2">
          <div class="flex-1">
            <div class="flex items-center mb-1">
              <a href="${notification.url}" target="_blank" class="font-medium text-purple-600">${notification.streamerName}</a>
              <span class="text-green-600 text-xs ml-2">CANLI</span>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 mb-1">${notification.title}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">${dateStr} ${timeStr}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Bildirim silme butonlarına event listener ekle
  const closeButtons = notificationsList.querySelectorAll('[data-notification-id]');
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const notificationId = parseInt(button.dataset.notificationId);
      removeNotification(notificationId);
    });
  });
}