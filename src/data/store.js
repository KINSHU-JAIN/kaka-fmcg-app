// ============================================
// KAKA FMCG — Data Store (Supabase-only, real-time)
// All data is read from and written to Supabase.
// In-memory _data is a reactive cache only.
// ============================================

import { supabase, isSupabaseConfigured } from './supabaseClient.js';

// ---------- Event Bus ----------
const listeners = {};
function emit(event, data) { (listeners[event] || []).forEach(cb => cb(data)); }
function on(event, callback) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
  return () => { listeners[event] = listeners[event].filter(cb => cb !== callback); };
}

// ---------- Case Conversion ----------
function keysToCamel(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const n = {};
  Object.keys(obj).forEach(k => {
    const ck = k.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
    n[ck] = obj[k];
  });
  return n;
}
function keysToSnake(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const n = {};
  Object.keys(obj).forEach(k => {
    const sk = k.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
    n[sk] = obj[k];
  });
  return n;
}

// ---------- UUID ----------
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- In-memory cache (reactive, populated from Supabase) ----------
let _data = {
  adminPin: localStorage.getItem('kaka_admin_pin') || 'Kaka@123',
  firms: [], companies: [], products: [], shops: [],
  staff: [], orders: [], routes: [], ledgers: [],
  staffLocations: [], targets: [], beatPlans: [], returns: []
};

function getData() { return _data; }

// ---------- Supabase write helper (fire-and-forget with error logging) ----------
function sbWrite(promise, label) {
  promise.then(({ error }) => {
    if (error) console.error(`[Supabase] ${label}:`, error);
  }).catch(err => console.error(`[Supabase] ${label}:`, err));
}

// ---------- Ledger Helpers ----------
function getLedger(shopId) {
  const entries = (_data.ledgers || []).filter(e => e.shopId === shopId);
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  return entries;
}

function addLedgerEntry(shopId, amount, type, refId = null, description = '', date = null) {
  if (!_data.ledgers) _data.ledgers = [];
  const entries = (_data.ledgers || []).filter(e => e.shopId === shopId);
  let prevBalance = 0;
  if (entries.length > 0) {
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    prevBalance = entries[entries.length - 1].runningBalance;
  }
  const balanceChange = (type === 'debit') ? amount : -amount;
  const runningBalance = prevBalance + balanceChange;
  const entry = {
    id: uid(), shopId,
    date: date || new Date().toISOString(),
    type, refId, description, amount, runningBalance
  };
  _data.ledgers.push(entry);
  emit('ledgers:change', _data.ledgers);
  if (isSupabaseConfigured) {
    sbWrite(supabase.from('ledgers').insert(keysToSnake(entry)), 'addLedgerEntry');
  }
  return entry;
}

function addLedgerPayment(shopId, amount, paymentMode, staffId = null) {
  const staff = staffId ? getStaffById(staffId) : null;
  const collector = staff ? staff.name : 'Admin';
  const description = `Partial payment collected in ${paymentMode.toUpperCase()} by ${collector}`;
  const entry = addLedgerEntry(shopId, amount, 'credit', null, description);
  const outstanding = getShopOutstanding(shopId);
  if (outstanding.totalOutstanding <= 0) {
    (_data.orders || []).forEach(o => {
      if (o.shopId === shopId && o.paymentStatus === 'unpaid' && o.status !== 'cancelled') {
        o.paymentStatus = 'paid';
        if (isSupabaseConfigured) sbWrite(supabase.from('orders').update({ payment_status: 'paid' }).eq('id', o.id), 'ledgerPayment:orderUpdate');
      }
    });
    emit('orders:change', _data.orders);
  }
  return entry;
}

function saveStaffLocation(staffId, lat, lng) {
  if (!_data.staffLocations) _data.staffLocations = [];
  const idx = _data.staffLocations.findIndex(l => l.staffId === staffId);
  const location = { staffId, lat, lng, updatedAt: new Date().toISOString() };
  if (idx !== -1) _data.staffLocations[idx] = location;
  else _data.staffLocations.push(location);
  emit('staffLocations:change', _data.staffLocations);
  if (isSupabaseConfigured) sbWrite(supabase.from('staff_locations').upsert(keysToSnake(location)), 'saveStaffLocation');
  return location;
}
function getStaffLocations() { return _data.staffLocations || []; }
function getStaffLocation(staffId) { return (_data.staffLocations || []).find(l => l.staffId === staffId) || null; }

