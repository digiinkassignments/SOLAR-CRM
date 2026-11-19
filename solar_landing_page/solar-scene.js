import * as THREE from './assets/vendor/three-0.187.0.min.js';

// Local, pinned Three.js. No network calls or customer data are used by this scene.
export function mountSolarScene(stage) {
  const canvas = stage.querySelector('canvas');
  const listeners=[];
  const listen=(target,type,handler)=>{target.addEventListener(type,handler);listeners.push(()=>target.removeEventListener(type,handler));};
  const status = document.getElementById('scene-status');
  const motion = document.getElementById('motion-toggle');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'low-power'}); }
  catch { status.textContent='Rooftop illustration'; disableControls(); return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.18;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(33,1,.1,80);
  const model=new THREE.Group(); scene.add(model);
  const hemi=new THREE.HemisphereLight(0xeaf3ff,0xc1b5a3,2.2);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff5e5,3.1);sun.position.set(-4,10,6);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-7;sun.shadow.camera.right=7;sun.shadow.camera.top=7;sun.shadow.camera.bottom=-7;
  sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;sun.shadow.radius=3;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xd4e5ff,1.2);fill.position.set(6,4,-5);scene.add(fill);
  const material=(color,roughness=.75,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const white=material(0xf4f0e7),concrete=material(0xcacbc6),roofMat=material(0xd7dad8),dark=material(0x28323d),metal=material(0xa4afb5,.35,.7),wood=material(0x8a6c50),glass=new THREE.MeshPhysicalMaterial({color:0x567c8c,metalness:.25,roughness:.16,clearcoat:1}),green=material(0x5c7853),soil=material(0x9a8d77),orange=material(0xe97631),paver=material(0xd7d7d1);
  function box(w,h,d,x,y,z,mat=white,parent=model){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function cylinder(r1,r2,h,x,y,z,mat,parent=model,segments=12){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function pipe(points,mat=dark,r=.025){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,16,r,6,false),mat);m.castShadow=true;model.add(m);return m;}
  // A modest Indian flat-roof residence, with terrace rails and a service-side inverter.
  box(7.5,.22,6.4,0,-.14,0,material(0xc6cbc8));
  box(7.3,.1,6.2,0,.02,0,material(0xe4e4dd));
  box(5,2.75,4.05,0,1.43,0,white);
  box(5.2,.18,4.24,0,2.88,0,roofMat);
  box(5.12,.11,4.15,0,.15,0,concrete);
  // Parapets and a warmer architectural fascia.
  box(5.2,.22,.12,0,3.07,-2.08,white);box(.12,.22,4.24,-2.54,3.07,0,white);box(.12,.22,4.24,2.54,3.07,0,white);
  box(5.2,.12,.15,0,2.93,2.1,white);box(5.1,.16,.1,0,2.55,2.065,wood);
  box(1.0,2.1,.08,-1.55,1.18,2.065,wood);box(.035,.32,.06,-1.19,1.15,2.13,metal);
  // Recessed window assemblies with mullions and concrete shades.
  function frontWindow(x,y,w,h){box(w+.13,h+.13,.08,x,y,2.06,dark);box(w,h,.05,x,y,2.12,glass);box(.045,h,.06,x,y,2.16,metal);box(w+.26,.09,.42,x,y+h/2+.15,2.19,white);box(w+.14,.07,.2,x,y-h/2-.07,2.16,concrete);}
  frontWindow(.68,1.49,1.88,1.16);
  for(const z of [-.85,.95]){box(.08,1.32,1.25,-2.53,1.55,z,dark);box(.045,1.2,1.13,-2.58,1.55,z,glass);box(.05,1.2,.045,-2.615,1.55,z,metal);box(.4,.08,1.5,-2.62,2.28,z,white);}
  // Front steps and paved approach.
  box(1.4,.12,.55,-1.55,.16,2.34,concrete);box(1.6,.08,.6,-1.55,.07,2.67,paver);
  for(let row=0;row<5;row++)for(let col=0;col<2;col++)box(.62,.025,.43,-1.88+col*.67,.09,2.2+row*.48,paver);
  // Rooftop access cabin at the rear, ventilation and small utility detail.
  box(1.0,.85,.8,1.9,3.4,-1.55,white);box(1.1,.1,.92,1.9,3.87,-1.55,concrete);box(.45,.55,.025,1.9,3.33,-1.135,dark);
  // Solar modules: reusable silicon cell texture, aluminium frame, rails and angled supports.
  const cellCanvas=document.createElement('canvas');cellCanvas.width=512;cellCanvas.height=768;
  const ctx=cellCanvas.getContext('2d');ctx.fillStyle='#0a1729';ctx.fillRect(0,0,512,768);
  for(let row=0;row<12;row++)for(let col=0;col<6;col++){
    const x=8+col*83,y=8+row*62.5;ctx.fillStyle=(row+col)%3===0?'#19364d':(row+col)%3===1?'#10283e':'#163049';ctx.fillRect(x,y,79,58);
    ctx.strokeStyle='#6b82916b';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(x+25,y+2);ctx.lineTo(x+25,y+56);ctx.moveTo(x+53,y+2);ctx.lineTo(x+53,y+56);ctx.stroke();
    ctx.strokeStyle='#c2d0d31c';for(let k=1;k<8;k++){ctx.beginPath();ctx.moveTo(x+1,y+k*7);ctx.lineTo(x+77,y+k*7);ctx.stroke();}
  }
  const texture=new THREE.CanvasTexture(cellCanvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);
  const cells=new THREE.MeshStandardMaterial({map:texture,color:0xffffff,roughness:.28,metalness:.38});
  const panelWidth=1.05,panelDepth=1.55,tilt=-.20;
  for(let row=0;row<2;row++){
    const z=-.88+row*1.7;
    for(const railZ of [-.52,.52])box(3.7,.055,.045,-.38,3.43,z+railZ,metal);
    for(let col=0;col<3;col++){
      const x=-1.52+col*1.15;const group=new THREE.Group();group.position.set(x,3.55,z);group.rotation.x=tilt;model.add(group);
      box(panelWidth,.045,panelDepth,0,0,0,metal,group);
      const surface=new THREE.Mesh(new THREE.PlaneGeometry(panelWidth-.045,panelDepth-.045),cells);surface.rotation.x=-Math.PI/2;surface.position.y=.026;group.add(surface);
      // The sloped legs remain vertical, rather than floating with the module surface.
      for(const dx of [-.4,.4])for(const dz of [-.52,.52]){
        const height=.49+(-Math.sin(tilt)*dz);box(.035,height,.035,x+dx,2.98+height/2,z+dz,metal);
      }
    }
  }
  // Wall-mounted inverter and protected AC/DC cable runs.
  box(.18,.72,.55,2.61,1.7,.48,material(0xe7e9e8,.4));box(.19,.11,.55,2.62,2.09,.48,orange);
  box(.015,.16,.22,2.716,1.83,.48,dark);box(.017,.035,.08,2.726,1.83,.48,material(0x86b7a3));
  for(let i=0;i<4;i++)box(.015,.018,.34,2.716,1.4+i*.055,.48,metal);
  pipe([[1.5,3.6,.7],[2.25,3.35,.7],[2.65,2.94,.7],[2.67,2.25,.7]],dark,.028);
  pipe([[2.65,1.3,.4],[2.65,.8,.4],[2.65,.7,-.7]],material(0xb9bdb8),.025);
  // Gravel garden and two compact trees keep the model grounded in a real site.
  box(.72,.07,3.6,3.13,.1,-.28,soil);box(1.8,.05,.6,-.35,.1,-2.56,soil);
  function shrub(x,z,scale=1){cylinder(.16,.2,.3,x,.23,z,concrete);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.31*scale,1),green);crown.position.set(x,.46,z);crown.castShadow=true;model.add(crown);}
  shrub(3.1,-1.5);shrub(3.12,-.42,.8);shrub(3.12,.75,.9);shrub(-.5,-2.53,.85);
  function tree(x,z){cylinder(.045,.07,.9,x,.55,z,wood);const leaves=material(0x69835d);for(const [dx,dy,dz,r] of [[0,1.3,0,.51],[-.24,1.15,.16,.36],[.25,1.08,-.17,.38]]){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),leaves);m.position.set(x+dx,dy,z+dz);m.castShadow=true;model.add(m);}}
  tree(-3.15,-2.12);tree(2.98,-2.35);
  // Paver seams, service path and understated boundary marker.
  for(let i=0;i<5;i++)box(.48,.025,.54,-3.13,.08,-.65+i*.65,paver);
  box(1.6,.38,.1,1.75,.25,3.0,concrete);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:0x4f5967,opacity:.13}));ground.rotation.x=-Math.PI/2;ground.position.y=-.27;ground.receiveShadow=true;scene.add(ground);
  let azimuth=.82,elevation=.62,distance=15.2,dragging=false,lastX=0,lastY=0,auto=false,visible=true,frame=0,disposed=false;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  function cameraUpdate(){const y=Math.max(.4,Math.min(.95,elevation));camera.position.set(Math.sin(azimuth)*distance*Math.cos(y),Math.sin(y)*distance+1.5,Math.cos(azimuth)*distance*Math.cos(y));camera.lookAt(0,1.65,0);}
  function render(){if(disposed||!visible||document.hidden)return;cameraUpdate();renderer.render(scene,camera);}
  function resize(){const {width,height}=stage.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;distance=width<400?17.7:width<550?16.2:15.2;camera.updateProjectionMatrix();render();}
  function stop(){cancelAnimationFrame(frame);frame=0;}
  function animate(){if(disposed||!auto||!visible||document.hidden||reduced.matches){stop();return;}azimuth+=.0025;render();frame=requestAnimationFrame(animate);}
  function start(){if(!frame&&auto&&visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(animate);}
  listen(canvas,'pointerdown',e=>{if(e.pointerType==='touch'&&e.isPrimary===false)return;dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
  listen(canvas,'pointermove',e=>{if(!dragging)return;azimuth-=(e.clientX-lastX)*.008;elevation+=(e.clientY-lastY)*.003;lastX=e.clientX;lastY=e.clientY;render();});
  const release=()=>{dragging=false;};listen(canvas,'pointerup',release);listen(canvas,'pointercancel',release);
  const rotate=amount=>{azimuth+=amount;render();};
  listen(document.getElementById('rotate-left'),'click',()=>rotate(-.3));
  listen(document.getElementById('rotate-right'),'click',()=>rotate(.3));
  listen(document.getElementById('reset-model'),'click',()=>{azimuth=.82;elevation=.62;render();});
  listen(canvas,'keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();rotate(e.key==='ArrowLeft'?-.2:.2);}if(e.key==='Home'){e.preventDefault();azimuth=.82;elevation=.62;render();}});
  listen(motion,'click',()=>{if(reduced.matches){status.textContent='Reduced motion enabled';return;}auto=!auto;motion.setAttribute('aria-pressed',String(auto));motion.textContent=auto?'Pause rotation':'Auto-rotate';if(auto)start();else stop();});
  const visibility=()=>{if(document.hidden)stop();else{render();start();}};listen(document,'visibilitychange',visibility);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){render();start();}else stop();},{rootMargin:'100px'});observer.observe(stage);
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);
  const reduceChange=()=>{if(reduced.matches){auto=false;motion.setAttribute('aria-pressed','false');motion.textContent='Auto-rotate';stop();}};listen(reduced,'change',reduceChange);
  listen(canvas,'webglcontextlost',e=>{e.preventDefault();auto=false;stop();stage.classList.remove('ready');status.textContent='Rooftop illustration';disableControls();});
  resize();for(const button of stage.querySelectorAll('button'))button.disabled=false;stage.classList.add('ready');status.textContent='Drag to explore';
  function disableControls(){for(const button of stage.querySelectorAll('button'))button.disabled=true;canvas.tabIndex=-1;}
  return {dispose(){disposed=true;stop();for(const remove of listeners)remove();observer.disconnect();resizeObserver.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',reduceChange);scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});texture.dispose();renderer.dispose();}};
}
