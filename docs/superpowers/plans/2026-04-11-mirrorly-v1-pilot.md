# Mirrorly V1 Pilot Hazırlık Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mirrorly'yi teknik prototip aşamasından çıkarıp 1-3 butikle gerçek ortamda test edilebilir Pilot V1'e taşımak.

**Architecture:** Mevcut Vite + React + Firebase + Vercel serverless mimarisi korunuyor. Müşteri akışı (GarmentView → PhotoInput → Processing → Result) mobil-first, dar wrapper içinde kalmaya devam ediyor. MerchantDashboard için ayrı geniş-ekran düzeni ekleniyor. Operasyonel değişiklikler (kredi uyarısı, onay akışı) mevcut Firestore veri modeline sıfır şema değişikliğiyle ekleniyor.

**Tech Stack:** React 18, TypeScript, Tailwind CSS (CDN), Firebase v10, Vercel Serverless Functions, Kie.ai API

---

## Dosya Haritası

**Değiştirilecekler:**
- `vercel.json` — function maxDuration eklenecek
- `App.tsx` — MerchantDashboard wrapper'ı geniş ekran için ayrışacak
- `components/ResultView.tsx` — CTA güçlendirilecek, butik bilgisi ekleniyor, alert() kaldırılıyor
- `components/Landing.tsx` — Mağaza Girişi butonu görünür hale getirilecek
- `components/MerchantDashboard.tsx` — Kredi uyarısı, layout genişletme, V2 yolları temizleme
- `components/Processing.tsx` — Görsel yükleme rehberi mesajları
- `components/GarmentView.tsx` — Ürün görseli uyarısı ve hata mesajları

**Oluşturulacaklar:**
- `docs/superpowers/plans/2026-04-11-mirrorly-v1-pilot.md` — bu dosya

---

## FAZ 0: Teknik Stabilizasyon

---

### Task 1: vercel.json — Function Timeout Güvencesi

**Files:**
- Modify: `vercel.json`

Kie.ai polling 90 saniyeye kadar sürebiliyor. Vercel'in varsayılan function timeout'u (10sn veya 60sn planına göre) bu işlemi keseceğinden `maxDuration: 90` eklenmelidir.

- [ ] **Step 1: Mevcut vercel.json içeriğini oku**

```bash
cat /Users/veliakcay/Documents/projeler/mirrorly/vercel.json
```

- [ ] **Step 2: maxDuration ekle**

`vercel.json` dosyasını aşağıdaki şekilde güncelle (mevcut routing kurallarını koru, sadece functions bloğunu ekle):

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/try-on.js": {
      "maxDuration": 90
    }
  }
}
```

Not: Eğer mevcut `vercel.json` farklı bir yapıdaysa (örn. `routes` yerine `rewrites` kullanıyor), mevcut yapıyı koru ve sadece `functions` bloğunu ekle.

- [ ] **Step 3: Commit**

```bash
cd /Users/veliakcay/Documents/projeler/mirrorly
git add vercel.json
git commit -m "fix: set vercel function maxDuration to 90s for Kie polling"
```

---

### Task 2: Smoke Test Checklist Doğrulaması

**Files:**
- Read: `scripts/smoke-check.sh` (varsa)
- Read: `RELEASE_CHECKLIST.md`

Bu adım kod değişikliği değil, production ortam doğrulaması için kontrol listesi.

- [ ] **Step 1: Mevcut smoke test scriptini oku**

```bash
cat /Users/veliakcay/Documents/projeler/mirrorly/scripts/smoke-check.sh 2>/dev/null || echo "Script yok"
cat /Users/veliakcay/Documents/projeler/mirrorly/RELEASE_CHECKLIST.md
```

- [ ] **Step 2: Vercel env değişkenlerini kontrol et**

Vercel Dashboard veya CLI ile production environment değişkenlerini doğrula:

```bash
# Vercel CLI kuruluysa:
vercel env ls --environment production 2>/dev/null || echo "Vercel CLI yok, Dashboard'dan kontrol edin"
```

Olması gereken env değişkenleri:
- `KIE_API_KEY` — Kie.ai API anahtarı
- `FIREBASE_PROJECT_ID` — Firebase proje ID'si
- `FIREBASE_CLIENT_EMAIL` — Firebase Admin service account email
- `FIREBASE_PRIVATE_KEY` — Firebase Admin private key (newline'lar `\n` ile)
- `VITE_FIREBASE_API_KEY` — Frontend Firebase config
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_TRYON_MODE=live` — Demo fallback KAPALI

