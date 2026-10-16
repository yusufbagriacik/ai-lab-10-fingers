/* Settings (language, theme, words, keyboard) + EN/TR translations.
   Strings in the code are written in English; T("English text") returns the Turkish
   version when the language is Turkish. {name} placeholders are filled from the 2nd argument. */
const SETTINGS = Object.assign({ lang: "en", theme: "auto", words: "en", kb: "us" },
  (() => { try { return JSON.parse(localStorage.getItem("tl_settings")) || {}; } catch (e) { return {}; } })());
let LANG = SETTINGS.lang === "tr" ? "tr" : "en";

const HTML_I18N = {
  rankNote: {
    en: 'Ranked by <b>score = WPM × accuracy</b> (best test in the selected period). Accuracy matters: 60 WPM at 90% scores 54.',
    tr: '<b>Puan = WPM × doğruluk</b> değerine göre sıralanır (seçili dönemdeki en iyi test). Doğruluk önemlidir: %90 doğrulukla 60 WPM = 54 puan.',
  },
};

const I18N = { tr: {
  /* header, login */
  "Test": "Test", "Learn": "Öğren", "Leaderboard": "Liderlik", "My Heatmap": "Isı Haritam", "Teacher Panel": "Hoca Paneli", "Log out": "Çıkış",
  "Log in": "Giriş yap", "Sign up": "Kayıt ol", "Username": "Kullanıcı adı", "PIN (4-6 digits)": "PIN (4-6 hane)", "e.g. 4821": "örn. 4821",
  'Spaces and capital letters in the username are ignored, so "Yusuf " and "yusuf" are the same account.': 'Kullanıcı adındaki boşluklar ve büyük harfler dikkate alınmaz; "Yusuf " ile "yusuf" aynı hesaptır.',
  "No account? Sign up": "Hesabın yok mu? Kayıt ol", "I already have an account": "Zaten hesabım var",
  "teacher": "hoca", "Something went wrong.": "Bir hata oluştu.",
  "Username already taken.": "Bu kullanıcı adı alınmış.", "User not found.": "Kullanıcı bulunamadı.",
  "Wrong username or password.": "Kullanıcı adı veya PIN yanlış.", "Wrong password.": "PIN yanlış.", "PIN must be 4-6 digits.": "PIN 4-6 haneli olmalı.",
  "Username: 3-20 letters, digits or _ (no spaces).": "Kullanıcı adı: 3-20 harf, rakam veya _ (boşluk yok).",
  "PIN must be 4 to 6 digits (numbers only).": "PIN 4 ile 6 hane arası olmalı (sadece rakam).",
  "Local mode: data stays in this browser only. Fill in firebase-config.js for shared use (see README). In local mode the username 'teacher' becomes the teacher.": "Yerel mod: veriler sadece bu tarayıcıda durur. Ortak kullanım için firebase-config.js dosyasını doldur (README). Yerel modda 'teacher' kullanıcı adı hoca olur.",
  /* test */
  "sec": "sn", "% accuracy": "% doğruluk", "Duration": "Süre", "30 sec": "30 sn", "60 sec": "60 sn", "120 sec": "120 sn",
  "Just start typing, the timer starts with your first key. Press Space after each word.": "Yazmaya başla, süre ilk tuşla başlar. Her kelimeden sonra Boşluk tuşuna bas.",
  "Restart": "Yeniden başla", "Result": "Sonuç", "correct words": "doğru kelime", "wrong words": "yanlış kelime",
  "Most missed letters:": "En çok hata yaptığın harfler:", "No letter errors, great job!": "Hiç harf hatası yok, harika!",
  "Raw WPM (all keystrokes, errors included): {raw} · Net WPM (correct letters): {wpm} · Wrong words: {bad}": "Ham WPM (hatalar dahil tüm tuşlar): {raw} · Net WPM (doğru harfler): {wpm} · Yanlış kelime: {bad}",
  "Score: {score} (WPM × accuracy) · +{pts} practice points": "Puan: {score} (WPM × doğruluk) · +{pts} çalışma puanı",
  "🏆 New personal best!": "🏆 Yeni kişisel rekor!", "Personal best: {n} WPM": "Kişisel rekorun: {n} WPM", "Could not save result:": "Sonuç kaydedilemedi:",
  /* heatmap, charts */
  "{c}: {e} errors / {t} presses": "{c}: {e} hata / {t} basış",
  "Green = few errors · Red = many errors · Gray = not enough data": "Yeşil = az hata · Kırmızı = çok hata · Gri = yeterli veri yok",
  "{c} ({pct}% errors, {n} times)": "{c} (%{pct} hata, {n} kez)", "Letters to practice:": "Çalışılması gereken harfler:", "Not enough data yet.": "Henüz yeterli veri yok.",
  "At least 2 tests are needed for a chart.": "Grafik için en az 2 test gerekli.",
  "{h}h {m}m": "{h}sa {m}dk", "{m}m": "{m}dk",
  /* learn */
  "← All lessons": "← Tüm dersler", "% done": "% tamam", "space": "boşluk",
  "Touch-typing lessons": "On parmak yazma dersleri",
  "Learn which finger presses which key. Finish a lesson with at least 90% accuracy to pass it. New to typing? Start at lesson 1.": "Hangi parmağın hangi tuşa bastığını öğren. Bir dersi geçmek için en az %90 doğrulukla bitir. Yazmaya yeni mi başlıyorsun? 1. dersten başla.",
  "Keys:": "Tuşlar:", "All letters": "Tüm harfler", "Lesson {n}: {title}": "Ders {n}: {title}",
  "Press <b>SPACE</b> with either thumb": "<b>BOŞLUK</b> tuşuna herhangi bir başparmağınla bas",
  "Press <b>{key}</b> with your <b>{finger}</b>": "<b>{key}</b> tuşuna <b>{finger}</b> ile bas",
  "left pinky": "sol serçe parmağın", "left ring finger": "sol yüzük parmağın", "left middle finger": "sol orta parmağın", "left index finger": "sol işaret parmağın",
  "right index finger": "sağ işaret parmağın", "right middle finger": "sağ orta parmağın", "right ring finger": "sağ yüzük parmağın", "right pinky": "sağ serçe parmağın",
  "🎉 Lesson passed!": "🎉 Ders geçildi!", "Almost there": "Neredeyse oldu",
  "{acc}% accuracy · {wpm} WPM · {secs}s · +{pts} points": "%{acc} doğruluk · {wpm} WPM · {secs} sn · +{pts} puan",
  "You need at least 90% accuracy to pass. Slow down a little and try again.": "Geçmek için en az %90 doğruluk gerekir. Biraz yavaşla ve tekrar dene.",
  "Try again": "Tekrar dene", "Next lesson →": "Sonraki ders →", "Could not save:": "Kaydedilemedi:",
  "Home row: left hand": "Ana sıra: sol el", "Home row: right hand": "Ana sıra: sağ el", "Index fingers reach": "İşaret parmakları uzanır",
  "Middle fingers up": "Orta parmaklar yukarı", "Index fingers up": "İşaret parmakları yukarı", "More index keys": "Diğer işaret parmağı tuşları",
  "Ring fingers up": "Yüzük parmakları yukarı", "Pinkies up": "Serçe parmaklar", "Bottom row: index fingers": "Alt sıra: işaret parmakları",
  "Bottom row: the rest": "Alt sıra: kalanlar", "Real words": "Gerçek kelimeler",
  "Reach with the highlighted finger, press the key, then bring the finger straight back to the home row. Look at the screen, not at your hands.": "Vurgulanan parmakla uzan, tuşa bas, sonra parmağını doğrudan ana sıraya geri getir. Ellerine değil ekrana bak.",
  "Rest your left fingers on A S D F (pinky on A, index on F). The small bump on F helps you find it without looking.": "Sol parmaklarını A S D F üzerine koy (serçe A'da, işaret parmağı F'de). F'deki küçük çıkıntı bakmadan bulmana yardım eder.",
  "Rest your right fingers on J K L ; (index on J, pinky on ;). The small bump on J helps you find it.": "Sağ parmaklarını J K L ; üzerine koy (işaret parmağı J'de, serçe ;'de). J'deki küçük çıkıntı yerini bulmana yardım eder.",
  "Rest your right fingers on J K L Ş (index on J, pinky on Ş). The small bump on J helps you find it.": "Sağ parmaklarını J K L Ş üzerine koy (işaret parmağı J'de, serçe Ş'de). J'deki küçük çıkıntı yerini bulmana yardım eder.",
  "G is typed with the left index finger, H with the right index finger. Both reach one key to the side.": "G sol işaret parmağıyla, H sağ işaret parmağıyla yazılır. İkisi de yana bir tuş uzanır.",
  "T and Y are also typed with the index fingers. Reach across, then return to F and J.": "T ve Y de işaret parmaklarıyla yazılır. Uzan, sonra F ve J'ye geri dön.",
  "Curl your index fingers down to the bottom row, then return them to F and J.": "İşaret parmaklarını alt sıraya kıvır, sonra F ve J'ye geri getir.",
  "Everything together. Keep your rhythm steady; accuracy first, speed will follow.": "Hepsi bir arada. Ritmini sabit tut; önce doğruluk, hız arkasından gelir.",
  /* leaderboard */
  "Rankings": "Sıralama", "All time": "Tüm zamanlar", "This week": "Bu hafta", "Today": "Bugün",
  "Most practice": "En çok çalışanlar",
  "Practice points reward time spent: 10 points per minute, ×1.2 at 90%+ accuracy, ×1.5 at 95%+, and +10 for every lesson passed. Tests and lessons both count.": "Çalışma puanı harcanan zamanı ödüllendirir: dakikada 10 puan, %90+ doğrulukta ×1.2, %95+ doğrulukta ×1.5 ve geçilen her ders için +10. Testler ve dersler birlikte sayılır.",
  "Recent attempts": "Son denemeler",
  "User": "Kullanıcı", "Best score": "En iyi puan", "WPM": "WPM", "Accuracy": "Doğruluk", "Latest WPM": "Son WPM", "Tests": "Test",
  "No results yet.": "Henüz sonuç yok.", "Points": "Puan", "Time practiced": "Çalışma süresi", "Lessons passed": "Geçilen ders", "Active days": "Aktif gün",
  "No practice yet.": "Henüz çalışma yok.", "When": "Zaman", "Score": "Puan",
  /* my heatmap */
  "My most missed letters": "En çok hata yaptığım harfler", "Red = high error rate on that letter. Number = total errors.": "Kırmızı = o harfte hata oranı yüksek. Sayı = toplam hata sayısı.",
  "My progress (WPM)": "Gelişimim (WPM)",
  /* teacher */
  "Student Progress": "Öğrenci İlerlemesi",
  'Sorted by practice points (time and effort). Click a row for details. "Progress" = average of first 5 tests → average of last 5 tests.': 'Çalışma puanına göre sıralı (zaman ve emek). Ayrıntı için bir satıra tıkla. "Gelişim" = ilk 5 testin ortalaması → son 5 testin ortalaması.',
  "Class-wide error heatmap": "Sınıf geneli hata ısı haritası",
  "Student": "Öğrenci", "Time": "Süre", "Lessons": "Dersler", "Progress": "Gelişim", "Weak letters": "Zayıf harfler", "Last active": "Son aktif",
  "Clear scores": "Skorları sil", "Remove": "Kaldır", "No students yet.": "Henüz öğrenci yok.", "{name} – details": "{name} – ayrıntılar",
  'Remove student "{name}" and ALL of their scores and lessons?\n\nThis cannot be undone.': '"{name}" öğrencisini ve TÜM skorlarını ve derslerini kaldır?\n\nBu işlem geri alınamaz.',
  'Delete ALL scores and lesson progress of "{name}"?\n\nThis cannot be undone.': '"{name}" öğrencisinin TÜM skorlarını ve ders ilerlemesini sil?\n\nBu işlem geri alınamaz.',
  "Could not delete:": "Silinemedi:", "If this says 'permissions', update the Firestore rules (see README).": "Hata 'permissions' diyorsa Firestore kurallarını güncelle (README).",
  /* settings */
  "Settings": "Ayarlar", "Language": "Dil", "Theme": "Tema", "Auto": "Otomatik", "Light": "Aydınlık", "Dark": "Karanlık",
  "Typing words": "Yazılacak kelimeler", "Keyboard": "Klavye", "US QWERTY": "ABD QWERTY", "Turkish Q": "Türkçe Q",
  "Turkish words need a Turkish Q keyboard to type ç ğ ı ö ş ü.": "Türkçe kelimelerdeki ç ğ ı ö ş ü harflerini yazmak için Türkçe Q klavye gerekir.",
  "Changing language, words or keyboard restarts the current test.": "Dil, kelime veya klavye değişince geçerli test yeniden başlar.",
  "Settings are saved in this browser.": "Ayarlar bu tarayıcıda saklanır.",
} };