async function safeSelect(tableName) {
  try {
    const res = await supabase.from(tableName).select('*');
    if (res && res.error) {
      console.warn(`[Store] Table ${tableName} warning:`, res.error.message);
      return { data: [], error: res.error };
    }
    return res || { data: [], error: null };
  } catch (err) {
    console.warn(`[Store] Table ${tableName} query error:`, err);
    return { data: [], error: null };
  }
}

// ---------- Supabase Init (primary data load) ----------
async function initSupabase(_seedDataIgnored) {
  if (!isSupabaseConfigured) {
    console.warn('[Store] Supabase not configured — app starting with empty data.');
    emit('data:ready', _data);
    return;
  }

  try {
    console.log('[Store] Loading all data from Supabase...');
    const [
      resFirms, resCompanies, resProducts, resShops, resStaff,
      resOrders, resRoutes, resLedgers, resLocations,
      resTargets, resBeatPlans, resReturns
    ] = await Promise.all([
      safeSelect('firms'),
      safeSelect('companies'),
      safeSelect('products'),
      safeSelect('shops'),
      safeSelect('staff'),
      safeSelect('orders'),
      safeSelect('routes'),
      safeSelect('ledgers'),
      safeSelect('staff_locations'),
      safeSelect('targets'),
      safeSelect('beat_plans'),
      safeSelect('returns')
    ]);

    _data = {
      adminPin: localStorage.getItem('kaka_admin_pin') || 'Kaka@123',
      firms:          (resFirms.data     || []).map(keysToCamel),
      companies:      (resCompanies.data || []).map(keysToCamel),
      products:       (resProducts.data  || []).map(keysToCamel),
      shops:          (resShops.data     || []).map(keysToCamel),
      staff:          (resStaff.data     || []).map(keysToCamel),
      orders:         (resOrders.data    || []).map(keysToCamel),
      routes:         (resRoutes.data    || []).map(keysToCamel),
      ledgers:        (resLedgers.data   || []).map(keysToCamel),
      staffLocations: (resLocations.data || []).map(keysToCamel),
      targets:        (resTargets.data   || []).map(keysToCamel),
      beatPlans:      (resBeatPlans.data || []).map(keysToCamel),
      returns:        (resReturns.data   || []).map(keysToCamel),
    };

    console.log(`[Store] Loaded successfully: ${_data.shops.length} shops, ${_data.staff.length} staff, ${_data.orders.length} orders`);

    // Setup Supabase Realtime
    try {
      supabase.channel('kaka-realtime')
        .on('postgres_changes', { event: '*', schema: 'public' }, handleRealtimeChange)
        .subscribe(status => console.log('[Realtime]', status));
    } catch (e) {
      console.warn('[Store] Realtime subscription failed:', e);
    }

    emit('data:ready', _data);
  } catch (err) {
    console.error('[Store] Supabase load failed:', err);
    // Even on error, emit data:ready so app opens gracefully
    emit('data:ready', _data);
  }
}

function handleRealtimeChange(payload) {
  const { table, eventType, new: newRow, old: oldRow } = payload;
  let key = table;
  if (table === 'staff_locations') key = 'staffLocations';
  if (table === 'beat_plans') key = 'beatPlans';
  if (!_data || !_data[key]) return;

  const keyField = key === 'staffLocations' ? 'staffId' : 'id';
  const camelNew = keysToCamel(newRow);
  const camelOld = keysToCamel(oldRow);

  if (eventType === 'INSERT') {
    if (!_data[key].some(item => item[keyField] === camelNew[keyField])) _data[key].push(camelNew);
  } else if (eventType === 'UPDATE') {
    const idx = _data[key].findIndex(item => item[keyField] === camelNew[keyField]);
    if (idx !== -1) _data[key][idx] = { ..._data[key][idx], ...camelNew };
  } else if (eventType === 'DELETE') {
    _data[key] = _data[key].filter(item => item[keyField] !== camelOld[keyField]);
  }

  emit(`${key}:change`, _data[key]);
  emit('data:change', _data);
}

