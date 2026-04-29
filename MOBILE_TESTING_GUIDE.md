# 📱 Mobil Cihazdan Test Rehberi

## Hızlı Başlangıç (Gerçek Mobil Cihaz)

### 1️⃣ Bilgisayarın IP Adresini Öğren
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows (cmd açarak)
ipconfig

# Örnek output: 192.168.1.100
```

### 2️⃣ Dev Server Başlat
```bash
npm run dev
# Output: ➜  Local:   http://localhost:5173/
```

### 3️⃣ Mobil Cihazda URL'yi Aç
- Bilgisayarın IP'si: `192.168.1.100` (örneğin)
- Cihazda açılacak URL: `http://192.168.1.100:5173`
- **ÖNEMLİ**: `https` değil `http` olmalı (localhost güvenilir bir domain)

### 4️⃣ Test Akışı
```
1. http://192.168.1.100:5173 → Landing sayfası görünmeli
2. "Google ile Gir" → Google authorize sayfası açılmalı
3. Google hesabını seçip onayla
4. Callback → Discover sayfasına yönlendirilmeli
5. Ya da "E-posta ile Gir" → Kayıt ol → DISCOVER
```

---

## Mobil Cihazda Console Loglarını Okuma

### iOS Safari
```
1. iPhone'da Safari aç
2. Ayarlar → Safari → Gelişmiş → Web Inspector ON
3. Mac'ta Safari → Geliştir → IP Adresi seç
4. Console'da tüm logları gör
```

### Android Chrome
```
1. Android'de Chrome aç
2. Telefonun USB hata ayıklaması ON
   (Ayarlar → Hakkında → Build numarası 7 kez tıkla → Geliştirici seçenekleri)
3. Bilgisayarda: chrome://inspect
4. "Remote devices" bölümünde telefonu seç
5. Console tab'ında logları gözlemle
```

---

## Sorun Giderme Kontrol Listesi

### ✅ Ekran Takılıyor (Loading Spinner Kalıyor)
```javascript
// Console'da bak:
[SignIn] Google sign-in clicked
[SignIn] No profile returned (redirect flow initiated)  // Redirect başladı
  ↓ Google authorize'ı yap
[SignIn] Got profile: user@email.com
[SignIn] Regular customer, syncing data...
[SignIn] Data synced, navigating...
[SignIn] Navigation complete
✓ Ekran kapanmalı

// Eğer "Navigation complete" logunu görmüyorsan:
// 1. Ağ bağlantısı mı kesildi?
// 2. Firestore okuma/yazma izni var mı?
// 3. Firebase initialization doğru mu?
```

### ✅ Google Redirect Başlamıyor
```javascript
// Loglar:
[Google Auth] isMobileBrowser: true (Android Chrome)
// AMAN!Redirect initiated, waiting for callback
// NE OLUYOR?

// Sonra:
[Google Auth] Redirect initiated, waiting for callback
// Burada Google authorize sayfası açılmalı
// Açılmıyorsa: Firebase OAuth yapılandırması yanlış
```

### ✅ Email Kayıt Takılıyor
```javascript
// Loglar:
[SignIn] Email auth succeeded for: test@example.com
[SignIn] Data synced, navigating...
[SignIn] Navigation complete  // BU gösterilmeli

// Gösterilmiyorsa:
// 1. console.error bak ("Email sign-in failed: ...")
// 2. Network tab'ında Firestore request'lerini kontrol et (200 OK mı?)
```

---

## Debug Komutları (Mobile Console'da)

```javascript
// 1. Redirect pending flag kontrol
localStorage.getItem('mirrorly_google_redirect_pending')
// "1" dönmeli redirect sırasında

// 2. Profil kontrol
const profile = localStorage.getItem('mirrorly_customer_profile');
console.log(JSON.parse(profile));
// { uid, email, credits, ... } dönmeli

// 3. Firebase currentUser
firebase.auth().currentUser;
// User object dönmeli

// 4. Firestore cache
firebase.firestore().collection('customer_profiles').doc('uid').get()
  .then(d => console.log(d.data()));
// Profil data dönmeli

// 5. Storage kontrol
Object.keys(localStorage).forEach(k => console.log(k + ': ' + localStorage.getItem(k)));
// Tüm stored değerleri göster

// 6. Yeniden başlat (cache temizle)
localStorage.clear();
location.reload();
```

---

## İnternet Bağlantısı Olmadan Test Etme (Simülasyon)

### DevTools Mobile Mode (Desktop)
```bash
# 1. Chrome/Firefox aç
# 2. F12 → DevTools aç
# 3. Ctrl+Shift+M (Mac: Cmd+Shift+M) → Mobile mode
# 4. Device: iPhone 12 seç
# 5. Console'da test et

# ÖNEMLİ: Mobil mode TAMAMEN aynı değil!
# - Popup vs Redirect davranışı farklı
# - Network throttling simüle edilebilir
# - Gerçek cihazdan test daha iyi
```

