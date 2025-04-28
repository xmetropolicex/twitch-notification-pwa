'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // URL'de hata parametresi var mı kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (errorParam) {
      setError(`Hata: ${errorParam} - ${errorDescription || 'Bilinmeyen hata'}`);
      setTimeout(() => {
        router.push('/');
      }, 5000);
      return;
    }
    
    // URL'den token bilgisini al
    const hashParams = window.location.hash.substring(1).split('&').reduce((acc, item) => {
      const [key, value] = item.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    if (hashParams.access_token) {
      const accessToken = hashParams.access_token;
      const expiresIn = hashParams.expires_in || '3600'; // Varsayılan 1 saat
      
      // Token'ı localStorage'a kaydet
      localStorage.setItem('twitch_access_token', accessToken);
      
      // Token geçerlilik süresini hesapla ve kaydet (milisaniye cinsinden)
      const expiresAt = Date.now() + parseInt(expiresIn) * 1000;
      localStorage.setItem('twitch_expires_at', expiresAt.toString());
      
      // Kullanıcı bilgilerini al
      fetchUserInfo(accessToken);
    } else {
      setError('Giriş başarısız oldu. Token bulunamadı. Lütfen tekrar deneyin.');
      setTimeout(() => {
        router.push('/');
      }, 5000);
    }
  }, [router]);

  const fetchUserInfo = async (token: string) => {
    try {
      // Client ID'yi doğrudan process.env'den değil, oluşturulan .env.local dosyasından al
      const clientId = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID;
      
      if (!clientId) {
        throw new Error('Client ID bulunamadı');
      }
      
      const response = await fetch('https://api.twitch.tv/helix/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Client-Id': clientId
        }
      });
      
      if (!response.ok) {
        throw new Error(`Kullanıcı bilgileri alınamadı: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const userData = data.data[0];
        
        // Kullanıcı bilgilerini localStorage'a kaydet
        localStorage.setItem('twitch_user', JSON.stringify({
          id: userData.id,
          login: userData.login,
          display_name: userData.display_name,
          profile_image_url: userData.profile_image_url
        }));
        
        // Kullanıcıyı dashboard'a yönlendir
        router.push('/dashboard');
      } else {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }
    } catch (err: any) {
      console.error('Hata:', err);
      setError(`Kullanıcı bilgileri alınamadı: ${err.message || 'Bilinmeyen hata'}. Lütfen tekrar deneyin.`);
      
      // Hata durumunda tüm token bilgilerini temizle
      localStorage.removeItem('twitch_access_token');
      localStorage.removeItem('twitch_expires_at');
      
      setTimeout(() => {
        router.push('/');
      }, 5000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-50 to-white">
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl max-w-md w-full text-center">
          <p>{error}</p>
          <p className="text-sm mt-2">Ana sayfaya yönlendiriliyorsunuz...</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Giriş Yapılıyor</h2>
          <p className="text-gray-600">Twitch hesabınızla bağlantı kuruluyor...</p>
        </div>
      )}
    </div>
  );
}