- [ ] **Step 3: Eksik env varsa not al, devam et**

Eksik env değişkenleri Vercel Dashboard → Project → Settings → Environment Variables'dan set edilmeli. Bu adım manuel; yapıldıktan sonra bir sonraki task'a geç.

---

## FAZ 1-A: Desktop Layout Düzeltmesi

---

### Task 3: App.tsx — MerchantDashboard için Geniş Ekran Wrapper

**Files:**
- Modify: `App.tsx` (satır 809-815)

Şu an tüm ekranlar `sm:max-w-md` (448px) içinde render ediliyor. MerchantDashboard'u bu kısıtın dışına çıkar.

- [ ] **Step 1: Mevcut wrapper yapısını incele**

`App.tsx` satır 809-815:
```tsx
return (
  <div className="w-full min-h-[100dvh] bg-neutral-100 flex items-stretch justify-center overflow-x-hidden">
    <div className="w-full min-h-[100dvh] bg-boutique-cream relative overflow-hidden sm:min-h-0 sm:max-w-md sm:h-[calc(100dvh-2rem)] sm:max-h-[900px] sm:my-4 sm:rounded-3xl sm:shadow-2xl sm:border sm:border-gray-200">
      {renderContent()}
    </div>
  </div>
);
```

- [ ] **Step 2: Merchant ekranları için ayrı wrapper mantığı ekle**

`App.tsx`'de `renderContent()` çağrısından önce hangi ekranın geniş olacağını belirleyen bir yardımcı ekle:

```tsx
const isMerchantScreen = currentState === AppState.MERCHANT_DASHBOARD;
```

- [ ] **Step 3: Return bloğunu güncelle**

```tsx
return (
  <div className="w-full min-h-[100dvh] bg-neutral-100 flex items-stretch justify-center overflow-x-hidden">
    {isMerchantScreen ? (
      <div className="w-full min-h-[100dvh] bg-boutique-cream relative overflow-hidden">
        {renderContent()}
      </div>
    ) : (
      <div className="w-full min-h-[100dvh] bg-boutique-cream relative overflow-hidden sm:min-h-0 sm:max-w-md sm:h-[calc(100dvh-2rem)] sm:max-h-[900px] sm:my-4 sm:rounded-3xl sm:shadow-2xl sm:border sm:border-gray-200">
        {renderContent()}
      </div>
    )}
  </div>
);
```

- [ ] **Step 4: Dev server'da kontrol et**

```bash
cd /Users/veliakcay/Documents/projeler/mirrorly && npm run dev
```

Tarayıcıda `localhost:5173` aç. "Mağaza Girişi"ne tıkla. Masaüstünde tam genişlikte görünmeli. Müşteri akışına geç, dar wrapper korunmuş olmalı.

- [ ] **Step 5: Commit**

```bash
git add App.tsx
git commit -m "feat: merchant dashboard uses full-width layout on desktop"
```

---

### Task 4: MerchantDashboard — Geniş Ekran Temel Layout

**Files:**
- Modify: `components/MerchantDashboard.tsx`

Merchant paneli artık tam genişlikte render ediliyor. İçerik düzenini masaüstü için iyileştir: üst header + içerik alanı yapısı.

- [ ] **Step 1: MerchantDashboard.tsx başını oku**

`components/MerchantDashboard.tsx` dosyasının ilk 150 satırını oku ve üst seviye container div'ini tespit et.

- [ ] **Step 2: Oturum açılmış durumun ana container'ını bul**

