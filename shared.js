/* ══════════════════════════════════════════════════
   NAWAKU — SHARED HELPER
   Satu area: index.html, kawasan-*.html, artikel-*.html,
   db.json, shared.js, admin.html semua sejajar (root yang sama).

   Struktur db.json (SAMA PERSIS dengan yang ditulis admin.html):
   {
     site: {...},
     stats: {...},
     kawasan: [ {id,name,desc,article_count,url,hero_image,layout} ],
     articles: [ {id,title,kawasan_id,kawasan_name,date,read_time,img,url,excerpt} ]
   }

   Jumlah artikel per kawasan SELALU dihitung live dari articles[]
   yang kawasan_id-nya cocok — bukan dari article_count (field itu
   hanya cache yang disamakan admin panel saat menyimpan).

   Cara pakai di semua halaman (path sama, tanpa ../ karena satu area):
   <script src="shared.js"></script>
   <script>
     NawakuDB.load().then(db => { ... });
   </script>
═══════════════════════════════════════════════════ */

const NawakuDB = (() => {
  let cache = null;
  const DB_PATH = 'db.json'; // satu area — semua file sejajar, tidak ada subfolder

  async function load(force = false) {
    if (cache && !force) return cache;
    try {
      const res = await fetch(DB_PATH, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      cache = await res.json();
      if (!cache.kawasan) cache.kawasan = [];
      if (!cache.articles) cache.articles = [];
    } catch (e) {
      console.warn('Gagal memuat db.json, memakai data cadangan.', e);
      cache = fallbackData();
    }
    return cache;
  }

  /* Cari satu kawasan berdasarkan id */
  function getKawasan(db, id) {
    return (db.kawasan || []).find(k => k.id === id) || null;
  }

  /* Semua artikel milik satu kawasan (live, urut sesuai urutan di articles[]) */
  function articlesOf(db, kawasanId) {
    return (db.articles || []).filter(a => a.kawasan_id === kawasanId);
  }

  /* Jumlah artikel live untuk satu kawasan */
  function articleCountOf(db, kawasanId) {
    return articlesOf(db, kawasanId).length;
  }

  /* Semua artikel, flat (berguna untuk beranda / pencarian lintas kawasan) */
  function allArticles(db) {
    return db.articles || [];
  }

  function totalArticles(db) {
    return (db.articles || []).length;
  }

  /* Data fallback minimal jika fetch gagal */
  function fallbackData() {
    return {
      site: {
        name: 'Nawaku',
        tagline: 'Mengabadikan sejarah setiap sudut Kota Cirebon.',
        description: 'Nawaku adalah ruang baca digital yang mengabadikan sejarah Cirebon.',
        about_extended: 'Dikelola oleh tim jurnalis dan peneliti sejarah lokal.',
        year_founded: 2023
      },
      stats: { articles: 0, kawasan: 0, tahun_berdiri: 2023 },
      kawasan: [],
      articles: []
    };
  }

  /* ── RENDER FOOTER (dipakai semua halaman) ── */
  function renderFooter(db) {
    const s = db.site || {};
    const descEl = document.getElementById('ftDesc');
    const copyEl = document.getElementById('ftCopy');
    if (descEl) descEl.textContent = s.tagline || '';
    if (copyEl) {
      const year = new Date().getFullYear();
      copyEl.textContent = `© ${s.year_founded || year}–${year} ${s.name || 'Nawaku'}.com — ${s.tagline || ''}`;
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
    load, getKawasan, articlesOf, articleCountOf, allArticles, totalArticles,
    renderFooter, goRedirect, attachNav, attachNavAll, showToast
  };
})();
