# QR / Link ile Mobil Giriş Akışı

## Mevcut Durum

Uygulamada mağaza sahibi (merchant) QR kod gösterebiliyor. Müşteri QR'ı taradığında:

1. **QR Link Formatı**: `https://mirrorly.app?id=<garment-id>`
2. **Tarama**: QR → Cihaz browser'ında link aç
3. **Giriş**: Müşteri GarmentView'de "Üzerinde Gör" tıklamadan önce giriş yapabilir

---

## Test Edilen Akış

### Desktop (Pop-up)
```
1. QR tarama → GarmentView açılıyor
2. "Üzerinde Gör" → Giriş gerekli
3. "Google ile Gir" → Pop-up açılıyor
4. Google seç ve onaylama
5. ✓ Try-on başladı
```

### Mobile (Redirect)
```
1. QR tarama → GarmentView açılıyor (cihazda)
2. "Üzerinde Gör" → Giriş isteniyorsa CustomerAuth
3. "Google ile Gir" → Google authorize sayfası
4. Kullanıcı seç ve onayla
5. Callback → GarmentView'e dön
6. ✓ Try-on başlamalı
```

---

## Mobil Giriş Akışındaki Değişiklikler (Son Fix)

### Problem
- Ekran takılıyor (loading spinner kalıyor)
- Giriş tamamlanıyor ama UI güncellenmiyor

### Neden
- `navigateCustomerAfterAuth()` tamamlandıktan sonra `setIsCustomerAuthPending(false)` çağrılmıyordu

### Çözüm
```typescript
// Eski:
await navigateCustomerAfterAuth(profile, target);
// (setIsCustomerAuthPending false değil!)

// Yeni:
await navigateCustomerAfterAuth(profile, target);
console.log('[SignIn] Navigation complete');
setIsCustomerAuthPending(false);  // ← Eklendi
```

---

## Beklenen Davranış

### Google Giriş (Mobil + QR)
```
Timeline:
0s   → "Google ile Gir" tıklandı
     [SignIn] Google sign-in clicked
     
0-1s → Redirect başladı
     [Google Auth] Mobile browser detected, using redirect flow
     
1-3s → Google authorize sayfası açıldı
     (Kullanıcı Google'da authorize edecek)
     
30s+ → Callback + polling
     [Bootstrap] Redirect pending: true
     [Google Redirect] Using currentUser: <uid>
     [SignIn] Got profile: user@email.com
     
35s+ → Data sync
     [SignIn] Data synced, navigating...
     
37s+ → Navigation complete
     [SignIn] Navigation complete
     setIsCustomerAuthPending(false)
     
✓ GarmentView'e dön
✓ "Üzerinde Gör" butonuna tıklanabilir
✓ Try-on başlıyor
```

### Email Giriş (Mobil + QR)
```
Timeline:
0s   → "E-posta ile Gir" tıklandı
     
1s   → Email + Password girdi
     
2s   → "Kayıt Ol" tıklandı
     [SignIn] Email auth succeeded for: user@example.com
     
2-3s → Firestore write (customer_profiles koleksiyonu)
     [SignIn] Data synced, navigating...
     
3s   → Navigation tamamlandı
     [SignIn] Navigation complete
     setIsCustomerAuthPending(false)
     
✓ GarmentView'e dön
✓ Try-on hazır
```

---

## Detaylı Log Analizi

### ✅ Başarılı Google Giriş
```javascript
[SignIn] Google sign-in clicked
[Google Auth] isMobileBrowser: true (Android Chrome)
[Google Auth] Starting Google sign-in...
[Google Auth] Mobile browser detected, using redirect flow
[Google Auth] Redirect pending flag set
[Google Auth] Redirect initiated, waiting for callback
// → Google auth sayfası açılıyor
// ← User authorize ediyor
[Bootstrap] Redirect pending: true
[Bootstrap] Setting auth pending
[Bootstrap] Consuming redirect customer...
[Google Redirect] Checking getRedirectResult...
[Google Redirect] No result from getRedirectResult
[Google Redirect] Using currentUser: 2x3y5z7a9b
[Google Map] Mapping user: 2x3y5z7a9b email: user@gmail.com
[Google Map] Profile upserted successfully
[Bootstrap] Got redirect profile, applying session
[Bootstrap] Applying customer session for: user@gmail.com
[SignIn] Got profile: user@gmail.com
[SignIn] Regular customer, syncing data...
[SignIn] Data synced, navigating...
[SignIn] Navigation complete
// Profil sync tamamlandı, state güncellendi
✓ GarmentView açılıyor
```

