const $ = id => document.getElementById(id);
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
let user = null, registering = false;

/* ---------- Giriş ---------- */
const ERR = {
  "auth/email-already-in-use": "Username already taken.",
  "auth/user-not-found": "User not found.", "auth/invalid-credential": "Wrong username or password.",
  "auth/wrong-password": "Wrong password.", "auth/weak-password": "PIN must be 4-6 digits.",
};
$("authToggle").onclick = e => {
  e.preventDefault(); registering = !registering;
  $("authTitle").textContent = $("authSubmit").textContent = registering ? "Sign up" : "Log in";
  $("authToggle").textContent = registering ? "I already have an account" : "No account? Sign up";
  $("authError").textContent = "";
};
$("password").addEventListener("input", e => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6); });
$("authForm").onsubmit = async e => {
  e.preventDefault(); $("authError").textContent = "";
  try {
    const u = DB.cleanUsername($("username").value), p = $("password").value.trim();
    $("username").value = u;
    if (!/^[a-z0-9_]{3,20}$/.test(u)) return void ($("authError").textContent = "Username: 3-20 letters, digits or _ (no spaces).");
    if (!/^\d{4,6}$/.test(p)) return void ($("authError").textContent = "PIN must be 4 to 6 digits (numbers only).");
    enter(registering ? await DB.register(u, p) : await DB.login(u, p));
  } catch (err) { $("authError").textContent = ERR[err.code] || err.message || "Something went wrong."; }
};
$("logout").onclick = async () => { await DB.logout(); location.reload(); };

function enter(u) {
  user = u;
  $("view-auth").hidden = true; $("nav").hidden = false; $("userbox").hidden = false;
  $("whoami").textContent = u.username + (u.role === "teacher" ? " (teacher)" : "");
  $("teacherTab").hidden = u.role !== "teacher";
  show("test");
}

/* ---------- Sekmeler ---------- */
document.querySelectorAll("nav button").forEach(b => b.onclick = () => show(b.dataset.tab));
function show(tab) {
  document.querySelectorAll("nav button").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  ["test", "learn", "board", "me", "teacher"].forEach(t => $("view-" + t).hidden = t !== tab);
  if (tab === "test") resetTest();
  if (tab === "learn") renderLearn();
  if (tab === "board") renderBoard();
  if (tab === "me") renderMe();
  if (tab === "teacher") renderTeacher();
}

/* ---------- Yazma testi ---------- */
let words, wi, started, startT, timer, left, dur;
let errs, tots, okWords, badWords, okChars, keys, wrongKeys, finished;
const el = { words: $("words"), inp: $("typing") };

function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
function resetTest() {
  clearInterval(timer);
  dur = +$("duration").value; left = dur;
  words = []; while (words.length < 350) words.push(...shuffle(WORDS));
  wi = 0; started = finished = false;
  errs = {}; tots = {}; okWords = badWords = okChars = keys = wrongKeys = 0;
  el.words.innerHTML = words.map((w, i) => `<span class="w" id="w${i}">${[...w].map(c => `<span class="c">${c}</span>`).join("")}</span>`).join(" ");
  el.words.scrollTop = 0; $("w0").classList.add("cur");
  el.inp.value = ""; el.inp.disabled = false; el.inp.focus();
  $("result").hidden = true; live();
}
$("restart").onclick = resetTest;
// the input is invisible: clicking the words, or just typing anywhere on the test page, focuses it
el.words.onclick = () => el.inp.focus();
document.addEventListener("keydown", e => {
  if ($("view-test").hidden || el.inp.disabled || document.activeElement === el.inp) return;
  if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
  if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
  el.inp.focus();
});
$("duration").onchange = resetTest;

