// A separate review tool. It does not unlock content or modify the game's save.
(async function () {
  SS.Save.load();
  await Promise.all([SS.DishView.load(),SS.Reference.ready]);
  const tabs=[['scenes','Gameplay scenes'],['controls','Controls'],['rewards','Rewards'],['status','Status'],['panels','Panels'],['recipes','117 recipes'],['ingredients','Ingredients'],['menus','Menu scenes']];
  const names={controls:'Controls',rewards:'Rewards',status:'Status',panels:'Panels'};
  const $=s=>document.querySelector(s),esc=SS.U.esc,URL=SS.assetURL;
  let active='scenes',query='',showCounter=true,group='all',scene=null,raf=0,run=0;
  const title=id=>id.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
  function show(tab) {
    active=tab;query='';group='all';
    $('nav').innerHTML=tabs.map(([id,name])=>`<button data-tab="${id}" role="tab" aria-selected="${id===tab}">${name}</button>`).join('');
    $('.tools').innerHTML=`<input type="search" placeholder="Search ${tab==='scenes'?'scenes':tab}…" aria-label="Search assets">${tab==='scenes'?'<label><input id="counter-toggle" type="checkbox" checked> Serving counters</label>':''}${tab==='recipes'?`<select id="group" aria-label="Recipe group"><option value="all">All recipe groups</option>${SS.DATA.GROUP_ORDER.map(g=>`<option>${esc(g)}</option>`).join('')}</select>`:''}`;
    $('.tools input[type=search]').addEventListener('input',e=>{query=e.target.value.toLowerCase();render();});
    $('#counter-toggle')?.addEventListener('change',e=>{showCounter=e.target.checked;render();});
    $('#group')?.addEventListener('change',e=>{group=e.target.value;render();});
    render();
  }
  function render() {
    const grid=$('.grid');grid.className='grid'+(active==='scenes'||active==='menus'?' scenes':'')+(!showCounter?' no-counter':'');
    let list=[],markup='';
    if(active==='scenes') {
      $('.note').textContent='Handcrafted SVG gameplay scenes with a separate, rigid foreground counter. Select a scene to inspect it.';
      list=SS.ReferenceData.backgrounds.filter(a=>a.name.toLowerCase().includes(query));
      markup=list.map(a=>`<button class="asset" data-scene="${a.id}"><div class="scene-art"><img src="${URL(a.svg)}" alt="${esc(a.name)}"><img class="scene-counter" src="${URL(a.counter_svg)}" alt=""></div><span class="label">${esc(a.name)}</span></button>`).join('');
    } else if(names[active]) {
      $('.note').textContent='Native SVG component drawings. Icons retain their proportions; game panels and controls use layouts designed for their actual size.';
      list=SS.ReferenceData.ui.filter(a=>a.category===active&&title(a.id).toLowerCase().includes(query));
      markup=list.map(a=>`<figure class="asset ${active==='panels'?'panel':''}"><img src="${URL(a.svg)}" alt="${title(a.id)}"><figcaption>${title(a.id)}</figcaption><small>${a.width} × ${a.height} · SVG</small></figure>`).join('');
    } else if(active==='recipes') {
      $('.note').textContent='All 117 recipes from the supplied game. Select any item to preview its ingredient sequence and assembly animation.';
      list=SS.DATA.recipes.filter(r=>(group==='all'||r.group===group)&&(r.display_name+' '+r.group).toLowerCase().includes(query));
      markup=list.map(r=>`<button class="asset" data-recipe="${r.id}">${SS.Art.thumbHTML(r.id,190)}<span class="label">${esc(r.display_name)}</span><small>${esc(r.group)} · ${r.ingredient_sequence.length} steps</small></button>`).join('');
    } else if(active==='ingredients') {
      $('.note').textContent='The current game’s ingredient library, including separate base containers and falling variants. Ingredient reference sheets in export (22).zip are still awaiting transfer.';
      list=Object.entries(SS.DISH.ing).filter(([id,a])=>(id+' '+(a.name||'')).toLowerCase().includes(query));
      markup=list.map(([id,a])=>`<figure class="asset">${SS.DishView.iconHTML(id,150)}<figcaption>${esc(a.name||title(id))}</figcaption><small>${esc(id)}</small></figure>`).join('');
    } else {
      $('.note').textContent='The five existing SVG menu scenes are preserved.';
      list=['anchor','level','shop','settings','results'].filter(s=>s.includes(query));
      markup=list.map(id=>`<figure class="asset"><div class="scene-art"><img src="${URL('assets/bg/cafe_'+id+'.svg')}" alt="${id}"></div><figcaption>${title(id)}</figcaption></figure>`).join('');
    }
    grid.innerHTML=markup||'<p class="empty">No matching assets.</p>';
    $('#count').textContent=list.length+' shown';
  }
  $('nav').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)show(b.dataset.tab);});
  $('.grid').addEventListener('click',e=>{
    const sceneButton=e.target.closest('[data-scene]'),recipeButton=e.target.closest('[data-recipe]');
    if(sceneButton) {
      const a=SS.ReferenceData.backgrounds.find(a=>a.id===sceneButton.dataset.scene);
      $('#detail-body').innerHTML=`<div class="dialog-heading"><h2>${esc(a.name)}</h2><button data-close aria-label="Close">×</button></div><div class="detail-scene ${!showCounter?'no-counter':''}"><img src="${URL(a.svg)}" alt="${esc(a.name)}">${showCounter?`<img src="${URL(a.counter_svg)}" alt="Serving counter">`:''}</div>`;
      $('#detail').showModal();
    }
    if(recipeButton)build(recipeButton.dataset.recipe);
  });
  $('#detail').addEventListener('click',e=>{if(e.target.closest('[data-close]'))$('#detail').close();if(e.target.closest('[data-replay]'))startBuild();});
  $('#detail').addEventListener('close',()=>{run++;cancelAnimationFrame(raf);scene?.reset();scene=null;});
  let selected=null;
  function build(id) {
    run++;cancelAnimationFrame(raf);scene?.reset();selected=SS.DATA.recipe_by_id[id];
    const thumb=document.createElement('div');thumb.innerHTML=SS.Art.thumbHTML(id,200);
    const bb=thumb.firstElementChild.viewBox.baseVal;
    const vb=`${bb.x-35} ${bb.y-140} ${bb.width+70} ${bb.height+165}`;
    $('#detail-body').innerHTML=`<div class="dialog-heading"><h2>${esc(selected.display_name)}</h2><button data-close aria-label="Close">×</button></div><div class="build-stage"><svg id="assembly" viewBox="${vb}"><defs id="build-defs"></defs><g filter="url(#dish-sticker)"><g id="build-root">${['baseBack','backContents','dish','fronts','baseFront'].map(id=>`<g data-layer="${id}"></g>`).join('')}</g></g><g id="build-fx"></g><g id="build-falling"></g></svg><ol class="steps">${selected.ingredient_sequence.map((id,i)=>`<li data-step="${i}">${SS.DishView.iconHTML(id,38)}<span>${i+1}. ${esc(SS.DATA.ingredient_by_id[id].display_name)}</span></li>`).join('')}</ol></div><div class="build-controls"><button data-replay>Replay assembly</button><span id="build-state">Bottom to top</span></div>`;
    if(!$('#detail').open)$('#detail').showModal();
    const R={'#animDefs':$('#build-defs'),'#dishRoot':$('#build-root'),'#fx':$('#build-fx'),'#falling':$('#build-falling')};
    for(const id of ['baseBack','backContents','dish','fronts','baseFront'])R['#'+id]=$(`[data-layer="${id}"]`);
    scene=SS.DishScene(R,{reduced:false,liquidSplash:true,pressed:()=>scene?.pressDone()});
    startBuild();
  }
  function startBuild() {
    if(!scene)return;const token=++run;cancelAnimationFrame(raf);
    const dish={base:selected.base,seq:selected.ingredient_sequence.map((id,i)=>[id,selected.cols[i]]),finish:selected.finish};
    scene.setDish(dish);let index=0,last=0,next=0,pressAt=0;
    function frame(now) {
      if(token!==run||!scene||!$('#detail').open)return;
      const dt=last?Math.min(.05,(now-last)/1000):0;last=now;scene.tick(dt,0,0);
      if(scene.pressWaiting) { if(!pressAt)pressAt=now+600;if(now>=pressAt){scene.press();pressAt=0;next=now+1000;} }
      else if(now>=next&&!scene.busy&&index<dish.seq.length) {
        const result=scene.place(index,0,true,'perfect');
        $$('.steps li').forEach((li,i)=>{li.classList.toggle('done',i<index);li.classList.toggle('current',i===index);});
        $('#build-state').textContent=`${index+1} / ${dish.seq.length} · ${SS.DATA.ingredient_by_id[dish.seq[index][0]].display_name}`;
        index++;next=now+Math.max(1050,(result.busy||0)*1000+300);
      } else if(index===dish.seq.length&&!scene.busy&&!scene.pressWaiting&&now>next) {
        $('#build-state').textContent='Recipe complete';$$('.steps li').forEach(li=>{li.classList.add('done');li.classList.remove('current');});
      }
      raf=requestAnimationFrame(frame);
    }
    raf=requestAnimationFrame(frame);
  }
  function $$(s){return [...document.querySelectorAll(s)];}
  show('scenes');window.SS_CATALOG_READY=true;
})();
