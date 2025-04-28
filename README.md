# Twitch Bildirim PWA

Bu proje, takip ettiğiniz Twitch yayıncıları canlı yayına başladığında bildirim almanızı sağlayan bir Progressive Web App'tir.

## Özellikler

- Progressive Web App (PWA) özelliği - Ana ekrana eklenebilir
- Responsive ve iOS tarzı tasarım (TailwindCSS ile)
- Twitch ile giriş yaparak takip ettiğiniz yayıncıları görüntüleme
- Yayıncılar canlı yayına başladığında bildirim alma
- Bildirimleri saklama ve görüntüleme
- Web Push bildirimleri desteği
- Karanlık/Aydınlık tema desteği
- Offline çalışabilme

## Kurulum

Projeyi kullanmak için aşağıdaki adımları izleyin:

1. Projeyi bir web sunucusuna yükleyin
2. `public/js/app.js` dosyasında Twitch Client ID'nizi ayarlayın:
   ```javascript
   const TWITCH_CLIENT_ID = 'YOUR_CLIENT_ID'; // Buraya kendi Client ID'nizi girin
   ```
3. Twitch Developer portalından bir uygulama oluşturun ve OAuth yönlendirme URL'ini projenizin URL'i olarak ayarlayın

## Icon Ekleme

Projenin tam olarak çalışması için aşağıdaki dosyaları eklemeniz gerekiyor:

1. `public/icons/icon-192x192.png` - 192x192 boyutunda uygulama ikonu
2. `public/icons/icon-512x512.png` - 512x512 boyutunda uygulama ikonu
3. `public/img/twitch-logo.png` - Giriş ekranında gösterilecek Twitch logosu

## Geliştirme

Bu proje aşağıdaki teknolojileri kullanmaktadır:

- HTML5 ve TailwindCSS
- JavaScript (Vanilla)
- PWA (Progressive Web App) özellikleri
- Twitch API

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakınız.