
const slides=[...document.querySelectorAll('.slide')];
const nav=document.querySelector('.nav');
let current=0,animating=false;

// 每页不同的入场/出场动画类名（10 页）
const slideFX=[
  {in:'fx-pixel',out:'fx-fade-out'},        // 0 封面：像素拼接 → 淡出
  {in:'fx-slide-left',out:'fx-slide-left-out'}, // 1 问题：左滑入 → 左滑出
  {in:'fx-zoom',out:'fx-zoom-out'},         // 2 遥感怎么做：放大入 → 放大出
  {in:'fx-rise',out:'fx-fall'},             // 3 互动地图：上浮入 → 下坠出
  {in:'fx-pixel',out:'fx-fade-out'},        // 4 建模演示：像素拼接 → 淡出
  {in:'fx-flip',out:'fx-flip-out'},         // 5 比较：翻转入 → 翻转出
  {in:'fx-slide-right',out:'fx-slide-left-out'}, // 6 谁受影响：右滑入 → 左滑出
  {in:'fx-zoom',out:'fx-zoom-out'},         // 7 行动：放大入 → 放大出
  {in:'fx-rise',out:'fx-fall'},             // 8 提问：上浮入 → 下坠出
  {in:'fx-pixel',out:'fx-fade-out'}         // 9 结尾：像素拼接 → 淡出
];

slides.forEach((s,i)=>{
  const b=document.createElement('button');
  b.title=s.dataset.title;b.setAttribute('aria-label',s.dataset.title);
  b.onclick=()=>showSlide(i);
  nav.appendChild(b);
});
const buttons=[...nav.children];

// 入场动画 item 延迟
slides.forEach(s=>{
  s.querySelectorAll('h2,h3,.quote,.card,.step,.flow,.map-wrap,.sat-demo-grid,.end-mark,.subtitle,.tree-conclusion').forEach((el,i)=>{
    el.classList.add('anim-item');el.style.setProperty('--d',Math.min(i*90,520)+'ms');
  });
});

// 像素拼接 overlay 工厂
function pixelReveal(slide){
  // 用 Canvas 实现像素拼接显现（可靠，不依赖复杂 CSS）
  const old=slide.querySelector('canvas.px-canvas');if(old)old.remove();
  const cv=document.createElement('canvas');
  cv.className='px-canvas';
  cv.style.cssText='position:absolute;inset:0;z-index:30;pointer-events:none;width:100%;height:100%';
  slide.appendChild(cv);
  const dpr=Math.min(devicePixelRatio||1,2);
  const w=slide.clientWidth||window.innerWidth,h=slide.clientHeight||window.innerHeight;
  cv.width=w*dpr;cv.height=h*dpr;
  const ctx=cv.getContext('2d');
  ctx.scale(dpr,dpr);
  // 像素尺寸
  const px=14;
  const cols=Math.ceil(w/px),rows=Math.ceil(h/px);
  // 初始铺满深色像素
  ctx.fillStyle='#08111d';
  ctx.fillRect(0,0,w,h);
  // 生成打乱顺序的像素索引
  const order=[];
  for(let i=0;i<cols*rows;i++)order.push(i);
  for(let i=order.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[order[i],order[j]]=[order[j],order[i]]}
  // 逐个擦除像素（露出下面内容）
  let k=0;
  const step=Math.max(1,Math.floor(cols*rows/48)); // 约48帧完成(~0.8秒)
  function tick(){
    for(let n=0;n<step;n++){
      if(k>=order.length){cv.remove();return}
      const idx=order[k++];
      const c=idx%cols,r=Math.floor(idx/cols);
      ctx.clearRect(c*px,r*px,px,px);
    }
    setTimeout(tick,16);
  }
  setTimeout(tick,16);
}

function clearFX(el){[...el.classList].filter(c=>c.startsWith('fx-')).forEach(c=>el.classList.remove(c))}

function showSlide(i){
  if(i===current||animating||i<0||i>=slides.length)return;
  animating=true;
  const prev=slides[current],next=slides[i];
  const pf=slideFX[current],nf=slideFX[i];
  // 出场
  clearFX(prev);
  prev.classList.add(pf.out);
  // 入场
  next.classList.add('is-active');
  const clouds=document.querySelector('.cloud-scene');
  if(clouds){clouds.classList.remove('reveal');void clouds.offsetWidth;clouds.classList.add('reveal')}
  clearFX(next);
  void next.offsetWidth;
  next.classList.add(nf.in);
  if(nf.in==='fx-pixel')pixelReveal(next);
  buttons.forEach((b,bi)=>b.classList.toggle('active',bi===i));
  current=i;
  updatePageControls();
  // 进入"比较"页时初始化 3D 街区模型
  if(next.dataset.title==='比较'&&window.__initCity3d){const boot=()=>window.__initCity3d();if(window.requestIdleCallback)requestIdleCallback(boot,{timeout:900});else setTimeout(boot,120)}
  setTimeout(()=>{prev.classList.remove('is-active');clearFX(prev);clearFX(next);animating=false;},650);
}
const prevBtn=document.getElementById('prevBtn');
document.getElementById('nextBtn').onclick=()=>showSlide(current+1);
prevBtn.onclick=()=>showSlide(current-1);
function updatePageControls(){prevBtn.disabled=current<=0;document.getElementById('nextBtn').disabled=current>=slides.length-1}
document.getElementById('printBtn').onclick=()=>window.print();

