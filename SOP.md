# 📋 Mirrorly - Standart Operasyon Prosedürü (SOP)

Bu döküman, Mirrorly platformunun kurulumu, yönetimi ve günlük kullanımı için gerekli adımları içerir.

## 1. İlk Kurulum ve Yapılandırma
### 1.1. API Anahtarlarının Hazırlanması
- **Google Gemini API:** [Google AI Studio](https://aistudio.google.com/app/apikey) adresinden ücretsiz veya ücretli bir anahtar alın.
- **Firebase:** Bir Firebase projesi oluşturun ve `services/firebase.ts` dosyasındaki yapılandırma nesnesini güncelleyin.

### 1.2. Çevresel Değişkenler (.env)
Kök dizinde bir `.env` dosyası oluşturun ve aşağıdaki anahtarları tanımlayın:
```env
API_KEY=Sizin_Gemini_Anahtariniz
FIREBASE_API_KEY=...
```

## 2. Mağaza Operasyonları (Merchant Workflow)
### 2.1. Ürün Ekleme
1. **Merchant Entrance** üzerinden giriş yapın.
2. **Ürünler** sekmesinden "+" butonuna basın.
3. Ürün fotoğrafını yükleyin (Arka planın sade olması AI performansı için tercih edilir).
4. Ürün ismi, fiyatı ve (varsa) online satış linkini ekleyerek kaydedin.

### 2.2. QR Kod Etiketleme
1. Eklenen ürünün yanındaki **QR ikonu**na tıklayın.
2. Açılan sayfada ürün bilgilerini kontrol edin.
3. **Etiketi Yazdır** butonuna basarak fiziksel raflara asılacak etiketi çıkartın.

## 3. Müşteri Deneyimi (Customer Journey)
1. Müşteri akıllı telefonuyla etiketteki QR kodu taratır.
2. Uygulama ilgili kıyafetle açılır.
3. "See Yourself In This" butonuna tıklar.
4. Selfie çeker veya galeriden boydan bir fotoğraf yükler.
5. AI işlemini (10-30 sn) bekler ve sonucu görür.

## 4. Sorun Giderme (Troubleshooting)
- **"Processing" ekranında takılma:** İnternet hızını kontrol edin. 45 saniye sonra "Cancel" butonu çıkacaktır.
- **Güvenlik Filtresi Hatası:** Yüklenen fotoğrafta Gemini'nin "zararlı" veya "müstehcen" olarak algıladığı bir içerik olabilir. Daha standart bir pozla tekrar deneyin.
- **Kıyafet Görseli Yüklenemiyor:** Görselin URL'sinin halka açık olduğundan ve CORS izinlerinin proxy üzerinden geçtiğinden emin olun.

## 5. Periyodik Bakım
- **Hafıza Temizliği:** Müşteriler "Reflections" bölümünden kendi geçmişlerini silebilir.
- **API Kotası:** Ücretsiz kota saniyede 2-15 istek ile sınırlıdır. Yoğun mağazalar için "Pay-as-you-go" planına geçilmelidir.