function T(s, p) {
  let o = (LANG === "tr" && I18N.tr[s]) || s;
  return p ? o.replace(/\{(\w+)\}/g, (_, k) => (p[k] ?? "")) : o;
}

/* --- static HTML text: collect translatable text nodes/attributes once, re-apply on change --- */
const _nodes = [], _attrs = [];
(function collect() {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    if (n.parentNode.closest("script,style,[data-i18n]")) continue;
    const key = n.nodeValue.trim();
    if (key && I18N.tr[key]) _nodes.push({ n, orig: n.nodeValue, key });
  }
  document.querySelectorAll("[placeholder],[title],[aria-label]").forEach(e => ["placeholder", "title", "aria-label"].forEach(a => {
    const v = e.getAttribute(a); if (v && I18N.tr[v]) _attrs.push({ e, a, orig: v });
  }));
})();
function applyStatic() {
  _nodes.forEach(s => { s.n.nodeValue = LANG === "tr" ? s.orig.replace(s.key, () => I18N.tr[s.key]) : s.orig; });
  _attrs.forEach(s => s.e.setAttribute(s.a, T(s.orig)));
  document.querySelectorAll("[data-i18n]").forEach(e => { e.innerHTML = HTML_I18N[e.dataset.i18n][LANG]; });
  document.documentElement.lang = LANG;
}