// 自动播放
let autoplay=null;const autoBtn=document.getElementById('autoBtn');
autoBtn.onclick=()=>{
  if(autoplay){clearInterval(autoplay);autoplay=null;autoBtn.classList.remove('autoplay-on');autoBtn.textContent='自动播放'}
  else{autoBtn.classList.add('autoplay-on');autoBtn.textContent='暂停播放';autoplay=setInterval(()=>{if(current>=slides.length-1){clearInterval(autoplay);autoplay=null;autoBtn.classList.remove('autoplay-on');autoBtn.textContent='自动播放'}else showSlide(current+1)},5200)}
};
const grid=document.getElementById('mapGrid');
const heatPatterns={hot:['hot','hot','high','hot','high','mid','mid','high','high','hot','hot','high','high','high','mid','mid','mid','high','high','hot','hot','high','mid','mid','mid','park','park','high','high','hot','high','mid','road','road','road','road','park','park','high','high','road','road','high','hot','high','mid','mid','mid'],warm:['mid','high','hot','high','mid','low','low','mid','low','mid','high','hot','high','mid','low','low','low','low','mid','high','hot','high','mid','low','low','park','park','mid','high','hot','mid','low','road','road','road','road','park','park','mid','high','road','road','mid','high','high','mid','low','low'],balanced:['low','mid','high','mid','low','low','low','mid','low','low','mid','high','mid','low','low','low','low','low','mid','mid','high','mid','low','low','low','park','park','mid','mid','high','mid','low','road','road','road','road','park','park','mid','mid','road','road','mid','mid','mid','low','low','low'],cool:['low','low','mid','low','low','low','low','low','low','low','low','mid','low','low','low','low','low','low','low','mid','mid','low','low','low','park','park','park','low','mid','mid','low','low','road','road','road','road','park','park','low','mid','road','road','low','mid','mid','low','low','low']};
const cells=[];for(let i=0;i<48;i++){const x=document.createElement('div');x.className='cell low';x.style.setProperty('--i',i);x.title='示意网格 '+(i+1);grid.appendChild(x);cells.push(x)}
const slider=document.getElementById('greenSlider');
function patternForRisk(risk){return risk>=78?heatPatterns.hot:risk>=64?heatPatterns.warm:risk>=48?heatPatterns.balanced:heatPatterns.cool}
function updateMap(){const v=+slider.value;document.getElementById('greenValue').textContent=v+'%';const risk=Math.round(91-(v-8)*1.55);document.getElementById('riskValue').firstChild.textContent=risk;const next=patternForRisk(risk);cells.forEach((c,i)=>{c.className='cell '+next[i];c.style.setProperty('--drop-delay',(i*18)+'ms');c.classList.remove('drop-in');void c.offsetWidth;c.classList.add('drop-in')});}
slider.addEventListener('input',updateMap);updateMap();
const stage=document.getElementById('spaceStage'),satellite=document.getElementById('dragSat'),target=document.getElementById('targetZone'),enterBtn=document.getElementById('enterSatView'),satView=document.getElementById('satView'),backBtn=document.getElementById('backToOrbit');
let dragging=false,ready=false,pos={x:75,y:21};
function renderSatellite(){satellite.style.left=pos.x+'%';satellite.style.top=pos.y+'%';const angle=Math.round(((pos.x-18)/69)*90);document.getElementById('angleValue').textContent=Math.max(0,Math.min(90,angle))+'°';document.getElementById('angleMeter').style.width=Math.max(8,Math.min(100,angle+10))+'%';const near=Math.abs(pos.x-87)<12&&Math.abs(pos.y-54)<16;ready=near;document.getElementById('satStatusDot').classList.toggle('ready',ready);document.getElementById('satStatus').textContent=ready?'观测窗口已锁定':'等待调整轨道';enterBtn.disabled=!ready;target.style.boxShadow=ready?'0 0 28px rgba(116,212,155,.7)':'none';target.style.borderColor=ready?'var(--green)':'rgba(255,180,84,.78)';}
function moveFromPointer(e){const r=stage.getBoundingClientRect();pos.x=Math.max(14,Math.min(88,((e.clientX-r.left)/r.width)*100));pos.y=Math.max(12,Math.min(80,((e.clientY-r.top)/r.height)*100));renderSatellite();}
satellite.addEventListener('pointerdown',e=>{dragging=true;satellite.setPointerCapture(e.pointerId);e.preventDefault()});satellite.addEventListener('pointermove',e=>{if(dragging)moveFromPointer(e)});satellite.addEventListener('pointerup',()=>{dragging=false});satellite.addEventListener('keydown',e=>{if(e.key==='ArrowRight')pos.x=Math.min(88,pos.x+4);if(e.key==='ArrowLeft')pos.x=Math.max(14,pos.x-4);if(e.key==='ArrowDown')pos.y=Math.min(80,pos.y+4);if(e.key==='ArrowUp')pos.y=Math.max(12,pos.y-4);renderSatellite()});
enterBtn.addEventListener('click',()=>{satView.classList.add('active');satView.setAttribute('aria-hidden','false')});backBtn.addEventListener('click',()=>{satView.classList.remove('active');satView.setAttribute('aria-hidden','true')});renderSatellite();
const treeInfo={root:{title:'先看一张关系图',text:'热风险不是一个抽象数字，它会沿着城市空间，落到具体的人身上。',tags:['空间','暴露','健康']},vulnerable:{title:'老人和儿童',text:'体温调节能力相对弱，步行、上学或就医时更需要连续树荫、休息点和饮水设施。',tags:['脆弱性更高','需要近距离降温','健康风险']},workers:{title:'户外劳动者',text:'骑手、环卫工人和建筑工人无法轻易避开高温路段，热暴露时间更长，路线也更固定。',tags:['暴露时间长','路线固定','补水休息']},community:{title:'高密度社区',text:'建筑密集、通风不足、绿地较少的区域，可能长期缺少有效降温空间。',tags:['硬化地面多','绿地不足','优先改造']}};
const treeTitle=document.getElementById('treeTitle'),treeText=document.getElementById('treeText'),treeTags=document.getElementById('treeTags');document.querySelectorAll('[data-tree]').forEach(btn=>btn.addEventListener('click',()=>{const key=btn.dataset.tree,info=treeInfo[key];document.querySelectorAll('.tree-node,.tree-root').forEach(n=>n.classList.remove('selected'));btn.classList.add('selected');treeTitle.textContent=info.title;treeText.textContent=info.text;treeTags.innerHTML=info.tags.map(t=>'<span class="chip">'+t+'</span>').join('');treeText.classList.remove('typed');void treeText.offsetWidth;treeText.classList.add('typed')}));

