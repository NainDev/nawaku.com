/* ══════════════════════════════════════════════════
   NAWAKU — LAYOUT ENGINE
   Merender daftar artikel kawasan sesuai k.layout dari db.json:
   - "grid"     : kartu grid statis (default lama, tetap dipertahankan)
   - "carousel" : geser horizontal (scroll-snap, tombol kiri/kanan)
   - "list"     : kartu horizontal besar bertumpuk (mirip daftar berita)
   - "masonry"  : kolom bertingkat (Pinterest-style, tinggi kartu bervariasi)

   Dipakai oleh semua halaman kawasan-*.html setelah shared.js dimuat:
   <script src="shared.js"></script>
   <script src="layout-engine.js"></script>
   <script>
     NawakuLayout.render('artGrid', articles, kw, { cardBase: 'art-card' });
   </script>
═══════════════════════════════════════════════════ */

const NawakuLayout = (() => {

  function cardHTML(a, kwName) {
    return `
      <a class="art-card" href="${a.url}" data-nav>
        <img class="art-card-img" src="${a.img || ''}" alt="${escapeHtml(a.title)}" loading="lazy"/>
        <div class="art-card-body">
          <span class="art-card-tag">${escapeHtml((kwName||'').toUpperCase())}</span>
          <div class="art-card-title">${escapeHtml(a.title)}</div>
          <div class="art-card-footer">
            <span class="art-card-date">${escapeHtml(a.date||'')}</span>
            <span class="art-card-time">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${a.read_time || 0} mnt
            </span>
          </div>
        </div>
      </a>`;
  }

  function listCardHTML(a, kwName) {
    return `
      <a class="art-list-card" href="${a.url}" data-nav>
        <img class="art-list-img" src="${a.img || ''}" alt="${escapeHtml(a.title)}" loading="lazy"/>
        <div class="art-list-body">
          <span class="art-card-tag">${escapeHtml((kwName||'').toUpperCase())}</span>
          <div class="art-list-title">${escapeHtml(a.title)}</div>
          <div class="art-list-excerpt">${escapeHtml(a.excerpt||'')}</div>
          <div class="art-card-footer" style="border:none;margin-top:8px;padding-top:0;">
            <span class="art-card-date">${escapeHtml(a.date||'')}</span>
            <span class="art-card-time">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${a.read_time || 0} mnt
            </span>
          </div>
        </div>
      </a>`;
  }

  function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }

  /* Render ke dalam elemen container sesuai mode layout */
  function render(containerId, articles, kw, opts = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const layout = (kw && kw.layout) || 'grid';
    const kwName = kw ? kw.name : '';

    if (!articles.length) {
      el.className = 'art-grid';
      el.innerHTML = '<div class="empty-state">Belum ada artikel tambahan untuk kawasan ini.</div>';
      return;
    }

    if (layout === 'carousel') {
      el.className = 'art-carousel-wrap';
      el.innerHTML = `
        <button class="carousel-btn carousel-btn-left" aria-label="Geser kiri">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="art-carousel" id="${containerId}_track">
          ${articles.map(a => cardHTML(a, kwName)).join('')}
        </div>
        <button class="carousel-btn carousel-btn-right" aria-label="Geser kanan">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      `;
      const track = document.getElementById(containerId + '_track');
      el.querySelector('.carousel-btn-left').addEventListener('click', () => {
        track.scrollBy({ left: -320, behavior: 'smooth' });
      });
      el.querySelector('.carousel-btn-right').addEventListener('click', () => {
        track.scrollBy({ left: 320, behavior: 'smooth' });
      });
    } else if (layout === 'list') {
      el.className = 'art-list';
      el.innerHTML = articles.map(a => listCardHTML(a, kwName)).join('');
    } else if (layout === 'masonry') {
      el.className = 'art-masonry';
      el.innerHTML = articles.map(a => cardHTML(a, kwName)).join('');
    } else {
      // default: grid
      el.className = 'art-grid';
      el.innerHTML = articles.map(a => cardHTML(a, kwName)).join('');
    }

    if (window.NawakuDB) NawakuDB.attachNavAll('#' + containerId + ' [data-nav], #' + containerId + '_track [data-nav]');
  }

  /* Kartu untuk mode swipe — mirip tampilan "featured" lama (gambar+judul+excerpt besar) tapi
     dibuat untuk banyak artikel berjajar horizontal, TANPA tombol panah.
     Hanya bisa digeser lewat scroll/drag/trackpad/sentuh (scroll-snap native). */
  function swipeCardHTML(a, kwName) {
    return `
      <a class="featured-swipe-card" href="${a.url}" data-nav>
        <img class="featured-swipe-img" src="${a.img || ''}" alt="${escapeHtml(a.title)}" loading="lazy"/>
        <div class="featured-swipe-body">
          <span class="featured-tag">${escapeHtml((kwName||'').toUpperCase())}</span>
          <div class="featured-title">${escapeHtml(a.title)}</div>
          <div class="featured-excerpt">${escapeHtml(a.excerpt||'')}</div>
          <div class="featured-meta">
            <span class="a-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${escapeHtml(a.date||'')}
            </span>
            <span class="a-meta-sep"></span>
            <span class="a-meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${a.read_time || 0} menit baca
            </span>
          </div>
          <span class="read-more">
            Baca Selengkapnya
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </span>
        </div>
      </a>`;
  }

  /* Render strip "Artikel Pilihan" — banyak kartu, geser bebas tanpa tombol navigasi.
     containerId: id elemen wrapper kosong di HTML.
     articles: hasil NawakuDB.resolveArticles(db, kw.featured_ids)
     kwName: nama kawasan untuk label tag */
  function renderSwipe(containerId, articles, kwName) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!articles.length) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'block';
    el.className = 'featured-swipe-wrap';
    el.innerHTML = articles.map(a => swipeCardHTML(a, kwName)).join('');
    if (window.NawakuDB) NawakuDB.attachNavAll('#' + containerId + ' [data-nav]');
  }

  return { render, renderSwipe };
})();
