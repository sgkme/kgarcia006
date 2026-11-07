// Source-aligned gameplay scenes and the complete supplied UI component library.
window.SS = window.SS || {};
SS.Reference = (function () {
  const data = SS.ReferenceData, records = new Map(data.ui.map(a => [a.id, a]));
  const kitchens = new Map(data.backgrounds.map(a => [a.kitchen_id, a]));
  const images = new Map(), canvases = new Map();
  const issues = [];
  const controlKeys = { gear:'settings',back:'back',pause:'pause',lock:'lock',play:'play',cart:'shop',home:'home',refresh:'restart',sound:'sound_on',music:'music' };
  const iconKeys = { ...controlKeys,clock:'clock',heartOn:'heart',heartOff:'heart',starOn:'star',starOff:'star',check:'complete',mistake:'failure',trophy:'trophy',flame:'flame',coinIco:'coin',gem:'gem',crown:'crown',xp:'lightning',sparkle:'sparkles',medal:'medal' };
  const bonuses = {score_star:'star',time_boost:'stopwatch',coin_burst:'coin_bag',slow_time:'hourglass',wide_catch:'boost',hazard_shield:'shield',combo_shield:'active_star'};
  const url = id => records.has(id) ? SS.assetURL(records.get(id).svg) : null;
  function image(src,key) {
    return new Promise(resolve => { const im=new Image();im.onload=()=>{images.set(key,im);resolve(im);};im.onerror=()=>{issues.push(src);console.error('Reference asset failed to load:',src);resolve(null);};im.src=SS.assetURL(src); });
  }
  const ready=Promise.all([...data.ui.map(a=>image(a.svg,'ui:'+a.id)),...data.backgrounds.flatMap(a=>[image(a.svg,'bg:'+a.id),image(a.counter_svg,'counter:'+a.id)])]);
  function background(key) {
    const record=kitchens.get(key);if(!record)return null;
    const cache='background:'+record.id;if(canvases.has(cache))return canvases.get(cache);
    const im=images.get('bg:'+record.id);if(!im)return null;
    const c=document.createElement('canvas');c.width=1080;c.height=1920;const ctx=c.getContext('2d');
    // Keep the full 1088x1920 composition and its aspect ratio. Extend only the
    // outer edge rows across the seven-pixel letterbox at top and bottom.
    const scale=Math.min(c.width/im.width,c.height/im.height),w=im.width*scale,h=im.height*scale,x=(c.width-w)/2,y=(c.height-h)/2;
    ctx.drawImage(im,0,0,im.width,1,0,0,c.width,Math.ceil(y));
    ctx.drawImage(im,0,im.height-1,im.width,1,0,Math.floor(y+h),c.width,c.height-Math.floor(y+h));
    ctx.drawImage(im,x,y,w,h);
    // One rigid foreground counter supports the plate at balance.plate.y.
    const counter=images.get('counter:'+record.id);if(counter)ctx.drawImage(counter,0,0,1080,1920);
    canvases.set(cache,c);return c;
  }
  function iconHTML(id,cls='') {
    const record=records.get(id);if(!record)return '';
    return `<img class="ico reference-art ${record.category==='controls'?'reference-control ':''}${cls}" alt="" draggable="false" data-reference-ui="${id}" src="${url(id)}">`;
  }
  function iconForKey(key,cls) { const id=iconKeys[key];return id?iconHTML(id,cls||''):null; }
  function canvasIcon(id,size) {
    const target=bonuses[id],im=target&&images.get('ui:'+target);if(!im)return null;
    const key='icon:'+id+':'+size;if(canvases.has(key))return canvases.get(key);
    const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d'),scale=Math.min(size/im.width,size/im.height);
    ctx.drawImage(im,(size-im.width*scale)/2,(size-im.height*scale)/2,im.width*scale,im.height*scale);canvases.set(key,c);return c;
  }
  function prepareStyle() {
    const style=document.documentElement.style;
    for(const a of data.ui)style.setProperty('--ref-'+a.id,'url("'+url(a.id)+'")');
    style.setProperty('--ico-coin','url("'+url('coin')+'")');style.setProperty('--ico-gem','url("'+url('gem')+'")');style.setProperty('--ico-ticket','url("'+url('ticket')+'")');
  }
  function decorate(root) {
    // These are semantic states of the existing UI, not additional game rules.
    for(const element of root.querySelectorAll('.mstat.done'))element.style.setProperty('--mission-state','var(--ref-complete)');
    for(const element of root.querySelectorAll('.mstat.cur'))element.style.setProperty('--mission-state','var(--ref-location)');
    for(const element of root.querySelectorAll('.mstat.lock'))element.style.setProperty('--mission-state','var(--ref-locked)');
    for(const input of root.querySelectorAll('[data-recipe-search]')){
      input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();for(const card of root.querySelectorAll('.grid .card'))card.hidden=!!q&&!card.textContent.toLowerCase().includes(q);});
    }
  }
  return {data,ready,url,background,iconHTML,iconForKey,canvasIcon,prepareStyle,decorate,issues,
    hasKitchen:key=>kitchens.has(key),get loaded(){return images.size;}};
})();
