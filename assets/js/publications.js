/*
 * Live publication list for the bruno-crispo site.
 * Pulls the works linked to Bruno Crispo's OpenAlex profile (ORCID 0000-0002-1252-8465)
 * every time the page loads, so new papers appear without editing the site.
 *
 * The list is split into sections (Conference papers, Journal articles, Books and book chapters,
 * Preprints, Other publications) and, inside each section, grouped by year.
 *   - OpenAlex type "conference-paper", or a venue that OpenAlex marks as a conference  -> Conference papers
 *   - OpenAlex type "article"/"review" published in a venue marked as a journal           -> Journal articles
 *   - "book" / "book-chapter"                                                             -> Books and book chapters
 *   - "preprint"                                                                          -> Preprints
 *   - anything else (e.g. a repository copy with no venue information)                    -> Other publications
 *
 * Settings come from hugo.toml through data attributes on #live-pubs in layouts/publications/list.html:
 *   openalexAuthor -> data-author, scholar -> data-scholar, openalexHide -> data-hide
 * To hide a wrongly attributed record, add its OpenAlex id (e.g. "W1234567890") to openalexHide in hugo.toml.
 * If OpenAlex cannot be reached, the page falls back to a link to Google Scholar.
 */
(function () {
  'use strict';

  var ME = /crispo/i;
  var ALLOWED = { 'article': 1, 'conference-paper': 1, 'book-chapter': 1, 'book': 1, 'review': 1, 'preprint': 1 };
  // Order of the sections on the page.
  var SECTIONS = [
    { key: 'conference', title: 'Conference papers' },
    { key: 'journal', title: 'Journal articles' },
    { key: 'book', title: 'Books and book chapters' },
    { key: 'preprint', title: 'Preprints' },
    { key: 'other', title: 'Other publications' }
  ];
  // When the same title appears more than once, keep the record with the clearest venue information.
  var RANK = { conference: 3, journal: 3, book: 2, other: 1, preprint: 0 };
  var MAX_AUTHORS = 12;

  var root = document.getElementById('live-pubs');
  if (!root) { return; }
  var AUTHOR_ID = root.getAttribute('data-author');
  var SCHOLAR = root.getAttribute('data-scholar');
  var HIDE = (root.getAttribute('data-hide') || '').split(',').filter(Boolean);
  var statusEl = document.getElementById('live-status');
  var listEl = document.getElementById('live-list');
  var searchEl = document.getElementById('live-search');
  var countEl = document.getElementById('live-count');
  var navEl = document.getElementById('live-nav') || document.createElement('nav');

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined) { n.textContent = text; }
    return n;
  }

  function safeUrl(u) {
    return (typeof u === 'string' && /^https:\/\//i.test(u)) ? u : null;
  }

  function norm(t) {
    return (t || '').toLowerCase().replace(/<[^>]*>/g, '').replace(/[^a-z0-9]+/g, '');
  }

  function showError() {
    statusEl.textContent = '';
    statusEl.appendChild(document.createTextNode('The live list could not be loaded right now. Please use '));
    var a = el('a', null, 'Google Scholar');
    a.href = SCHOLAR;
    statusEl.appendChild(a);
    statusEl.appendChild(document.createTextNode(' to browse all publications.'));
  }

  function fetchAll() {
    var base = 'https://api.openalex.org/works?filter=author.id:' + AUTHOR_ID +
      '&sort=publication_date:desc&per-page=200' +
      '&select=id,title,publication_year,type,doi,primary_location,authorships,biblio';
    var all = [];
    function page(n) {
      return fetch(base + '&page=' + n).then(function (r) {
        if (!r.ok) { throw new Error('HTTP ' + r.status); }
        return r.json();
      }).then(function (j) {
        all = all.concat(j.results || []);
        if ((j.results || []).length === 200 && n < 5) { return page(n + 1); }
        return all;
      });
    }
    return page(1);
  }

  // Which section a record belongs to.
  function kindOf(w) {
    if (w.type === 'preprint') { return 'preprint'; }
    if (w.type === 'book' || w.type === 'book-chapter') { return 'book'; }
    if (w.type === 'conference-paper') { return 'conference'; }
    var src = w.primary_location && w.primary_location.source;
    var st = (src && src.type) || '';
    if (st === 'conference') { return 'conference'; }
    if (st === 'journal') { return 'journal'; }
    return 'other';
  }

  function clean(works) {
    var best = {};
    works.forEach(function (w) {
      if (!w.title || !ALLOWED[w.type] || !w.publication_year) { return; }
      if (HIDE.indexOf((w.id || '').replace('https://openalex.org/', '')) !== -1) { return; }
      var k = norm(w.title);
      if (!k) { return; }
      w._kind = kindOf(w);
      var cur = best[k];
      // keep one record per title, preferring the one with the clearest venue (a preprint is the weakest)
      if (!cur || RANK[w._kind] > RANK[cur._kind]) { best[k] = w; }
    });
    return Object.keys(best).map(function (k) { return best[k]; });
  }

  function venueText(w) {
    var loc = w.primary_location || {};
    var v = loc.source && loc.source.display_name ? loc.source.display_name : '';
    if (/^arxiv/i.test(v)) { v = 'arXiv'; }
    var b = w.biblio || {};
    var bits = [];
    if (v) { bits.push(v); }
    if (b.volume) { bits.push('vol. ' + b.volume); }
    if (b.first_page) { bits.push('pp. ' + b.first_page + (b.last_page && b.last_page !== b.first_page ? '–' + b.last_page : '')); }
    return bits.join(', ');
  }

  function renderItem(w) {
    var li = el('li');
    var link = safeUrl(w.doi) || safeUrl(w.primary_location && w.primary_location.landing_page_url);
    var title = link ? el('a', 'ti', w.title) : el('span', 'ti', w.title);
    if (link) { title.href = link; title.rel = 'noopener'; }
    li.appendChild(title);

    var names = (w.authorships || []).map(function (a) { return a.author && a.author.display_name; }).filter(Boolean);
    var au = el('span', 'au');
    var shown = names.slice(0, MAX_AUTHORS);
    shown.forEach(function (n, i) {
      if (i) { au.appendChild(document.createTextNode(', ')); }
      if (ME.test(n)) { au.appendChild(el('b', null, n)); } else { au.appendChild(document.createTextNode(n)); }
    });
    if (names.length > MAX_AUTHORS) { au.appendChild(document.createTextNode(', … +' + (names.length - MAX_AUTHORS) + ' more')); }
    li.appendChild(au);

    var ve = venueText(w);
    if (ve) { li.appendChild(el('span', 've', ve)); }
    li._search = (w.title + ' ' + names.join(' ') + ' ' + ve + ' ' + w.publication_year).toLowerCase();
    return li;
  }

  function render(works) {
    var groups = {};
    works.forEach(function (w) { (groups[w._kind] = groups[w._kind] || []).push(w); });
    listEl.textContent = '';
    navEl.textContent = '';

    SECTIONS.forEach(function (s) {
      var items = groups[s.key];
      if (!items || !items.length) { return; }

      var block = el('section', 'typeblock');
      block.id = 'pubs-' + s.key;
      var h = el('h3', null, s.title + ' ');
      var cnt = el('span', 'count');
      h.appendChild(cnt);
      block.appendChild(h);

      var byYear = {};
      items.forEach(function (w) { (byYear[w.publication_year] = byYear[w.publication_year] || []).push(w); });
      Object.keys(byYear).sort(function (a, b) { return b - a; }).forEach(function (y) {
        var yb = el('div', 'yearblock');
        yb.appendChild(el('h4', null, y));
        var ul = el('ul');
        byYear[y].forEach(function (w) { ul.appendChild(renderItem(w)); });
        yb.appendChild(ul);
        block.appendChild(yb);
      });
      listEl.appendChild(block);

      // link at the top of the list that jumps to this section
      var a = el('a', null, s.title + ' ');
      a.href = '#' + block.id;
      var ncnt = el('span', 'count');
      a.appendChild(ncnt);
      navEl.appendChild(a);

      block._count = cnt;
      block._navLink = a;
      block._navCount = ncnt;
    });

    statusEl.textContent = '';
    updateCount();
  }

  function updateCount() {
    var q = (searchEl.value || '').trim().toLowerCase();
    var shown = 0;
    Array.prototype.forEach.call(listEl.querySelectorAll('.typeblock'), function (sec) {
      var secShown = 0;
      Array.prototype.forEach.call(sec.querySelectorAll('.yearblock'), function (yb) {
        var any = false;
        Array.prototype.forEach.call(yb.querySelectorAll('li'), function (li) {
          var ok = !q || (li._search || '').indexOf(q) !== -1;
          li.hidden = !ok;
          if (ok) { any = true; secShown++; }
        });
        yb.hidden = !any;
      });
      sec.hidden = secShown === 0;
      sec._navLink.hidden = secShown === 0;
      sec._count.textContent = '(' + secShown + ')';
      sec._navCount.textContent = '(' + secShown + ')';
      shown += secShown;
    });
    countEl.textContent = shown + (shown === 1 ? ' publication' : ' publications') + (q ? ' match' : ' listed');
  }

  searchEl.addEventListener('input', updateCount);

  fetchAll().then(function (works) {
    var cleaned = clean(works);
    if (!cleaned.length) { throw new Error('empty'); }
    render(cleaned);
  }).catch(showError);
}());