/* ===== 封面：持续旋转地球 + 环绕卫星 + 素材循环 ===== */
(function(){
  const cont=document.getElementById('heroContinents');
  if(cont){
    const defs=[
      {w:88,h:50,l:24,t:52,r:-18},{w:66,h:42,l:118,t:90,r:24},{w:72,h:33,l:62,t:118,r:10},
      {w:40,h:26,l:150,t:30,r:6},{w:52,h:28,l:10,t:120,r:-8},{w:34,h:22,l:96,t:150,r:30}
    ];
    defs.forEach(d=>{const e=document.createElement('div');e.className='hcont';e.style.cssText=`width:${d.w}px;height:${d.h}px;left:${d.l}px;top:${d.t}px;transform:rotate(${d.r}deg)`;cont.appendChild(e)});
  }
  const cap=document.getElementById('heroCaption');
  const dither=document.getElementById('heroDither');
  const dctx=dither&&dither.getContext('2d');
  const sampler=document.createElement('canvas');sampler.width=512;sampler.height=512;const sctx=sampler.getContext('2d',{willReadFrequently:true});
  const earthImage=new Image();earthImage.src='assets/earth_day_2048.jpg';
  const earth=document.getElementById('heroEarth');
  function drawDither(t=0){
    if(!dither||!dctx)return;
    const r=dither.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);const w=Math.max(1,r.width),h=Math.max(1,r.height);
    if(dither.width!==Math.round(w*dpr)||dither.height!==Math.round(h*dpr)){dither.width=Math.round(w*dpr);dither.height=Math.round(h*dpr)}
    dctx.setTransform(dpr,0,0,dpr,0,0);dctx.clearRect(0,0,w,h);
    const er=earth.getBoundingClientRect(),dr=dither.getBoundingClientRect(),cx=er.left-dr.left+er.width/2,cy=er.top-dr.top+er.height/2,rad=er.width/2;
    let pixels=null;if(earthImage.complete&&earthImage.naturalWidth){sctx.drawImage(earthImage,0,0,512,512);pixels=sctx.getImageData(0,0,512,512).data}
    const gap=Math.max(7,Math.round(Math.min(w,h)/112));
    for(let y=gap/2;y<h;y+=gap){for(let x=gap/2;x<w;x+=gap){const dx=(x-cx)/rad,dy=(y-cy)/rad,dist=Math.hypot(dx,dy);let alpha=0.06,color='155,141,181';if(dist<1.06){const z=Math.sqrt(Math.max(0,1-dx*dx-dy*dy));const lon=Math.atan2(dx,z),lat=Math.asin(-dy);const u=Math.min(511,Math.max(0,Math.floor((lon/(Math.PI*2)+.5)*511))),v=Math.min(511,Math.max(0,Math.floor((lat/Math.PI+.5)*511)));if(pixels){const p=(v*512+u)*4;color=pixels[p]+','+pixels[p+1]+','+pixels[p+2]}alpha=Math.max(.12,.62*(1-Math.max(0,dist-.72)*1.8))*(.9+.1*Math.sin(t*.002+x*.02+y*.017))}else if(dist<1.34){alpha=.15*(1-(dist-1.06)/.28);color='145,125,180'}if(alpha>0.01){dctx.fillStyle='rgba('+color+','+alpha+')';dctx.fillRect(Math.round(x),Math.round(y),Math.max(1,gap-1),Math.max(1,gap-1))}}}
    requestAnimationFrame(drawDither);
  }
  earthImage.onload=()=>drawDither(0);drawDither(0);
  const scenes=[
    {label:'热红外扫描', b:'地表温度 LST', hue:-12},
    {label:'植被识别', b:'绿地覆盖 NDVI', hue:56},
    {label:'城市地表', b:'不透水面比例', hue:18}
  ];
  let si=Math.floor(Math.random()*scenes.length);
  function nextScene(){
    const s=scenes[si];
    cap.innerHTML='正在 '+s.label+' · 关键指标 <b>'+s.b+'</b>';
    if(earth)earth.style.filter='none';
    if(dither)dither.style.filter='none';
    si=(si+1)%scenes.length;
  }
  nextScene();setInterval(nextScene,3600);
})();

