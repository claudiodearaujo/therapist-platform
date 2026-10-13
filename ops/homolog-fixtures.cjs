// Explicit temporary fixtures for an authorized homologation, executed INSIDE backend.
// No real accounts, secrets or provider credentials are embedded here.
const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const { prisma } = require('/app/dist/config/database');
const { supabaseAdmin } = require('/app/dist/config/supabase');
async function main() {
  const action = process.env.HOMOLOG_ACTION;
  if (action === 'init') {
    const runId = 'homolog-cutover-' + crypto.randomUUID().slice(0, 8);
    const password = crypto.randomBytes(24).toString('base64url') + 'Aa1!';
    const hash = await bcrypt.hash(password, 10);
    const tenants = [];
    for (const suffix of ['a', 'b']) {
      const t = await prisma.tenant.create({data:{name:'Temporary homologation',slug:runId+'-'+suffix,onboardingCompletedAt:new Date(),planKey:'studio'}});
      const people = {};
      for (const role of ['admin','client']) {
        const email = `${runId}-${suffix}-${role}@example.invalid`;
        const u = await prisma.user.create({data:{email,passwordHash:hash,fullName:'Temporary '+role,role:role==='admin'?'ADMIN':'CLIENT'}});
        await prisma.tenantMembership.create({data:{tenantId:t.id,userId:u.id,role:role==='admin'?'OWNER':'CLIENT'}});
        people[role]={id:u.id,email};
      }
      const p = await prisma.product.create({data:{tenantId:t.id,name:'Homologation service '+suffix,slug:runId+'-product-'+suffix,productType:'QUESTION',serviceKind:'SERVICE',price:10,numQuestions:1,isActive:true}});
      const o = await prisma.order.create({data:{tenantId:t.id,clientId:people.client.id,orderNumber:runId+'-seed-'+suffix,subtotal:10,total:10,status:'PAID',paymentStatus:'SUCCEEDED',items:{create:{productId:p.id,productName:p.name,productType:'QUESTION',unitPrice:10,quantity:1,totalPrice:10,clientQuestions:['Synthetic question']}}},include:{items:true}});
      const d = await prisma.reading.create({data:{tenantId:t.id,clientId:people.client.id,orderItemId:o.items[0].id,title:'Temporary private delivery',status:'PUBLISHED',publishedAt:new Date(),deliveryType:'CONTENT'}});
      tenants.push({id:t.id,slug:t.slug,...people,productId:p.id,productSlug:p.slug,readingId:d.id});
    }
    console.log(JSON.stringify({runId,password,tenants}));
  } else if (action === 'cleanup') {
    const f=JSON.parse(process.env.HOMOLOG_FIXTURES || '{}');
    if (!f.runId?.startsWith('homolog-cutover-') || f.tenants?.length!==2) throw Error('Invalid cleanup manifest');
    const ids=f.tenants.map(t=>t.id),users=f.tenants.flatMap(t=>[t.admin.id,t.client.id]);
    for (const t of f.tenants) {
      const existing=await prisma.tenant.findUnique({where:{id:t.id}});
      if (!existing || existing.slug!==t.slug || !t.slug.startsWith(f.runId+'-')) throw Error('Cleanup scope mismatch');
      const media=await prisma.reading.findMany({where:{tenantId:t.id},select:{audioUrl:true}});
      const paths=media.map(x=>x.audioUrl).filter(x=>x?.startsWith(`private://${t.id}/`)).map(x=>x.slice(10));
      if(paths.length){const {error}=await supabaseAdmin.storage.from('therapist-private').remove(paths);if(error)throw Error('Private cleanup failed');}
    }
    for(const id of users){
      const u=await prisma.user.findUnique({where:{id},select:{avatarUrl:true}});
      if(u?.avatarUrl){const marker='/storage/v1/object/public/therapist-platform/';const path=u.avatarUrl.split(marker)[1];if(!path||!path.includes(id))throw Error('Avatar cleanup scope mismatch');const {error}=await supabaseAdmin.storage.from('therapist-platform').remove([path]);if(error)throw Error('Avatar cleanup failed');}
    }
    await prisma.auditEvent.deleteMany({where:{OR:[{tenantId:{in:ids}},{actorUserId:{in:users}}]}});
    await prisma.tenant.deleteMany({where:{id:{in:ids},slug:{startsWith:f.runId+'-'}}});
    await prisma.user.deleteMany({where:{id:{in:users},email:{startsWith:f.runId+'-'}}});
    if(await prisma.tenant.count({where:{id:{in:ids}}})||await prisma.user.count({where:{id:{in:users}}}))throw Error('Temporary data remained');
    console.log('HOMOLOG_TEMPORARY_ACCOUNTS_AND_TENANTS_REMOVED');
  } else throw Error('HOMOLOG_ACTION must be init or cleanup');
}
main().then(()=>prisma.$disconnect()).then(()=>process.exit(0)).catch(()=>{console.error('HOMOLOG_FIXTURE_OPERATION_FAILED');process.exit(1)});
