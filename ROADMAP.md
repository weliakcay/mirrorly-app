# Mirrorly Yol Haritasi

Tarih: 2026-04-11

Bu dokuman Mirrorly'yi yarim urun durumundan cikartip satilabilir ve pazarlanabilir bir urune donusturmek icin kullanilacak ana plan dosyasidir.

## 1. Urun Tezi

Mirrorly'nin cekirdek fikri, fiziksel butiklerin urun etiketlerine yerlestirilen QR kodlar sayesinde musteriyi aninda mobil try-on deneyimine sokmasidir.

Ilk hedef kitle:

- Teknolojiye uzak butik sahipleri
- Fiziksel magazada satici destegi olmadan urun deneyimini artirmak isteyen markalar
- Sosyal medya veya site uzerinden urun satan ama teknik ekibi olmayan kucuk moda markalari

Ilk ana deger onerisi:

- Butik urununu dakikalar icinde sisteme yukler
- Her urun icin benzersiz QR uretilir
- Musteri QR'yi okutup kendi fotografiyla urunu uzerinde gorur
- Butik, AI hype'ini fiziksel magazaya tasir

## 2. Bugunku Gercek Durum

Calisan kisimlar:

- Merchant giris ve temel panel
- Profil ve urun kayit akisi
- QR ve deep link urun acilisi
- Mobilde fotograf secme ve sonuc ekranina ulasabilme

Tam kapanmayan kritik kisimlar:

- Gercek try-on sonucunun provider tarafinda guvenilir uretilmesi
- Kie model zincirinin production'da tutarli calismasi
- Env, billing ve provider fallback mantiginin saha kosullarinda dogrulanmasi
- Firestore rules, storage ve Vercel env senkronunun kalici hale gelmesi

Bu nedenle Mirrorly su an "teknik prototip / pilot hazirlik" asamasindadir; henuz "satilabilir V1" degildir.

## 3. Fazlara Gore Yol Haritasi

### Faz 0: Teknik Stabilizasyon

Amac:

- Tek bir merchant urunu icin gercek try-on sonucunu tutarli sekilde almak

Kapanis kriterleri:

- En az 3 farkli test fotografisinda gercek try-on sonucu donmeli
- Sonuc fallback demo yerine provider sonucundan gelmeli
- Basarili denemede kredi 1 azalmali
- Basarisiz denemede kredi dusmemeli
- QR akisi iPhone ve Android'de test edilmeli

Yapilacaklar:

- Kie model ve billing yolunu netlestirmek
- Calisan "golden path" model kombinasyonunu sabitlemek
- Merchant tarafinda hangi preset'in hangi modele gittigini sade ama guvenli sekilde duzeltmek
- Sonuc kalitesini dusuren urun gorseli ve kullanici gorseli kurallarini netlestirmek
- Canli smoke test senaryosunu yazili hale getirmek

### Faz 1: Pilot Hazir Urun

Amac:

- 1 ila 3 butik ile gercek ortamda test edilebilir bir pilot urun cikarmak

Kapanis kriterleri:

- Merchant kendi urununu yardimsiz ekleyebilmeli
- QR etiketi fiziksel baskiya uygun gorunmeli
- Sonuc ekranindaki satin al / iletisim CTA'si dogru calismali
- Merchant profil, logo, iletisim ve shop URL alanlari stabil kaydolmali
- En az bir butik tarafindan "magazada kullanilabilir" geri bildirimi alinmali

Yapilacaklar:

- Merchant panelinde gereksiz V2 alanlarini temizlemek
- Urun ekleme ve QR yazdirma akisini sadeleştirmek
- Sonuc ekrani tasarimini daha premium hale getirmek
- Yetersiz urun gorseli durumlari icin uyari kutulari ve yukleme rehberleri eklemek
- Hata mesajlarini butik ve musteri tarafinda daha anlasilir hale getirmek

### Faz 2: Satilabilir V1

Amac:

- Mirrorly'yi para alinabilir bir butik SaaS urunu haline getirmek

Kapanis kriterleri:

- Landing page ve deger onerisi net olmali
- Paketler, kredi mantigi ve destek akisi yazili olmali
- Merchant onboarding yarim-manuel de olsa kontrol altinda olmali
- Temel hukuki metinler ve veri kullanimi aciklanmali
- Basit admin ekranindan merchant onay, kredi ve sponsorlu urun yonetimi yapilabilmeli

Yapilacaklar:

- Merchant onay akisi
- Admin panelin minimum versiyonu
- Paketleme: aylik kredi limiti + urun limiti
- Sponsorlu urun slot mantigi
- Basit analytic sayaci: deneme sayisi, QR tiklamasi, sonuc olusma orani
- Temel gizlilik, kullanim kosullari ve destek sayfalari