/* ===== 卫星视角：地区切换 + 真实 3D 地球 ===== */
(function(){
  const regions={
    rio:{img:'assets/rio_heat.png',sub:'RIO DE JANEIRO · LAND SURFACE TEMPERATURE',caption:'真实遥感图：里约热内卢北部地表温度，NASA Earth Observatory，基于 ECOSTRESS 与 Landsat 数据。',src:'https://science.nasa.gov/earth/earth-observatory/climate-proofing-rio-de-janeiro-90687/',read:'深蓝区域相对较凉，对应森林、水体或大型绿地；浅紫、粉白区域较热，对应机场、港口、高速路和密集建成区。',lat:-22.9,lon:-43.2},
    lahore:{img:'assets/lahore_heat.jpg',sub:'LAHORE · NIGHTTIME LST (ECOSTRESS)',caption:'真实遥感图：巴基斯坦拉合尔夜间地表温度，NASA ECOSTRESS 观测，显示公园与水体对城市热岛的降温作用。',src:'https://science.nasa.gov/earth/earth-observatory/beating-the-heat-in-pakistan/',read:'夜间热红外更能看清城市热岛：绿化好、靠近水体的区域呈蓝白色（较凉），密集建成区呈红橙色（较热），温差可达数度。',lat:31.5,lon:74.3},
    nyc:{img:'assets/nyc_heat.jpg',sub:'NEW YORK CITY · TEMPERATURE & VEGETATION',caption:'真实遥感图：纽约市地表温度（上）与植被覆盖（下）对比，NASA Landsat 数据，清晰展示植被越密、温度越低。',src:'https://science.nasa.gov/earth/earth-observatory/new-york-city-temperature-and-vegetation/',read:'上下对比可见：中央公园等绿地区域温度明显更低，而密集建成区温度更高——植被覆盖与地表温度高度相关。',lat:40.7,lon:-74.0}
  };
  const img=document.getElementById('regionImage'),sub=document.getElementById('regionSubtitle'),cap=document.getElementById('regionCaption'),readEl=document.querySelector('.sat-view-read');

  /* 真实 3D 地球（Three.js + 真实纹理） */
  function initGlobe(){
    const host=document.getElementById('globe3d');
    if(!host||!window.THREE||host.dataset.init)return;
    host.dataset.init='1';
    host.querySelector('.city3d-fallback')?.remove();
    const w=host.clientWidth||360,h=host.clientHeight||320;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(40,w/h,0.1,100);
    camera.position.set(0,0,3.0);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    renderer.setSize(w,h);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff,.85));
    const sun=new THREE.DirectionalLight(0xffffff,1.4);sun.position.set(5,2,4);scene.add(sun);

    // 地球主体：真实纹理
    const group=new THREE.Group();scene.add(group);
    const earth=new THREE.Mesh(
      new THREE.SphereGeometry(1,96,96),
      new THREE.MeshPhongMaterial({color:0xffffff,shininess:8,specular:0x1a2a33})
    );
    group.add(earth);

    // 大气层光晕
    const atmos=new THREE.Mesh(
      new THREE.SphereGeometry(1.02,64,64),
      new THREE.MeshBasicMaterial({color:0x53d6e5,transparent:true,opacity:.12,side:THREE.BackSide})
    );
    group.add(atmos);

    // 轨道环 + 卫星点
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1.6,.006,8,140),new THREE.MeshBasicMaterial({color:0x53d6e5,transparent:true,opacity:.4}));
    ring.rotation.x=Math.PI/2.35;ring.rotation.y=-0.3;scene.add(ring);
    const satPivot=new THREE.Group();scene.add(satPivot);
    satPivot.rotation.x=Math.PI/2.35;satPivot.rotation.y=-0.3;
    const satDot=new THREE.Mesh(new THREE.SphereGeometry(.045,12,12),new THREE.MeshBasicMaterial({color:0xffb454}));
    satDot.position.set(1.6,0,0);satPivot.add(satDot);

    // 星空
    const starPos=[];for(let i=0;i<300;i++){starPos.push((Math.random()-.5)*14,(Math.random()-.5)*14,(Math.random()-.5)*14)}
    const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));
    const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xffffff,size:.025,transparent:true,opacity:.75}));
    scene.add(stars);

    // 加载真实地球纹理
    const loader=new THREE.TextureLoader();
    const tex=loader.load('assets/earth_day_2048.jpg',()=>{
      earth.material.map=tex;
      earth.material.color.set(0xffffff);
      earth.material.needsUpdate=true;
    },undefined,()=>{
      // 本地 file:// 环境若阻止纹理读取，保留有色地球作为可见降级画面
      earth.material.map=null;
      earth.material.color.set(0x2c7f9c);
      earth.material.needsUpdate=true;
    });

    // 经纬度 → 目标旋转（把目标点转到相机正前方 +z）
    function latLonToRot(lat,lon){
      // three.js SphereGeometry 顶点公式：
      // x = -cos(phi)*sin(theta), y = cos(theta), z = sin(phi)*sin(theta)
      // 其中 phi = u*2π（u=(lon+180)/360），theta = v*π（v=(90-lat)/180）
      const phi=(lon+180)*Math.PI/180;
      const theta=(90-lat)*Math.PI/180;
      const x=-Math.cos(phi)*Math.sin(theta);
      const y=Math.cos(theta);
      const z=Math.sin(phi)*Math.sin(theta);
      // 绕 y 轴旋转使点转到 +z：ry = atan2(-x, z)
      // 绕 x 轴旋转使点抬到赤道：rx = atan2(y, z)
      const ry=Math.atan2(-x,z);
      const rx=Math.atan2(y,z);
      return {ry, rx};
    }

    // 平滑动画：旋转 + 拉近
    let targetRX=0,targetRY=0,targetZoom=3.0;
    function flyTo(lat,lon){
      const r=latLonToRot(lat,lon);
      targetRY=r.ry;targetRX=r.rx;targetZoom=2.35;
    }

    // 拖拽旋转
    let dragging=false,px=0,py=0,curRX=0,curRY=0,velX=0,velY=0;
    function onDown(e){dragging=true;px=e.clientX;py=e.clientY;host.setPointerCapture&&host.setPointerCapture(e.pointerId);host.style.cursor='grabbing'}
    function onMove(e){
      if(!dragging)return;
      const dx=e.clientX-px,dy=e.clientY-py;px=e.clientX;py=e.clientY;
      curRY+=dx*0.005;curRX+=dy*0.005;
      curRX=Math.max(-Math.PI/2,Math.min(Math.PI/2,curRX));
      targetRX=curRX;targetRY=curRY;
    }
    function onUp(){dragging=false;host.style.cursor='grab'}
    host.addEventListener('pointerdown',onDown);
    window.addEventListener('pointermove',onMove);
    window.addEventListener('pointerup',onUp);
    host.style.cursor='grab';
    host.addEventListener('wheel',e=>{e.preventDefault();targetZoom=Math.max(2.0,Math.min(4.5,targetZoom+e.deltaY*0.003));},{passive:false});

    function animate(){
      requestAnimationFrame(animate);
      earth.rotation.y+=0.0012;           // 地球自身缓慢自转
      ring.rotation.z+=0.0006;
      satPivot.rotation.z-=0.012;
      stars.rotation.y+=0.0003;
      // 平滑逼近目标（拖拽或 flyTo 设置的目标）
      curRX+=(targetRX-curRX)*0.07;curRY+=(targetRY-curRY)*0.07;
      group.rotation.x=curRX;group.rotation.y=curRY;
      camera.position.z+=(targetZoom-camera.position.z)*0.08;
      renderer.render(scene,camera);
    }
    animate();

    function focusRegion(key){const r=regions[key];if(r)flyTo(r.lat,r.lon)}
    window.__globe={focusRegion:focusRegion};

    window.addEventListener('resize',()=>{const w2=host.clientWidth||360,h2=host.clientHeight||320;camera.aspect=w2/h2;camera.updateProjectionMatrix();renderer.setSize(w2,h2)});
  }

  document.querySelectorAll('.region-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.region-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const r=regions[btn.dataset.region];
      img.src=r.img;img.alt=r.sub;
      sub.textContent=r.sub;
      cap.innerHTML=r.caption+'<br><a href="'+r.src+'" target="_blank" rel="noreferrer" style="color:var(--cyan)">查看 NASA 来源说明</a>';
      readEl.innerHTML='<b>读图方法：</b>'+r.read;
      if(window.__globe&&window.__globe.focusRegion)window.__globe.focusRegion(btn.dataset.region);
    });
  });

  // 进入卫星视角时初始化 3D 地球（此时容器可见、有尺寸）
  let globeStarted=false;
  function startGlobe(){if(globeStarted)return;globeStarted=true;requestAnimationFrame(()=>requestAnimationFrame(initGlobe))}
  document.getElementById('enterSatView').addEventListener('click',startGlobe);
  if(window.ResizeObserver){new ResizeObserver(()=>{const sv=document.getElementById('satView');if(sv.classList.contains('active'))startGlobe()}).observe(document.getElementById('satView'))}
})();

