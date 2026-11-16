'use strict';
(() => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const all = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const node = (tag, className, text) => { const el = document.createElement(tag); if(className) el.className = className; if(text) el.textContent = text; return el; };
  let indexPromise;
  const loadIndex = () => indexPromise || (indexPromise = fetch(document.body.dataset.searchUrl).then(response => { if(!response.ok) throw new Error('index'); return response.json(); }).catch(error => { indexPromise = null; throw error; }));
  const panel = $('#site-search');
  const toggle = $('.search-toggle');
  const input = $('#search-input');
  let searchSequence = 0;
  function closeSearch() { panel.hidden = true; toggle.setAttribute('aria-expanded','false'); toggle.focus(); }
  if (toggle && panel && input) {
    toggle.hidden = false;
    toggle.addEventListener('click', () => { panel.hidden = !panel.hidden; toggle.setAttribute('aria-expanded', String(!panel.hidden)); if(!panel.hidden) { input.focus(); loadIndex().catch(() => {}); } });
    $('.search-close').addEventListener('click', closeSearch);
    document.addEventListener('keydown', event => { if(event.key === 'Escape' && !panel.hidden) closeSearch(); });
    document.addEventListener('pointerdown', event => { if(!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) { panel.hidden = true; toggle.setAttribute('aria-expanded','false'); } });
    let searchTimer;
    input.addEventListener('input', () => { const current = ++searchSequence; clearTimeout(searchTimer); searchTimer = setTimeout(async () => {
      const query = input.value.trim().toLocaleLowerCase(); const resultHost = $('.search-results'); const status = $('.search-status');
      resultHost.replaceChildren();
      if(!query) { status.textContent = '输入关键词，查找已有的记录。'; return; }
      status.textContent = '正在查找…';
      try {
        const posts = await loadIndex(); if(current !== searchSequence) return;
        const results = posts.filter(post => (post.title + ' ' + post.text).toLocaleLowerCase().includes(query));
        status.textContent = results.length ? '找到 ' + results.length + ' 篇记录' : '没有找到相关记录，试试其他关键词。';
        const fragment = document.createDocumentFragment();
        results.forEach(post => { const link = node('a','search-result'); link.href = post.url; link.append(node('strong','',post.title),node('span','',post.date),node('p','',post.summary)); fragment.append(link); });
        resultHost.replaceChildren(fragment);
      } catch { if(current === searchSequence) status.textContent = '搜索索引暂时无法加载，请重新输入重试，或前往文章归档。'; }
    }, 120); });
  }
  const filters = $('.record-filters');
  if(filters) {
    filters.hidden = false;
    const gallery = $('.post-gallery'); const original = [...gallery.children]; const pagination = $('.pagination'); let filterSequence = 0;
    const createCard = post => {
      const article = node('article','post-item'); article.dataset.family = post.family;
      const cover = node('a','post-cover'); cover.href = post.url; cover.tabIndex = -1; cover.setAttribute('aria-hidden','true');
      const img = node('img'); img.src = post.cover; img.alt = ''; img.width = 800; img.height = 560; img.loading = 'lazy'; img.decoding = 'async'; cover.append(img);
      const caption = node('div','post-caption'); const time = node('time','',post.date); const h = node('h3'); const link = node('a','',post.title); link.href = post.url; h.append(link);
      const arrow = node('a','post-read'); arrow.href = post.url; arrow.setAttribute('aria-label','阅读' + post.title); arrow.textContent = '↗';
      caption.append(h,time,node('p','',post.summary),arrow); article.append(cover,caption); return article;
    };
    all('button',filters).forEach(button => button.addEventListener('click',async () => {
      const family = button.dataset.filter; const current = ++filterSequence; const status = $('.filter-status');
      all('button',filters).forEach(b => b.setAttribute('aria-pressed',String(b === button)));
      if(family === 'all') { gallery.replaceChildren(...original); gallery.removeAttribute('aria-busy'); pagination.hidden = false; status.textContent = ''; return; }
      status.textContent = '正在整理记录…'; gallery.setAttribute('aria-busy','true');
      try { const posts = await loadIndex(); if(current !== filterSequence) return; const matches = posts.filter(post => post.family === family); gallery.replaceChildren(...matches.map(createCard)); pagination.hidden = true; status.textContent = matches.length ? '' : '这个分类暂时没有文章。'; }
      catch { if(current !== filterSequence) return; status.textContent = '暂时无法加载完整列表，已显示当前页的相关记录。'; gallery.replaceChildren(...original.filter(card => card.dataset.family === family)); pagination.hidden = false; }
      finally { if(current === filterSequence) gallery.removeAttribute('aria-busy'); }
    }));
  }
  const hero = $('.hero'); const canvas = $('.hero-canvas');
  if(hero && canvas && matchMedia('(hover:hover) and (pointer:fine) and (min-width:761px)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    let frame = 0; let x = 0; let y = 0;
    hero.addEventListener('pointermove', event => { const bounds = hero.getBoundingClientRect(); x = (event.clientX / bounds.width - .5) * 9; y = ((event.clientY - bounds.top) / bounds.height - .5) * 6; if(!frame) frame = requestAnimationFrame(() => { canvas.style.setProperty('--art-x',x.toFixed(1)+'px'); canvas.style.setProperty('--art-y',y.toFixed(1)+'px'); frame = 0; }); }, {passive:true});
    hero.addEventListener('pointerleave',() => { if(frame) cancelAnimationFrame(frame); frame=0; canvas.style.setProperty('--art-x','0px'); canvas.style.setProperty('--art-y','0px'); });
  }
  const commentButton = $('.comments-load');
  if(commentButton) commentButton.addEventListener('click',() => {
    const host = $('.giscus-host'); const status = $('.comments-status'); commentButton.disabled = true; status.textContent = '正在连接评论…';
    const script = document.createElement('script'); script.src = 'https://giscus.app/client.js'; script.async=true; script.crossOrigin='anonymous';
    const attrs = {'repo':host.dataset.repo,'repo-id':host.dataset.repoId,'category':host.dataset.category,'category-id':host.dataset.categoryId,'mapping':'pathname','strict':'0','reactions-enabled':'1','emit-metadata':'0','input-position':'bottom','theme':'light','lang':'zh-CN','loading':'lazy'};
    Object.entries(attrs).forEach(([key,value]) => script.setAttribute('data-'+key,value));
    script.onload = () => { commentButton.hidden=true; status.textContent='评论由原有 Giscus 讨论区提供。网络较慢时可稍候刷新。'; };
    script.onerror = () => { commentButton.disabled=false; status.textContent='评论连接失败，请稍后再试。'; script.remove(); }; host.append(script);
  });
  const musicButton = $('.music-load');
  if(musicButton) musicButton.addEventListener('click',async () => {
    const host = $('.music-host'); const status = $('.music-status'); musicButton.disabled=true; status.textContent='正在加载播放器…';
    const loadScript = src => new Promise((resolve,reject) => { const script=document.createElement('script'); script.src=src; script.async=true; script.onload=resolve; script.onerror=reject; document.head.append(script); });
    try {
      const css=document.createElement('link'); css.rel='stylesheet'; css.href='https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css'; document.head.append(css);
      if(!window.APlayer) await loadScript('https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js');
      const player=document.createElement('meting-js'); ['id','server','type'].forEach(key=>player.setAttribute(key,host.dataset[key])); player.setAttribute('volume','0.6'); player.setAttribute('loop','all'); player.setAttribute('order','list'); player.setAttribute('preload','none'); host.replaceChildren(player);
      if(!customElements.get('meting-js')) await loadScript('https://cdn.jsdelivr.net/npm/meting@2.0.1/dist/Meting.min.js');
      musicButton.hidden=true; status.textContent='歌单由第三方服务提供；无法加载时可用上方链接打开。';
    } catch { musicButton.disabled=false; status.textContent='播放器加载失败，请重试，或用上方链接在网易云打开。'; }
  });
  all('.prose pre').forEach(pre=>{pre.tabIndex=0;pre.setAttribute('aria-label','可滚动的代码');});
  all('.prose a[onclick]:not([href])').forEach(link=>{link.setAttribute('role','button');link.tabIndex=0;link.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();link.click();}});});
})();
