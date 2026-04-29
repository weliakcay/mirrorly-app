# Firebase Configuration Checklist

## ⚠️ Mobil Google Giriş Hatası Yaşıyor musun?

Eğer mobil cihazdan Google ile giriş yaparken:
- "Mirrorly seni bekliyor" ekranında takılıyor
- Console'da `[Google Redirect] No currentUser found` görüyorsun
- Geri dönüp tekrar girişe yönlendiriliyor

**→ FIREBASE_OAUTH_FIX.md'yi oku ÖNCE!**

---

## Complete Firebase Setup Checklist

### 1️⃣ Firebase Project Temel Ayarları

#### Authentication → Settings
```
✓ Project public name: Mirrorly
✓ Support email: your-email@example.com
✓ Default language: Turkish (tr)
```

#### Authentication → Sign-in method
```
✓ Google provider: ENABLED
  - Client ID: (auto-filled)
  - Web SDK: (auto-filled)
  
✓ Email/Password: ENABLED
  - Password sign-up: ON
  
✓ Phone: OPTIONAL (not required)
✓ Anonymous: OPTIONAL (not required)
```

---

### 2️⃣ **KRITIK: Authorized Domains**

**Location**: Authentication → Settings → Authorized domains

```
✓ localhost
✓ 127.0.0.1
✓ mirrorly-app.vercel.app
✓ mirrorly.app (if custom domain used)
```

**NOT**: Authorized domains listesi açık görünmeli. Eğer "Authorized domains can't be modified" yazıyorsa, proje tipi sorun olabilir.

---

### 3️⃣ Firestore Database

#### Database Oluşturma
```
✓ Database adı: default
✓ Location: eur3 (Europe)
✓ Mode: Production mode

Sonra Security Rules → DÜZENLEME (aşağıda)
```

#### Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Customer profiles - Customer read/write own, Admin read all
    match /customer_profiles/{uid} {
      allow read, write: if request.auth.uid == uid;
      allow read: if request.auth.token.admin == true;
    }
    
    // Merchant profiles - Merchant read/write own, Admin read all
    match /merchant_profiles/{uid} {
      allow read: if request.auth.uid == uid || request.auth.token.claims.admin == true;
      allow write: if request.auth.uid == uid;
    }
    
    // Merchant inventory - Merchant read/write own
    match /merchant_inventory/{mid}/garments/{doc=**} {
      allow read, write: if request.auth.uid == mid;
    }
    
    // Customer history - Customer read/write own
    match /customer_profiles/{uid}/history/{doc=**} {
      allow read, write: if request.auth.uid == uid;
    }
    
    // Merchant history - Merchant read/write own
    match /merchant_inventory/{mid}/history/{doc=**} {
      allow read, write: if request.auth.uid == mid;
    }
  }
}
```

#### Indexes
```
No custom indexes needed initially.
Firestore will suggest composite indexes as needed.
```

---

### 4️⃣ Cloud Storage

#### Storage Bucket
```
✓ Location: eur3 (Europe, same as Firestore)
✓ Storage class: Standard
✓ Access control: Uniform
```

#### Security Rules
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload
    match /uploads/{uid}/{allPaths=**} {
      allow read, write: if request.auth.uid == uid;
    }
    
    // Allow public read (for displaying images)
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

### 5️⃣ Environment Variables

**Dosya**: `.env.local`

```bash
# Firebase Web Config
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=mirrorlyapp.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mirrorlyapp
VITE_FIREBASE_STORAGE_BUCKET=mirrorlyapp.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=955400146750
VITE_FIREBASE_APP_ID=1:955400146750:web:c032bdd...
VITE_FIREBASE_MEASUREMENT_ID=G-11PLJPMH9V

# Firebase Admin (Backend)
FIREBASE_ADMIN_PROJECT_ID=mirrorlyapp
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@mirrorlyapp.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_STORAGE_BUCKET=mirrorlyapp.appspot.com

# Admin Users
VITE_ADMIN_EMAILS="weliakcay@gmail.com"
```

---

### 6️⃣ Google Cloud Console Integration

**Location**: Google Cloud Console → APIs & Services

#### OAuth 2.0 Credentials
```
✓ Client ID: (for Web)
✓ Authorized JavaScript origins:
  - http://localhost:5173
  - https://mirrorly-app.vercel.app
  