/* ===== 现场提问：树状图交互 ===== */
(function(){
  const qaInfo={
    root:{title:'现场提问',text:'从数据可信度、遥感原理、应用价值三个方向，整理现场可能被问到的问题。'},
    data:{title:'数据可信度',text:'演示中的示意网格与3D街区模型是为讲解而设的模型，非实测值；卫星视角的三张图是 NASA 公开发布的真实热红外数据。'},
    theory:{title:'遥感原理',text:'遥感是"多波段"的：可见光看形态、近红外看植被、热红外反演地表温度，能看到人眼看不见的信息。'},
    value:{title:'应用与价值',text:'遥感能大范围、可重复地定位城市热风险，帮助精准施策并验证改造效果。'},
    q1:{title:'这些温度数据是真的吗？',text:'示意网格和3D街区模型是为讲解清晰而做的模型，不是实测值；但卫星视角里的三张图是 NASA 公开发布的真实热红外遥感数据（里约、拉合尔、纽约），附有来源链接。两者在页面里都做了明确标注。'},
    q2:{title:'LST 和气温是一回事吗？',text:'不是。LST 是卫星用热红外传感器测到的"地面表面"温度，反映路面、屋顶、草地被晒得多烫；气温是离地约 1.5 米的空气温度。夏天正午沥青路面 LST 可比气温高出 20℃ 以上。'},
    q3:{title:'为什么卫星能看出温度？',text:'卫星不是普通相机。它携带多个波段传感器：可见光看"长什么样"、近红外看植被健康、热红外测地面辐射的热量并反演出温度，因此能看到人眼看不见的信息。'},
    q4:{title:'为什么同城温差这么大？',text:'主要取决于地表材料与覆盖：混凝土、沥青、金属屋面吸热多、散热慢会积累热量；绿地、树荫、水体通过蒸散和遮阴降温。加上建筑密集、通风差、人为热源集中，形成"热岛"中的"热点"。'},
    q5:{title:'遥感真能帮城市降温吗？',text:'能。遥感可以低成本、大范围、可重复地"看"整座城市的热分布，帮管理者定位高风险街区、优先补种树荫、建口袋公园和饮水点，并在改造后用多时相图像验证是否真的变凉。'},
    q6:{title:'"热不平等"是否被夸大？',text:'不是。大量研究（含 NASA 与学术论文）显示，绿地、树荫等降温资源在城市分布并不均匀，往往与收入、社区等因素相关，而老人、儿童、户外劳动者暴露时间更长。遥感恰好能把这些"不显眼"的差异放到同一张图上比较。'}
  };
  const titleEl=document.getElementById('qaTitle'),textEl=document.getElementById('qaText');
  document.querySelectorAll('[data-qa]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const key=btn.dataset.qa,info=qaInfo[key];
      document.querySelectorAll('.qa-q,.qa-node').forEach(n=>n.classList.remove('active'));
      btn.classList.add('active');
      titleEl.textContent=info.title;textEl.textContent=info.text;
    });
  });
})();

