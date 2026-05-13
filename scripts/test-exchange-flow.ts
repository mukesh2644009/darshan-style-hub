/**
 * Integration test for the full exchange flow.
 *
 * Boots no server — assumes Next dev server is running on BASE_URL (default 3333).
 * Sets up isolated test data, runs each TC, and prints a coloured summary table.
 *
 * Usage:
 *   BASE_URL=http://localhost:3333 npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/test-exchange-flow.ts
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3333';
const prisma = new PrismaClient();

// ─── Helpers ───────────────────────────────────────────────────────────────────
const RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', BOLD = '\x1b[1m', RESET = '\x1b[0m';
type Result = { id: string; name: string; pass: boolean; detail: string };
const results: Result[] = [];

function record(id: string, name: string, pass: boolean, detail: string) {
  results.push({ id, name, pass, detail });
  const tag = pass ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
  console.log(`  [${tag}] ${id} — ${name}${detail ? `\n         ${detail}` : ''}`);
}

async function api(
  path: string,
  opts: { method?: string; body?: unknown; cookie?: string } = {}
) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.cookie ? { Cookie: `auth_token=${opts.cookie}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data: { success?: boolean; error?: string; [k: string]: unknown } = {};
  try { data = await res.json(); } catch {}
  return { status: res.status, body: data };
}

// ─── Fixture creation ─────────────────────────────────────────────────────────
async function createSessionToken(userId: string) {
  const token = crypto.randomUUID();
  await prisma.session.create({
    data: { userId, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });
  return token;
}

interface Fixtures {
  customerId: string;
  customerToken: string;
  customerEmail: string;
  otherCustomerId: string;
  otherCustomerToken: string;
  adminId: string;
  adminToken: string;
  productId: string;
  product2Id: string; // out-of-stock-target product for TC10
  deliveredOrderId: string;        // happy path order
  pendingOrderId: string;          // for TC4 — not delivered
  otherUserOrderId: string;        // for TC5 — wrong owner
  returnTypeOrderId: string;       // for TC9 — RETURN flow
  oosOrderId: string;              // for TC10 — out-of-stock target
}

async function setup(): Promise<Fixtures> {
  console.log(`${BOLD}Setting up isolated test data…${RESET}`);
  const stamp = Date.now();
  const customer = await prisma.user.create({
    data: { email: `tc-customer-${stamp}@test.local`, name: 'TC Customer', password: 'x', role: 'CUSTOMER' },
  });
  const otherCustomer = await prisma.user.create({
    data: { email: `tc-other-${stamp}@test.local`, name: 'Other Customer', password: 'x', role: 'CUSTOMER' },
  });
  const admin = await prisma.user.create({
    data: { email: `tc-admin-${stamp}@test.local`, name: 'TC Admin', password: 'x', role: 'ADMIN' },
  });

  const product = await prisma.product.create({
    data: {
      sku: `TC-SKU-${stamp}`,
      name: 'TC Test Suit',
      description: 'integration-test only',
      price: 1499,
      category: 'Suits',
      subcategory: 'Cotton',
      sizes:  { create: [{ size: 'S', quantity: 5 }, { size: 'M', quantity: 5 }, { size: 'L', quantity: 5 }] },
      colors: { create: [{ name: 'Red', hex: '#ef4444' }, { name: 'Blue', hex: '#3b82f6' }] },
    },
    include: { sizes: true },
  });

  // Second product with target size 'L' OUT OF STOCK to trigger TC10.
  const product2 = await prisma.product.create({
    data: {
      sku: `TC-SKU2-${stamp}`,
      name: 'TC Out-of-stock Suit',
      description: 'integration-test only',
      price: 1499,
      category: 'Suits',
      subcategory: 'Cotton',
      sizes: { create: [{ size: 'M', quantity: 5 }, { size: 'L', quantity: 0 }] },
      colors: { create: [{ name: 'Red', hex: '#ef4444' }] },
    },
  });

  // Helper to create an order with a single item
  async function makeOrder(userId: string, status: string, productId: string, size: string, color: string) {
    const order = await prisma.order.create({
      data: {
        userId, status,
        paymentMethod: 'COD', paymentStatus: status === 'DELIVERED' ? 'PAID' : 'PENDING',
        subtotal: 1499, shipping: 0, discount: 0, total: 1499,
        shippingName: 'TC', shippingPhone: '9000000000',
        shippingAddress: '1 Test St', shippingCity: 'Jaipur',
        shippingState: 'Rajasthan', shippingPincode: '302001',
        items: { create: [{ productId, quantity: 1, price: 1499, size, color }] },
      },
    });
    if (status === 'DELIVERED') {
      // updatedAt drives the 7-day window — refresh to "now"
      await prisma.order.update({ where: { id: order.id }, data: { updatedAt: new Date() } });
    }
    return order;
  }

  const deliveredOrder    = await makeOrder(customer.id,      'DELIVERED', product.id,  'M', 'Red');
  const pendingOrder      = await makeOrder(customer.id,      'CONFIRMED', product.id,  'M', 'Red');
  const otherUserOrder    = await makeOrder(otherCustomer.id, 'DELIVERED', product.id,  'M', 'Red');
  const returnTypeOrder   = await makeOrder(customer.id,      'DELIVERED', product.id,  'M', 'Red');
  const oosOrder          = await makeOrder(customer.id,      'DELIVERED', product2.id, 'M', 'Red');

  return {
    customerId: customer.id,
    customerToken: await createSessionToken(customer.id),
    customerEmail: customer.email,
    otherCustomerId: otherCustomer.id,
    otherCustomerToken: await createSessionToken(otherCustomer.id),
    adminId: admin.id,
    adminToken: await createSessionToken(admin.id),
    productId: product.id,
    product2Id: product2.id,
    deliveredOrderId: deliveredOrder.id,
    pendingOrderId: pendingOrder.id,
    otherUserOrderId: otherUserOrder.id,
    returnTypeOrderId: returnTypeOrder.id,
    oosOrderId: oosOrder.id,
  };
}

async function teardown(f: Fixtures) {
  console.log(`\n${BOLD}Cleaning up test data…${RESET}`);
  // Cascades: ReturnRequest -> ON DELETE CASCADE from order
  // Replacement orders also need deleting. We delete by parentOrderId then by user.
  await prisma.returnRequest.deleteMany({ where: { userId: { in: [f.customerId, f.otherCustomerId] } } });
  // delete replacement orders first (parentOrderId lookup)
  const replacements = await prisma.order.findMany({
    where: { orderType: 'REPLACEMENT', parentOrderId: { in: [f.deliveredOrderId, f.pendingOrderId, f.otherUserOrderId, f.returnTypeOrderId, f.oosOrderId] } },
    select: { id: true },
  });
  if (replacements.length) {
    await prisma.orderItem.deleteMany({ where: { orderId: { in: replacements.map(r => r.id) } } });
    await prisma.order.deleteMany({ where: { id: { in: replacements.map(r => r.id) } } });
  }
  await prisma.orderItem.deleteMany({
    where: { orderId: { in: [f.deliveredOrderId, f.pendingOrderId, f.otherUserOrderId, f.returnTypeOrderId, f.oosOrderId] } },
  });
  await prisma.order.deleteMany({
    where: { id: { in: [f.deliveredOrderId, f.pendingOrderId, f.otherUserOrderId, f.returnTypeOrderId, f.oosOrderId] } },
  });
  await prisma.session.deleteMany({ where: { userId: { in: [f.customerId, f.otherCustomerId, f.adminId] } } });
  await prisma.product.deleteMany({ where: { id: { in: [f.productId, f.product2Id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [f.customerId, f.otherCustomerId, f.adminId] } } });
}

// ─── Test cases ───────────────────────────────────────────────────────────────
async function run(f: Fixtures) {
  let returnRequestId: string | null = null;
  let oosReturnRequestId: string | null = null;
  let returnTypeRequestId: string | null = null;

  console.log(`\n${BOLD}── Customer-side request creation ──${RESET}`);

  // TC1 — happy path: submit EXCHANGE
  {
    const r = await api('/api/returns', {
      method: 'POST',
      cookie: f.customerToken,
      body: {
        orderId: f.deliveredOrderId,
        reason: 'WRONG_SIZE',
        details: 'M is too tight',
        requestType: 'EXCHANGE',
        exchangeSize: 'L',
        exchangeColor: 'Blue',
      },
    });
    const ok = r.status === 201 && r.body.success === true && !!(r.body.returnRequest as { id?: string })?.id;
    if (ok) returnRequestId = (r.body.returnRequest as { id: string }).id;
    record('TC1', 'Submit EXCHANGE on DELIVERED order with size+colour',
      ok, `status=${r.status}, success=${r.body.success}, id=${returnRequestId ?? '—'}`);
  }

  // TC2 — DB state after TC1
  {
    const order = await prisma.order.findUnique({ where: { id: f.deliveredOrderId } });
    const req = returnRequestId
      ? await prisma.returnRequest.findUnique({ where: { id: returnRequestId } })
      : null;
    const ok =
      order?.status === 'EXCHANGE_REQUESTED' &&
      req?.requestType === 'EXCHANGE' &&
      req?.pickupFee === 0 &&
      req?.exchangeSize === 'L' &&
      req?.exchangeColor === 'Blue';
    record('TC2', 'Order moves to EXCHANGE_REQUESTED + size/colour stored, pickupFee=0',
      ok, `order.status=${order?.status}, pickupFee=${req?.pickupFee}, size=${req?.exchangeSize}, colour=${req?.exchangeColor}`);
  }

  // TC3 — duplicate
  {
    const r = await api('/api/returns', {
      method: 'POST',
      cookie: f.customerToken,
      body: { orderId: f.deliveredOrderId, reason: 'WRONG_SIZE', requestType: 'EXCHANGE' },
    });
    const ok = r.status === 400 && /already exists/i.test(String(r.body.error));
    record('TC3', 'Duplicate exchange request blocked',
      ok, `status=${r.status}, error="${r.body.error}"`);
  }

  // TC4 — non-DELIVERED order
  {
    const r = await api('/api/returns', {
      method: 'POST',
      cookie: f.customerToken,
      body: { orderId: f.pendingOrderId, reason: 'WRONG_SIZE', requestType: 'EXCHANGE' },
    });
    const ok = r.status === 400 && /delivered/i.test(String(r.body.error));
    record('TC4', 'Cannot exchange a non-DELIVERED order',
      ok, `status=${r.status}, error="${r.body.error}"`);
  }

  // TC5 — wrong owner
  {
    const r = await api('/api/returns', {
      method: 'POST',
      cookie: f.customerToken,
      body: { orderId: f.otherUserOrderId, reason: 'WRONG_SIZE', requestType: 'EXCHANGE' },
    });
    const ok = r.status === 403 && /access denied/i.test(String(r.body.error));
    record('TC5', 'Cannot exchange another user\'s order',
      ok, `status=${r.status}, error="${r.body.error}"`);
  }

  // TC6 — unauthenticated
  {
    const r = await api('/api/returns', {
      method: 'POST',
      body: { orderId: f.deliveredOrderId, reason: 'WRONG_SIZE', requestType: 'EXCHANGE' },
    });
    const ok = r.status === 401;
    record('TC6', 'Unauthenticated exchange request rejected',
      ok, `status=${r.status}, error="${r.body.error}"`);
  }

  console.log(`\n${BOLD}── Admin approve / negative paths ──${RESET}`);

  // TC7 — admin approves
  {
    if (!returnRequestId) {
      record('TC7', 'Admin approves the exchange', false, 'no return request id from TC1');
    } else {
      const r = await api(`/api/admin/returns/${returnRequestId}`, {
        method: 'PATCH',
        cookie: f.adminToken,
        body: { status: 'APPROVED' },
      });
      const order = await prisma.order.findUnique({ where: { id: f.deliveredOrderId } });
      const req   = await prisma.returnRequest.findUnique({ where: { id: returnRequestId } });
      const ok = r.status === 200 && req?.status === 'APPROVED' && order?.status === 'EXCHANGE_APPROVED';
      record('TC7', 'Admin approves → order=EXCHANGE_APPROVED, return=APPROVED',
        ok, `status=${r.status}, return=${req?.status}, order=${order?.status}`);
    }
  }

  // TC8 — complete-exchange when status PENDING (use the OOS-order request, not yet approved)
  {
    const r1 = await api('/api/returns', {
      method: 'POST',
      cookie: f.customerToken,
      body: { orderId: f.oosOrderId, reason: 'WRONG_SIZE', requestType: 'EXCHANGE', exchangeSize: 'L', exchangeColor: 'Red' },
    });
    oosReturnRequestId = (r1.body.returnRequest as { id?: string } | undefined)?.id ?? null;
    const r = oosReturnRequestId
      ? await api(`/api/admin/returns/${oosReturnRequestId}/complete-exchange`, {
          method: 'POST',
          cookie: f.adminToken,
        })
      : { status: 0, body: { error: 'no oos return id' } };
    const ok = r.status === 400 && /approve/i.test(String(r.body.error));
    record('TC8', 'complete-exchange refused when not APPROVED',
      ok, `status=${r.status}, error="${r.body.error}"`);
  }

  // TC9 — complete-exchange on a RETURN-type request
  {
    const r1 = await api('/api/returns', {
      method: 'POST',
      cookie: f.customerToken,
      body: { orderId: f.returnTypeOrderId, reason: 'DAMAGED', requestType: 'RETURN' },
    });
    returnTypeRequestId = (r1.body.returnRequest as { id?: string } | undefined)?.id ?? null;
    if (returnTypeRequestId) {
      await api(`/api/admin/returns/${returnTypeRequestId}`, {
        method: 'PATCH', cookie: f.adminToken, body: { status: 'APPROVED' },
      });
    }
    const r = returnTypeRequestId
      ? await api(`/api/admin/returns/${returnTypeRequestId}/complete-exchange`, {
          method: 'POST', cookie: f.adminToken,
        })
      : { status: 0, body: { error: 'no return id' } };
    const ok = r.status === 400 && /exchange/i.test(String(r.body.error));
    record('TC9', 'complete-exchange refused for RETURN-type request',
      ok, `status=${r.status}, error="${r.body.error}"`);
  }

  // TC10 — out-of-stock requested size
  {
    if (!oosReturnRequestId) {
      record('TC10', 'Out-of-stock requested size blocks completion', false, 'no oos return id from TC8');
    } else {
      // Approve the OOS request first
      await api(`/api/admin/returns/${oosReturnRequestId}`, {
        method: 'PATCH', cookie: f.adminToken, body: { status: 'APPROVED' },
      });
      const r = await api(`/api/admin/returns/${oosReturnRequestId}/complete-exchange`, {
        method: 'POST', cookie: f.adminToken,
      });
      const ok = r.status === 400 && /out of stock/i.test(String(r.body.error));
      record('TC10', 'Out-of-stock requested size blocks completion',
        ok, `status=${r.status}, error="${r.body.error}"`);
    }
  }

  console.log(`\n${BOLD}── Happy-path completion + replacement order ──${RESET}`);

  // Inventory snapshot pre-completion (for TC14)
  const sizeM_before = await prisma.productSize.findFirst({ where: { productId: f.productId, size: 'M' } });
  const sizeL_before = await prisma.productSize.findFirst({ where: { productId: f.productId, size: 'L' } });

  let replacementOrderId: string | null = null;

  // TC11 — admin completes the exchange
  {
    if (!returnRequestId) {
      record('TC11', 'Admin completes the approved exchange', false, 'no return id');
    } else {
      const r = await api(`/api/admin/returns/${returnRequestId}/complete-exchange`, {
        method: 'POST', cookie: f.adminToken,
      });
      replacementOrderId = (r.body.replacementOrderId as string | undefined) || null;
      const ok = r.status === 200 && r.body.success === true && !!replacementOrderId;
      record('TC11', 'Admin completes → 200 with replacementOrderId',
        ok, `status=${r.status}, replacementOrderId=${replacementOrderId ?? '—'}`);
    }
  }

  // TC12 — replacement order shape
  {
    if (!replacementOrderId) {
      record('TC12', 'Replacement order has correct fields', false, 'no replacement id');
    } else {
      const repl = await prisma.order.findUnique({
        where: { id: replacementOrderId },
        include: { items: true },
      });
      const ok =
        repl?.total === 0 &&
        repl?.subtotal === 0 &&
        repl?.shipping === 0 &&
        repl?.paymentStatus === 'PAID' &&
        repl?.paymentMethod === 'EXCHANGE' &&
        repl?.orderType === 'REPLACEMENT' &&
        repl?.parentOrderId === f.deliveredOrderId &&
        repl.items.length === 1 &&
        repl.items[0].size === 'L' &&
        repl.items[0].color === 'Blue' &&
        repl.items[0].price === 0;
      record('TC12', 'Replacement order: ₹0, PAID, REPLACEMENT, parentOrderId, size=L colour=Blue',
        ok, `total=${repl?.total}, type=${repl?.orderType}, parent=${repl?.parentOrderId === f.deliveredOrderId}, item=${repl?.items[0]?.size}/${repl?.items[0]?.color}`);
    }
  }

  // TC13 — original order + return request final state
  {
    const order = await prisma.order.findUnique({ where: { id: f.deliveredOrderId } });
    const req = returnRequestId
      ? await prisma.returnRequest.findUnique({ where: { id: returnRequestId } })
      : null;
    const ok =
      order?.status === 'EXCHANGED' &&
      req?.status === 'COMPLETED' &&
      req?.replacementOrderId === replacementOrderId;
    record('TC13', 'Original=EXCHANGED, Return=COMPLETED, replacementOrderId linked',
      ok, `order=${order?.status}, return=${req?.status}, link=${req?.replacementOrderId === replacementOrderId}`);
  }

  // TC14 — inventory adjustment
  {
    const sizeM_after = await prisma.productSize.findFirst({ where: { productId: f.productId, size: 'M' } });
    const sizeL_after = await prisma.productSize.findFirst({ where: { productId: f.productId, size: 'L' } });
    const ok =
      !!sizeM_before && !!sizeM_after && !!sizeL_before && !!sizeL_after &&
      sizeM_after.quantity === sizeM_before.quantity + 1 &&
      sizeL_after.quantity === sizeL_before.quantity - 1;
    record('TC14', 'Inventory: M (returned) +1, L (replacement) −1',
      ok, `M ${sizeM_before?.quantity}→${sizeM_after?.quantity}, L ${sizeL_before?.quantity}→${sizeL_after?.quantity}`);
  }

  // TC15 — completing twice
  {
    if (!returnRequestId) {
      record('TC15', 'Cannot complete the exchange twice', false, 'no return id');
    } else {
      const r = await api(`/api/admin/returns/${returnRequestId}/complete-exchange`, {
        method: 'POST', cookie: f.adminToken,
      });
      const ok = r.status === 400 && /already exists/i.test(String(r.body.error));
      record('TC15', 'Cannot complete the exchange twice',
        ok, `status=${r.status}, error="${r.body.error}"`);
    }
  }

  // TC16 — non-admin cannot complete
  {
    if (!returnRequestId) {
      record('TC16', 'Non-admin user cannot call complete-exchange', false, 'no return id');
    } else {
      const r = await api(`/api/admin/returns/${returnRequestId}/complete-exchange`, {
        method: 'POST', cookie: f.customerToken,
      });
      const ok = r.status === 403;
      record('TC16', 'Non-admin user cannot call complete-exchange',
        ok, `status=${r.status}, error="${r.body.error}"`);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  let fixtures: Fixtures | null = null;
  try {
    fixtures = await setup();
    console.log(`${BOLD}Running test cases against ${BASE_URL}${RESET}\n`);
    await run(fixtures);
  } catch (e) {
    console.error(`${RED}Fatal error:${RESET}`, e);
    process.exitCode = 2;
  } finally {
    if (fixtures) {
      try { await teardown(fixtures); } catch (e) { console.error('Teardown error:', e); }
    }
    await prisma.$disconnect();
  }

  const passed = results.filter(r => r.pass).length;
  const failed = results.length - passed;
  console.log(`\n${BOLD}═══ Summary ═══${RESET}`);
  console.log(`Total: ${results.length}   ${GREEN}Passed: ${passed}${RESET}   ${failed > 0 ? RED : GREEN}Failed: ${failed}${RESET}`);
  if (failed > 0) {
    console.log(`\n${YELLOW}Failed test cases:${RESET}`);
    results.filter(r => !r.pass).forEach(r => console.log(`  ${RED}✘${RESET} ${r.id} — ${r.name}\n     ${r.detail}`));
    process.exitCode = 1;
  }
})();
