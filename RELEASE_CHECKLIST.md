# Mirrorly V1 Release Checklist

## 1. Pre-launch

- [ ] `npm run build` hatasiz tamamlandi
- [ ] Vercel env'leri `.env.example` ile karsilastirildi
- [ ] `KIE_API_KEY` production icin dogru
- [ ] `FIREBASE_ADMIN_*` alanlari production icin dogru
- [ ] Firestore rules publish edildi
- [ ] En az bir merchant profili ve en az bir urun production verisinde mevcut

## 2. Preview deploy smoke test

- [ ] `npm run smoke:deploy -- https://preview-url.vercel.app`
- [ ] `/api/ping` 200 donuyor
- [ ] `/api/try-on` GET 200 donuyor
- [ ] Landing ekrani aciliyor
- [ ] `/?id=<garmentId>` urun sayfasini aciyor

## 3. Product smoke test

- [ ] Merchant kayit veya giris basarili
- [ ] Merchant urun ekleyebiliyor
- [ ] QR etiketi aciliyor ve deep link dogru
- [ ] Mobil cihazda foto yukleme aciliyor
- [ ] Gercek try-on sonucu uretiliyor
- [ ] Sonuc indiriliyor
- [ ] Sonuc paylasma akisi aciliyor
- [ ] Basarili denemede kredi 1 azaltiliyor

## 4. Production go/no-go

- [ ] Preview deploy temiz
- [ ] Production deploy temiz
- [ ] En az bir iPhone test edildi
- [ ] En az bir Android test edildi
- [ ] Merchant geri bildirimi alindi

## 5. Acil durum fallback

- [ ] Gerekirse `VITE_TRYON_MODE=demo` ile acil demo deployu alinabilir
- [ ] Demo modunda sonuc ekraninda "Demo Preview" etiketi gorunuyor
- [ ] Merchant ekibi demo moduna alindigindan haberdar