### ❌ Başarısız Google Giriş
```javascript
[SignIn] Google sign-in clicked
[Google Auth] isMobileBrowser: true (Android Chrome)
[Google Auth] Redirect initiated, waiting for callback
// ← User closes auth, doesn't authorize
[Bootstrap] Redirect pending: true
[Bootstrap] Consuming redirect customer...
[Google Redirect] No currentUser found
// → Hiçbir profil gelmedi, polling timeout başlıyor
[Redirect session poll attempt 1-20] skipped: null
// ...20 attempt sonra timeout
⚠️ Redirect pending but session not found, clearing pending flag
// CustomerAuth'a geri döndü, tekrar dene
```

### ✅ Başarılı Email Kayıt
```javascript
[SignIn] Email auth succeeded for: newuser@example.com
[SignIn] Regular customer, syncing data...
// Favorites ve History fetch ediliyor
[SignIn] Data synced, navigating...
[SignIn] Navigation complete
// Profil oluşturuldu, sync tamamlandı
✓ DISCOVER'a yönlendirildi
```

---

## QR Kod Test Senaryoları

### Senaryo 1: Giriş Yapılmamış Müşteri + QR
```
1. Müşteri QR tararıyor
   → GarmentView açılıyor
   
2. "Üzerinde Gör" tıklanıyor
   → CustomerAuth modal açılıyor
   
3. "Google ile Gir" seçiliyor
   → Redirect flow başlıyor
   
4. Google hesaplarını seçip authorize ediyor
   → Callback alındı
   
5. ✓ Try-on başlıyor
   → Profil oluşturuldu ve sync tamamlandı
```

### Senaryo 2: Giriş Yapılı Müşteri + QR
```
1. Müşteri QR tararıyor
   → localStorage'da profil var
   
2. GarmentView açılıyor
   
3. "Üzerinde Gör" doğrudan tıklanabilir
   → Giriş ihtiyacı yok
   
4. ✓ Try-on başlıyor
   → Kredi ödenerek işlem yapılıyor
```

### Senaryo 3: Admin Giriş + QR
```
1. Admin (weliakcay@gmail.com) QR tararıyor
   → GarmentView açılıyor
   
2. "Üzerinde Gör" tıklanıyor
   → Admin Check!
   
3. "Google ile Gir" tıklanıyor
   → Admin email
   
4. Google authorize ediyor
   → Admin panel açılıyor (DISCOVER değil!)
   
✓ Admin paneline yönlendirildi
```

---

## Mobile Giriş State Flow

```
Landing
  ↓
GarmentView (QR ile açıldı)
  ↓
[Üzerinde Gör] → Login gerekli mi?
  ├─ Evet: CustomerAuth modal
  │   ├─ Google → [RED] → Polling → [Sync] → GarmentView
  │   └─ Email → [Register] → [Sync] → GarmentView
  │
  └─ Hayır: PhotoInput → Processing → Result
```

---

## Performance Metrikleri (Mobile)

| Akış | Zaman | Kritik Nokta |
|------|-------|--------------|
| Google + Redirect | 30-40s | Callback polling |
| Email + Register | 5-8s | Firestore write |
| Already Logged In | 1-2s | Try-on başlama |

---

## Sorun Giderme

### Sorun: QR'dan sonra giriş takılıyor
```
Kontrol:
1. Console'da [SignIn] Navigation complete var mı?
2. localStorage'da mirrorly_customer_profile var mı?
3. Network tab'ında Firestore requests 200 OK mi?

Eğer hepsi tamam ama UI güncellenmiyor:
→ Browser cache'i temizle
→ localStorage.clear() + reload
```

### Sorun: Admin (weliakcay@gmail.com) QR ile giriş yapınca admin panel yerine discover açılıyor
```
Kontrol:
1. Admin check: if (adminEmails.includes(profile.email))
2. Email spell check: weliakcay@gmail.com (küçük harf)
3. ENV variable: VITE_ADMIN_EMAILS="weliakcay@gmail.com"

Hata var mı? → git diff kontrol et
```

### Sorun: Email kayıt 404 hatası veriyor
```
Kontrol:
1. registerCustomer fonksiyonu çalışıyor mu?
   → firebase.ts satır 800 civarında
2. Firestore rules write izni var mı?
   → Firebase Console → Firestore → Rules
3. Customer profil koleksiyonu var mı?
   → Otomatik create edilmeli ilk giriş'te

Hata: "Cannot create collection"
→ Firestore initialization sorunu
→ Firebase config kontrol et
```

---

## Next Steps

✅ Yapılan:
- [x] Mobile redirect flow iyileştirildi
- [x] Loading state fix uygulandı
- [x] Debug logging eklendi
- [x] Email auth iyileştirildi

⏳ Yapılacak (isteğe bağlı):
- [ ] QR kod deep link'lerine offline fallback
- [ ] Başarısız giriş'te retry mekanizması
- [ ] Profil cache invalidation
- [ ] Progressive Web App desteği

---

## Referanslar
- MOBILE_TESTING_GUIDE.md — Detaylı test adımları
- MOBILE_AUTH_FIX.md — Technical deep dive
- GOOGLE_AUTH_IMPROVEMENTS.md — Auth architecture