### Network Throttle
```
DevTools → Network → Slow 3G/4G seç
- 3G: Yavaş redirect akışını test et (20+ sn bekleme)
- 4G: Hızlı akışı test et (2-3 sn)
```

---

## Beklenen Timeline

### Google Sign-In (Mobile)
| Zaman | Olay | Log |
|-------|------|-----|
| 0s | "Google ile Gir" | `[SignIn] Google sign-in clicked` |
| 0-1s | signInWithRedirect() | `[Google Auth] Redirect initiated` |
| 1s | Google auth sayfası aç | Browser yönlendir |
| 30s | Kullanıcı authorize et | - |
| 31s | Callback + polling başla | `[Bootstrap] Redirect pending: true` |
| 31-33s | Profile al + sync | `[SignIn] Data synced` |
| 33s | Navigation | ✓ DISCOVER sayfası |

### Email Sign-In (Mobile)
| Zaman | Olay | Log |
|-------|------|-----|
| 0s | E-posta gir | - |
| 1s | "Kayıt Ol" tıkla | `[SignIn] Email auth succeeded` |
| 2s | Firestore write | `setCustomerAuthPending(false)` |
| 2-3s | Navigation | ✓ DISCOVER sayfası |

---

## Network İstek Kontrolü

Chrome DevTools'de Network tab açıyorum:

### Google Redirect'ten Sonra Görmesi Gerekir
```
GET /                                    ← Callback URL
POST firestore.googleapis.com/v1/...     ← Customer profil sorgula
POST firestore.googleapis.com/v1/...     ← Favorites yükle
POST firestore.googleapis.com/v1/...     ← History yükle
```

Hepsi `200 OK` dönmeli. Hata varsa:
- `401 Unauthorized` → Firebase token
- `403 Forbidden` → Firestore rules
- `500` → Backend error

---

## Spesifik Sorunlar

### Sorun: "Oturum tamamlanıyor" yazısı sonsuz döndürülüyor
**Çözüm:**
1. Console'da `[SignIn] Navigation complete` logunu ara
2. Yoksa: Network → Firestore requests 200 OK mı?
3. localStorage'da `mirrorly_customer_profile` var mı?

### Sorun: "Network error" mesajı alıyorum
**Çözüm:**
1. Bilgisayar ve telefon aynı Wi-Fi'de mi?
2. Firewall mobil erişimi mi engelliyor?
3. URL `http://` mi (https değil)?
4. Port 5173 açık mı? (Dev server çalışıyor mu?)

### Sorun: Email kayıt "Bu email zaten kayıtlı" mesajı
**Çözüm:**
1. Konsol: `Email sign-in failed: auth/email-already-in-use`
2. Bu normaldir, başka email dene
3. Otomatik olarak login mode'a geçmeliydi

### Sorun: Google Authorize Sayfası Açılmıyor
**Çözüm:**
1. Firebase Console → Authentication → Authorized domains
2. `http://192.168.1.100:5173` ekle
3. Veya localhost'ta test et (http://localhost:5173 ÖNEMLİ)
4. Chrome DevTools mobile mode'da test et (daha basit)

---

## Testler Bitince

```bash
# 1. Desktop'ta test et (boş önbellek)
localStorage.clear()
# F5 refresh → Landing
# "Google ile Gir" → Pop-up açılmalı

# 2. Mobile'da test et
# http://192.168.1.100:5173 → redirect flow

# 3. Her ikisinde de admin giriş
weliakcay@gmail.com
# Admin panel açılmalı

# 4. Email giriş test et
# "E-posta ile Gir" → Kayıt ol / Giriş yap
```

---

## İleri Debugging

Eğer hala sıkıştıysa:

```bash
# Dev sunucunun çalışmasını takip et
npm run dev

# Hata var mı kontrol et:
tail -f /tmp/dev.log

# Browser console'da:
console.clear()
localStorage.clear()
location.reload()
# Sonra adım adım izle
```

## Kontrol Listesi
- [ ] Bilgisayar IP'sini buldun
- [ ] Dev server çalışıyor
- [ ] Mobil cihaz aynı Wi-Fi'de
- [ ] http://192.168.1.100:5173 açılıyor
- [ ] Landing sayfası görünüyor
- [ ] "Google ile Gir" butonuna basıyor
- [ ] Google auth sayfası açılıyor
- [ ] Giriş tamamlandığında DISCOVER görünüyor
- [ ] Console'da tüm logları gördün
- [ ] Admin paneli test ettin (weliakcay@gmail.com)
- [ ] Email kayıt test ettin