Giriş yapıldıktan sonra render edilen ana div'i bul (genellikle `isLoggedIn` true olduğunda render edilen kısım). Bu div'in className'ini aşağıdaki gibi güncelle:

Eski: `className="flex flex-col h-full ..."` (dar mobil yapı)

Yeni — Login ekranı (auth formu) için değiştirme, sadece dashboard içeriği için:
```tsx
className="flex flex-col h-full min-h-[100dvh] bg-boutique-cream"
```

- [ ] **Step 3: Üst header bar'ı masaüstüne uyarla**

Header'da (mağaza adı, tabs, çıkış butonu olan kısım) mobil görünüm korunurken masaüstünde daha geniş padding ver:

```tsx
// Header container
className="px-4 sm:px-8 md:px-12 pt-6 pb-4 border-b border-gray-100 bg-white/80 backdrop-blur-md"
```

- [ ] **Step 4: Tab içerik alanını kısıtla**

Tab içerikleri (inventory listesi, profil formu) masaüstünde çok yayılmasın:

```tsx
// Tab içerik wrapper
className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-6"
```

İçeriği `max-w-4xl mx-auto` ile ortala:
```tsx
<div className="max-w-4xl mx-auto">
  {/* tab content */}
</div>
```

- [ ] **Step 5: Kontrol et ve commit et**

```bash
npm run dev
```

Merchant dashboard'u tarayıcıda masaüstünde aç. Header geniş, içerik ortalı görünmeli. Mobilde de bozulmamış olmalı.

```bash
git add components/MerchantDashboard.tsx
git commit -m "feat: merchant dashboard responsive layout for desktop"
```

---

## FAZ 1-B: Sonuç Ekranı (Dönüşüm Odaklı)

---

### Task 5: ResultView — Butik Bilgisi ve CTA Güçlendirmesi

**Files:**
- Modify: `components/ResultView.tsx`

Mevcut sorunlar:
1. `alert()` kullanılıyor (satır 98) — kaldır, inline mesaja çevir
2. Butik adı/logo result ekranında yok
3. CTA butonu görsel ağırlık olarak yetersiz
4. "Satın Al" yoksa kullanıcı ne yapacağını bilmiyor

- [ ] **Step 1: ResultView'ı komple oku**

`components/ResultView.tsx` dosyasını baştan sona oku.

- [ ] **Step 2: State ekle — noCta mesajı için**

`ResultView` bileşeninin state tanımlarına ekle:

```tsx
const [noCtaVisible, setNoCtaVisible] = useState(false);
```

- [ ] **Step 3: handleBuy'ı güncelle — alert() kaldır**

Eski:
```tsx
const handleBuy = () => {
  if (!purchaseAction.href) {
    alert('Bu urun icin henuz online satis veya iletisim bilgisi eklenmemis.');
    return;
  }
  window.open(purchaseAction.href, '_blank', 'noopener,noreferrer');
};
```

Yeni:
```tsx
const handleBuy = () => {
  if (!purchaseAction.href) {
    setNoCtaVisible(true);
    return;
  }
  window.open(purchaseAction.href, '_blank', 'noopener,noreferrer');
};
```

- [ ] **Step 4: CTA bölümünü güncelle**

Mevcut CTA grid bölümünü (`mx-auto max-w-sm grid grid-cols-[auto,1fr,auto]`) şu şekilde değiştir:

```tsx
<div className="mx-auto max-w-sm space-y-3 mb-6">
  {/* Ana CTA — tam genişlik, gold vurgu */}
  <button
    onClick={handleBuy}
    className="w-full h-14 bg-gray-900 text-white rounded-full shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-[0.98] border border-white/10"
  >
    <ShoppingBag className="w-5 h-5" />
    <span className="font-sans font-semibold text-base tracking-wide">{purchaseAction.label}</span>
  </button>

  {noCtaVisible && (
    <p className="text-center text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
      Bu ürün için henüz satış veya iletişim bilgisi eklenmemiş.
    </p>
  )}

  {/* İkincil aksiyonlar */}
  <div className="grid grid-cols-2 gap-3">
    <button
      onClick={onRetake}
      className="flex items-center justify-center gap-2 h-12 rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white transition-colors text-sm font-medium"
    >
      <RefreshCw className="w-4 h-4" />
      Tekrar
    </button>

    <button
      onClick={handleNativeShare}
      className="flex items-center justify-center gap-2 h-12 rounded-full border border-gray-300 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white transition-colors text-sm font-medium"
    >
      <Share2 className="w-4 h-4" />
      Paylaş
    </button>
  </div>
</div>
```

- [ ] **Step 5: Butik bilgisini ekle — sonuç ekranına**

CTA bölümünün hemen üstüne, garment adı ve butik bilgisi ekle:

```tsx
{/* Ürün ve butik bilgisi */}
<div className="mx-auto max-w-sm mb-5 text-center">
  <h2 className="font-serif text-xl text-gray-900 mb-1">{garment.name}</h2>
  {merchantProfile && (
    <div className="flex items-center justify-center gap-2">
      {merchantProfile.logoUrl && (
        <img
          src={merchantProfile.logoUrl}
          alt={merchantProfile.name}
          className="w-5 h-5 rounded-full object-cover"
        />
      )}
      <span className="text-sm text-gray-500 font-sans">{merchantProfile.name}</span>
    </div>
  )}
</div>
```

- [ ] **Step 6: Ana konteyner padding'ini kontrol et**

`-mt-16 sm:-mt-20` ile başlayan içerik div'i şu şekilde olmalı (değişiklik gerekmiyorsa dokunma):
```tsx
<div className="relative z-10 -mt-16 sm:-mt-20 w-full px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
```

Ürün + butik bilgisi → CTA → Ana Ekrana Dön sıralaması olmalı.

- [ ] **Step 7: Dev server'da kontrol et**

```bash
npm run dev
```

Bir ürün seç → fotoğraf yükle (veya demo mode) → result ekranına gel. Butik adı görünüyor olmalı. CTA tam genişlik olmalı. Paylaş/Tekrar yan yana küçük butonlar olmalı.

- [ ] **Step 8: Commit**

```bash
git add components/ResultView.tsx
git commit -m "feat: result screen - stronger CTA, boutique info, remove alert()"
```

---

## FAZ 1-C: Rol Geçişi Netleştirme

---

### Task 6: Landing — Mağaza Girişi Görünürlüğü

**Files:**
- Modify: `components/Landing.tsx`

Mevcut "Mağaza Girişi" linki `text-[10px]` ghost buton — neredeyse görünmez.

- [ ] **Step 1: Landing.tsx'i oku**

`components/Landing.tsx` dosyasını oku.

- [ ] **Step 2: Mağaza Girişi butonunu güncelle**

Eski (satır 84-89):
```tsx
<div className="pt-2 text-center">
  <button
    onClick={onMerchantLogin}
    className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors tracking-widest uppercase font-sans p-4"
  >
    Magaza Girisi
  </button>
</div>
```

Yeni — daha görünür ama müşteri CTA'sından hafif:
```tsx
<div className="pt-2">
  <button
    onClick={onMerchantLogin}
    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white/60 border border-gray-200 rounded-2xl text-gray-500 hover:text-gray-800 hover:bg-white hover:border-gray-300 transition-all text-sm font-sans"
  >
    <Store className="w-4 h-4" />
    Mağaza Girişi
  </button>
</div>
```

- [ ] **Step 3: Store ikonunu import'a ekle**

`Landing.tsx` import satırında `Store` ikonu yoksa ekle:
```tsx
import { ArrowRight, Chrome, History, Scan, Sparkles, Store } from 'lucide-react';
```

- [ ] **Step 4: Kontrol et**

```bash
npm run dev
```

Landing ekranında "Mağaza Girişi" butonu artık bir kutu şeklinde görünüyor, tıklanabilir hissettiriyor ama müşteri CTA'sından daha hafif görsel ağırlıkta olmalı.