/* ===== FlexCarousel：地区热环境图片轮播（plain JS/CSS 适配） ===== */
(function(){
  const host=document.getElementById('flexCarousel');
  const detail=document.getElementById('carouselDetail');
  if(!host||!detail)return;
  const fallback=host.querySelector('.carousel-fallback');
  const items=[
    {key:'rio',src:'assets/rio_heat.png',title:'里约热内卢',subtitle:'ECOSTRESS + Landsat · 地表温度',text:'森林、机场、港口和密集建成区之间的地表温度差异，可以在同一张热红外图上直接比较。'},
    {key:'lahore',src:'assets/lahore_heat.jpg',title:'拉合尔',subtitle:'ECOSTRESS · 夜间地表温度',text:'夜间热红外图可以帮助我们观察：绿地和水体附近相对较凉，密集建成区更容易保留热量。'},
    {key:'nyc',src:'assets/nyc_heat.jpg',title:'纽约',subtitle:'Landsat · 温度与植被对比',text:'中央公园等绿地区域与周围建成区形成对比，说明植被覆盖和地表温度之间存在可观察的空间关系。'},
    {key:'visible',src:'assets/rio_visible.png',title:'里约可见光',subtitle:'可见光底图 · 与热图对照',text:'先看地表形态，再与热红外图叠加，可以把“哪里热”和“那里是什么地表”联系起来。'}
  ];
  let index=0,down=false,startX=0,startIndex=0,detailOpen=false,auto=null;const enableAuto=false;
  const track=document.createElement('div');track.className='flex-carousel__track';
  const hint=document.createElement('div');hint.className='flex-carousel__hint';hint.textContent='拖动 · 点击查看';
  const dots=document.createElement('div');dots.className='flex-carousel__dots';
  host.append(track,hint,dots);
  const cards=items.map((item,i)=>{
    const card=document.createElement('div');card.className='flex-carousel__card';card.dataset.index=i;card.innerHTML='<img src="'+item.src+'" alt="'+item.title+'遥感图"><div class="flex-carousel__shade"></div><div class="flex-carousel__caption"><b>'+item.title+'</b><span>'+item.subtitle+'</span></div>';
    card.querySelector('img').addEventListener('load',()=>{if(fallback)fallback.remove()},{once:true});
    card.addEventListener('click',()=>{if(i!==index){index=i;detailOpen=false;render()}else{detailOpen=!detailOpen;renderDetail()}});track.appendChild(card);return card;
  });
  items.forEach((_,i)=>{const b=document.createElement('button');b.setAttribute('aria-label','查看第'+(i+1)+'个地区');b.addEventListener('click',()=>{index=i;detailOpen=false;render()});dots.appendChild(b)});
  function renderDetail(){detail.classList.remove('reveal');void detail.offsetWidth;detail.classList.add('reveal');const item=items[index];detail.innerHTML=detailOpen?'<b>'+item.title+' · '+item.subtitle+'</b><span>'+item.text+'</span>':'<b>点击中间图片查看详情</b><span>当前：'+item.title+'。再点一次展开讲解重点。</span>';}
  function render(){cards.forEach((c,i)=>c.classList.toggle('is-active',i===index));[...dots.children].forEach((b,i)=>b.classList.toggle('active',i===index));const cardW=cards[0]?.getBoundingClientRect().width||host.clientWidth*.46;const gap=12;const offset=host.clientWidth/2-(index*(cardW+gap)+cardW/2);track.style.transform='translateX('+offset+'px)';renderDetail();if(window.__setCity3dRegion)window.__setCity3dRegion(items[index].key)}
  function go(delta){index=(index+delta+items.length)%items.length;detailOpen=false;render()}
  host.addEventListener('pointerdown',e=>{down=true;startX=e.clientX;startIndex=index;host.setAttribute('data-dragging','');if(auto){clearInterval(auto);auto=null}});
  host.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-startX;if(Math.abs(dx)>35){const step=dx<0?1:-1;index=(startIndex+step+items.length)%items.length;render()}});
  host.addEventListener('pointerup',()=>{down=false;host.removeAttribute('data-dragging');startAuto()});host.addEventListener('pointercancel',()=>{down=false;host.removeAttribute('data-dragging');startAuto()});
  host.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();go(1)}if(e.key==='ArrowLeft'){e.preventDefault();go(-1)}if(e.key==='Enter'){detailOpen=!detailOpen;renderDetail()}});host.tabIndex=0;
  function startAuto(){if(!enableAuto||auto||document.hidden)return;auto=setInterval(()=>{if(!down)go(1)},5200)}
  window.addEventListener('resize',render);render();if(enableAuto)startAuto();
})();