// ---------- Firms ----------
function getFirms()      { return _data.firms || []; }
function getFirmById(id) { return (_data.firms || []).find(f => f.id === id); }

// ---------- Companies ----------
function getCompanies(firmId) {
  let c = _data.companies || [];
  if (firmId) c = c.filter(x => x.firmId === firmId);
  return c;
}
function getCompanyById(id) { return (_data.companies || []).find(c => c.id === id); }

function addCompany(company) {
  const rec = { id: uid(), isActive: true, ...company };
  _data.companies.push(rec);
  emit('companies:change', _data.companies);
  if (isSupabaseConfigured) sbWrite(supabase.from('companies').insert(keysToSnake(rec)), 'addCompany');
  return rec;
}
function updateCompany(id, updates) {
  const idx = _data.companies.findIndex(c => c.id === id);
  if (idx === -1) return null;
  _data.companies[idx] = { ..._data.companies[idx], ...updates };
  emit('companies:change', _data.companies);
  if (isSupabaseConfigured) sbWrite(supabase.from('companies').update(keysToSnake(updates)).eq('id', id), 'updateCompany');
  return _data.companies[idx];
}
function deleteCompany(id) {
  _data.companies = _data.companies.filter(c => c.id !== id);
  _data.products  = _data.products.filter(p => p.companyId !== id);
  emit('companies:change', _data.companies);
  emit('products:change', _data.products);
  if (isSupabaseConfigured) {
    sbWrite(supabase.from('companies').delete().eq('id', id), 'deleteCompany');
    sbWrite(supabase.from('products').delete().eq('company_id', id), 'deleteCompany:products');
  }
  return true;
}

// ---------- Products ----------
function getProducts(filters = {}) {
  let p = _data.products || [];
  if (filters.firmId)    p = p.filter(x => x.firmId    === filters.firmId);
  if (filters.companyId) p = p.filter(x => x.companyId === filters.companyId);
  if (filters.isActive !== undefined) p = p.filter(x => x.isActive === filters.isActive);
  if (filters.search) { const q = filters.search.toLowerCase(); p = p.filter(x => x.name.toLowerCase().includes(q)); }
  return p;
}
function getProductById(id)  { return (_data.products || []).find(p => p.id === id); }
function getProductPrice(product, qty) {
  if (!product) return 0;
  if (!qty || qty <= 0 || !product.tierPrices || product.tierPrices.length === 0) return product.sellingPrice;
  const sorted = [...product.tierPrices].sort((a, b) => b.minQty - a.minQty);
  const matched = sorted.find(t => qty >= t.minQty);
  return matched ? matched.price : product.sellingPrice;
}
function addProduct(product) {
  const rec = { id: uid(), isActive: true, ...product };
  _data.products.push(rec);
  emit('products:change', _data.products);
  if (isSupabaseConfigured) sbWrite(supabase.from('products').insert(keysToSnake(rec)), 'addProduct');
  return rec;
}
function updateProduct(id, updates) {
  const idx = _data.products.findIndex(p => p.id === id);
  if (idx === -1) return null;
  _data.products[idx] = { ..._data.products[idx], ...updates };
  emit('products:change', _data.products);
  if (isSupabaseConfigured) sbWrite(supabase.from('products').update(keysToSnake(updates)).eq('id', id), 'updateProduct');
  return _data.products[idx];
}
function deleteProduct(id) {
  _data.products = _data.products.filter(p => p.id !== id);
  emit('products:change', _data.products);
  if (isSupabaseConfigured) sbWrite(supabase.from('products').delete().eq('id', id), 'deleteProduct');
  return true;
}

