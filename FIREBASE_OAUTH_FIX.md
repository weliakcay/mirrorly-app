# Firebase OAuth Authorized Domains - Kritik Fix

## Sorun
Mobil giriş akışında:
```
[Google Redirect] No currentUser found
[Google Redirect] No result from getRedirectResult
Redirect pending but session not found, clearing pending flag
```

Bu loglar şu demek: **Google OAuth tamamlanıyor ama Firebase'e session kaydedilmiyor.**

---

## Kök Neden
Firebase Console'da **authorized redirect URI'ler** eksik veya yanlış.

Google OAuth akışında:
1. ✅ Google authorize sayfası açılıyor (Google config doğru)
2. ✅ User authorize ediyor
3. ❌ Callback URL'de Firebase session oluşmuyor (Firebase OAuth config yanlış)

---

## Çözüm: Firebase Console'da Authorized Domains Ekle

### 1️⃣ Firebase Console Aç
```
https://console.firebase.google.com/project/mirrorlyapp/settings/authentication
```

### 2️⃣ Authentication → Settings Sekmesine Git
```
Authentication → Settings → Authorized domains
```

### 3️⃣ Aşağıdaki Domains'i Ekle

**Localhost (Development)**
```
localhost
127.0.0.1
```

**Production (Vercel)**
```
mirrorly-app.vercel.app
```

**Custom Domain (varsa)**
```
mirrorly.app
yourdomain.com
```

### 4️⃣ Save (Kaydet)

---

## Adım Adım Ekran

```
Firebase Console
  → Project Settings
    → Authentication
      → Sign-in method
        → Authorized domains
```

Veya doğrudan:
```
https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/authentication
```

Aşağıya scroll → **Authorized domains** bölümü

---

## Test Etme Sonrası

Authorized domains eklendikten sonra:

### Desktop'ta Test (Pop-up)
```bash
npm run dev
# http://localhost:5173
# "Google ile Gir" → Pop-up açılmalı → Giriş başarılı
```

### Vercel Production'da Test
```bash
# https://mirrorly-app.vercel.app
# QR scan veya linki aç
# "Google ile Gir" → Redirect başlasın
# Authorization → Callback → ✓ DISCOVER sayfası
```

---

## Beklenen Log Output (Başarılı)

```javascript
[Google Redirect] Checking getRedirectResult...
[Google Redirect] Found user from redirect result, mapping profile
[Google Map] Mapping user: uid123
[Google Map] Profile upserted successfully
[Bootstrap] Got redirect profile, applying session
[SignIn] Got profile: user@gmail.com
[SignIn] Navigation complete
✓ DISCOVER sayfası açılıyor
```

---

## Hala Çalışmıyor mu?

### Step 1: Domain'in Authorized olduğunu Doğrula
```
Firebase Console → Authentication → Authorized domains
→ mirrorly-app.vercel.app var mı?
→ localhost/127.0.0.1 var mı?
```

### Step 2: Browser Cache Temizle
```bash
# Windows/Linux: Ctrl+Shift+Delete
# Mac: Cmd+Shift+Delete
→ All time seç
→ Cookies and other site data seç
→ Delete data
```

### Step 3: Incognito Mode'da Test
```
Chrome: Ctrl+Shift+N (Cmd+Shift+N Mac)
→ Yeni pencerede http://localhost:5173 aç
→ "Google ile Gir" test et
```

### Step 4: localStorage Temizle
```javascript
// Browser Console'da:
localStorage.clear()
location.reload()
// Sonra "Google ile Gir" test et
```

---

## Authorized Domains vs OAuth Credentials

**❌ Confusion**
```
Google Cloud Console → OAuth 2.0 Credentials → Authorized redirect URIs
vs
Firebase Console → Authentication → Authorized domains
```

**✅ Doğrusu**
- **Google Cloud OAuth**: Credentials sayfasında zaten `https://YOUR_PROJECT.firebaseapp.com` var
- **Firebase**: Authentication → Authorized domains'e production domain'i eklemelisin

Her ikisi de gerekli!

---

## Vercel Deployment İçin

Vercel URL'leri format:
```
https://mirrorly-app.vercel.app        ← Production
https://pr-123-mirrorly-app.vercel.app ← Preview
```

Her ikisini de ekleyebilirsin (optional preview için):
```
mirrorly-app.vercel.app
pr-*.mirrorly-app.vercel.app (wildcard - önerilmez, spesifik ekle)
```

---

## Kontrol Listesi

- [ ] Firebase Console açtın
- [ ] Authentication → Settings sekmesine gittim
- [ ] Authorized domains bölümü buldum
- [ ] localhost ekledim
- [ ] 127.0.0.1 ekledim
- [ ] mirrorly-app.vercel.app ekledim
- [ ] Changes saved
- [ ] Browser cache temizledim
- [ ] Incognito mode'da test ettim
- [ ] ✓ Google ile giriş çalışıyor

---

## Referanslar
- [Firebase Authentication - Authorized Domains](https://firebase.google.com/docs/auth/web/start#set_up_sign-in_methods)
- [Google OAuth - Redirect URIs](https://cloud.google.com/docs/authentication/oauth)
- MOBILE_LOGIN_FIX_SUMMARY.md