/* ===== 3D 街区热量模型（Three.js） ===== */
(function(){
  function initCity3d(){
    const host=document.getElementById('city3d');
    if(!host||!window.THREE||host.dataset.init)return;
    host.dataset.init='1';
    const w=host.clientWidth||360,h=host.clientHeight||300;
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(42,w/h,0.1,100);
    camera.position.set(4.2,3.6,6.5);
    camera.lookAt(0,1,0);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    renderer.setSize(w,h);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff,.75));
    const sun=new THREE.DirectionalLight(0xffffff,1.2);sun.position.set(4,6,4);scene.add(sun);
    const rim=new THREE.DirectionalLight(0x53d6e5,.5);rim.position.set(-3,-1,-3);scene.add(rim);

    const group=new THREE.Group();scene.add(group);

    // 地面
    const floor=new THREE.Mesh(
      new THREE.PlaneGeometry(9,6),
      new THREE.MeshPhongMaterial({color:0x12222f})
    );
    floor.rotation.x=-Math.PI/2;floor.position.y=0;group.add(floor);
    // 地面网格
    const grid=new THREE.GridHelper(9,12,0x1d3a4d,0x152a38);
    grid.position.y=0.01;group.add(grid);

    // 街区柱子：高度表示热风险
    const blocks=[
      {x:-2.4,z:-1,label:'A区',h:0.6,c:0x74d49b,desc:'绿地多，降温资源较充足'},
      {x:-0.8,z:-1,label:'B区',h:1.5,c:0xffb454,desc:'硬化地面较多，热量积累'},
      {x:0.8,z:-1,label:'高暴露区',h:2.3,c:0xff6b5f,desc:'高人流叠加高温，优先关注'},
      {x:2.4,z:-1,label:'改造后',h:1.0,c:0x53d6e5,desc:'增加树荫后，风险下降'}
    ];
    const pillars=[];
    blocks.forEach(b=>{
      const geo=new THREE.BoxGeometry(1.1,b.h,1.1);
      const mat=new THREE.MeshPhongMaterial({color:b.c,shininess:20,emissive:new THREE.Color(b.c).multiplyScalar(.18)});
      const m=new THREE.Mesh(geo,mat);
      m.position.set(b.x,b.h/2,b.z);
      m.userData={...b,baseH:b.h};
      group.add(m);
      pillars.push(m);
      // 顶部发光边
      const edge=new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.25})
      );
      edge.position.copy(m.position);group.add(edge);m.userData.edge=edge;
    });

    // 用 Canvas 生成文字标签 sprite
    function makeLabel(text,color){
      const c=document.createElement('canvas');c.width=256;c.height=64;
      const ctx=c.getContext('2d');
      ctx.fillStyle='rgba(6,17,30,.82)';ctx.fillRect(0,0,256,64);
      ctx.strokeStyle='rgba(83,214,229,.5)';ctx.lineWidth=2;ctx.strokeRect(1,1,254,62);
      ctx.fillStyle=color;ctx.font='bold 30px "Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(text,128,32);
      const tex=new THREE.CanvasTexture(c);tex.minFilter=THREE.LinearFilter;
      const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));
      sp.scale.set(1.3,.325,1);
      return sp;
    }
    blocks.forEach((b,i)=>{
      const s=makeLabel(b.label, b.c===0x74d49b?'#74d49b':b.c===0xffb454?'#ffb454':b.c===0xff6b5f?'#ff6b5f':'#53d6e5');
      s.position.set(b.x,b.h+0.55,b.z);group.add(s);pillars[i].userData.label=s;
    });

    const regionHeights={rio:[.65,1.45,2.35,1.0],lahore:[1.55,2.15,2.8,1.9],nyc:[.55,1.1,1.8,.85],visible:[.45,.9,1.35,.7]};
    window.__setCity3dRegion=function(key){const hs=regionHeights[key]||regionHeights.rio;pillars.forEach((p,i)=>{const h=hs[i]||p.userData.baseH;p.userData.h=h;p.userData.targetScale=h/p.userData.baseH;p.position.y=h/2;if(p.userData.edge){p.userData.edge.scale.y=h/p.userData.baseH;p.userData.edge.position.y=h/2}if(p.userData.label)p.userData.label.position.y=h+.55})};
    window.__setCity3dRegion('rio');

    // 拖拽旋转
    let dragging=false,px=0,py=0,ry=0.6,rx=0.15;
    function onDown(e){dragging=true;px=e.clientX;py=e.clientY;host.style.cursor='grabbing'}
    function onMove(e){
      if(!dragging)return;
      const dx=e.clientX-px,dy=e.clientY-py;px=e.clientX;py=e.clientY;
      ry+=dx*0.006;rx+=dy*0.003;rx=Math.max(-0.2,Math.min(1.0,rx));
    }
    function onUp(){dragging=false;host.style.cursor='grab'}
    host.addEventListener('pointerdown',onDown);
    window.addEventListener('pointermove',onMove);
    window.addEventListener('pointerup',onUp);
    host.style.cursor='grab';
    host.addEventListener('wheel',e=>{e.preventDefault();camera.position.z=Math.max(4,Math.min(11,camera.position.z+e.deltaY*0.008));},{passive:false});

    let hovered=null;
    const raycaster=new THREE.Raycaster();
    const mouse=new THREE.Vector2();
    host.addEventListener('pointermove',e=>{
      if(dragging)return;
      const r=host.getBoundingClientRect();
      mouse.x=((e.clientX-r.left)/r.width)*2-1;mouse.y=-((e.clientY-r.top)/r.height)*2+1;
      raycaster.setFromCamera(mouse,camera);
      const hit=raycaster.intersectObjects(pillars)[0];
      hovered=hit?hit.object:null;
      host.style.cursor=hovered?'pointer':'grab';
    });

    function animate(){
      requestAnimationFrame(animate);
      group.rotation.y=ry;group.rotation.x=rx;
      pillars.forEach(p=>{
        const isHover=p===hovered;
        const base=p.userData.h;
        const targetScale=(isHover?1.08:1)*(p.userData.targetScale||1);
        p.scale.y+=(targetScale-p.scale.y)*0.15;
        p.material.emissive.set(new THREE.Color(p.userData.c).multiplyScalar(isHover?.5:.18));
      });
      renderer.render(scene,camera);
    }
    animate();

    window.addEventListener('resize',()=>{const w2=host.clientWidth||360,h2=host.clientHeight||300;camera.aspect=w2/h2;camera.updateProjectionMatrix();renderer.setSize(w2,h2)});
  }
  // 05 页显示时初始化
  window.__initCity3d=initCity3d;
})();