// ---------- Shops ----------
function getShops(filters = {}) {
  let s = _data.shops || [];
  if (filters.routeId) s = s.filter(x => x.routeId === filters.routeId);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    s = s.filter(x => x.name.toLowerCase().includes(q) || (x.ownerName || '').toLowerCase().includes(q));
  }
  return s;
}
function getShopById(id) { return (_data.shops || []).find(s => s.id === id); }
function addShop(shop) {
  const rec = { id: uid(), ...shop };
  _data.shops.push(rec);
  emit('shops:change', _data.shops);
  if (isSupabaseConfigured) sbWrite(supabase.from('shops').insert(keysToSnake(rec)), 'addShop');
  return rec;
}
function updateShop(id, updates) {
  const idx = _data.shops.findIndex(s => s.id === id);
  if (idx === -1) return null;
  _data.shops[idx] = { ..._data.shops[idx], ...updates };
  emit('shops:change', _data.shops);
  if (isSupabaseConfigured) sbWrite(supabase.from('shops').update(keysToSnake(updates)).eq('id', id), 'updateShop');
  return _data.shops[idx];
}
function deleteShop(id) {
  _data.shops = _data.shops.filter(s => s.id !== id);
  _data.routes.forEach(r => { r.shopIds = (r.shopIds || []).filter(sid => sid !== id); });
  emit('shops:change', _data.shops);
  emit('routes:change', _data.routes);
  if (isSupabaseConfigured) {
    sbWrite(supabase.from('shops').delete().eq('id', id), 'deleteShop');
    _data.routes.forEach(r => sbWrite(supabase.from('routes').update({ shop_ids: r.shopIds }).eq('id', r.id), 'deleteShop:routeUpdate'));
  }
  return true;
}
function getShopOutstanding(shopId) {
  const entries = (_data.ledgers || []).filter(e => e.shopId === shopId);
  if (entries.length === 0) return { totalOutstanding: 0, totalPenalty: 0, unpaidOrdersCount: 0, details: [] };
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  const ledgerBalance = entries[entries.length - 1].runningBalance;
  const debitEntries  = entries.filter(e => e.type === 'debit');
  const creditRefIds  = new Set(entries.filter(e => e.type === 'credit').map(e => e.refId).filter(Boolean));
  const now = new Date();
  let totalPenalty = 0;
  const unpaidDetails = [];
  debitEntries.forEach(debit => {
    if (!creditRefIds.has(debit.refId)) {
      const order = getOrderById(debit.refId);
      if (order && order.status !== 'cancelled' && order.paymentStatus !== 'paid') {
        const diffDays = Math.floor(Math.abs(now - new Date(order.createdAt)) / 86400000);
        const penalty  = diffDays > 7 ? (diffDays - 7) * 50 : 0;
        totalPenalty += penalty;
        unpaidDetails.push({ orderId: order.id, originalTotal: order.total, penalty, daysOld: diffDays, outstanding: order.total + penalty });
      }
    }
  });
  return { totalOutstanding: Math.max(0, ledgerBalance + totalPenalty), totalPenalty, unpaidOrdersCount: unpaidDetails.length, details: unpaidDetails };
}
function settleShopOutstanding(shopId) {
  const outstanding = getShopOutstanding(shopId);
  if (outstanding.totalOutstanding <= 0) return 0;
  addLedgerEntry(shopId, outstanding.totalOutstanding, 'credit', null, 'Full outstanding balance settlement');
  (_data.orders || []).forEach(o => {
    if (o.shopId === shopId && o.paymentStatus === 'unpaid' && o.status !== 'cancelled') {
      o.paymentStatus = 'paid';
      if (isSupabaseConfigured) sbWrite(supabase.from('orders').update({ payment_status: 'paid' }).eq('id', o.id), 'settleShop');
    }
  });
  emit('orders:change', _data.orders);
  return 1;
}

