# Mirrorly Landing Page Playbook

Bu dokuman, Mirrorly icin landing page mimarisi kurarken urunun bugunku gercegini, pazarlama mesajlarini ve teknik kurulum notlarini tek yerde toplar.

Amac:

- Claude Code tarafinda landing page mimarisini netlestirmek
- Codex tarafinda bu mimariyi uygularken icerik ve teknik karar destegi saglamak
- Pazarlama dili ile urunun gercek teknik kapsamini ayni hizada tutmak

## 1. Urun Ne Yapiyor?

Mirrorly, fiziksel butiklerdeki urunleri QR veya deep link ile acilan mobil AI try-on deneyimine ceviren bir urundur.

En kisa anlatim:

- Magaza urununu yukler
- Her urun icin bir QR veya link olusur
- Musteri urunu telefondan acar
- Fotografini yukler
- Uygun oldugunda urunu kendi uzerinde gorur
- Sonucu indirebilir, paylasabilir ve urunden satin alma veya iletisim aksiyonuna gecebilir

## 2. Kodda Gercekten Var Olan En Guclu Ozellikler

Bu kisim landing page copy'sinin cekirdegi olarak kullanilabilir.

### 2.1 Magaza icin en onemli ozellikler

1. QR tabanli urun deneyimi
Her urun icin deep link ve yazdirilabilir QR etiketi olusturulabiliyor. Bu, Mirrorly'yi "AI demo" yerine magazaya indirilen somut bir araca ceviriyor.

2. Teknik ekip gerektirmeyen urun girisi
Merchant panelinde butik kendi urununu, fiyatini, aciklamasini ve gorselini ekleyebiliyor. Bu landing page'de "self-serve pilot setup" olarak anlatilabilir.

3. Magaza profili ve marka bilgisi
Logo, butik aciklamasi, Instagram, shop URL, WhatsApp ve para birimi gibi bilgiler kaydediliyor. Sonuc ekranindaki satin alma veya iletisim aksiyonu bu alanlarla besleniyor.

4. Her urunden satin alma veya iletisime gecis
Try-on sonucundan sonra kullanici urunun shop URL'ine, genel shop URL'ine veya WhatsApp iletisime yonlendirilebiliyor. Bu, denemeyi satis aksiyonuna baglayan en kritik ozellik.

5. Kredi bazli kullanim mantigi
Magaza kullandikca kredi tuketiyor. Bu, urunun paketlenmesini kolaylastiriyor ve landing page fiyatlama anlatisi icin guclu bir temel sunuyor.

6. Model kalite seviyesi secimi
Economy, balanced ve premium preset mantigi var. Bu, "tek tip AI" yerine hiz, maliyet ve kalite dengesi secilebilen bir deneyim sunuyor.

7. Pilot icin uygun QR baski akisi
Merchant panelinde QR etiketi yazdirma, indirme ve link kopyalama akisi var. Fiziksel magaza kullanimina en yakin ozelliklerden biri bu.

8. Coklu butik / coklu urun yapisi
Veri modeli multi-tenant kurgulanmis. Her butik kendi envanterini ve public profilini yonetebiliyor. Landing page'de bunu "butiklere ozel vitrin" veya "her urun icin ayri deneyim" diye anlatmak mantikli.

9. Dusuk bakiye operasyonu icin altyapi
Dusuk kredi durumlarinda e-posta uyari mantigi mevcut. Landing page'de ana mesaj degil ama operasyonel olgunluk gostergesi olarak kullanilabilir.

10. Demo fallback ile satis demosu alma imkani
Gercek try-on provider'i sorunlu olsa bile demo modu ile akisi gosterebilen bir altyapi var. Bu, erken asama demo gorusmeleri icin faydali.

### 2.2 Son kullanici icin en onemli ozellikler

1. Uygulama indirmeden deneyim
Kullanici QR okutuyor veya linke tikliyor, urun sayfasi dogrudan aciliyor.

2. Mobil odakli urun akisi
Deneyim telefondan urun acma, fotograf yukleme ve sonuc gorme uzerine kurulmus.

3. Sonucu indirip paylasabilme
Try-on sonucu kaydedilebiliyor ve paylasilabiliyor. Bu, kullanici tarafinda tekrar paylasim ve organik yayilim potansiyeli tasiyor.

4. Favoriler ve kesfet akisi
Giris yapan kullanici urunleri favorileyebiliyor, farkli butiklerden urunler gezebiliyor ve kesfet akisina donebiliyor.

5. Deneme gecmisi
Kullanici onceki sonuclarina yeniden ulasabiliyor. Lokal gecmis ve girisli kullanici icin bulut gecmisi mantigi var.

