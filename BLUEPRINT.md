# 🏗 Mirrorly - Teknik Blueprint

Bu döküman Mirrorly uygulamasının teknik mimarisini ve sistem tasarımını detaylandırır.

## 1. Sistem Mimarisi
Mirrorly, **Serverless (Sunucusuz)** bir mimari üzerine kurulmuştur:
- **Client:** React 19 (Single Page Application).
- **AI Engine:** Google Gemini 2.5 Flash Image API.
- **Database & Storage:** Firebase Firestore & Firebase Storage.
- **CDN/Hosting:** Vercel veya Firebase Hosting.

## 2. Görüntü İşleme Boru Hattı (Image Pipeline)
Uygulama, yüksek çözünürlüklü fotoğrafları API'ye göndermeden önce istemci tarafında optimize eder:
1. **Giriş:** Kullanıcıdan alınan Base64 fotoğraf.
2. **Normalizasyon:** HTML5 Canvas kullanılarak `600px` genişliğe küçültme.
3. **Sıkıştırma:** JPEG formatında `0.6` kalite oranıyla paketleme (Hız ve veri tasarrufu için).
4. **API Gönderimi:** Optimize edilmiş Base64 verisi Gemini Vision modeline iletilir.

## 3. Yapay Zeka Mantığı (AI Prompt Strategy)
`geminiService.ts` içinde kullanılan "Virtual Try-On" istemi (prompt) şu katmanlardan oluşur:
- **Rol Atama:** "Professional Fashion Retoucher".
- **Giriş Katmanları:** Kişi fotoğrafı (Image 1) ve Kıyafet fotoğrafı (Image 2).
- **Kısıtlamalar:** Yüz, saç, ten rengi ve vücut oranlarını %100 koruma talimatı.
- **Teknik Detaylar:** Işık ve gölge uyumu (lighting match) sağlama talimatı.

## 4. Veri Modeli (Schema)
### 4.1. Firestore: `garments`
```typescript
{
  id: string,
  name: string,
  price: number,
  imageUrl: string, // Firebase Storage URL
  shopUrl: string,
  description: string,
  boutiqueName: string
}
```
### 4.2. Firestore: `merchant_profiles`
```typescript
{
  name: string,
  logoUrl: string,
  geminiApiKey: string, // Şifrelenmiş veya güvenli erişim
  paymentLink: string
}
```

## 5. Güvenlik ve Hata Toleransı
- **Timeout Race Condition:** Gemini API yanıtı 45 saniyeyi geçerse `Promise.race` ile işlem iptal edilir.
- **CORS Proxy:** Harici kaynaklı kıyafet görsellerini yüklemek için `corsproxy.io` entegrasyonu kullanılır.
- **Safety Settings:** Gemini modelinin güvenlik filtreleri `BLOCK_ONLY_HIGH` olarak ayarlanarak moda odaklı içeriklerin haksız yere engellenmesi azaltılır.

## 6. Gelecek Yol Haritası (Scalability)
- **Multi-Turn Chat:** Kıyafet üzerinde "rengini değiştir" gibi sesli komutlar.
- **Video Try-On:** Gemini Live API ile gerçek zamanlı deneme (Gelecek sürümler).
- **Analytics:** Hangi kıyafetlerin daha çok "sanal deneme" aldığının takibi.
