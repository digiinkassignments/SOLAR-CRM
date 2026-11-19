(() => {
  const menu=document.querySelector('.mobile-menu');
  menu?.addEventListener('click',e=>{if(e.target.closest('a'))menu.open=false;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.open){menu.open=false;menu.querySelector('summary').focus();}});
  const stage=document.getElementById('solar-stage');
  if(!stage)return;
  const button=document.getElementById('load-3d'),status=document.getElementById('scene-status');
  let mounted=false,scene;
  async function load(){if(mounted)return;mounted=true;button.disabled=true;button.textContent='Loading 3D...';
    try{const module=await import('/solar-scene.js?v=20261119');scene=module.mountSolarScene(stage);if(!scene){button.textContent='Static view';button.disabled=true;}}
    catch{mounted=false;status.textContent='Rooftop illustration';for(const b of stage.querySelectorAll('.scene-controls button'))b.disabled=true;stage.querySelector('canvas').tabIndex=-1;button.disabled=false;button.textContent='Retry 3D';}
  }
  button.addEventListener('click',load);
  // Do not spend mobile bandwidth and GPU time until the visitor requests 3D.
  const connection=navigator.connection;
  const automatic=matchMedia('(min-width: 768px)').matches&&!connection?.saveData&&!['slow-2g','2g'].includes(connection?.effectiveType);
  if(automatic){if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();if('requestIdleCallback' in window)requestIdleCallback(load,{timeout:1600});else setTimeout(load,100);}},{rootMargin:'100px'});observer.observe(stage);}else load();}
  window.addEventListener('pagehide',()=>{scene?.dispose();});
  window.addEventListener('pageshow',e=>{if(e.persisted){mounted=false;button.disabled=false;button.textContent='Explore in 3D';stage.classList.remove('ready');if(automatic)load();}});
})();