// ---------- Orders ----------
function getOrders(filters = {}) {
  let o = _data.orders || [];
  if (filters.firmId)  o = o.filter(x => x.firmId  === filters.firmId);
  if (filters.staffId) o = o.filter(x => x.staffId === filters.staffId);
  if (filters.status)  o = o.filter(x => x.status  === filters.status);
  if (filters.shopId)  o = o.filter(x => x.shopId  === filters.shopId);
  o.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return o;
}
function getOrderById(id) { return (_data.orders || []).find(o => o.id === id); }
function addOrder(order) {
  const rec = { id: uid(), status: 'pending', createdAt: new Date().toISOString(), penaltyAdded: 0, ...order };
  _data.orders.push(rec);
  emit('orders:change', _data.orders);
  if (isSupabaseConfigured) sbWrite(supabase.from('orders').insert(keysToSnake(rec)), 'addOrder');
  return rec;
}
function updateOrderStatus(id, status) {
  const idx = _data.orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  const oldStatus = _data.orders[idx].status;
  _data.orders[idx].status = status;
  const updates = { status };
  if (status === 'confirmed') {
    _data.orders[idx].confirmedAt = new Date().toISOString();
    updates.confirmedAt = _data.orders[idx].confirmedAt;
    addLedgerEntry(_data.orders[idx].shopId, _data.orders[idx].total, 'debit', id, `Order #${id.slice(-6).toUpperCase()} approved`);
  } else if (status === 'delivered') {
    _data.orders[idx].deliveredAt = new Date().toISOString();
    updates.deliveredAt = _data.orders[idx].deliveredAt;
    if (_data.orders[idx].paymentStatus === 'paid') {
      addLedgerEntry(_data.orders[idx].shopId, _data.orders[idx].total, 'credit', id, `Payment received on delivery for Order #${id.slice(-6).toUpperCase()}`);
    }
  } else if (status === 'cancelled') {
    if (oldStatus === 'confirmed' || oldStatus === 'delivered') {
      addLedgerEntry(_data.orders[idx].shopId, _data.orders[idx].total, 'credit', id, `Order #${id.slice(-6).toUpperCase()} cancelled (reverted)`);
    }
  }
  emit('orders:change', _data.orders);
  if (isSupabaseConfigured) sbWrite(supabase.from('orders').update(keysToSnake(updates)).eq('id', id), 'updateOrderStatus');
  return _data.orders[idx];
}
function updateOrder(id, updates) {
  const idx = _data.orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  const oldOrder = { ..._data.orders[idx] };
  _data.orders[idx] = { ..._data.orders[idx], ...updates };
  const newOrder = _data.orders[idx];
  if (updates.status === 'confirmed'  && oldOrder.status !== 'confirmed')  addLedgerEntry(newOrder.shopId, newOrder.total, 'debit',  id, `Order #${id.slice(-6).toUpperCase()} approved`);
  if (updates.status === 'delivered'  && oldOrder.status !== 'delivered'  && newOrder.paymentStatus === 'paid') addLedgerEntry(newOrder.shopId, newOrder.total, 'credit', id, `Payment received for Order #${id.slice(-6).toUpperCase()}`);
  if (updates.paymentStatus === 'paid' && oldOrder.paymentStatus !== 'paid') addLedgerEntry(newOrder.shopId, newOrder.total, 'credit', id, `Payment received for Order #${id.slice(-6).toUpperCase()}`);
  if (updates.status === 'cancelled'  && oldOrder.status !== 'cancelled'  && (oldOrder.status === 'confirmed' || oldOrder.status === 'delivered')) addLedgerEntry(newOrder.shopId, newOrder.total, 'credit', id, `Order #${id.slice(-6).toUpperCase()} cancelled (reverted)`);
  emit('orders:change', _data.orders);
  if (isSupabaseConfigured) {
    const dbUp = { ...updates };
    delete dbUp.deliveredAt; delete dbUp.confirmedAt;
    sbWrite(supabase.from('orders').update(keysToSnake(dbUp)).eq('id', id), 'updateOrder');
  }
  return _data.orders[idx];
}
function deleteOrder(id) {
  _data.orders = _data.orders.filter(o => o.id !== id);
  emit('orders:change', _data.orders);
  if (isSupabaseConfigured) sbWrite(supabase.from('orders').delete().eq('id', id), 'deleteOrder');
  return true;
}

