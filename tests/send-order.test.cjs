const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/send-order');
const body = { salesRep: 'Enzo & <Team>', customerCode: 'K012345', customerName: 'Müller & <Figli>', notes: '<script>test</script>', lines: [{ id: 'i0', qty: 3 }] };
const requestId = 'a86ccf58-7b1b-414a-a2e1-8cf2056b2cd4';
function response() { return { headers: {}, setHeader(k,v) { this.headers[k]=v; }, status(n) { this.statusCode=n; return this; }, json(data) { this.data=data; return this; } }; }
function request(patch={}) { return { method:'POST', headers:{'content-type':'application/json','x-order-access-code':'test-access','x-order-request-id':requestId}, body, ...patch }; }
test('catalog determines codes/weights and escapes HTML in both tables',()=>{
 const order=handler.buildOrder(body);assert.ok(order);assert.ok(order.html.includes('Enzo &amp; &lt;Team&gt;'));assert.ok(order.text.includes('Aussendienstmitarbeiter: Enzo & <Team>'));assert.equal(handler.buildOrder({...body,salesRep:''}),null);assert.equal(handler.buildOrder({...body,salesRep:'Name\nOther'}),null);assert.equal((order.html.match(/<table /g)||[]).length,2);assert.ok(order.html.includes('82404'));assert.ok(order.html.includes('Müller &amp; &lt;Figli&gt;'));assert.ok(!order.html.includes('<script>'));assert.ok(order.text.includes('82404\t3\tALLEGRA'));assert.equal(handler.buildOrder({...body,lines:[{id:'unknown',qty:1}]}),null);assert.equal(handler.buildOrder({...body,lines:[{id:'i0',qty:1.5}]}),null);assert.equal(handler.buildOrder({...body,lines:[{id:'i0',qty:1},{id:'i0',qty:2}]}),null);assert.equal(handler.buildOrder({...body,customerName:'name\nBcc: other'}),null);
});
test('API guards credentials, validates input, fixes recipient, and uses idempotency',async()=>{
 const oldKey=process.env.RESEND_API_KEY,oldCode=process.env.ORDER_ACCESS_CODE,oldFetch=global.fetch;
 let calls=[];
 try{
  delete process.env.RESEND_API_KEY;process.env.ORDER_ACCESS_CODE='test-access';let res=response();await handler(request(),res);assert.equal(res.statusCode,503);
  process.env.RESEND_API_KEY='test-key-never-used-external';global.fetch=async(url,opts)=>{calls.push({url,opts});return {ok:true,json:async()=>({id:'email-test-id'})}};
  res=response();await handler(request({method:'GET'}),res);assert.equal(res.statusCode,405);
  res=response();await handler(request({headers:{'x-order-access-code':'wrong'}}),res);assert.equal(res.statusCode,401);assert.equal(calls.length,0);
  res=response();await handler(request({body:{...body,lines:[]}}),res);assert.equal(res.statusCode,400);assert.equal(calls.length,0);
  res=response();await handler(request({body:{...body,recipient:'attacker@example.com',html:'BAD'}}),res);assert.equal(res.statusCode,200);let sent=JSON.parse(calls[0].opts.body);assert.deepEqual(sent.to,['ad@pregel-deutschland.de']);assert.equal(sent.from,'PreGel Bestellportal <onboarding@resend.dev>');assert.notEqual(sent.html,'BAD');assert.equal(calls[0].opts.headers['Idempotency-Key'],'order-'+requestId);
  global.fetch=async()=>({ok:false,json:async()=>({message:'sensitive upstream details'})});res=response();await handler(request(),res);assert.equal(res.statusCode,502);assert.ok(!JSON.stringify(res.data).includes('sensitive'));
  global.fetch=async()=>{throw Error('network')};res=response();await handler(request(),res);assert.equal(res.statusCode,502);
 }finally{global.fetch=oldFetch;if(oldKey===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=oldKey;if(oldCode===undefined)delete process.env.ORDER_ACCESS_CODE;else process.env.ORDER_ACCESS_CODE=oldCode;}
});
