import { test, expect, request as factory } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const file=process.env.HOMOLOG_FIXTURES_FILE;
if(!file)throw Error('Authorized temporary fixtures required');
const f=JSON.parse(fs.readFileSync(file,'utf8')),[a,b]=f.tenants;
if(!f.runId.startsWith('homolog-cutover-'))throw Error('Invalid temporary scope');
test('Storage real: avatar pÃƒÂºblico removÃƒÂ­vel, ÃƒÂ¡udio privado, bytes reais e isolamento',async ({request,baseURL})=>{
 const csrf={'x-requested-with':'XMLHttpRequest'};
 async function auth(t:any,who:string){const r=await request.post('/api/auth/login',{headers:{...csrf,'x-tenant-slug':t.slug},data:{email:t[who].email,password:f.password}});expect(r.status()).toBe(200);return {...csrf,'x-tenant-slug':t.slug,Authorization:'Bearer '+(await r.json()).data.accessToken};}
 const client=await auth(a,'client'),admin=await auth(a,'admin'),other=await auth(b,'admin');
 const image=fs.readFileSync(path.resolve(process.cwd(),'../frontend/public/cards/01-cavaleiro.jpg'));
 const upload=await request.post('/api/users/avatar',{headers:client,multipart:{avatar:{name:'fixture.png',mimeType:'image/png',buffer:image}}});expect(upload.status()).toBe(200);
 const body=await upload.json();const url=body.data.avatarUrl;
 const downloaded=await request.get(url);expect(downloaded.status()).toBe(200);expect(downloaded.headers()['content-type'].startsWith('image/')).toBe(true);expect((await downloaded.body()).length).toBeGreaterThan(0);
 expect((await request.delete('/api/users/avatar',{headers:client})).status()).toBe(200);
 const profile=await request.get('/api/users/profile',{headers:client});expect(profile.status()).toBe(200);expect((await profile.json()).data.avatarUrl).toBeNull();
 const wav=Buffer.alloc(48);wav.write('RIFF',0);wav.writeUInt32LE(40,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(4,40);
 const audio=await request.post('/api/admin/deliveries/'+a.readingId+'/upload-audio',{headers:admin,multipart:{file:{name:'fixture.wav',mimeType:'audio/wav',buffer:wav}}});expect(audio.status()).toBe(200);
 const delivery=await request.get('/api/deliveries/'+a.readingId,{headers:client});expect(delivery.status()).toBe(200);const audioUrl=(await delivery.json()).data.audioUrl;
 expect(audioUrl.includes('/object/sign/therapist-private/')).toBe(true);const real=await request.get(audioUrl);expect(real.status()).toBe(200);expect((await real.body()).equals(wav)).toBe(true);
 const jwt=JSON.parse(Buffer.from(new URL(audioUrl).searchParams.get('token')!.split('.')[1],'base64url').toString());expect(jwt.exp-jwt.iat).toBeLessThanOrEqual(300);
 expect((await request.get(audioUrl.replace('/object/sign/','/object/public/').split('?')[0])).status()).not.toBe(200);
 expect((await request.get('/api/deliveries/'+a.readingId,{headers:other})).status()).toBe(404);
 expect((await request.get('/api/deliveries/'+a.readingId,{headers:{...other,'x-tenant-slug':a.slug}})).status()).toBe(403);
 expect((await request.post('/api/admin/deliveries/'+a.readingId+'/upload-audio',{headers:client,multipart:{file:{name:'fixture.wav',mimeType:'audio/wav',buffer:wav}}})).status()).toBe(403);
 console.info('REAL_STORAGE_DOWNLOAD_AND_CROSS_TENANT_DENIAL_PASS');
});