function matchChars(w, v) { let n = 0; for (let i = 0; i < v.length && i < w.length; i++) if (v[i] === w[i]) n++; return n; }
// correct characters of the word currently being typed (counted too, so the last word isn't lost)
function partialChars() {
  if (finished || !words) return 0;
  const w = words[wi], v = el.inp.value; let n = 0;
  for (let i = 0; i < v.length && i < w.length; i++) if (v[i] === w[i]) n++;
  return n;
}
function live() {
  $("liveTime").textContent = left;
  const mins = started ? Math.max((Date.now() - startT) / 60000, 1 / 600) : 1;
  $("liveWpm").textContent = started ? Math.round((okChars + partialChars()) / 5 / mins) : 0;
  $("liveAcc").textContent = keys ? Math.round((keys - wrongKeys) / keys * 100) : 100;
}
function shake(t) { t.classList.remove("shake"); void t.offsetWidth; t.classList.add("shake"); }
function paintCur() {
  const w = words[wi], typed = el.inp.value, spans = $("w" + wi).children;
  const cur = $("w" + wi);
  cur.querySelectorAll(".extra").forEach(x => x.remove());
  for (let i = 0; i < w.length; i++)
    spans[i].className = "c" + (i < typed.length ? (typed[i] === w[i] ? " right" : " wrong") : "");
  // extra letters typed beyond the end of the word are shown right in the word (in red)
  for (let i = w.length; i < typed.length; i++) {
    const x = document.createElement("span"); x.className = "c wrong extra"; x.textContent = typed[i]; cur.appendChild(x);
  }
}
el.inp.addEventListener("input", e => {
  if (finished) return;
  if (!started) { started = true; startT = Date.now(); timer = setInterval(tick, 250); }
  const v = el.inp.value;
  if (e.inputType === "insertText" && v.length) {
    const i = v.length - 1, exp = words[wi][i];
    keys++;
    let wrong = false;
    if (exp) { tots[exp] = (tots[exp] || 0) + 1; if (v[i] !== exp) { errs[exp] = (errs[exp] || 0) + 1; wrongKeys++; wrong = true; } }
    else { wrongKeys++; wrong = true; }
    if (wrong) shake(el.words);
  }
  paintCur();
});
el.inp.addEventListener("keydown", e => {
  if (e.key !== " ") return;
  e.preventDefault();
  const v = el.inp.value.trim(); if (!v || finished) return;
  const cur = $("w" + wi), ok = v === words[wi];
  cur.classList.remove("cur"); cur.classList.add(ok ? "ok" : "bad");
  if (ok) { okWords++; okChars += words[wi].length + 1; }
  else { badWords++; okChars += matchChars(words[wi], v); } // a typo no longer wipes out the whole word
  wi++; el.inp.value = ""; $("w" + wi).classList.add("cur");
  el.words.scrollTop = $("w" + wi).offsetTop - 4; // current line becomes the top line
});
function tick() {
  left = Math.max(0, dur - Math.floor((Date.now() - startT) / 1000));
  live(); if (left <= 0) finish();
}
async function finish() {
  const extra = partialChars();
  finished = true; clearInterval(timer); el.inp.disabled = true;
  const wpm = Math.round((okChars + extra) / 5 / (dur / 60));
  const acc = keys ? Math.round((keys - wrongKeys) / keys * 100) : 0;
  $("liveWpm").textContent = wpm;
  $("rWpm").textContent = wpm; $("rAcc").textContent = acc; $("rOk").textContent = okWords; $("rBad").textContent = badWords;
  const worst = topErrors(errs, tots, 3);
  $("rWorst").textContent = worst.length ? "Most missed letters: " + worst.map(x => x.ch.toUpperCase() + " (" + x.e + ")").join(", ") : "No letter errors, great job!";
  const raw = Math.round((keys + okWords + badWords) / 5 / (dur / 60));
  $("rRaw").textContent = `Raw WPM (all keystrokes, errors included): ${raw} · Net WPM (correct letters): ${wpm} · Wrong words: ${badWords}`;
  const earned = xpOf({ dur, acc, lesson: 0 });
  $("rScore").textContent = `Score: ${Math.round(wpm * acc / 100)} (WPM × accuracy) · +${earned} practice points`;
  $("rBest").textContent = "";
  $("result").hidden = false;
  if (!keys) return;
  const r = { uid: user.id, username: user.username, wpm, acc, ok: okWords, bad: badWords, dur, errs, tots, date: Date.now() };
  try {
    await DB.saveResult(r);
    const mine = (await DB.results()).filter(x => x.uid === user.id && isTest(x)).map(x => x.wpm);
    const best = Math.max(...mine);
    $("rBest").textContent = wpm >= best ? "🏆 New personal best!" : "Personal best: " + best + " WPM";
  } catch (e) { $("rBest").textContent = "Could not save result: " + (e.message || e); }
}

