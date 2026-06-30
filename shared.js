/* ══════════════════════════════════════════════════
   NAWAKU — SHARED HELPER
   Dipakai oleh semua halaman: beranda, kawasan, artikel.
   Tugasnya: ambil database/db.json (SATU sumber data),
   lalu sediakan fungsi-fungsi siap pakai.

   Cara pakai di halaman lain:
   <script src="../shared.js"></script>  (sesuaikan path relatif)
   <script>
     NawakuDB.load().then(db => {
       // db.site, db.kawasan (array, tiap kawasan punya .articles)
     });
   </script>
═══════════════════════════════════════════════════ */

const NawakuDB = (() => {
  let cache = null;

  /* Path ke db.json — otomatis menyesuaikan posisi file saat ini.
     index.html (root)        -> database/db.json
     kawasan/xxx.html         -> ../database/db.json
     artikel/xxx.html         -> ../database/db.json
  */
  function resolveDbPath() {
    const depth = window.location.pathname.split('/').filter(Boolean);
    // deteksi sederhana: jika berada di folder kawasan/ atau artikel/, naik satu level
    const inSubfolder = window.location.pathname.includes('/kawasan/') ||
                         window.location.pathname.includes('/artikel/');
    return inSubfolder ? '../database/db.json' : 'database/db.json';
  }

  async function load() {
    if (cache) return cache;
    try {
      const res = await fetch(resolveDbPath());
      cache = await res.json();
    } catch (e) {
      console.warn('Gagal memuat database/db.json, memakai data cadangan.', e);
      cache = fallbackData();
    }
    return cache;
  }

  /* Cari satu kawasan berdasarkan id */
  function getKawasan(db, id) {
    return (db.kawasan || []).find(k => k.id === id) || null;
  }

  /* Semua artikel dari semua kawasan, digabung jadi satu list flat
     (berguna untuk pencarian / artikel terkait lintas kawasan) */
  function allArticles(db) {
    const out = [];
    (db.kawasan || []).forEach(k => {
      (k.articles || []).forEach(a => {
        out.push({ ...a, kawasan_id: k.id, kawasan_name: k.name });
      });
    });
    return out;
  }

  /* Total artikel di seluruh database */
  function totalArticles(db) {
    return allArticles(db).length;
  }

  /* Data fallback minimal jika fetch gagal (mis. dibuka via file:// tanpa server) */
  function fallbackData() {
    return {
      site: {
        name: 'Nawaku',
        tagline: 'Mengabadikan sejarah setiap sudut Kota Cirebon.',
        description: 'Nawaku adalah ruang baca digital yang mengabadikan sejarah Cirebon.',
        about_extended: 'Dikelola oleh tim jurnalis dan peneliti sejarah lokal.',
        year_founded: 2023
      },
      kawasan: [
        {
          id: 'lemahwungkuk', name: 'Lemahwungkuk',
          desc: 'Kawasan kota lama dengan bangunan kolonial bersejarah.',
          hero_image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1400&q=85',
          location_label: 'Kota Cirebon, Jawa Barat',
          page_url: 'kawasan/lemahwungkuk.html',
          articles: [
            { id:'gedung-bat', title:'Sejarah Gedung BAT Cirebon', excerpt:'Saksi bisu kejayaan industri rokok di Kota Udang.', date:'17 Mei 2025', read_time:10, image:'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&q=80', url:'artikel/sejarah-gedung-bat-cirebon.html' }
          ]
        }
      ]
    };
  }

  /* ── RENDER FOOTER (dipakai semua halaman) ── */
  function renderFooter(db, opts = {}) {
    const s = db.site;
    const descEl = document.getElementById('ftDesc');
    const copyEl = document.getElementById('ftCopy');
    if (descEl) descEl.textContent = s.tagline;
    if (copyEl) {
      const year = new Date().getFullYear();
      copyEl.textContent = `© ${s.year_founded}–${year} ${s.name}.com — ${s.tagline}`;
    }
  }

  /* ── REDIRECT OVERLAY (dipakai semua halaman) ── */
  function goRedirect(url) {
    if (!url || url === '#') return;
    const o = document.getElementById('redirectOverlay');
    if (!o) { window.location.href = url; return; }
    o.classList.add('show');
    setTimeout(() => { window.location.href = url; }, 1600);
  }
  function attachNav(el) {
    el.addEventListener('click', e => {
      const href = el.getAttribute('href');
      if (!href || href === '#') return;
      e.preventDefault();
      goRedirect(href);
    });
  }
  function attachNavAll(selector = '[data-nav]') {
    document.querySelectorAll(selector).forEach(attachNav);
  }

  /* ── TOAST (dipakai semua halaman) ── */
  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  return {
    load, getKawasan, allArticles, totalArticles,
    renderFooter, goRedirect, attachNav, attachNavAll, showToast
  };
})();
