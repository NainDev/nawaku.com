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

  /* Deteksi kedalaman halaman saat ini berdasarkan jumlah segmen path.
     - index.html, kawasan-*.html, admin.html → 1 segmen → berada di root
     - namakawasan/judul-artikel.html (artikel baru dari fitur "Buat Artikel") → 2 segmen → 1 level di bawah root
     Heuristik ini tidak bergantung pada domain/subpath hosting, murni relatif. */
  function pathDepth() {
    return window.location.pathname.split('/').filter(Boolean).length;
  }

  function resolveDbPath() {
    return pathDepth() > 1 ? '../db.json' : 'db.json';
  }

  /* Ubah path relatif-dari-root (yang tersimpan di db.json, mis. "kawasan-lemahwungkuk.html"
     atau "lemahwungkuk/judul-artikel.html") menjadi path yang benar dilihat dari HALAMAN SAAT INI.
     Dipakai oleh halaman artikel yang hidup di dalam subfolder supaya link ke root
     (beranda, kawasan lain, artikel lain) tetap benar. Halaman di root tidak terpengaruh. */
  function relFromHere(path) {
    if (!path) return path;
    if (/^https?:\/\//i.test(path) || path.startsWith('/') || path.startsWith('#')) return path;
    return pathDepth() > 1 ? '../' + path : path;
  }

  async function load(force = false) {
    if (cache && !force) return cache;
    try {
      const res = await fetch(resolveDbPath(), { cache: 'no-store' });
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

  /* Cari satu artikel berdasarkan id (dipakai fitur featured_ids & sections) */
  function getArticleById(db, id) {
    return (db.articles || []).find(a => a.id === id) || null;
  }

  /* Ubah daftar id artikel menjadi daftar objek artikel (id yang tidak ketemu diabaikan,
     bukan menyebabkan error, supaya admin panel yang menghapus artikel tidak merusak
     section/featured yang masih menunjuk ke id lama) */
  function resolveArticles(db, ids) {
    return (ids || []).map(id => getArticleById(db, id)).filter(Boolean);
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
    getArticleById, resolveArticles, relFromHere,
    renderFooter, goRedirect, attachNav, attachNavAll, showToast
  };
})();
