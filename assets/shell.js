
(function(){
  const metaEl = document.getElementById('game-meta');
  if(!metaEl) return;
  let meta = {};
  try{ meta = JSON.parse(metaEl.textContent || '{}'); }catch(e){ meta = {}; }

  const body = document.body;
  if(meta.theme) body.classList.add(meta.theme);

  // persistent UI toggles (per browser)
  const storeKey = 'vl_shell_toggles_v1';
  const saved = (()=>{ try{return JSON.parse(localStorage.getItem(storeKey)||'{}');}catch(e){return {};}})();
  const defaults = { highContrast:false, reduceMotion:false, bigText:false };
  const state = Object.assign({}, defaults, saved);

  function apply(){
    body.classList.toggle('high-contrast', !!state.highContrast);
    body.classList.toggle('reduce-motion', !!state.reduceMotion);
    body.classList.toggle('big-text', !!state.bigText);
    try{ localStorage.setItem(storeKey, JSON.stringify(state)); }catch(e){}
  }
  apply();

  const shell = document.createElement('section');
  shell.className = 'vl-shell';
  shell.innerHTML = `
    <div class="vl-shell-inner">
      <div class="vl-meta">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span class="vl-badge">Game ${meta.number || ''}</span>
          <h1 class="vl-title">${escapeHtml(meta.title || document.title || 'Game')}</h1>
          ${meta.concept ? `<span class="vl-badge">${escapeHtml(meta.concept)}</span>` : ``}
        </div>

        ${meta.whatsDifferent ? `
          <div class="vl-box">
            <h3>What’s different from last game?</h3>
            <p>${escapeHtml(meta.whatsDifferent)}</p>
          </div>
        `:``}

        ${Array.isArray(meta.challengeVariants) && meta.challengeVariants.length ? `
          <div class="vl-box">
            <h3>Optional challenge variants</h3>
            <p style="margin-bottom:8px;color:rgba(255,255,255,.86)">Pick one after you beat the default version.</p>
            <ul style="margin:0;padding-left:18px;color:rgba(255,255,255,.92);line-height:1.35">
              ${meta.challengeVariants.map(v=>`<li>${escapeHtml(v)}</li>`).join('')}
            </ul>
          </div>
        `:``}
      </div>

      <div style="min-width:240px;display:flex;flex-direction:column;gap:10px">
        <div class="vl-box">
          <h3>Player options</h3>
          <div class="vl-variants">
            ${toggle('highContrast','High contrast')}
            ${toggle('reduceMotion','Reduced motion')}
            ${toggle('bigText','Bigger text')}
          </div>
        </div>
        <div class="vl-box">
          <h3>Navigation</h3>
          <div class="vl-links">
            <a href="../../index.html">All games</a>
            ${meta.prev ? `<a href="../game-${meta.prev}/index.html">Prev</a>` : ``}
            ${meta.next ? `<a href="../game-${meta.next}/index.html">Next</a>` : ``}
          </div>
        </div>
      </div>
    </div>
  `;
  body.insertBefore(shell, body.firstChild);

  // wire toggles
  shell.querySelectorAll('input[data-t]').forEach(inp=>{
    const key = inp.getAttribute('data-t');
    inp.checked = !!state[key];
    inp.addEventListener('change', ()=>{
      state[key] = inp.checked;
      apply();
    });
  });

  function toggle(key,label){
    return `<label class="vl-toggle"><input type="checkbox" data-t="${key}"/><span>${label}</span></label>`;
  }
  function escapeHtml(str){
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'","&#39;");
  }
})();
