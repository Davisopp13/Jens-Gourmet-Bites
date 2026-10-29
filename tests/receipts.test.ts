import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateReview, blankReview, reconcile, type ReceiptReview } from '../lib/receipts/types';
import { convertQuantity, calculateOrder } from '../lib/pricing';
import { fingerprint, validateFile, readLimited, csvCell } from '../lib/receipts/validation';
import type { Ingredient, RecipeWithIngredients } from '../lib/types';
const iid='11111111-1111-4111-8111-111111111111';
function review():ReceiptReview{return {...blankReview(),store:'Publix',purchased_on:'2026-10-28',total_cents:998,lines:[{id:iid,description:'Butter',quantity:2,net_cents:998,package_quantity:1,unit:'lb',ingredient_id:iid,exact_product:'Land O Lakes unsalted',confirmed:true,use_for_pricing:true,category:'ingredient',on_sale:true}]};}
test('two-package purchase reconciles; net amount remains a line total',()=>{assert.equal(reconcile(review()),0);assert.equal(validateReview(review(),true).lines[0].net_cents/2,499);});
test('cannot update unconfirmed or personal products',()=>{for(const patch of [{confirmed:false},{category:'personal'},{exact_product:''},{ingredient_id:null},{package_quantity:null}]){const r=review();Object.assign(r.lines[0],patch);assert.throws(()=>validateReview(r,true));}});
test('mismatched total, duplicate mapping and unallocated discount rejected',()=>{const r=review();r.total_cents=999;assert.throws(()=>validateReview(r,true));r.total_cents=1996;r.lines.push({...r.lines[0]});assert.throws(()=>validateReview(r,true));const d=review();d.adjustment_cents=-100;d.adjustment_note='coupon';d.total_cents=898;assert.throws(()=>validateReview(d,true));});
test('archive-only allows incomplete mappings without updating costs',()=>{const r=review();r.lines[0].confirmed=false;assert.equal(validateReview(r,false).store,'Publix');});
test('bad dates, negative amounts and non-finite quantities rejected',()=>{for(const field of [{purchased_on:'2026-02-31'},{total_cents:-1}])assert.throws(()=>validateReview({...review(),...field},true));const r=review();r.lines[0].quantity=Infinity;assert.throws(()=>validateReview(r,true));});
test('unit conversion separates volume and weight',()=>{assert.equal(convertQuantity(16,'oz','lb'),1);assert.equal(convertQuantity(1,'cup','tbsp'),16);assert.throws(()=>convertQuantity(1,'cup','lb'));assert.throws(()=>convertQuantity(0,'lb','lb'));});
const ingredient={id:iid,name:'Flour',package_quantity:5,unit:'lb',current_price_cents:649} as Ingredient;
const recipe={id:iid,name:'Cookies',batch_size:32,product:{batch_size:16,price_cents:2200},recipe_ingredients:[{ingredient_id:iid,quantity:16,unit:'oz',ingredient}]} as RecipeWithIngredients;
test('order pricing uses whole batches and total selling revenue',()=>{const r=calculateOrder(recipe,[ingredient],{packs:3,packSize:16,packaging:1,minutes:60,hourly:18,overhead:2,waste:1,margin:40,selling:66});assert.equal(r.batches,2);assert.equal(r.leftovers,16);assert.equal(r.total,2660);assert.equal(r.profit,3940);assert.equal(r.suggested,4434);});
test('no recipes or incompatible units cannot masquerade as zero cost',()=>{const values={packs:1,packSize:16,packaging:0,minutes:0,hourly:0,overhead:0,waste:0,margin:40,selling:22};assert.throws(()=>calculateOrder({...recipe,recipe_ingredients:[]},[],values));assert.throws(()=>calculateOrder(recipe,[],{...values,margin:100}));});
test('content hashing detects reordered and renamed duplicate uploads',()=>{const a={name:'a',type:'application/pdf',bytes:Buffer.from('%PDF-a')};const b={...a,name:'b',bytes:Buffer.from('%PDF-b')};assert.equal(fingerprint([a,b]),fingerprint([b,{...a,name:'renamed'}]));assert.notEqual(fingerprint([a]),fingerprint([b]));});
test('MIME spoofing and oversized/empty uploads fail',()=>{assert.throws(()=>validateFile({name:'x.jpg',type:'image/jpeg',bytes:Buffer.from('<script/>')}));assert.throws(()=>validateFile({name:'x',type:'image/svg+xml',bytes:Buffer.from('<svg/>')}));assert.throws(()=>validateFile({name:'x',type:'image/png',bytes:Buffer.alloc(0)}));validateFile({name:'x.pdf',type:'application/pdf',bytes:Buffer.from('%PDF-1.4')});});
test('bounded content reads stop oversized bodies',async()=>{assert.equal((await readLimited(new Response('hello'),5)).toString(),'hello');await assert.rejects(()=>readLimited(new Response('hello!'),5));});
test('CSV cells neutralize formulas and quote embedded delimiters',()=>{assert.equal(csvCell('=1+1'),'"\'=1+1"');assert.equal(csvCell('a"b'),'"a""b"');});