- [ ] **Step 5: Commit**

```bash
git add components/Landing.tsx
git commit -m "feat: landing - make merchant login button visible and styled"
```

---

### Task 7: MerchantDashboard — Oturum Durumu ve Çıkış Belirginleştirme

**Files:**
- Modify: `components/MerchantDashboard.tsx`

- [ ] **Step 1: MerchantDashboard'da çıkış ve oturum göstergesini bul**

Dosyada `LogOut` ikonunun kullanıldığı yeri ve merchant adının gösterildiği header kısmını tespit et.

- [ ] **Step 2: Header'da mağaza adı + çıkış butonunu belirginleştir**

Header'da oturum açık olan mağazanın adını göster ve çıkış butonunu etiketli yap:

```tsx
{/* Header üst kısım — mağaza kimliği */}
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-3">
    {merchantProfile.logoUrl ? (
      <img
        src={merchantProfile.logoUrl}
        alt={merchantProfile.name}
        className="w-9 h-9 rounded-full object-cover border border-gray-200"
      />
    ) : (
      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
        <Store className="w-4 h-4 text-gray-500" />
      </div>
    )}
    <div>
      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-sans">Mağaza Paneli</p>
      <p className="font-serif text-lg leading-tight text-gray-900">{merchantProfile.name}</p>
    </div>
  </div>

  <button
    onClick={handleLogout}
    className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
  >
    <LogOut className="w-3.5 h-3.5" />
    <span className="font-sans">Çıkış</span>
  </button>
</div>
```

Not: `handleLogout` fonksiyonunun mevcut adını koru — sadece butona etiket eklenmiş oluyor.

- [ ] **Step 3: Store ikonunu import'a ekle (yoksa)**

```tsx
import { ..., Store } from 'lucide-react';
```

- [ ] **Step 4: Commit**

```bash
git add components/MerchantDashboard.tsx
git commit -m "feat: merchant dashboard - visible session state and labeled logout"
```

---

## FAZ 1-D: Merchant Paneli Sadeleştirme

---

### Task 8: MerchantDashboard — Kredi Uyarısı ve Bilgi Paneli

**Files:**
- Modify: `components/MerchantDashboard.tsx`

Merchant'ın kredisi 3'ün altına düştüğünde uyarı banner'ı; 0 olduğunda blok banner.

- [ ] **Step 1: Kredi uyarı banner'ını ekle**

Merchant dashboard'da aktif tab içeriğinin üstüne (yani `activeTab` switch'inden önce) şu bileşeni ekle:

```tsx
{/* Kredi Uyarı Banner */}
{merchantProfile.credits === 0 && (
  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Coins className="w-4 h-4 text-red-500" />
    </div>
    <div>
      <p className="text-sm font-medium text-red-800">Krediniz tükendi</p>
      <p className="text-xs text-red-600 mt-0.5">
        Müşterileriniz deneme yapamıyor. Kredi eklemek için bizimle iletişime geçin.
      </p>
    </div>
  </div>
)}

{merchantProfile.credits > 0 && merchantProfile.credits <= 3 && (
  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Coins className="w-4 h-4 text-amber-600" />
    </div>
    <div>
      <p className="text-sm font-medium text-amber-800">Krediniz azalıyor ({merchantProfile.credits} kaldı)</p>
      <p className="text-xs text-amber-600 mt-0.5">
        Yakında müşteri denemeleri durabilir. Kredi eklemek için bizimle iletişime geçin.
      </p>
    </div>
  </div>
)}
```

- [ ] **Step 2: Balance tab'ının içeriğini güncelle**

`activeTab === 'balance'` içeriğinde kredi bilgisini ve iletişim CTA'sını göster:

```tsx
case 'balance':
  return (
    <div className="space-y-4">
      <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-sans mb-2">Mevcut Kredi</p>
        <p className="font-serif text-5xl text-gray-900 mb-1">{merchantProfile.credits}</p>
        <p className="text-sm text-gray-500">kullanılabilir deneme kredisi</p>
      </div>

      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
        <p className="text-sm font-medium text-gray-700">Kredi nasıl çalışır?</p>
        <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside">
          <li>Ekonomik mod: 1 kredi / deneme</li>
          <li>Dengeli mod: 2 kredi / deneme</li>
          <li>Premium mod: 3 kredi / deneme</li>
        </ul>
      </div>

      <div className="p-4 bg-boutique-cream border border-gray-200 rounded-2xl text-center">
        <p className="text-sm text-gray-600 mb-3">Kredi paketi almak veya mevcut paketinizi görüntülemek için:</p>
        <a
          href="https://wa.me/?text=Mirrorly%20kredi%20paketi%20hakkında%20bilgi%20almak%20istiyorum."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-black transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Kredi Paketi Hakkında İletişim
        </a>
      </div>
    </div>
  );
```

- [ ] **Step 3: Kontrol et**

```bash
npm run dev
```

Merchant girişi yap. Eğer profil kredisi 0 veya <=3 ise ilgili banner görünmeli. Balance tab'ında kredi sayısı ve iletişim CTA'sı görünmeli.

- [ ] **Step 4: Commit**

```bash
git add components/MerchantDashboard.tsx
git commit -m "feat: merchant dashboard - credit warning banners and balance tab info"
```

---

## FAZ 1-E: Hata Mesajları ve Yükleme Rehberi

---

### Task 9: PhotoInput — Görsel Rehber Mesajı

**Files:**
- Modify: `components/PhotoInput.tsx`  
- Read: `components/GarmentView.tsx`

- [ ] **Step 1: PhotoInput.tsx'i oku**

`components/PhotoInput.tsx` dosyasını oku.

- [ ] **Step 2: Fotoğraf yükleme rehberini ekle**

Fotoğraf seçim butonunun altına rehber ipuçları ekle:

```tsx
{/* Rehber ipuçları */}
<div className="mt-4 p-4 bg-white/60 rounded-2xl border border-gray-100 space-y-2">
  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">En iyi sonuç için</p>
  <ul className="space-y-1.5">
    {[
      'Düz, sade arka planlı fotoğraf kullanın',
      'Yüzünüz ve vücudunuz tam görünsün',
      'İyi aydınlatılmış ortamda çekin',
      'Sizi tam kaplayan kıyafet tercih edin',
    ].map((tip) => (
      <li key={tip} className="flex items-start gap-2 text-xs text-gray-500">
        <span className="text-boutique-gold mt-0.5">✦</span>
        {tip}
      </li>
    ))}
  </ul>
</div>
```

- [ ] **Step 3: GarmentView'da eksik ürün görseli uyarısı**

`components/GarmentView.tsx` dosyasını oku. Ürün görseli (`garment.imageUrl`) mevcut değilse veya yüklenemezse kullanıcıya bilgi göster.

Garment görselinin render edildiği `<img>` etiketini bul ve `onError` handler ekle:

```tsx
<img
  src={garment.imageUrl}
  alt={garment.name}
  className="..."
  onError={(e) => {
    (e.target as HTMLImageElement).style.display = 'none';
    // Fallback placeholder göster
  }}
/>
```

Veya mevcut yapıya göre state ile yönet:
```tsx
const [imageError, setImageError] = useState(false);

// img tag'inde:
onError={() => setImageError(true)}

// imageError === true ise:
{imageError && (
  <div className="w-full aspect-[3/4] bg-gray-100 rounded-2xl flex items-center justify-center">
    <div className="text-center space-y-2">
      <ImageIcon className="w-8 h-8 text-gray-300 mx-auto" />
      <p className="text-xs text-gray-400">Ürün görseli yüklenemedi</p>
    </div>
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add components/PhotoInput.tsx components/GarmentView.tsx
git commit -m "feat: photo input guide tips, garment image error fallback"
```

---

## FAZ 2-A: Merchant Onay Akışı (Minimal)

---