6. Google ve e-posta ile musteri girisi
Musteri auth akisi sadece tek seferlik ziyaret degil, tekrar gelen kullanici mantigi icin iyi bir temel sunuyor.

7. Musteri kredi cuzdani
Giris yapan kullanicilar icin kredi bakiyesi ve kredi paketi yapisi mevcut. Bu, ileride B2C gelir modeli icin de kapinin acik oldugunu gosteriyor.

8. Kisisel model tercihi
Kullanici kendi denemelerinde hangi kalite seviyesini kullanacagini secebiliyor.

## 3. Landing Page'de Vurgulanmasi Gereken Ana Deger Onerileri

### 3.1 Magaza sahibine anlatilacak ana mesaj

"Urun etiketini AI deneyimine cevir."

Alt mesajlar:

- Urunlerini dakikalar icinde QR destekli try-on deneyimine donustur
- Musteriyi kabine girmeden once urunle etkilesime sok
- Magazana teknik ekip kurmadan AI katmani ekle
- Sonucu satin alma veya WhatsApp iletisime bagla

### 3.2 Son kullaniciya dolayli olarak anlatilacak mesaj

"Tarat, yukle, uzerinde gor."

Alt mesajlar:

- Uygulama indirmeden urune gir
- Fotografini yukle, sonucunu gorme sansini yakala
- Gorunumu kaydet, paylas, sonra geri don

### 3.3 En guclu konumlandirma

Mirrorly'yi ilk asamada su sekilde konumlandirmak en dogru gorunuyor:

"Butikler icin 1 gunde kurulabilen QR destekli AI try-on araci"

Su konumlandirmalardan kacin:

- Tam olgunlasmis AI moda marketplace'i
- Kusursuz sanal kabin platformu
- Buyuk markalar icin enterprise retail OS

Repo gercegine gore bugun en guclu hikaye "butiklere hizli kurulan magazai AI deneyimi"dir.

## 4. Landing Page'de Abartilmamasi Gereken Konular

Landing page guclu olmali ama teknik gercekligi asmamali.

### Net sekilde dikkatli anlatilmasi gerekenler

1. Gercek try-on kalitesi
Kodda canli try-on hatti var ama repo dokumanlarina gore en buyuk teknik risk hala provider guvenilirligi. Bu nedenle "production-ready flawless realism" vaadi verilmemeli.

2. Analytics ve raporlama
Analytics altyapisi var ama tam urunlestirilmis merchant dashboard seviyesi raporlama bugun ana guc noktasi degil.

3. Tam self-serve SaaS olgunlugu
Merchant onboarding ve kredi akislari var; yine de bugunku durum pilot odakli. Bu nedenle CTA dili "hemen satin al" yerine "pilot baslat", "demo iste", "magazanda dene" olabilir.

4. Marketplace anlatisi
Kesfet, favoriler ve customer katmani mevcut; ama ana landing page konusu su an marketplace olmamali. Bu kisim ikinci plana alinmali.

## 5. Landing Page Icin Onerilen Bilgi Mimarisi

Bu yapi Claude Code tarafinda section architecture olarak kullanilabilir.

### Section 1: Hero

Amac:
3 saniyede ne oldugunu anlatmak.

Baslik onerileri:

- Butiginizdeki urunu AI try-on deneyimine cevirin
- QR ile acilan mobil try-on deneyimi
- Urun etiketini tarat, urunu musterinin uzerinde goster

Alt baslik:

"Mirrorly, butiklerin urunlerini QR veya link ile acilan mobil deneme akisina tasir. Musteri fotografini yukler, urunu kendi uzerinde gorur, sonucunu kaydeder ve satin alma adimina ilerler."

Hero CTA onerileri:

- Demo Iste
- Pilot Baslat
- Ornek Akisi Gor

Ikinci CTA:

- QR Etiketi Ornegi
- Nasil Calisir

### Section 2: Problem

Amac:
Butik sahibinin bugunku sorununu tarif etmek.

Mesaj:

- Her musteri fiziksel prova yapmak istemiyor
- Magazada urun ilgisini dijital aksiyona cevirmek zor
- Sosyal medyadan gelen trafik magazada devam etmiyor
- Kucuk markalar AI kullanmak istiyor ama teknik ekipleri yok

### Section 3: Nasil Calisir

3 adimli akis:

1. Urununu yukle
2. QR veya link olustur
3. Musteri taratsin, fotograf yuklesin, sonucu gorsun

Bu section'da urun icinden ekran goruntuleri veya mock flow kullanilabilir:

- Merchant panel urun ekleme
- QR etiketi
- Urun sayfasi
- Sonuc ekrani