// ---------- Routes ----------
function getRoutes(firmId) {
  let r = _data.routes || [];
  if (firmId) r = r.filter(x => x.firmId === firmId);
  return r;
}
function getRouteById(id) { return (_data.routes || []).find(r => r.id === id); }
function addRoute(route) {
  const rec = { id: uid(), shopIds: [], ...route };
  _data.routes.push(rec);
  emit('routes:change', _data.routes);
  if (isSupabaseConfigured) sbWrite(supabase.from('routes').insert(keysToSnake(rec)), 'addRoute');
  return rec;
}
function updateRoute(id, updates) {
  const idx = _data.routes.findIndex(r => r.id === id);
  if (idx === -1) return null;
  _data.routes[idx] = { ..._data.routes[idx], ...updates };
  emit('routes:change', _data.routes);
  if (isSupabaseConfigured) sbWrite(supabase.from('routes').update(keysToSnake(updates)).eq('id', id), 'updateRoute');
  return _data.routes[idx];
}
function deleteRoute(id) {
  _data.shops.forEach(s => { if (s.routeId === id) s.routeId = null; });
  _data.routes = _data.routes.filter(r => r.id !== id);
  emit('routes:change', _data.routes);
  emit('shops:change', _data.shops);
  if (isSupabaseConfigured) {
    sbWrite(supabase.from('routes').delete().eq('id', id), 'deleteRoute');
    _data.shops.forEach(s => sbWrite(supabase.from('shops').update({ route_id: s.routeId }).eq('id', s.id), 'deleteRoute:shopUpdate'));
  }
  return true;
}

// ---------- Staff ----------
function getStaff()       { return _data.staff || []; }
function getStaffById(id) { return (_data.staff || []).find(s => s.id === id); }
function addStaff(staff) {
  const rec = { id: uid(), ...staff };
  _data.staff.push(rec);
  emit('staff:change', _data.staff);
  if (isSupabaseConfigured) sbWrite(supabase.from('staff').insert(keysToSnake(rec)), 'addStaff');
  return rec;
}
function updateStaff(id, updates) {
  const idx = _data.staff.findIndex(s => s.id === id);
  if (idx === -1) return null;
  _data.staff[idx] = { ..._data.staff[idx], ...updates };
  emit('staff:change', _data.staff);
  if (isSupabaseConfigured) sbWrite(supabase.from('staff').update(keysToSnake(updates)).eq('id', id), 'updateStaff');
  return _data.staff[idx];
}
function deleteStaff(id) {
  _data.staff = _data.staff.filter(s => s.id !== id);
  emit('staff:change', _data.staff);
  if (isSupabaseConfigured) sbWrite(supabase.from('staff').delete().eq('id', id), 'deleteStaff');
  return true;
}

// ---------- Auth ----------
function getAdminPin() { return _data.adminPin || 'Kaka@123'; }
function setAdminPin(pin) {
  _data.adminPin = pin;
  localStorage.setItem('kaka_admin_pin', pin); // PIN is tiny and doesn't need a DB table
}

function authenticate(username, password) {
  const u = (username || '').trim().toLowerCase();
  const p = (password || '').trim();
  if (u === 'kaka' && p === 'Kaka@123') return { role: 'admin', requires2fa: true, user: { name: 'Kaka', id: 'admin' } };
  const staffList = _data ? (_data.staff || []) : [];
  const staff = staffList.find(s => {
    const sUser = (s.username || s.name || '').trim().toLowerCase();
    const sPass = (s.password || s.pin || '').trim();
    return sUser === u && sPass === p;
  });
  if (staff) {
    if (staff.isBlocked) return { role: 'staff', blocked: true, user: { name: staff.name, id: staff.id } };
    return { role: 'staff', user: { name: staff.name, id: staff.id } };
  }
  return null;
}

