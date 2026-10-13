import { test, expect, request as requestFactory, APIRequestContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const manifest = process.env.HOMOLOG_FIXTURES_FILE;
if (!manifest) throw new Error('Authorized temporary fixture manifest is required');
const f = JSON.parse(fs.readFileSync(manifest, 'utf8'));
if (!f.runId.startsWith('homolog-cutover-')) throw new Error('Invalid temporary fixture scope');
const [a,b]=f.tenants;
async function login(api:APIRequestContext, t:any, who:'client'|'admin') {
  const r=await api.post('/api/auth/login',{headers:{'x-tenant-slug':t.slug,'x-requested-with':'XMLHttpRequest'},data:{email:t[who].email,password:f.password}});
  expect(r.status()).toBe(200);const body=await r.json();
  const token=body.data.accessToken;
  expect(typeof token).toBe('string');
  return {'x-tenant-slug':t.slug,'x-requested-with':'XMLHttpRequest',Authorization:'Bearer '+token};
}

test('API real: sessÃƒÆ’Ã‚Âµes, catÃƒÆ’Ã‚Â¡logo, pedidos, agenda, isolamento, branding e ÃƒÆ’Ã‚Â¡udio privado',async ({request,baseURL},info)=>{
 const admin=await login(request,a,'admin'), client=await login(request,a,'client');
 const second=await requestFactory.newContext({baseURL});const other=await login(second,b,'admin');
 const suffix=crypto.randomUUID().slice(0,8);
 try {
  expect((await request.get('/api/auth/profile',{headers:client})).status()).toBe(200);
  const refresh=await request.post('/api/auth/refresh',{headers:{'x-tenant-slug':a.slug,'x-requested-with':'XMLHttpRequest'}});expect(refresh.status()).toBe(200);
  const rotated={...client,Authorization:'Bearer '+(await refresh.json()).data.accessToken};
  expect((await request.get('/api/products',{headers:client})).status()).toBe(403);
  expect((await request.get('/api/products',{headers:{...client,'x-tenant-slug':b.slug}})).status()).toBe(403);
  const catalog=await request.get('/api/products/public',{headers:{'x-tenant-slug':a.slug,'x-requested-with':'XMLHttpRequest'}});expect(catalog.status()).toBe(200);
  expect(JSON.stringify(await catalog.json()).includes(a.productId)).toBe(true);expect(JSON.stringify(await catalog.json()).includes(b.productId)).toBe(false);
  const made=await request.post('/api/products',{headers:admin,data:{name:'Temporary API service '+suffix,slug:f.runId+'-'+suffix,price:17.5,productType:'QUESTION',numQuestions:1}});expect(made.status()).toBe(201);
  const product=(await made.json()).data;
  expect((await second.get('/api/products/'+product.id,{headers:other})).status()).toBe(404);
  expect((await request.patch('/api/products/'+product.id,{headers:admin,data:{name:'Edited temporary service'}})).status()).toBe(200);
  const orders=await request.get('/api/orders/my',{headers:rotated});expect(orders.status()).toBe(200);
  const o=(await orders.json()).data.find((row:any)=>row.orderNumber===f.runId+'-seed-a');expect(Boolean(o)).toBe(true);
  expect((await request.get('/api/orders/my/'+o.id,{headers:rotated})).status()).toBe(200);
  expect((await second.get('/api/orders/'+o.id,{headers:other})).status()).toBe(404);
  expect((await request.patch('/api/orders/'+o.id,{headers:admin,data:{adminNotes:'Homologation only'}})).status()).toBe(200);
  // Appointment mutations send e-mail and are covered outside this Supabase cutover suite.
  // Here we still verify the tenant-scoped read path against the migrated database.
  expect((await request.get('/api/appointments',{headers:rotated})).status()).toBe(200);
  // Avatar upload exercises the real Supabase Storage path and image processing.
  const image=fs.readFileSync(path.resolve(process.cwd(),'../frontend/public/cards/01-cavaleiro.jpg'));
  const avatar=await request.post('/api/users/avatar',{headers:rotated,multipart:{avatar:{name:'fixture.png',mimeType:'image/png',buffer:image}}});expect(avatar.status()).toBe(200);
  const av=await avatar.json();const avatarUrl=av.data.avatarUrl;
  const bytes=await request.get(avatarUrl);expect(bytes.status()).toBe(200);expect((await bytes.body()).length).toBeGreaterThan(0);expect(bytes.headers()['content-type'].startsWith('image/')).toBe(true);
  expect((await request.delete('/api/users/avatar',{headers:rotated})).status()).toBe(200);
  expect((await request.get('/api/users/profile',{headers:rotated})).status()).toBe(200);
  // Valid RIFF/WAVE test file, uploaded through the actual backend authorization boundary.
  const wav=Buffer.alloc(48);wav.write('RIFF',0);wav.writeUInt32LE(40,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(4,40);
  const audio=await request.post('/api/admin/deliveries/'+a.readingId+'/upload-audio',{headers:admin,multipart:{file:{name:'fixture.wav',mimeType:'audio/wav',buffer:wav}}});expect(audio.status()).toBe(200);
  const delivery=await request.get('/api/deliveries/'+a.readingId,{headers:rotated});expect(delivery.status()).toBe(200);
  const deliveryBody=await delivery.json();const audioUrl=deliveryBody.data.audioUrl;
  expect(audioUrl.includes('/storage/v1/object/sign/therapist-private/')).toBe(true);
  const realAudio=await request.get(audioUrl);expect(realAudio.status()).toBe(200);expect((await realAudio.body()).equals(wav)).toBe(true);
  const publicUrl=audioUrl.replace('/object/sign/','/object/public/').split('?')[0];expect((await request.get(publicUrl)).status()).not.toBe(200);
  const jwt=JSON.parse(Buffer.from(new URL(audioUrl).searchParams.get('token')!.split('.')[1],'base64url').toString());expect(jwt.exp-jwt.iat).toBeLessThanOrEqual(300);
  expect((await second.get('/api/deliveries/'+a.readingId,{headers:{...other,'x-tenant-slug':a.slug}})).status()).toBe(403);
  expect((await second.get('/api/deliveries/'+a.readingId,{headers:other})).status()).toBe(404);
  expect((await request.post('/api/auth/logout',{headers:rotated,data:{}})).status()).toBe(200);
  expect((await request.get('/api/auth/profile',{headers:rotated})).status()).toBe(401);
  expect((await request.post('/api/auth/refresh',{headers:{'x-tenant-slug':a.slug,'x-requested-with':'XMLHttpRequest'}})).status()).toBe(401);
  console.info('REAL_SUPABASE_DOMAIN_AND_STORAGE_FLOW_PASS');
 } finally {await second.dispose();}
});

test('UI real: login admin, pÃƒÆ’Ã‚Â¡ginas autenticadas, recarga, mobile e logout',async ({page,context})=>{
 const errors:string[]=[];const failures:number[]=[];let authenticated=false;
 page.on('pageerror',()=>errors.push('uncaught-js'));
 page.on('response',r=>{if(r.url().includes('/api/auth/')) console.info('SESSION_HTTP',new URL(r.url()).pathname,r.status());if(authenticated&&r.url().includes('/api/')&&r.status()>=400)failures.push(r.status());});
 await context.addInitScript(({slug})=>localStorage.setItem('tenantSlug',slug),{slug:a.slug});
 await page.goto('/auth/login');await page.locator('input[type=email]').fill(a.admin.email);await page.locator('input[type=password]').fill(f.password);
 await page.locator('form button[type=submit]').click();await expect(page.locator('app-admin-layout')).toBeVisible();await expect(page).toHaveURL(/\/admin/);authenticated=true;
 for(const url of ['/admin','/admin/produtos','/admin/pedidos','/admin/agendamentos','/admin/usuarios','/admin/entregas','/loja']){
  await page.goto(url);await page.waitForLoadState('networkidle');await expect(page).toHaveURL(new RegExp(url+'$'));await expect(page.locator('app-not-found')).not.toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 }
 await page.goto('/admin');await page.waitForLoadState('networkidle');await expect(page.locator('app-admin-layout')).toBeVisible();await page.reload();await page.waitForLoadState('networkidle');await expect(page.locator('app-admin-layout')).toBeVisible();await expect(page).toHaveURL(/\/admin/);
 const logout=page.locator('button').filter({has:page.locator('.pi-sign-out')}).first();
 if((page.viewportSize()?.width || 1280)<1024)await page.getByRole('button',{name:'Abrir navegaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o',exact:true}).click();
 expect(errors).toEqual([]);expect(failures).toEqual([]);
 const ended=page.waitForResponse(r=>r.url().endsWith('/api/auth/logout'));
 await logout.click();expect((await ended).status()).toBe(200);authenticated=false;
 await page.goto('/admin');await expect(page).toHaveURL(/\/auth\/login/);
 expect(errors).toEqual([]);console.info('AUTHENTICATED_UI_NO_JS_HTTP_ERRORS_PASS');
});
