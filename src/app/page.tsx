'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Kullanıcı daha önce giriş yapmış mı kontrol et
    const token = localStorage.getItem('twitch_access_token');
    const expiresAt = localStorage.getItem('twitch_expires_at');
    
    if (token && expiresAt && parseInt(expiresAt) > Date.now()) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = () => {
    setIsLoading(true);
    
    // Twitch OAuth URL'i
    const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
    // Redirect URI olarak geçerli URL'i kullan (port değişebilir)
    const redirectUri = window.location.origin + '/auth/callback';
    const scopes = 'user:read:email user:read:follows user:read:subscriptions';
    
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scopes}`;
    
    window.location.href = authUrl;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-50 to-white p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-lg flex flex-col items-center">
        <div className="w-16 h-16 bg-purple-600 rounded-full mb-6 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="currentColor">
            <path d="M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2m-1.43 9.29l-2.85 2.85h-2.86l-2.5 2.5v-2.5H7.71V3.43h11.43z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Twitch Bildirim</h1>
        <p className="text-gray-600 text-center mb-8">Twitch hesabınızla giriş yaparak bildirimlerinizi görüntüleyin</p>
        
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-[#9146FF] hover:bg-[#7a30e0] text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
              <path d="M11.64 5.93h1.43v4.28h-1.43m3.93-4.28H17v4.28h-1.43M7 2L3.43 5.57v12.86h4.28V22l3.58-3.57h2.85L20.57 12V2m-1.43 9.29l-2.85 2.85h-2.86l-2.5 2.5v-2.5H7.71V3.43h11.43z" />
            </svg>
          )}
          {isLoading ? 'Yükleniyor...' : 'Twitch ile Giriş Yap'}
        </button>
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Twitch Bildirim Uygulaması</p>
      </div>
    </div>
  );
}