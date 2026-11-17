const { chromium } = require('../.tmp/project-ui/node_modules/playwright');
const fs = require('fs');
const origin = process.argv[2] || 'http://127.0.0.1:4173';
const assert = require('node:assert/strict');
const project = {id:42,project_uuid:'PRJ-UI-TEST',project_number:'PROJ-2026-0042',customer_name:'Ananya Sharma Residential Rooftop Installation',customer_phone:'9876543210',customer_address:'42 Green Park Extension, near community centre',city:'Jaipur',state:'Rajasthan',system_capacity_kw:5.5,panel_count:10,inverter_kw:5,stage:'Installation In Progress',assigned_to_name:'Site delivery team',total_cost:320000,amount_received:120000,created_at:'2026-11-01T12:00:00',stage_updated_at:'2026-11-08T12:00:00',installation_start_date:'2026-11-12',stage_logs:[]};
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results=[];
 for(const role of [1,2,4]) {
  const context=await browser.newContext();const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.addInitScript(({role})=>{localStorage.setItem('token','synthetic-ui-test');localStorage.setItem('user',JSON.stringify({id:1,role_id:role,role_name:role===1?'Admin':role===2?'Manager':'Site Engineer',is_password_changed:1,full_name:'UI Test',permissions:[]}));localStorage.setItem('solar_crm_tour_done','true');}, {role});
  let failedList=false;
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.pathname.startsWith('/api')) {
    let data={success:true,data:[]};
    if(url.pathname.endsWith('/subscription/status')) data={success:true,data:{status:'Active',plan:{max_users:0,has_reports:1}}};
    else if(url.pathname.endsWith('/projects/stats')) data={success:true,data:[{stage:project.stage,count:1}]};
    else if(url.pathname==='/api/projects') {if(failedList) return route.fulfill({status:500,json:{success:false,message:'Synthetic connection failure'}});data={success:true,data:{projects:[project],total:1}};}
    else if(/^\/api\/projects\/(42|PRJ-UI-TEST)$/.test(url.pathname)) data={success:true,data:project};
    else if(url.pathname.endsWith('/warranty')) data={success:true,warranty:null,visits:[]};
    else if(url.pathname.endsWith('/handover')) data={success:true,handover:null};
    else if(url.pathname.includes('/loans')) data={success:true,data:null};
    else if(url.pathname.includes('/projects/')) data={success:true,data:null,logs:[]};
    else if(url.pathname.includes('/settings')) data={success:true,data:{company_name:'Solar workspace'}};
    return route.fulfill({json:data});
   }
   if(url.origin===origin) return route.continue();
   return route.abort();
  });
  const assertButtonsFit = async () => {
   const outside=await page.locator('.project-workspace .MuiButton-root, [role="dialog"] .MuiButton-root').evaluateAll(elements=>elements.filter(e=>{
    const r=e.getBoundingClientRect();return r.width && r.height && (r.left < -1 || r.right > innerWidth+1);
   }).map(e=>({text:e.textContent,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right})));
   assert.deepEqual(outside,[], 'Action buttons must remain inside the viewport');
  };
  const base=role===2?'/manager/projects':role===4?'/engineer/projects':'/projects';
  for(const width of [1440,768,390]) {
   await page.setViewportSize({width,height:1000});await page.goto(origin+base);await page.getByRole('button',{name:'Open project',exact:true}).first().waitFor();
   console.log('Checking',role,width);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert(overflow<=1,`list role ${role} width ${width}: overflow ${overflow}`);
   await page.screenshot({path:`.tmp/project-ui/list-${role}-${width}.png`,fullPage:true});
   if(role===1) {await page.getByRole('button',{name:'New project',exact:true}).click();await page.getByRole('dialog').waitFor();await page.waitForTimeout(250);await assertButtonsFit();await page.screenshot({path:`.tmp/project-ui/create-${width}.png`,fullPage:true});await page.getByRole('button',{name:'Cancel',exact:true}).click();}
   await page.getByRole('button',{name:'Open project',exact:true}).first().click();await page.getByRole('heading',{name:project.customer_name,exact:true}).waitFor();await page.evaluate(()=>scrollTo(0,0));
   assert(page.url().includes(base+'/PRJ-UI-TEST'));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,`detail overflow ${role} ${width}`);
   await page.screenshot({path:`.tmp/project-ui/detail-${role}-${width}.png`,fullPage:true});
   await page.getByRole('button',{name:'Edit details',exact:true}).click();await page.getByRole('dialog').waitFor();await page.waitForTimeout(250);await assertButtonsFit();await page.screenshot({path:`.tmp/project-ui/edit-${role}-${width}.png`,fullPage:true});await page.getByRole('button',{name:'Cancel',exact:true}).click();
   if(role===1) {
    for(const label of ['Stage History','Pre-Install Inspection','Installation Progress','Commissioning','Final Inspection','Customer Handover','Warranty & AMC','Solar Loan']) {
     await page.getByRole('tab',{name:label,exact:true}).click();await page.waitForTimeout(250);await assertButtonsFit();
     const tabOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(tabOverflow>1){console.log(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width}))));}assert(tabOverflow<=1,`tab ${label} overflow at ${width}`);
     await page.screenshot({path:`.tmp/project-ui/tab-${label.replace(/\W/g,'')}-${width}.png`,fullPage:true});
    }
   }
   results.push({role,width,overflow});
  }
  if(role===1){await page.goto(origin+base);await page.getByRole('button',{name:'Table view'}).click();await page.getByRole('table',{name:'Projects'}).waitFor();failedList=true;await page.getByRole('button',{name:'Refresh',exact:true}).click();await page.getByRole('alert').filter({hasText:'Synthetic connection failure'}).waitFor();failedList=false;await page.getByRole('button',{name:'Retry',exact:true}).click();await page.getByRole('button',{name:'Open project',exact:true}).first().waitFor();}
  assert.deepEqual(errors,[],`Runtime errors for role ${role}`);await context.close();
 }
 await browser.close();fs.writeFileSync('.tmp/project-ui/results.json',JSON.stringify(results,null,2));console.log('PASS',JSON.stringify(results));
})().catch(e=>{console.error(e);process.exit(1)});
