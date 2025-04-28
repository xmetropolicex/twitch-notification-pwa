'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  image?: string;
  timestamp: number;
  read: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<TwitchUser | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Token kontrolü
    const token = localStorage.getItem('twitch_access_token');
    const expiresAt = localStorage.getItem('twitch_expires_at');
    
    if (!token || !expiresAt || parseInt(expiresAt) <= Date.now()) {
      // Token yok veya süresi dolmuş, ana sayfaya yönlendir
      router.push('/');
      return;
    }
    
    // Kullanıcı bilgilerini localStorage'dan al
    const userStr = localStorage.getItem('twitch_user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    
    // Bildirimleri localStorage'dan al veya örnek bildirimler yükle
    const savedNotifications = localStorage.getItem('twitch_notifications');
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    } else {
      // Eğer hiç bildirim yoksa, başlangıç için örnek bildirimler
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'follow',
          title: 'Yeni Takipçi',
          message: 'User123 seni takip etmeye başladı!',
          timestamp: Date.now() - 1000 * 60 * 30, // 30 dakika önce
          read: false
        },
        {
          id: '2',
          type: 'stream',
          title: 'Yayın Başladı',
          message: 'Favorite_Streamer yayına başladı: "Bugün speedrun yapıyoruz!"',
          image: 'https://static-cdn.jtvnw.net/ttv-boxart/516575-188x250.jpg',
          timestamp: Date.now() - 1000 * 60 * 60, // 1 saat önce
          read: true
        }
      ];
      setNotifications(mockNotifications);
      localStorage.setItem('twitch_notifications', JSON.stringify(mockNotifications));
    }
    
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    // Token bilgilerini temizle
    localStorage.removeItem('twitch_access_token');
    localStorage.removeItem('twitch_expires_at');
    localStorage.removeItem('twitch_user');
    
    // Ana sayfaya yönlendir
    router.push('/');
  };

  const markAsRead = (id: string) => {
    const updatedNotifications = notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    );
    setNotifications(updatedNotifications);
    localStorage.setItem('twitch_notifications', JSON.stringify(updatedNotifications));
  };

  const removeNotification = (id: string) => {
    const updatedNotifications = notifications.filter(notification => notification.id !== id);
    setNotifications(updatedNotifications);
    localStorage.setItem('twitch_notifications', JSON.stringify(updatedNotifications));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem('twitch_notifications', JSON.stringify([]));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-3">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2m-1.43 9.29l-2.85 2.85h-2.86l-2.5 2.5v-2.5H7.71V3.43h11.43z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Twitch Bildirim</h1>
          </div>
          
          {user && (
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                  {user.profile_image_url && (
                    <Image 
                      src={user.profile_image_url} 
                      alt={user.display_name} 
                      width={32} 
                      height={32}
                    />
                  )}
                </div>
                <span className="text-sm font-medium">{user.display_name}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
              >
                Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-2xl mx-auto p-4">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-medium text-gray-800">Bildirimler</h2>
          {notifications.length > 0 && (
            <button 
              onClick={clearAllNotifications}
              className="text-sm px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
            >
              Bildirim Geçmişini Temizle
            </button>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-1">Bildiriminiz Yok</h3>
            <p className="text-gray-500">Yeni bildirimler geldiğinde burada görünecek.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`bg-white rounded-xl shadow-sm p-4 relative ${!notification.read ? 'border-l-4 border-purple-500' : ''}`}
              >
                <button 
                  onClick={() => removeNotification(notification.id)}
                  className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <div className="flex">
                  {notification.image ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden mr-3 flex-shrink-0">
                      <Image 
                        src={notification.image} 
                        alt={notification.title} 
                        width={48} 
                        height={48}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-purple-100 rounded-lg mr-3 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-purple-600" fill="currentColor">
                        <path d="M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2m-1.43 9.29l-2.85 2.85h-2.86l-2.5 2.5v-2.5H7.71V3.43h11.43z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="flex-1 pr-6">
                    <h3 className="font-medium text-gray-800 mb-1">{notification.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {new Date(notification.timestamp).toLocaleString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                      
                      {!notification.read && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-purple-600 hover:text-purple-800"
                        >
                          Okundu İşaretle
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}