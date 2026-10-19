// Veri katmanı: Firebase varsa ortak veritabanı, yoksa tarayıcıda yerel mod.
(function () {
  const cfg = window.FIREBASE_CONFIG;
  const useFirebase = !!(cfg && cfg.apiKey && window.firebase);
  const emailOf = u => u.toLowerCase() + "@yazilab.local";
  // one canonical form per username: no spaces, lowercase, Turkish letters -> ASCII
  const TR = { "ç": "c", "ğ": "g", "ı": "i", "i̇": "i", "ö": "o", "ş": "s", "ü": "u" };
  const clean = u => u.toLowerCase().replace(/\u0307/g, "").replace(/\s+/g, "").replace(/[çğıöşü]/g, c => TR[c]);
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
    // shared results are cached for 30 s so switching tabs doesn't re-read the whole collection (free-plan read quota)
    let cache = {};
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
        const ref = fs.collection("users").doc(c.user.uid);
        // a student removed by the teacher is simply re-created as a fresh student on next login
        if (!(await ref.get()).exists) await ref.set({ username: clean(username), role: "student", created: Date.now() });
        return loadUser(c.user);
      },
      logout: () => auth.signOut(),
      async saveResult(r) { cache = {}; await fs.collection("results").add(r); },
      async results(since = 0) {
        const c = cache[since];
        if (c && Date.now() - c.t < 30000) return c.d;
        let q = fs.collection("results"); if (since) q = q.where("date", ">=", since);
        const s = await q.orderBy("date").limit(5000).get(), d = s.docs.map(x => x.data());
        cache[since] = { t: Date.now(), d };
        return d;
      },
      // only this user's own results: far fewer reads than the whole collection
      async myResults(uid) { const s = await fs.collection("results").where("uid", "==", uid).get(); return s.docs.map(d => d.data()).sort((a, b) => a.date - b.date); },
      async users() { const s = await fs.collection("users").get(); return s.docs.map(d => ({ id: d.id, ...d.data() })); },
      // teacher only (enforced by the Firestore rules)
      async deleteResults(uid) {
        cache = {};
        const s = await fs.collection("results").where("uid", "==", uid).get();
        for (let i = 0; i < s.docs.length; i += 400) {
          const b = fs.batch(); s.docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit();
        }
      },
      async deleteUser(uid) { await this.deleteResults(uid); await fs.collection("users").doc(uid).delete(); },
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
      async myResults(uid) { return ls.get("yl_results", []).filter(r => r.uid === uid); },
      async deleteResults(uid) { ls.set("yl_results", ls.get("yl_results", []).filter(r => r.uid !== uid)); },
      async deleteUser(uid) { await this.deleteResults(uid); const u = ls.get("yl_users", {}); delete u[uid]; ls.set("yl_users", u); },
      async users() { return Object.values(ls.get("yl_users", {})).map(u => ({ id: u.username, username: u.username, role: u.role })); },
    };
  }
  DB.cleanUsername = clean;
  window.DB = DB;
})();
