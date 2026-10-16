// Veri katmanı: Firebase varsa ortak veritabanı, yoksa tarayıcıda yerel mod.
(function () {
  const cfg = window.FIREBASE_CONFIG;
  const useFirebase = !!(cfg && cfg.apiKey && window.firebase);
  const emailOf = u => u.toLowerCase() + "@yazilab.local";
  // one canonical form per username: no spaces, lowercase, Turkish letters -> ASCII
  const TR = { "ç": "c", "ğ": "g", "ı": "i", "i̇": "i", "ö": "o", "ş": "s", "ü": "u" };
  const clean = u => u.toLowerCase().replace(/\s+/g, "").replace(/[çğıöşü]/g, c => TR[c]);
  // Firebase requires passwords of 6+ characters, so a 4-6 digit PIN is padded before it is sent
  const fbPw = p => "pin-" + p + "-typelab";

  async function sha(text) {
    if (window.crypto && crypto.subtle) {
      const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("yazilab:" + text));
      return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, "0")).join("");
    }
    return btoa(unescape(encodeURIComponent("yazilab:" + text)));
  }
  const ls = {
    get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  };

  let DB;
  if (useFirebase) {
    firebase.initializeApp(cfg);
    const auth = firebase.auth(), fs = firebase.firestore();
    const loadUser = async fu => {
      if (!fu) return null;
      const d = await fs.collection("users").doc(fu.uid).get();
      const x = d.exists ? d.data() : { username: fu.email.split("@")[0], role: "student" };
      return { id: fu.uid, username: x.username, role: x.role || "student" };
    };
    DB = {
      mode: "firebase",
      current: () => new Promise(res => { const un = auth.onAuthStateChanged(async u => { un(); res(await loadUser(u)); }); }),
      async register(username, password) {
        username = clean(username);
        const c = await auth.createUserWithEmailAndPassword(emailOf(username), fbPw(password));
        await fs.collection("users").doc(c.user.uid).set({ username, role: "student", created: Date.now() });
        return { id: c.user.uid, username, role: "student" };
      },
      async login(username, password) {
        const c = await auth.signInWithEmailAndPassword(emailOf(clean(username)), fbPw(password));
        return loadUser(c.user);
      },
      logout: () => auth.signOut(),
      saveResult: r => fs.collection("results").add(r),
      async results() { const s = await fs.collection("results").orderBy("date").limit(10000).get(); return s.docs.map(d => d.data()); },
      async users() { const s = await fs.collection("users").get(); return s.docs.map(d => ({ id: d.id, ...d.data() })); },
    };
  } else {
    DB = {
      mode: "local",
      async current() { const id = ls.get("yl_session", null); const u = ls.get("yl_users", {})[id]; return u ? { id, username: u.username, role: u.role } : null; },
      async register(username, password) {
        username = clean(username);
        const users = ls.get("yl_users", {});
        if (users[username]) throw { code: "auth/email-already-in-use" };
        // yerel modda username "teacher" is automatically the teacher
        users[username] = { username, role: username === "teacher" ? "teacher" : "student", hash: await sha(password) };
        ls.set("yl_users", users); ls.set("yl_session", username);
        return { id: username, username, role: users[username].role };
      },
      async login(username, password) {
        username = clean(username);
        const u = ls.get("yl_users", {})[username];
        if (!u) throw { code: "auth/user-not-found" };
        if (u.hash !== await sha(password)) throw { code: "auth/wrong-password" };
        ls.set("yl_session", username);
        return { id: username, username, role: u.role };
      },
      async logout() { localStorage.removeItem("yl_session"); },
      async saveResult(r) { const a = ls.get("yl_results", []); a.push(r); ls.set("yl_results", a); },
      async results() { return ls.get("yl_results", []); },
      async users() { return Object.values(ls.get("yl_users", {})).map(u => ({ id: u.username, username: u.username, role: u.role })); },
    };
  }
  DB.cleanUsername = clean;
  window.DB = DB;
})();
