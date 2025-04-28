# Twitch Bildirim Görüntüleyici (PWA)

Bu proje, kullanıcıların Twitch hesaplarıyla giriş yapıp bildirimlerini görüntüleyebilecekleri bir PWA (Progressive Web App) uygulamasıdır.

## Özellikler

- Twitch OAuth ile güvenli giriş
- Bildirimleri görüntüleme ve yönetme
- PWA desteği (Ana ekrana eklenebilir)
- Tamamen client-side (sunucu gerekmez)
- Responsive tasarım
- Tüm veri localStorage'da saklanır

## Kurulum

1. Repoyu klonlayın
   ```
   git clone https://github.com/xmetropolicex/twitch-notification-pwa.git
   cd twitch-notification-pwa
   ```

2. Bağımlılıkları yükleyin
   ```
   npm install
   ```

3. Twitch API bilgilerinizi ekleyin
   - `.env.example` dosyasını `.env.local` olarak kopyalayın
   - `NEXT_PUBLIC_TWITCH_CLIENT_ID` değerini Twitch Developer Dashboard'dan alacağınız Client ID ile güncelleyin
   - `NEXT_PUBLIC_REDIRECT_URI` değerini uygulamanızın callback URL'i ile güncelleyin

4. Uygulamayı başlatın
   ```
   npm run dev
   ```

## Teknolojiler

- Next.js
- React
- TailwindCSS
- Next-PWA
- Twitch API