✓ Authorized redirect URIs:
  - https://mirrorlyapp.firebaseapp.com/__/auth/handler
  - http://localhost:5173/
  - https://mirrorly-app.vercel.app/
```

#### API Enablement
```
✓ Google+ API: ENABLED
✓ Cloud Firestore API: ENABLED
✓ Cloud Storage API: ENABLED
✓ Cloud Authentication API: ENABLED
✓ Identity Toolkit API: ENABLED
```

---

### 7️⃣ Vercel Deployment Environment Variables

**Dosya**: Vercel Dashboard → Settings → Environment Variables

```
✓ VITE_FIREBASE_API_KEY
✓ VITE_FIREBASE_AUTH_DOMAIN
✓ VITE_FIREBASE_PROJECT_ID
✓ VITE_FIREBASE_STORAGE_BUCKET
✓ VITE_FIREBASE_MESSAGING_SENDER_ID
✓ VITE_FIREBASE_APP_ID
✓ VITE_FIREBASE_MEASUREMENT_ID
✓ VITE_ADMIN_EMAILS

✓ KIE_API_KEY (backend)
✓ FIREBASE_ADMIN_PROJECT_ID (backend)
✓ FIREBASE_ADMIN_CLIENT_EMAIL (backend)
✓ FIREBASE_ADMIN_PRIVATE_KEY (backend)
```

---

## Sorun Giderme

### Sorun 1: "Authorized domains can't be modified"
```
Neden: Project typu restricted
Çözüm: Firebase Support'a contact et veya yeni project oluştur
```

### Sorun 2: Google redirect başlamıyor
```
Kontrol:
1. Authorized domains'e domain eklendi mi?
2. Google Cloud OAuth credentials doğru mu?
3. Client ID firebase config'de doğru mu?
```

### Sorun 3: Firestore "Permission denied"
```
Kontrol:
1. Security Rules doğru mu?
2. Koleksiyonlar autoupdate'i enabled mi?
3. Auth session valid mi (24h)?
```

### Sorun 4: Storage upload başarısız
```
Kontrol:
1. Storage Rules write permission var mı?
2. Bucket location doğru mu (eur3)?
3. File size < 5MB mi?
```

---

## Test Akışı

### Lokal Test
```bash
npm run dev
# http://localhost:5173
# Authorize > Firestore data yaz > ✓
```

### Production Test
```bash
# Vercel: https://mirrorly-app.vercel.app
# QR scan veya link > Authorize > ✓
```

### Admin Test
```
weliakcay@gmail.com ile giriş
Admin panel açılmalı
```

---

## Hızlı Kontrol

Eğer giriş çalışmıyorsa sırayla kontrol et:

1. **Firebase Console Açık mı?**
   ```
   console.firebase.google.com/project/mirrorlyapp
   ```

2. **Authorized Domains var mı?**
   ```
   Authentication → Settings → Authorized domains
   ✓ localhost
   ✓ mirrorly-app.vercel.app
   ```

3. **Google Provider Enabled mi?**
   ```
   Authentication → Sign-in method
   ✓ Google: ENABLED
   ```

4. **Firestore Rules OK mi?**
   ```
   Firestore → Rules
   ✓ Rules published (not in draft)
   ```

5. **Environment Variables set mi?**
   ```
   Vercel Dashboard → Settings → Environment Variables
   ✓ All VITE_FIREBASE_* vars set
   ```

6. **Browser cache temizle**
   ```
   Ctrl+Shift+Delete → All time → Clear
   ```

7. **Test et**
   ```
   npm run dev → Google ile Gir → ✓
   ```

---

## Firebase Documentation Links
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Firebase Authentication Setup](https://firebase.google.com/docs/auth/web/start)
- [Storage Security Rules](https://firebase.google.com/docs/storage/security/start)
- [Google OAuth Setup](https://cloud.google.com/docs/authentication/oauth)

---

## Verilen Bilgiler (Current Config)

```
Project ID: mirrorlyapp
Auth Domain: mirrorlyapp.firebaseapp.com
Storage Bucket: mirrorlyapp.firebasestorage.app
Messaging Sender ID: 955400146750
Admin Email: weliakcay@gmail.com
```

---

## Her Deployment Öncesi Kontrol

- [ ] Authorized domains updated?
- [ ] Environment variables verified?
- [ ] Firestore rules published?
- [ ] Storage rules published?
- [ ] Google Console OAuth updated?
- [ ] Admin email correct?
- [ ] Test akışı başarılı?