/* --- settings panel --- */
function saveSettings() { try { localStorage.setItem("tl_settings", JSON.stringify(SETTINGS)); } catch (e) {} }
function applyTheme() {
  if (SETTINGS.theme === "light" || SETTINGS.theme === "dark") document.documentElement.dataset.theme = SETTINGS.theme;
  else delete document.documentElement.dataset.theme;
}
function syncSettingsUI() {
  document.querySelectorAll("#settingsPanel .seg").forEach(seg => seg.querySelectorAll("button").forEach(b =>
    b.classList.toggle("on", SETTINGS[seg.dataset.key] === b.dataset.val)));
}
(function initSettings() {
  const panel = document.getElementById("settingsPanel"), btn = document.getElementById("settingsBtn");
  btn.onclick = e => { e.stopPropagation(); panel.hidden = !panel.hidden; };
  document.addEventListener("click", e => { if (!panel.hidden && !panel.contains(e.target)) panel.hidden = true; });
  document.addEventListener("keydown", e => { if (e.key === "Escape") panel.hidden = true; });
  panel.querySelectorAll(".seg button").forEach(b => b.onclick = () => {
    const key = b.parentNode.dataset.key;
    SETTINGS[key] = b.dataset.val; saveSettings(); syncSettingsUI();
    if (key === "lang") { LANG = SETTINGS.lang === "tr" ? "tr" : "en"; applyStatic(); }
    if (key === "theme") applyTheme();
    if (window.onSettingsChange) window.onSettingsChange(key);
  });
  applyTheme(); syncSettingsUI(); applyStatic();
})();