async function authenticateAsync(username, password) {
  const u = (username || '').trim().toLowerCase();
  const p = (password || '').trim();
  if (u === 'kaka' && p === 'Kaka@123') return { role: 'admin', requires2fa: true, user: { name: 'Kaka', id: 'admin' } };
  // Try local cache first (fast path)
  const localResult = authenticate(username, password);
  if (localResult) return localResult;
  // Direct Supabase lookup (works on any device before cache is warm)
  if (isSupabaseConfigured) {
    try {
      const { data: staffRows, error } = await supabase.from('staff').select('*').or(`username.eq.${u},name.ilike.${u}`);
      if (!error && staffRows && staffRows.length > 0) {
        const staff = staffRows.map(keysToCamel).find(s => {
          const sUser = (s.username || s.name || '').trim().toLowerCase();
          const sPass = (s.password || s.pin || '').trim();
          return sUser === u && sPass === p;
        });
        if (staff) {
          if (_data) {
            const exists = (_data.staff || []).some(s => s.id === staff.id);
            if (!exists) _data.staff = [...(_data.staff || []), staff];
          }
          if (staff.isBlocked) return { role: 'staff', blocked: true, user: { name: staff.name, id: staff.id } };
          return { role: 'staff', user: { name: staff.name, id: staff.id } };
        }
      }
    } catch (err) {
      console.warn('[Auth] Supabase fallback failed:', err);
    }
  }
  return null;
}

function getSession() {
  try {
    const raw = localStorage.getItem('kaka_session');
    if (raw) return JSON.parse(raw);
    const rawSS = sessionStorage.getItem('kaka_session');
    if (rawSS) {
      const parsed = JSON.parse(rawSS);
      localStorage.setItem('kaka_session', rawSS);
      sessionStorage.removeItem('kaka_session');
      return parsed;
    }
    return null;
  } catch { return null; }
}
function setSession(session) {
  const val = JSON.stringify(session);
  localStorage.setItem('kaka_session', val);
  try { sessionStorage.setItem('kaka_session', val); } catch {}
}
function clearSession() {
  localStorage.removeItem('kaka_session');
  sessionStorage.removeItem('kaka_session');
}

// ---------- Stats ----------
function getStats(firmId) {
  const orders = getOrders(firmId ? { firmId } : {});
  const today = new Date().toISOString().split('T')[0];
  const todayOrders   = orders.filter(o => o.createdAt.split('T')[0] === today);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  return {
    totalOrders:    orders.length,
    todayOrders:    todayOrders.length,
    pendingOrders:  pendingOrders.length,
    todayRevenue:   todayOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0),
    totalRevenue:   orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0),
    totalProducts:  getProducts(firmId ? { firmId } : {}).length,
    totalCompanies: getCompanies(firmId).length,
    totalShops:     getShops().length,
    totalStaff:     getStaff().length,
    activeRoutes:   getRoutes(firmId).length
  };
}

// ---------- Targets ----------
function getTargets(firmId) {
  let t = _data.targets || [];
  if (firmId) t = t.filter(x => x.firmId === firmId);
  return t;
}
function getTargetByStaff(staffId, month) {
  return (_data.targets || []).find(t => t.staffId === staffId && t.month === month) || null;
}
function setTarget(staffId, firmId, month, targetAmount) {
  const existing = (_data.targets || []).find(t => t.staffId === staffId && t.firmId === firmId && t.month === month);
  if (existing) {
    existing.targetAmount = targetAmount;
    emit('targets:change', _data.targets);
    if (isSupabaseConfigured) sbWrite(supabase.from('targets').update({ target_amount: targetAmount }).eq('id', existing.id), 'setTarget:update');
  } else {
    const rec = { id: uid(), staffId, firmId, month, targetAmount };
    if (!_data.targets) _data.targets = [];
    _data.targets.push(rec);
    emit('targets:change', _data.targets);
    if (isSupabaseConfigured) sbWrite(supabase.from('targets').insert(keysToSnake(rec)), 'setTarget:insert');
  }
}

// ---------- Beat Plans ----------
function getBeatPlans(firmId) {
  let b = _data.beatPlans || [];
  if (firmId) b = b.filter(x => x.firmId === firmId);
  return b;
}
function setBeatPlan(staffId, firmId, dayOfWeek, shopIds) {
  const existing = (_data.beatPlans || []).find(b => b.staffId === staffId && b.firmId === firmId && b.dayOfWeek === dayOfWeek);
  if (existing) {
    existing.shopIds = shopIds;
    emit('beatPlans:change', _data.beatPlans);
    if (isSupabaseConfigured) sbWrite(supabase.from('beat_plans').update({ shop_ids: shopIds }).eq('id', existing.id), 'setBeatPlan:update');
  } else {
    const rec = { id: uid(), staffId, firmId, dayOfWeek, shopIds };
    if (!_data.beatPlans) _data.beatPlans = [];
    _data.beatPlans.push(rec);
    emit('beatPlans:change', _data.beatPlans);
    if (isSupabaseConfigured) sbWrite(supabase.from('beat_plans').insert(keysToSnake(rec)), 'setBeatPlan:insert');
  }
}