/* ===== 全局按钮：Interactive Hover Button 视觉适配 ===== */
(function(){
  document.querySelectorAll('button').forEach(btn=>{
    if(btn.dataset.ihbReady)return;
    btn.dataset.ihbReady='1';
    btn.classList.add('ihb');
    if(btn.closest('.nav'))btn.classList.add('nav-dot');
    const html=btn.innerHTML;
    btn.innerHTML='<span class="ihb-label">'+html+'</span>';
  });
})();

/* ===== GlowCursor：无构建依赖的 JS-CSS 发光拖尾适配 ===== */
(function(){
  if(matchMedia('(pointer:coarse)').matches)return;
  document.documentElement.classList.add('hide-system-cursor');
  const layer=document.createElement('canvas');layer.className='glow-cursor-layer';layer.setAttribute('aria-hidden','true');document.body.appendChild(layer);const ctx=layer.getContext('2d');
  const points=[];const bursts=[];let w=0,h=0,dpr=1,lastX=-999,lastY=-999,last=performance.now();
  function resize(){dpr=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;layer.width=w*dpr;layer.height=h*dpr;layer.style.width=w+'px';layer.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
  function addPoint(x,y,power=1){points.push({x,y,life:1,power,phase:Math.random()*6.28});if(points.length>90)points.shift()}
  function addBurst(x,y){bursts.push({x,y,r:3,life:1});if(bursts.length>8)bursts.shift()}
  addEventListener('resize',resize);resize();
  addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const d=Math.hypot(e.clientX-lastX,e.clientY-lastY);if(d>5)addPoint(e.clientX,e.clientY,Math.min(1.3,d/36));lastX=e.clientX;lastY=e.clientY});
  addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')addBurst(e.clientX,e.clientY)});
  function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;ctx.clearRect(0,0,w,h);ctx.save();ctx.globalCompositeOperation='lighter';for(let i=points.length-1;i>=0;i--){const p=points[i];p.life-=dt*(.55+1.05*(1-p.power*.25));if(p.life<=0){points.splice(i,1);continue}const a=p.life*p.life*.18;const radius=3+p.power*10;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,radius*3.8);g.addColorStop(0,'rgba(95,139,255,'+(a*1.4)+')');g.addColorStop(.35,'rgba(154,134,220,'+(a*.72)+')');g.addColorStop(1,'rgba(154,134,220,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,radius*3.8,0,Math.PI*2);ctx.fill()}bursts.forEach(b=>{b.r+=dt*180;b.life-=dt*1.5;ctx.strokeStyle='rgba(122,158,255,'+(b.life*b.life*.48)+')';ctx.lineWidth=1.5+b.life*3;ctx.shadowBlur=18;ctx.shadowColor='rgba(95,139,255,.4)';ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.stroke()});for(let i=bursts.length-1;i>=0;i--)if(bursts[i].life<=0)bursts.splice(i,1);ctx.restore();requestAnimationFrame(loop)}requestAnimationFrame(loop);
})();

/* ===== 按钮磁吸：靠近时轻微跟随，离开后回弹 ===== */
(function(){
  const targets=[...document.querySelectorAll('button.ihb:not(.nav-dot):not(.flex-carousel__dots button)')];
  let mx=-9999,my=-9999;
  window.addEventListener('pointermove',e=>{mx=e.clientX;my=e.clientY;targets.forEach(btn=>{const r=btn.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=mx-cx,dy=my-cy,dist=Math.hypot(dx,dy),range=110;if(dist<range){const force=(1-dist/range)*.16;btn.style.transform='translate('+Math.max(-8,Math.min(8,dx*force))+'px,'+Math.max(-6,Math.min(6,dy*force))+'px)'}else if(!btn.matches(':hover'))btn.style.transform=''})});
  window.addEventListener('pointerleave',()=>targets.forEach(btn=>btn.style.transform=''));
})();

// 初始化第一页
(function(){
  slides[0].classList.add('is-active');
  const clouds=document.querySelector('.cloud-scene');
  if(clouds){clouds.classList.add('reveal')}
  slides[0].classList.add(slideFX[0].in);
  // 首屏直接显示，避免 Edge 直接打开时像素遮罩阻塞内容
  buttons[0].classList.add('active');
  current=0;
  updatePageControls();
  setTimeout(()=>{clearFX(slides[0])},700);
})();
