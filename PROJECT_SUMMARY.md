# 🪞 Mirrorly - Yapay Zeka Destekli Sanal Butik Aynası

**Mirrorly**, butikler için tasarlanmış, müşterilerin kıyafetleri fiziksel olarak giymeden kendi üzerlerinde görmelerini sağlayan yapay zeka (AI) tabanlı bir sanal deneme (Virtual Try-On) uygulamasıdır.

## 🌟 Proje Vizyonu
Geleneksel alışveriş deneyimini dijitalin hızı ve yapay zekanın büyüsüyle birleştirmek. Müşteriler, mağazadaki bir QR kodu okutarak saniyeler içinde seçtikleri kıyafeti kendi fotoğrafları üzerinde görebilirler.

## 🚀 Temel Özellikler

### 1. Müşteri Deneyimi
- **Anında Sanal Deneme:** Google Gemini 2.5 Flash Image modelini kullanarak, kullanıcının fotoğrafı ile kıyafet görselini gerçekçi bir şekilde birleştirir.
- **QR Kod Entegrasyonu:** Her ürün için özel üretilen QR kodlar sayesinde doğrudan ilgili ürüne erişim.
- **Kişisel Geçmiş (Reflections):** Kullanıcıların daha önce denediği kombinleri tarayıcı hafızasında saklayarak tekrar bakabilme imkanı.
- **Satın Alma Yönlendirmesi:** Beğenilen ürünü doğrudan butiğin online mağazasından alma veya mağaza içi bilgi alma butonu.

### 2. Mağaza Yönetimi (Merchant Dashboard)
- **Envanter Yönetimi:** Ürün fotoğrafı, fiyatı ve açıklamasıyla kolayca ürün ekleme/güncelleme.
- **Otomatik QR Etiket Üretimi:** Ürünler için rafa asılmaya hazır, fiyat ve isim içeren QR kodlu etiket tasarımı ve yazdırma desteği.
- **Marka Özelleştirme:** Butik adı ve logosunu uygulama arayüzüne entegre edebilme.
- **Bulut Senkronizasyonu:** Firebase entegrasyonu sayesinde verilerin tüm cihazlarda güncel kalması.

## 🛠 Teknik Altyapı
- **Frontend:** React 19 + TypeScript + Tailwind CSS.
- **Yapay Zeka:** Google Gemini API (`gemini-2.5-flash-image`).
- **Backend/Veritabanı:** Firebase Firestore (Veri) & Firebase Storage (Görsel).
- **Görsel İşleme:** 
  - Mobil cihazlar için optimize edilmiş Canvas tabanlı sıkıştırma.
  - CORS hatalarını aşmak için gelişmiş Proxy ve Cache-Busting mekanizmaları.
  - 45 saniyelik işlem zaman aşımı (Timeout) koruması.

## 🎨 Tasarım Dili (Boutique Aesthetics)
- **Tipografi:** Şık ve klasik bir hava için *Cormorant Garamond* (Serif), modern okunabilirlik için *Inter* (Sans-serif).
- **Renk Paleti:**
  - `Boutique Cream (#fdfbf7)` - Sıcak ve lüks bir arka plan.
  - `Boutique Gold (#d4af37)` - Premium detaylar ve vurgular.
  - `Mirror Dark (#1f2937)` - Modern ve ciddi bir kontrast.

## 📱 Kurulum ve Dağıtım
Proje, Vite kullanılarak paketlenmiş olup Vercel veya Firebase Hosting üzerinde tek tıkla yayınlanmaya hazırdır. 

1. Bağımlılıkları yükle: `npm install`
2. `.env` dosyasına API anahtarlarını ekle.
3. Uygulamayı başlat: `npm start`

---
*Mirrorly - Geleceğin butik deneyimi şimdi cebinizde.*