### Section 4: Magaza Icin Faydalar

Kart basliklari:

- Fiziksel urune dijital deneyim ekle
- Her urun icin QR olustur
- Satin alma ve WhatsApp aksiyonunu kacirma
- Teknik ekip olmadan kur
- Kredi bazli olceklenebilir kullanim

### Section 5: Musteri Deneyimi

Mesaj:

- Uygulama indirmeden acilir
- Mobilde hizli ilerler
- Sonuc kaydedilir ve paylasilabilir
- Giris yapan kullanici favori, gecmis ve kesfet akisina doner

### Section 6: Neden Mirrorly?

Rakip mesaj yerine karar kolaylastiran farklar:

- QR-first: magaza ici kullanim icin tasarli
- Boutique-first: enterprise degil, butik gercegine yakin
- Action-first: sonuc ekrani satin alma veya iletisim aksiyonuna baglanir
- Pilot-friendly: demo ve pilot kurulum mantigi var

### Section 7: Paketler veya Pilot Modeli

Bugunku urun gercegine uygun en dogru format:

- Baslangic: tanitim / pilot kredisi
- Aylik: kredi limiti + urun limiti
- Ek kredi: top-up mantigi

Bu kisimda kesin fiyat yerine su format daha guvenli olabilir:

- Pilot Paket
- Growth Paket
- Scale Paket

### Section 8: SSS

Onerilen sorular:

- Kurulum ne kadar surer?
- Musteri uygulama indirmek zorunda mi?
- QR kodu nasil kullaniliyor?
- Her deneme kredi tuketiyor mu?
- Sonuc dogrudan satin almaya yonlenebiliyor mu?
- Hangi cihazlarda calisiyor?
- Pilot surecte nasil destek veriyorsunuz?

### Section 9: Final CTA

Onerilen mesaj:

"Butiginizde AI try-on deneyimini test etmek icin 1 haftalik pilotla baslayin."

CTA:

- Pilot Talebi Birak
- Demo Gorusmesi Planla

## 6. Landing Page Copy Kit

Bu bolum dogrudan taslak copy olarak kullanilabilir.

### Hero copy v1

Baslik:
Butiginizdeki urunu AI try-on deneyimine cevirin

Metin:
Mirrorly, butik urunlerini QR veya link ile acilan mobil deneme akisina donusturur. Musteri urunu taratir, fotografini yukler, sonucunu gorur ve satin alma adimina ilerler.

CTA:
Pilot Baslat

### Hero copy v2

Baslik:
QR okut, urunu musteriye kendi uzerinde goster

Metin:
Fiziksel magaza deneyimini AI ile guclendirin. Teknik ekip kurmadan urunlerinize mobil try-on akisi ekleyin.

CTA:
Demo Iste

### Kisa tagline alternatifleri

- Boutique AI, finally usable
- AI try-on, built for boutiques
- Scan. Try. Share. Shop.
- Magazana indirilen AI deneyimi
- QR ile acilan try-on akisi

## 7. Claude Code Icin Mimari Girdiler

Landing page mimarisi tasarlanirken asagidaki kurallar korunmali.

### 7.1 Hedef

Landing page'in amaci kullaniciyi uygulamanin icine dusurmek degil, butik sahibini ikna etmektir.

Bu nedenle primary visitor:

- Butik sahibi
- Kucuk moda markasi
- Showroom veya fiziksel magaza yoneticisi

Secondary visitor:

- Deneyimi ilk kez goren musteri
- Partner / yatirimci / isbirligi adayi

### 7.2 Ana CTA davranisi

Bugunku urun durumuna gore primary CTA self-serve signup degil, lead capture veya demo talebi olmalidir.

Ornek:

- `Demo Iste`
- `Pilot Baslat`
- `Bize Ulas`

### 7.3 Tasarim dili

Mirrorly icin uygun tasarim yonu:

- Premium butik estetik
- Teknoloji saticisi gibi degil, moda deneyimi gibi hissettiren dil
- Krem, koyu antrasit, yumusak altin vurgular
- Buyuk urun gorselleri
- QR ve telefon mockup'lari
- Parlak ama sakin tipografi kontrasti

### 7.4 Gorsel ihtiyac listesi

- 1 adet hero phone mockup
- 1 adet QR etiketi goruntusu
- 1 adet merchant dashboard urun ekleme ekrani
- 1 adet try-on sonuc ekrani
- 1 adet magazada kullanilan sticker / stand mockup'i

## 8. Codex Icin Teknik Kurulum Notlari

Landing page bu repo icinde veya ayri bir marketing app olarak kurulabilir.

