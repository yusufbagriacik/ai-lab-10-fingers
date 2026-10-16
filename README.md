# Yazı Lab – 10FastFingers benzeri yazma uygulaması

- Kullanıcı girişi (kullanıcı adı + şifre), 30/60/120 sn test, WPM ve doğruluk
- Herkesin görebildiği liderlik tablosu (bugün / hafta / tümü)
- Her kullanıcı için hata ısı haritası (klavye üzerinde, hangi harfte çok hata yapıyor)
- Hoca paneli: tüm öğrenciler, gelişim (ilk 5 test → son 5 test), zayıf harfler, öğrenci detayı, sınıf ısı haritası

## Hemen dene (yerel mod)
`index.html` dosyasını tarayıcıda aç. Veriler sadece o tarayıcıda durur. Kullanıcı adı `teacher` olarak kayıt olursan hoca paneli açılır.

## Ortak kullanım: Firebase kurulumu (ücretsiz, ~5 dk)
1. https://console.firebase.google.com → **Proje ekle**.
2. **Build → Authentication → Sign-in method → E-posta/Parola** aç.
3. **Build → Firestore Database → Veritabanı oluştur** (production modu).
4. **Firestore → Rules** sekmesine şunu yapıştır ve Yayınla:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == uid && request.resource.data.role == 'student';
    }
    match /results/{id} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }
  }
}
```
5. **Proje ayarları → Genel → Web uygulaması ekle (</>)** → çıkan `firebaseConfig` değerlerini `firebase-config.js` içine yaz.
6. Hoca hesabı: uygulamada normal kayıt ol, sonra Firestore → `users` → kendi belgen → `role` alanını `teacher` yap.
   (Rol sadece konsoldan değiştirilebilir, öğrenciler kendini hoca yapamaz.)

## GitHub Pages ile yayınlama
```
cd ~/Desktop/yazi-lab
git init && git add . && git commit -m "Yazı Lab"
git branch -M main
git remote add origin https://github.com/KULLANICI/yazi-lab.git
git push -u origin main
```
Repo → **Settings → Pages → Branch: main / root** → Kaydet. Adres: `https://KULLANICI.github.io/yazi-lab/`
(Firebase → Authentication → Settings → Authorized domains listesine `KULLANICI.github.io` ekle.)

Not: Firebase `apiKey` gizli değildir, repoda durması normaldir; güvenliği yukarıdaki kurallar sağlar.