// Provider-independent safety boundaries for inbound receipt mail.
import { createHmac } from 'node:crypto';
import { Resend } from 'resend';
import { allowedReceiptSender, emailAddress, validateReceiptDownloadUrl } from '../lib/receipts/validation';
test('email sender and recipient normalization does not accept lookalike domains',()=>{
  assert.equal(emailAddress('Jen <JEN@example.com>'),'jen@example.com');
  assert.equal(allowedReceiptSender('Jen <jen@example.com>','jen@example.com'),true);
  assert.equal(allowedReceiptSender('store@receipts.example.com','@receipts.example.com'),true);
  assert.equal(allowedReceiptSender('store@evilreceipts.example.com','@receipts.example.com'),false);
  assert.equal(allowedReceiptSender('store@example.com',''),false);
});
test('email downloads reject internal, credentialed, redirected and lookalike destinations',()=>{
  validateReceiptDownloadUrl('https://attachments.resend.com/file');
  for(const url of ['http://attachments.resend.com/file','https://localhost/file','https://127.0.0.1/file','https://attachments.resend.com.evil.test/file','https://user:pass@attachments.resend.com/file','https://attachments.resend.com:444/file'])assert.throws(()=>validateReceiptDownloadUrl(url));
});
test('Resend webhook verification rejects tampering and stale signatures',()=>{
  const key=Buffer.from('synthetic-receipt-test-secret');const secret='whsec_'+key.toString('base64');
  const id='msg_synthetic';const timestamp=Math.floor(Date.now()/1000).toString();const payload=JSON.stringify({type:'email.received',data:{email_id:iid}});
  const signature='v1,'+createHmac('sha256',key).update(`${id}.${timestamp}.${payload}`).digest('base64');
  const resend=new Resend('re_test');const headers={id,timestamp,signature};
  assert.equal(resend.webhooks.verify({payload,headers,webhookSecret:secret}).type,'email.received');
  assert.throws(()=>resend.webhooks.verify({payload:payload+' ',headers,webhookSecret:secret}));
  const old='1';const oldSignature='v1,'+createHmac('sha256',key).update(`${id}.${old}.${payload}`).digest('base64');
  assert.throws(()=>resend.webhooks.verify({payload,headers:{id,timestamp:old,signature:oldSignature},webhookSecret:secret}));
});

test('different email receipts sharing a store logo are not discarded as duplicates',()=>{
  const logo={name:'logo.png',type:'image/png',bytes:Buffer.from('shared logo')};
  const email={name:'original.eml',type:'message/rfc822',bytes:Buffer.from('purchase one')};
  assert.notEqual(fingerprint([logo,email]),fingerprint([logo,{...email,bytes:Buffer.from('purchase two')}]));
});