### Secenek A: Mevcut repo icinde landing page

Ne zaman uygun:

- Hizli cikmak isteniyorsa
- Tek deploy ile ilerlemek isteniyorsa
- SEO kritik degilse
- Landing page daha cok satis gorusmelerinde kullanilacaksa

Artisi:

- Mevcut Vite yapisi korunur
- Tasarim hizli uygulanir
- Uygulama ile ayni domain uzerinde calisir

Eksisi:

- SEO ve icerik sayfasi genisleme esnekligi daha sinirli
- Pazarlama sayfasi ile app state yapisi ayni kod tabaninda karisir

### Secenek B: Ayri marketing site

Ne zaman uygun:

- SEO, blog, sayfa cesidi ve performans oncelikliyse
- Pazarlama ile uygulama lifecycle'i ayrilsin isteniyorsa
- Gelecekte case study, fiyatlama, SSS, blog ve legal sayfalari buyuyecekse

Artisi:

- Daha temiz bilgi mimarisi
- SEO ve sayfa genisletme daha guclu
- Marketing ve app deployment ayrilir

Eksisi:

- Ikinci repo veya ikinci app operasyonu getirir
- Tasarim sistemi ayrisma riski olur

### Oneri

Bugunku repo durumuna gore en hizli yol:

1. Ilk landing page'i mevcut repo icinde kur
2. CTA'lari demo/pilot lead akisina bagla
3. Urun satilabilir V1 seviyesine gelince ayri marketing site degerlendir

## 9. Teknik Setup Checklist

Landing page bu repo icinde kurulacaksa:

1. Ayrik bir marketing route veya marketing-first entry kurgula
2. App deneyimi ile marketing deneyimini net ayir
3. CTA'lari e-posta, form, WhatsApp veya takvim linkine bagla
4. Gercek olmayan metrik ve testimonial kullanma
5. Demo modunu sadece kontrollu demo baglaminda goster

App'in calismasi icin mevcut kritik env bagimliliklari:

- Firebase web config
- Firebase Admin config
- KIE API key
- Opsiyonel LemonSqueezy checkout URL ve webhook env'leri
- Opsiyonel Mixpanel token

Deploy oncesi minimum kontrol:

- `npm run build`
- `/api/ping` saglik kontrolu
- `/?id=<garmentId>` urun sayfasi acilisi
- En az bir merchant urunu ile QR akisi testi

## 10. Landing Page'de Kullanilabilecek Ozellik Listesi

Bu listeyi section, feature grid veya comparison kartlarinda kullanabilirsin.

### Merchant-facing feature bullets

- Her urun icin QR ve deep link
- Yazdirilabilir QR etiketi
- Butige ozel profil, logo ve iletisim alanlari
- Urun bazli fiyat, aciklama ve shop URL
- Sonuctan satin alma veya WhatsApp CTA
- Kredi bazli kullanim modeli
- Economy / balanced / premium AI secenekleri
- Multi-tenant butik envanteri
- Demo ve pilot kurulum mantigi

### Customer-facing feature bullets

- Uygulama indirmeden giris
- Mobil fotograf yukleme
- Try-on sonucu gorme
- Sonuc indirme ve paylasma
- Favoriler
- Deneme gecmisi
- Kesfet akisi
- Google veya e-posta ile hesap
- Kullanici kredi cuzdani

## 11. Sitede Kullanilmamasi Gereken veya Temkinli Kullanilacak Iddialar

Kullanma:

- "Tamamen kusursuz gercekci sanal prova"
- "Tum markalar icin hazir enterprise platform"
- "Detayli magaza analitigi hazir"
- "Apple girisi aktif"
- "Olgun marketplace altyapisi"

Temkinli kullan:

- "Canli AI sonuc"
- "Aninda satin alma donusumu"
- "Olceklenebilir SaaS"

Bunlar ancak pilot ve production dogrulamalari daha guclu hale geldikce daha sert yazilabilir.

## 12. Onerilen Sonraki Adimlar

1. Claude Code'da bu dokumana gore landing page section tree cikar
2. Hero, problem, nasil calisir, faydalar, paketler, SSS ve final CTA bloklarini tasarla
3. CTA hedefini netlestir: form mu, WhatsApp mi, takvim mi?
4. Kod uygulamasinda once statik marketing page'i kur
5. Sonra gercek ekran goruntuleri, QR ornekleri ve demo asset'leri yerlestir

## 13. Tek Cumlelik Son Ozet

Mirrorly bugun en guclu sekilde, "butiklerin urunlerini QR ile acilan mobil AI try-on deneyimine donusturen pilot hazir arayuz" olarak konumlandirilmalidir.