// ---------- Returns ----------
function getReturns(filters = {}) {
  let r = _data.returns || [];
  if (filters.firmId)  r = r.filter(x => x.firmId  === filters.firmId);
  if (filters.staffId) r = r.filter(x => x.staffId === filters.staffId);
  return r;
}
function addReturn(ret) {
  if (!_data.returns) _data.returns = [];
  _data.returns.push(ret);
  emit('returns:change', _data.returns);
  if (isSupabaseConfigured) sbWrite(supabase.from('returns').insert(keysToSnake(ret)), 'addReturn');
  return ret;
}
function updateReturnStatus(id, status) {
  const idx = (_data.returns || []).findIndex(r => r.id === id);
  if (idx === -1) return null;
  _data.returns[idx].status = status;
  _data.returns[idx].resolvedAt = new Date().toISOString();
  emit('returns:change', _data.returns);
  if (isSupabaseConfigured) sbWrite(supabase.from('returns').update({ status, resolved_at: _data.returns[idx].resolvedAt }).eq('id', id), 'updateReturnStatus');
  return _data.returns[idx];
}

// ---------- Report Helpers ----------
function getSalesmanStats(staffId, month) {
  const orders = getOrders({ staffId });
  const monthly = orders.filter(o => o.createdAt && o.createdAt.startsWith(month));
  return {
    totalOrders: monthly.length,
    delivered:   monthly.filter(o => o.status === 'delivered').length,
    revenue:     monthly.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0)
  };
}
function getTopProducts(firmId, limit = 20) {
  const orders = getOrders({ firmId }).filter(o => o.status !== 'cancelled');
  const map = {};
  orders.forEach(o => (o.items || []).forEach(item => {
    const k = item.productId || item.name;
    if (!map[k]) map[k] = { name: item.name, qty: 0, revenue: 0 };
    map[k].qty     += item.qty || 0;
    map[k].revenue += item.subtotal || 0;
  }));
  return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}
function getOutstandingAging(firmId) {
  const shops = getShops();
  return shops.map(shop => {
    const outstanding = getShopOutstanding(shop.id);
    return { shop, ...outstanding };
  }).filter(x => x.totalOutstanding > 0);
}
function getShopPurchaseHistory(shopId) {
  return getOrders({ shopId });
}

// ---------- Export ----------
export const Store = {
  on, emit, getData, initSupabase,
  // Firms
  getFirms, getFirmById,
  // Companies
  getCompanies, getCompanyById, addCompany, updateCompany, deleteCompany,
  // Products
  getProducts, getProductById, getProductPrice, addProduct, updateProduct, deleteProduct,
  // Shops
  getShops, getShopById, addShop, updateShop, deleteShop,
  getShopOutstanding, settleShopOutstanding,
  // Orders
  getOrders, getOrderById, addOrder, updateOrderStatus, updateOrder, deleteOrder,
  // Routes
  getRoutes, getRouteById, addRoute, updateRoute, deleteRoute,
  // Staff
  getStaff, getStaffById, addStaff, updateStaff, deleteStaff,
  // Staff Locations
  saveStaffLocation, getStaffLocations, getStaffLocation,
  // Ledger
  getLedger, addLedgerEntry, addLedgerPayment,
  // Auth
  getAdminPin, setAdminPin, authenticate, authenticateAsync,
  getSession, setSession, clearSession,
  // Stats
  getStats,
  // Targets
  getTargets, getTargetByStaff, setTarget,
  // Beat Plans
  getBeatPlans, setBeatPlan,
  // Returns
  getReturns, addReturn, updateReturnStatus,
  // Reports
  getSalesmanStats, getTopProducts, getOutstandingAging, getShopPurchaseHistory,
};