### Faz 3: V2 Deneyim Katmani

Amac:

- Son kullaniciyi tek seferlik QR ziyaretcisinden tekrar gelen kullaniciya cevirmek

Kapanis kriterleri:

- Google / Apple ile giris
- Kesfet ana sayfasi
- Kullanici kredi paketleri
- Prompt'lu ekstra varyasyonlar
- Hesapta sonuc gecmisi ve favoriler

Yapilacaklar:

- Kullanici auth
- Kesfet feed'i, arama ve kategori
- Kullanici cuzdani ve mikro odeme paketleri
- "Beni sahilde goster" gibi ikinci katman istem akisi
- Bulut gecmis ve favoriler

### Faz 4: Marketplace ve Buyume

Amac:

- Mirrorly'yi sadece QR araci degil, butiklerin trafik ve satis kanali haline getirmek

Kapanis kriterleri:

- Giris yapan kullanici urun gezebilmeli
- Sponsorlu alanlar satilabilir olmali
- Online satin al akisi olcumlenebilir hale gelmeli
- En cok denenen / sponsorlu / yeni urun siralamalari islemeli

Yapilacaklar:

- Merchant vitrin yapisi
- Sponsorlu listeleme
- Basit reklam paneli
- Marketplace siparis veya yonlendirme olcum katmani
- Daha guclu butikler icin toplu urun yukleme

## 4. Pazarlama Hazirligi

### 4.1 Ilk konumlandirma

Mirrorly ilk asamada bir "AI moda marketplace'i" gibi degil, "butiklere 1 gunde kurulabilen QR try-on araci" gibi konumlanmali.

Ilk mesaj yonleri:

- "AI teknolojisini magazana indir."
- "Urun etiketini tarat, urunu musteriye kendi uzerinde goster."
- "Teknik ekip olmadan AI destekli butik deneyimi."

### 4.2 Ilk satis materyalleri

Satisa cikmadan once su materyaller hazir olmali:

- 30 saniyelik urun demosu
- 3 ekranlik merchant onboarding gorseli
- QR etiketi ornek baskisi
- Sonuc ekrani ornekleri
- Basit paket tablosu
- SSS ve destek akis metni

### 4.3 Ilk kanal denemeleri

Ilk trafik ve satis icin odak:

- Instagram DM ile butik sahiplerine direkt ulasim
- Moda toptancilari ve showroom ziyaretleri
- "Magazana AI deneyimi ekleyelim" temali kisa landing page
- Bir iki pilot magazadan referans ve video testimonial

### 4.4 Ilk fiyatlama hipotezi

Baslangic icin:

- Merchant'a 10 tanitim kredisi
- Sonra aylik paket: kredi limiti + urun limiti
- Ek kredi yukleme opsiyonu
- V2 sonrasinda kullanici kredi paketleri

### 4.5 Takip edilmesi gereken metrikler

Ilk asamada su metrikler kritik:

- Merchant kayit -> ilk urun yukleme donusum orani
- QR okutma -> fotograf yukleme orani
- Fotograf yukleme -> sonuc olusma orani
- Sonuc -> indirme / paylasma orani
- Merchant basina aylik kullanilan kredi
- Pilot merchant tekrar kullanim orani

## 5. Pazarlanabilir Urune Gecis Icin Net Gate'ler

Mirrorly "pazarlanabilir" sayilmaz, eger:

- Gercek try-on sonucu guvenilir degilse
- Merchant yardimsiz urun ekleyemiyorsa
- QR etiketi fiziksel kullanim icin yeterince net degilse
- Sonuc ekraninda satin alma veya iletisim aksiyonu zayifsa
- Ilk fiyatlandirma ve onboarding anlatisi hazir degilse

Mirrorly "pazarlanabilir pilot urun" sayilir, eger:

- Bir butik kendi urununu sisteme koyup ayni gun test edebiliyorsa
- Musteri QR ile deneyim alip sonuc indirebiliyorsa
- Butik bu akis icin tekrar kullanma istegi duyuyorsa

## 6. Bu Dokumana Gore Sonraki Uretim Onceligi

Kod tarafinda bir sonraki oncelik sirasi:

1. Gercek try-on akisini sabitle
2. Merchant panelini pilot seviyesine sadeleştir
3. QR etiket ve sonuc ekranini premiumlastir
4. Landing page + paket anlatisi hazirla
5. Admin ve merchant onay akisini ekle
6. V2 kullanici ve odeme katmanina gec