### Task 10: MerchantDashboard — Pending Status Ekranı

**Files:**
- Modify: `components/MerchantDashboard.tsx`

`MerchantProfile.status === 'pending'` olan merchant'a dashboard yerine bekleme ekranı göster.

- [ ] **Step 1: Status kontrolünü bul**

`MerchantDashboard.tsx` içinde `isLoggedIn === true` olduğunda render edilen ana içeriği bul.

- [ ] **Step 2: Pending check ekle**

Giriş başarılı ama `merchantProfile.status === 'pending'` ise:

```tsx
{isLoggedIn && merchantProfile.status === 'pending' && (
  <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
      <Sparkles className="w-7 h-7 text-amber-500" />
    </div>
    <h2 className="font-serif text-2xl text-gray-900 mb-3">Başvurunuz İnceleniyor</h2>
    <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-6">
      Mağazanız Mirrorly ekibi tarafından inceleniyor. Onay sonrası panele tam erişim sağlayacaksınız.
    </p>
    <p className="text-xs text-gray-400">
      Sorularınız için: <a href="https://wa.me/" className="underline text-gray-600">WhatsApp ile ulaşın</a>
    </p>
    <button
      onClick={handleLogout}
      className="mt-8 text-xs text-gray-400 hover:text-gray-600 uppercase tracking-widest"
    >
      Çıkış Yap
    </button>
  </div>
)}

{isLoggedIn && merchantProfile.status !== 'pending' && (
  // ... mevcut dashboard içeriği
)}
```

- [ ] **Step 3: handleLogout referansını kontrol et**