/* ---------- Yardımcılar ---------- */
function topErrors(errs, tots, n, minTotal = 1) {
  return Object.keys(errs).map(ch => ({ ch, e: errs[ch], t: tots[ch] || 0, rate: errs[ch] / Math.max(tots[ch] || 1, 1) }))
    .filter(x => x.t >= minTotal).sort((a, b) => b.e - a.e).slice(0, n);
}
function sumRes(list) {
  const errs = {}, tots = {};
  list.forEach(r => { for (const c in r.errs || {}) errs[c] = (errs[c] || 0) + r.errs[c]; for (const c in r.tots || {}) tots[c] = (tots[c] || 0) + r.tots[c]; });
  return { errs, tots };
}
function heatmap(target, errs, tots) {
  const rates = Object.keys(tots).filter(c => tots[c] >= 5).map(c => (errs[c] || 0) / tots[c]);
  const max = Math.max(...rates, 0.0001);
  const key = c => {
    const t = tots[c] || 0, e = errs[c] || 0;
    let style = "";
    if (t >= 5) { const k = Math.min((e / t) / max, 1); style = `background:hsl(${Math.round(130 * (1 - k))},65%,${38 + 4 * k}%)`; }
    return `<div class="key" style="${style}" title="${c.toUpperCase()}: ${e} errors / ${t} presses">${c}<small>${e ? e : ""}</small></div>`;
  };
  target.innerHTML = `<div class="kb">${ROWS.map(r => `<div class="kr">${[...r].map(key).join("")}</div>`).join("")}</div>
    <p class="muted" style="text-align:center">Green = few errors · Red = many errors · Gray = not enough data</p>`;
}
function workText(errs, tots) {
  const w = topErrors(errs, tots, 5, 5).map(x => `${x.ch.toUpperCase()} (${Math.round(x.rate * 100)}% errors, ${x.e} times)`);
  return w.length ? "Letters to practice: " + w.join(" · ") : "Not enough data yet.";
}
function chart(points) {
  if (points.length < 2) return '<p class="muted">At least 2 tests are needed for a chart.</p>';
  const W = 700, H = 180, P = 28, max = Math.max(...points, 10) * 1.1;
  const x = i => P + i * (W - 2 * P) / (points.length - 1), y = v => H - P - v / max * (H - 2 * P);
  const d = points.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%"><path d="${d}" fill="none" stroke="#f5b942" stroke-width="2.5"/>
    ${points.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="3.5" fill="#f5b942"><title>${v} WPM</title></circle>`).join("")}
    <text x="4" y="${y(max / 1.1)}" fill="#8b95a3" font-size="11">${Math.round(max / 1.1)}</text><text x="4" y="${H - P}" fill="#8b95a3" font-size="11">0</text></svg>`;
}
const isTest = r => !r.lesson;
// Skill score: speed weighted by accuracy (60 WPM at 100% = 60, 60 WPM at 90% = 54)
const scoreOf = r => Math.round(r.wpm * r.acc / 100);
// Practice points: 10 points per minute practiced, x1.2 at 90%+ accuracy, x1.5 at 95%+, +10 for passing a lesson
const xpOf = r => Math.round(Math.max(1, (r.dur || 0) / 6) * (r.acc >= 95 ? 1.5 : r.acc >= 90 ? 1.2 : 1)) + (r.lesson && r.passed ? 10 : 0);
const fmtTime = sec => { const m = Math.round(sec / 60); return m >= 60 ? Math.floor(m / 60) + "h " + (m % 60) + "m" : m + "m"; };
const avg = a => a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- Learn: touch-typing lessons ---------- */
const FINGERS = { lp: "left pinky", lr: "left ring finger", lm: "left middle finger", li: "left index finger", lt: "left thumb", rt: "right thumb", ri: "right index finger", rm: "right middle finger", rr: "right ring finger", rp: "right pinky" };
const FCOL = { lp: "#ef9a9a", lr: "#ffcc80", lm: "#fff59d", li: "#a5d6a7", ri: "#80deea", rm: "#90caf9", rr: "#b39ddb", rp: "#f48fb1", lt: "#cfd8dc", rt: "#cfd8dc" };
const FINGER_OF = {};
[["lp", "qaz"], ["lr", "wsx"], ["lm", "edc"], ["li", "rfvtgb"], ["ri", "yhnujm"], ["rm", "ik,"], ["rr", "ol."], ["rp", "p;"]].forEach(([f, cs]) => [...cs].forEach(c => FINGER_OF[c] = f));
const LROWS = ["qwertyuiop", "asdfghjkl;", "zxcvbnm,."];
const GENERIC_TIP = "Reach with the highlighted finger, press the key, then bring the finger straight back to the home row. Look at the screen, not at your hands.";
const LESSONS = [
  { title: "Home row: left hand", keys: "asdf", tip: "Rest your left fingers on A S D F (pinky on A, index on F). The small bump on F helps you find it without looking." },
  { title: "Home row: right hand", keys: "jkl;", tip: "Rest your right fingers on J K L ; (index on J, pinky on ;). The small bump on J helps you find it." },
  { title: "Index fingers reach", keys: "gh", tip: "G is typed with the left index finger, H with the right index finger. Both reach one key to the side." },
  { title: "Middle fingers up", keys: "ei", tip: GENERIC_TIP },
  { title: "Index fingers up", keys: "ru", tip: GENERIC_TIP },
  { title: "More index keys", keys: "ty", tip: "T and Y are also typed with the index fingers. Reach across, then return to F and J." },
  { title: "Ring fingers up", keys: "ow", tip: GENERIC_TIP },
  { title: "Pinkies up", keys: "qp", tip: GENERIC_TIP },
  { title: "Bottom row: index fingers", keys: "vbnm", tip: "Curl your index fingers down to the bottom row, then return them to F and J." },
  { title: "Bottom row: the rest", keys: "cxz,.", tip: GENERIC_TIP },
  { title: "Real words", keys: "", tip: "Everything together. Keep your rhythm steady; accuracy first, speed will follow." },
];
let lsn = null;
const passedSet = new Set();

function lessonKnown(i) { return LESSONS.slice(0, i + 1).map(l => l.keys).join("") || "abcdefghijklmnopqrstuvwxyz"; }
function makeDrill(i) {
  const L = LESSONS[i], known = [...lessonKnown(i)], fresh = L.keys ? [...L.keys] : known;
  const pick = a => a[Math.random() * a.length | 0];
  let items = [];
  if (i === LESSONS.length - 1) items = shuffle(WORDS).slice(0, 14);
  else {
    items = shuffle(WORDS.filter(w => [...w].every(c => known.includes(c)) && [...w].some(c => fresh.includes(c)))).slice(0, 5);
    while (items.join(" ").length < 55) {
      const n = 2 + (Math.random() * 4 | 0); let w = "";
      for (let k = 0; k < n; k++) w += Math.random() < 0.6 ? pick(fresh) : pick(known);
      if (![...w].some(c => fresh.includes(c))) w = w.slice(0, -1) + pick(fresh);
      items.push(w);
    }
    items = shuffle(items);
  }
  return items.join(" ");
}
async function renderLearn() {
  $("lessonPane").hidden = true; $("lessonList").hidden = false; lsn = null;
  passedSet.clear();
  try { (await DB.results()).filter(r => r.uid === user.id && r.lesson && r.passed).forEach(r => passedSet.add(r.lesson)); } catch (e) {}
  const next = LESSONS.findIndex((_, i) => !passedSet.has(i + 1));
  $("lessonList").innerHTML = `<h2>Touch-typing lessons</h2><p class="muted">Learn which finger presses which key. Finish a lesson with at least 90% accuracy to pass it. New to typing? Start at lesson 1.</p>
    <div class="lessons">${LESSONS.map((l, i) => `<button class="lbtn ${passedSet.has(i + 1) ? "passed" : ""} ${i === next ? "next" : ""}" data-i="${i}"><b>${passedSet.has(i + 1) ? "✓ " : ""}${i + 1}. ${l.title}</b><small>${l.keys ? "Keys: " + [...l.keys].join(" ").toUpperCase() : "All letters"}</small></button>`).join("")}</div>`;
  document.querySelectorAll(".lbtn").forEach(b => b.onclick = () => startLesson(+b.dataset.i));
}
function handsSVG(active) {
  const L = { lp: [10, 62, 28, 56], lr: [44, 38, 30, 80], lm: [80, 26, 32, 92], li: [116, 38, 30, 80], lt: [150, 112, 46, 26] };
  const mir = ([x, y, w, h]) => [440 - (x + w), y, w, h], M = { lp: "rp", lr: "rr", lm: "rm", li: "ri", lt: "rt" };
  const rect = (f, [x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h + (f.endsWith("t") ? 0 : 50)}" rx="14" fill="${active.includes(f) ? FCOL[f] : "#8a93a0"}" opacity="${active.includes(f) ? 1 : .35}" stroke="${active.includes(f) ? "#222" : "none"}" stroke-width="2"/>`;
  let out = `<rect x="6" y="110" width="150" height="58" rx="20" fill="#8a93a0" opacity=".25"/><rect x="284" y="110" width="150" height="58" rx="20" fill="#8a93a0" opacity=".25"/>`;
  for (const f in L) { out += rect(f, L[f]); out += rect(M[f], mir(L[f])); }
  return `<svg class="hands" viewBox="0 0 440 180">${out}</svg>`;
}
function lessonKb() {
  $("lsKb").innerHTML = `<div class="kb">${LROWS.map((r, i) => `<div class="kr" style="padding-left:${i * 14}px">${[...r].map(c => `<div class="key lk" data-k="${c}" style="background:${FCOL[FINGER_OF[c]]}">${c}</div>`).join("")}</div>`).join("")}
    <div class="kr"><div class="key lk space" data-k=" " style="background:${FCOL.lt}">space</div></div></div>`;
}
function startLesson(i) {
  lsn = { i, text: makeDrill(i), pos: 0, keys: 0, wrong: 0, errs: {}, tots: {}, start: 0, done: false };
  $("lessonList").hidden = true; $("lessonPane").hidden = false; $("lsResult").hidden = true;
  $("lsTitle").textContent = `Lesson ${i + 1}: ${LESSONS[i].title}`; $("lsTip").textContent = LESSONS[i].tip;
  $("lsText").innerHTML = [...lsn.text].map(c => c === " " ? '<span class="sp">␣</span>' : `<span>${c}</span>`).join("");
  lessonKb(); lessonUpdate();
}
function lessonUpdate() {
  const sp = $("lsText").children, k = lsn.text[lsn.pos];
  if (lsn.pos < sp.length) sp[lsn.pos].classList.add("cur");
  $("lsProg").textContent = Math.round(lsn.pos / lsn.text.length * 100);
  $("lsAcc").textContent = lsn.keys ? Math.round((lsn.keys - lsn.wrong) / lsn.keys * 100) : 100;
  const mins = lsn.start ? Math.max((Date.now() - lsn.start) / 60000, 1 / 600) : 0;
  $("lsWpm").textContent = mins ? Math.round(lsn.pos / 5 / mins) : 0;
  document.querySelectorAll("#lsKb .key").forEach(e => e.classList.toggle("target", !!k && e.dataset.k === k));
  if (!k) { $("lsHint").textContent = ""; $("lsHands").innerHTML = ""; return; }
  const f = k === " " ? null : FINGER_OF[k];
  $("lsHint").innerHTML = k === " " ? "Press <b>SPACE</b> with either thumb" : `Press <b>${k.toUpperCase()}</b> with your <b>${FINGERS[f]}</b>`;
  $("lsHands").innerHTML = handsSVG(k === " " ? ["lt", "rt"] : [f]);
}
document.addEventListener("keydown", e => {
  if (!lsn || lsn.done || $("view-learn").hidden || $("lessonPane").hidden) return;
  if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
  e.preventDefault();
  if (!lsn.start) lsn.start = Date.now();
  const exp = lsn.text[lsn.pos], k = e.key.toLowerCase();
  lsn.keys++; lsn.tots[exp] = (lsn.tots[exp] || 0) + 1;
  const sp = $("lsText").children;
  if (k === exp) { sp[lsn.pos].className = (exp === " " ? "sp " : "") + "d"; lsn.pos++; }
  else {
    lsn.wrong++; lsn.errs[exp] = (lsn.errs[exp] || 0) + 1;
    shake($("lsText"));
    const pk = [...document.querySelectorAll("#lsKb .key")].find(x => x.dataset.k === k);
    if (pk) { pk.classList.add("bad"); setTimeout(() => pk.classList.remove("bad"), 250); }
  }
  lessonUpdate();
  if (lsn.pos >= lsn.text.length) finishLesson();
});
async function finishLesson() {
  lsn.done = true;
  const secs = Math.round((Date.now() - lsn.start) / 1000), mins = Math.max((Date.now() - lsn.start) / 60000, 1 / 600);
  const acc = Math.round((lsn.keys - lsn.wrong) / lsn.keys * 100), wpm = Math.round(lsn.text.length / 5 / mins), passed = acc >= 90;
  const hasNext = lsn.i + 1 < LESSONS.length, cur = lsn.i;
  $("lsResult").hidden = false;
  $("lsResult").innerHTML = `<div class="lres"><h2>${passed ? "🎉 Lesson passed!" : "Almost there"}</h2>
    <p>${acc}% accuracy · ${wpm} WPM · ${secs}s · +${xpOf({ dur: secs, acc, lesson: 1, passed })} points ${passed ? "" : "<br>You need at least 90% accuracy to pass. Slow down a little and try again."}</p>
    <button class="primary" id="lsRetry">Try again</button>${passed && hasNext ? '<button class="primary" id="lsNext">Next lesson →</button>' : ""}</div>`;
  $("lsRetry").onclick = () => startLesson(cur);
  if ($("lsNext")) $("lsNext").onclick = () => startLesson(cur + 1);
  try { await DB.saveResult({ uid: user.id, username: user.username, lesson: cur + 1, passed, wpm, acc, dur: secs, errs: lsn.errs, tots: lsn.tots, date: Date.now() }); }
  catch (err) { $("lsResult").insertAdjacentHTML("beforeend", `<p class="muted">Could not save: ${esc(err.message || err)}</p>`); }
}
$("lsBack").onclick = renderLearn;

/* ---------- Liderlik ---------- */
$("boardRange").onchange = renderBoard;
async function renderBoard() {
  const range = $("boardRange").value, now = Date.now();
  const since = range === "today" ? new Date().setHours(0, 0, 0, 0) : range === "week" ? now - 7 * 864e5 : 0;
  const every = (await DB.results()).filter(r => r.date >= since).sort((a, b) => a.date - b.date);
  const all = every.filter(isTest), by = {};
  all.forEach(r => (by[r.username] ??= []).push(r));
  const when = d => new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const rows = Object.entries(by).map(([u, l]) => {
    const top = l.reduce((a, b) => scoreOf(b) > scoreOf(a) ? b : a), last = l[l.length - 1];
    return { u, top, score: scoreOf(top), last, n: l.length };
  }).sort((a, b) => b.score - a.score || b.top.wpm - a.top.wpm);
  const medal = i => ["🥇", "🥈", "🥉"][i] || i + 1;
  $("boardTable").innerHTML = "<tr><th>#</th><th>User</th><th>Best score</th><th>WPM</th><th>Accuracy</th><th>Latest WPM</th><th>Tests</th></tr>" +
    (rows.map((r, i) => `<tr class="${r.u === user.username ? "me" : ""}"><td>${medal(i)}</td><td>${esc(r.u)}</td><td><b>${r.score}</b></td>
      <td>${r.top.wpm}</td><td>${r.top.acc}%</td><td>${r.last.wpm} <span class="muted">${when(r.last.date)}</span></td><td>${r.n}</td></tr>`).join("") || '<tr><td colspan="7" class="muted">No results yet.</td></tr>');
  // practice leaderboard: who works the most (tests + lessons)
  const pr = {};
  every.forEach(r => { const p = (pr[r.username] ??= { xp: 0, sec: 0, tests: 0, lessons: new Set(), days: new Set() });
    p.xp += xpOf(r); p.sec += r.dur || 0; p.days.add(new Date(r.date).toDateString());
    if (isTest(r)) p.tests++; else if (r.passed) p.lessons.add(r.lesson); });
  const prow = Object.entries(pr).sort((a, b) => b[1].xp - a[1].xp);
  $("practiceTable").innerHTML = "<tr><th>#</th><th>User</th><th>Points</th><th>Time practiced</th><th>Tests</th><th>Lessons passed</th><th>Active days</th></tr>" +
    (prow.map(([u, p], i) => `<tr class="${u === user.username ? "me" : ""}"><td>${medal(i)}</td><td>${esc(u)}</td><td><b>${p.xp}</b></td><td>${fmtTime(p.sec)}</td><td>${p.tests}</td><td>${p.lessons.size}/${LESSONS.length}</td><td>${p.days.size}</td></tr>`).join("") || '<tr><td colspan="7" class="muted">No practice yet.</td></tr>');
  const recent = all.slice(-20).reverse();
  $("recentTable").innerHTML = "<tr><th>When</th><th>User</th><th>WPM</th><th>Accuracy</th><th>Score</th></tr>" +
    (recent.map(r => `<tr class="${r.username === user.username ? "me" : ""}"><td>${when(r.date)}</td><td>${esc(r.username)}</td><td>${r.wpm}</td><td>${r.acc}%</td><td><b>${scoreOf(r)}</b></td></tr>`).join("") || '<tr><td colspan="5" class="muted">No results yet.</td></tr>');
}

/* ---------- Benim ---------- */
async function renderMe() {
  const mine = (await DB.results()).filter(r => r.uid === user.id), s = sumRes(mine);
  heatmap($("myHeat"), s.errs, s.tots); $("myWorst").textContent = workText(s.errs, s.tots);
  $("myChart").innerHTML = chart(mine.filter(isTest).map(r => r.wpm));
}

/* ---------- Hoca ---------- */
async function renderTeacher() {
  const [users, results] = await Promise.all([DB.users(), DB.results()]);
  const students = users.filter(u => u.role !== "teacher");
  const rows = students.map(u => {
    const l = results.filter(r => r.uid === u.id), t = l.filter(isTest), w = t.map(r => r.wpm), s = sumRes(l);
    const lessons = new Set(l.filter(r => r.lesson && r.passed).map(r => r.lesson)).size;
    const xp = l.reduce((a, r) => a + xpOf(r), 0), sec = l.reduce((a, r) => a + (r.dur || 0), 0);
    const first = avg(w.slice(0, 5)), last = avg(w.slice(-5));
    return { u, l: t, all: l, lessons, xp, sec, n: t.length, best: w.length ? Math.max(...w) : 0, bestScore: t.length ? Math.max(...t.map(scoreOf)) : 0, first, last, trend: l.length >= 2 ? last - first : null,
      worst: topErrors(s.errs, s.tots, 3, 5).map(x => x.ch.toUpperCase()).join(" "), lastDate: l.length ? l[l.length - 1].date : 0 };
  }).sort((a, b) => b.xp - a.xp);
  $("teacherTable").innerHTML = "<tr><th>Student</th><th>Points</th><th>Time</th><th>Lessons</th><th>Tests</th><th>Best score</th><th>Progress</th><th>Weak letters</th><th>Last active</th><th></th></tr>" +
    (rows.map(r => `<tr class="click" data-id="${esc(r.u.id)}"><td>${esc(r.u.username)}</td><td><b>${r.xp}</b></td><td>${fmtTime(r.sec)}</td><td>${r.lessons}/${LESSONS.length}</td><td>${r.n}</td><td><b>${r.bestScore}</b> <span class="muted">(${r.best} WPM)</span></td>
      <td>${r.trend === null ? "-" : `${r.first} → ${r.last} <span class="${r.trend >= 0 ? "up" : "down"}">${r.trend >= 0 ? "▲" : "▼"}${Math.abs(r.trend)}</span>`}</td>
      <td>${r.worst || "-"}</td><td>${r.lastDate ? new Date(r.lastDate).toLocaleDateString("en-GB") : "-"}</td>
      <td style="white-space:nowrap"><button class="ghost del" data-act="scores" data-id="${esc(r.u.id)}">Clear scores</button> <button class="ghost del" data-act="user" data-id="${esc(r.u.id)}">Remove</button></td></tr>`).join("") || '<tr><td colspan="10" class="muted">No students yet.</td></tr>');
  document.querySelectorAll("#teacherTable .del").forEach(b => b.onclick = async e => {
    e.stopPropagation();
    const r = rows.find(x => x.u.id === b.dataset.id), whole = b.dataset.act === "user";
    const msg = whole ? `Remove student "${r.u.username}" and ALL of their scores and lessons?\n\nThis cannot be undone.` : `Delete ALL scores and lesson progress of "${r.u.username}"?\n\nThis cannot be undone.`;
    if (!confirm(msg)) return;
    try { await (whole ? DB.deleteUser(r.u.id) : DB.deleteResults(r.u.id)); $("studentDetail").hidden = true; renderTeacher(); }
    catch (err) { alert("Could not delete: " + (err.message || err) + "\n\nIf this says 'permissions', update the Firestore rules (see README)."); }
  });
  document.querySelectorAll("#teacherTable tr.click").forEach(tr => tr.onclick = () => {
    const r = rows.find(x => x.u.id === tr.dataset.id), s = sumRes(r.all), d = $("studentDetail");
    d.hidden = false; d.innerHTML = `<h2>${esc(r.u.username)} – details</h2><div id="sdChart"></div><div id="sdHeat"></div><div class="muted">${workText(s.errs, s.tots)}</div>`;
    $("sdChart").innerHTML = chart(r.l.map(x => x.wpm)); heatmap($("sdHeat"), s.errs, s.tots);
    d.scrollIntoView({ behavior: "smooth" });
  });
  const cs = sumRes(results.filter(r => students.some(u => u.id === r.uid)));
  heatmap($("classHeat"), cs.errs, cs.tots); $("classWorst").textContent = workText(cs.errs, cs.tots);
}

/* ---------- Başlat ---------- */
(async () => {
  if (DB.mode === "local") { $("modeBanner").hidden = false; $("modeBanner").textContent = "Local mode: data stays in this browser only. Fill in firebase-config.js for shared use (see README). In local mode the username 'teacher' becomes the teacher."; }
  const u = await DB.current(); if (u) enter(u);
})();