`handleLogout` mevcut değilse, mevcut çıkış fonksiyonunun adını kullan (örn. `onBack` veya logout state'i resetleyen fonksiyon).

- [ ] **Step 4: Commit**

```bash
git add components/MerchantDashboard.tsx
git commit -m "feat: merchant dashboard - pending approval waiting screen"
```

---

## FAZ 2-B: Müşteri Tarafında "Butik Kredisi Bitti" Mesajı

---

### Task 11: ResultView + App.tsx — Kredi Yetersizliği Mesajı

**Files:**
- Modify: `components/ResultView.tsx`
- Read: `App.tsx` (processImageFile, hata yönetimi)

Mevcut durumda API'dan `status: 402, creditOwner: 'merchant'` döndüğünde result ekranı generic hata mesajı gösteriyor. Bunu butik odaklı bir mesaja çevir.

- [ ] **Step 1: App.tsx processImageFile error handling'i oku**

`App.tsx` satır 503-605 arasını oku. `apiResult.success === false` kontrolünde ne olduğunu anla.

- [ ] **Step 2: Result ekranında merchant kredi mesajını özelleştir**

`ResultView.tsx`'deki başarısız durum render bloğunda (`!result.success`), gelen mesaja göre farklı başlık göster:

```tsx
if (!result.success) {
  const isMerchantCreditError =
    result.message?.toLowerCase().includes('yeterli kredi') ||
    result.message?.toLowerCase().includes('kredi gerektiriyor');

  return (
    <div className="h-full min-h-0 flex flex-col items-center justify-center p-8 text-center bg-boutique-cream relative">
      {/* navigation butonları — mevcut yapıyı koru */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <button onClick={onRetake} className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        <button onClick={onHome} className="p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors">
          <Home className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      {isMerchantCreditError ? (
        <>
          <h3 className="font-serif text-2xl text-gray-900 mb-4">Bu Butik Şu An Dolu</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xs">
            Bu mağazanın deneme kapasitesi dolmuş. Daha sonra tekrar deneyin veya başka bir butiki keşfedin.
          </p>
        </>
      ) : (
        <>
          <h3 className="font-serif text-2xl text-gray-900 mb-4">Ayna netleşemedi</h3>
          <p className="text-gray-600 mb-8">{result.message}</p>
        </>
      )}

      <button onClick={onRetake} className="px-8 py-3 bg-gray-900 text-white rounded-full font-sans text-sm uppercase tracking-wide">
        Tekrar Dene
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/ResultView.tsx
git commit -m "feat: result screen - merchant credit error shows user-friendly message"
```

---

## FAZ 1-F: QR Etiketi Kalitesi Kontrolü

---

### Task 12: MerchantDashboard — QR Etiketi Butik Adı

**Files:**
- Modify: `components/MerchantDashboard.tsx` (QR print alanı)

- [ ] **Step 1: QR print alanını bul**

`MerchantDashboard.tsx` içinde `print-area` className'ini veya `activeQrItem` ile ilgili render bloğunu bul.

- [ ] **Step 2: QR etiketine butik adı ekle**

QR kodu render eden bölümde butik adı ve ürün adı görünsün:

```tsx
{/* QR Print Alanı */}
<div className="print-area flex flex-col items-center gap-3 p-6">
  {/* QR kod bileşeni — mevcut kodu koru */}
  
  {/* Ürün bilgisi */}
  <div className="text-center mt-2">
    <p className="font-serif text-base font-semibold text-gray-900">{activeQrItem.name}</p>
    <p className="text-xs text-gray-500 mt-1">{merchantProfile.name}</p>
    <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">
      QR kodu okutun, deneyin
    </p>
  </div>
</div>
```

- [ ] **Step 3: Print preview test et**

```bash
npm run dev
```

Merchant dashboard → bir ürünün QR'ına tıkla → Tarayıcıda Ctrl+P veya "Yazdır" → Preview'da butik adı ve ürün adı görünmeli. QR kodu net, yeterli boyutta olmalı.

- [ ] **Step 4: Commit**

```bash
git add components/MerchantDashboard.tsx
git commit -m "feat: QR label shows product name and boutique name for print"
```

---

## Son Kontrol

### Task 13: Genel Test ve Temizlik

- [ ] **Step 1: Üretim build'i çalıştır**

```bash
cd /Users/veliakcay/Documents/projeler/mirrorly
npm run build
```

Beklenen: Build hatasız tamamlansın. TypeScript hataları varsa düzelt.

- [ ] **Step 2: Uçtan uca akış testi**

Dev server'da şu senaryoları test et:

**Müşteri akışı:**
1. Landing ekranı → butik görünümlü, "Mağaza Girişi" butonu görünür
2. QR linki ile giriş (`?id=<garmentId>`) → GarmentView açılır
3. Fotoğraf yükle → Processing ekranı görünür
4. Sonuç ekranı → Butik adı, güçlü CTA, Paylaş/Tekrar butonları

**Merchant akışı:**
1. Landing → Mağaza Girişi → login
2. Dashboard masaüstünde geniş görünür
3. Kredi düşükse uyarı banner görünür
4. Balance tab'ında kredi bilgisi ve iletişim CTA'sı görünür
5. QR etiketinde butik ve ürün adı görünür
6. Çıkış butonu etiketli ve belirgin

- [ ] **Step 3: Varsa TypeScript hatalarını düzelt**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git status  # sadece beklenen dosyalar staged olmalı
git commit -m "chore: v1 pilot - final build check and cleanup"
```

---

## Tamamlanma Kriterleri

Plan başarıyla tamamlanmış sayılır:
- [ ] `npm run build` hatasız çalışıyor
- [ ] Vercel function timeout 90s olarak set edilmiş
- [ ] MerchantDashboard masaüstünde tam genişlikte görünüyor
- [ ] ResultView'da butik adı ve güçlendirilmiş CTA mevcut
- [ ] `alert()` çağrısı kaldırılmış, inline mesaj var
- [ ] Landing'de Mağaza Girişi butonu görünür ve styled
- [ ] Merchant oturum durumu ve çıkış butonu belirgin
- [ ] Kredi uyarı banner'ları çalışıyor
- [ ] `status: 'pending'` merchant bekleme ekranı görüyor
- [ ] QR etiketinde butik ve ürün adı var
- [ ] PhotoInput'ta fotoğraf rehberi mevcut
