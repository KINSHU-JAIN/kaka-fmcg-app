// ============================================
// KAKA FMCG — Data Store (localStorage + Supabase Sync)
// ============================================

import { supabase, isSupabaseConfigured } from './supabaseClient.js';

const STORAGE_KEY = 'kaka_fmcg_data';

// Event system for reactivity
const listeners = {};

function emit(event, data) {
  (listeners[event] || []).forEach(cb => cb(data));
}

function on(event, callback) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
  return () => {
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  };
}

// ---------- Case Conversion Helpers ----------
function keysToCamel(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const n = {};
  Object.keys(obj).forEach(k => {
    const ck = k.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    n[ck] = obj[k];
  });
  return n;
}

function keysToSnake(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const n = {};
  Object.keys(obj).forEach(k => {
    const sk = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    n[sk] = obj[k];
  });
  return n;
}

// ---------- Persistence ----------
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load data:', e);
  }
  return null;
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

function getData() {
  return _data;
}

let _data = null;

function initStore(seedData) {
  const existing = loadData();
  if (existing) {
    _data = existing;
  } else {
    _data = seedData;
  }
  if (!_data.ledgers) _data.ledgers = [];
  if (!_data.staffLocations) _data.staffLocations = [];
  saveData(_data);
  initLedgers();
}

function persist() {
  saveData(_data);
}

// ---------- Ledger & Location Helpers ----------
function initLedgers() {
  if (!_data.ledgers) _data.ledgers = [];
  
  if (_data.ledgers.length === 0 && _data.orders && _data.orders.length > 0) {
    const sortedOrders = [..._data.orders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    sortedOrders.forEach(o => {
      if (o.status === 'cancelled') return;
      
      // Debit order
      addLedgerEntry(o.shopId, o.total, 'debit', o.id, `Order #${o.id.slice(-6).toUpperCase()} approved`, o.createdAt);
      
      // If paid, credit order
      if (o.paymentStatus === 'paid') {
        addLedgerEntry(o.shopId, o.total, 'credit', o.id, `Payment received for Order #${o.id.slice(-6).toUpperCase()}`, o.deliveredAt || o.createdAt);
      }
    });
  }
}

function getLedger(shopId) {
  const entries = (_data.ledgers || []).filter(e => e.shopId === shopId);
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  return entries;
}

function addLedgerEntry(shopId, amount, type, refId = null, description = '', date = null) {
  if (!_data.ledgers) _data.ledgers = [];
  
  const entries = _data.ledgers.filter(e => e.shopId === shopId);
  let prevBalance = 0;
  if (entries.length > 0) {
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    prevBalance = entries[entries.length - 1].runningBalance;
  }
  
  const balanceChange = (type === 'debit') ? amount : -amount;
  const runningBalance = prevBalance + balanceChange;
  
  const entry = {
    id: uid(),
    shopId,
    date: date || new Date().toISOString(),
    type,
    refId,
    description,
    amount,
    runningBalance
  };
  
  _data.ledgers.push(entry);
  persist();
  emit('ledgers:change', _data.ledgers);

  if (isSupabaseConfigured) {
    supabase.from('ledgers').insert(keysToSnake(entry))
      .then(({ error }) => {
        if (error) console.error('Error inserting ledger entry in Supabase:', error);
      });
  }

  return entry;
}

function addLedgerPayment(shopId, amount, paymentMode, staffId = null) {
  const staff = staffId ? getStaffById(staffId) : null;
  const collector = staff ? staff.name : 'Admin';
  const description = `Partial payment collected in ${paymentMode.toUpperCase()} by ${collector}`;
  
  // Add credit entry
  const entry = addLedgerEntry(shopId, amount, 'credit', null, description);
  
  // Update orders payment status if overall balance is settled
  const outstanding = getShopOutstanding(shopId);
  if (outstanding.totalOutstanding <= 0) {
    const orders = _data.orders || [];
    orders.forEach(o => {
      if (o.shopId === shopId && o.paymentStatus === 'unpaid' && o.status !== 'cancelled') {
        o.paymentStatus = 'paid';
      }
    });
    emit('orders:change', _data.orders);
  }
  
  return entry;
}

function saveStaffLocation(staffId, lat, lng) {
  if (!_data.staffLocations) _data.staffLocations = [];
  const idx = _data.staffLocations.findIndex(l => l.staffId === staffId);
  const location = {
    staffId,
    lat,
    lng,
    updatedAt: new Date().toISOString()
  };
  if (idx !== -1) {
    _data.staffLocations[idx] = location;
  } else {
    _data.staffLocations.push(location);
  }
  persist();
  emit('staffLocations:change', _data.staffLocations);

  if (isSupabaseConfigured) {
    supabase.from('staff_locations').upsert(keysToSnake(location))
      .then(({ error }) => {
        if (error) console.error('Error upserting staff location in Supabase:', error);
      });
  }

  return location;
}

function getStaffLocations() {
  return _data.staffLocations || [];
}

function getStaffLocation(staffId) {
  return (_data.staffLocations || []).find(l => l.staffId === staffId) || null;
}

// ---------- Supabase Connection & Sync ----------
async function initSupabase(fallbackSeedData) {
  if (!isSupabaseConfigured) {
    initStore(fallbackSeedData);
    return;
  }

  try {
    console.log('Connecting to Supabase and loading data...');
    const [
      { data: firms, error: eFirms },
      { data: companies, error: eCompanies },
      { data: products, error: eProducts },
      { data: shops, error: eShops },
      { data: staff, error: eStaff },
      { data: orders, error: eOrders },
      { data: routes, error: eRoutes },
      { data: ledgers, error: eLedgers },
      { data: staffLocations, error: eStaffLocations }
    ] = await Promise.all([
      supabase.from('firms').select('*'),
      supabase.from('companies').select('*'),
      supabase.from('products').select('*'),
      supabase.from('shops').select('*'),
      supabase.from('staff').select('*'),
      supabase.from('orders').select('*'),
      supabase.from('routes').select('*'),
      supabase.from('ledgers').select('*'),
      supabase.from('staff_locations').select('*')
    ]);

    if (eFirms || eCompanies || eProducts || eShops || eStaff || eOrders || eRoutes || eLedgers || eStaffLocations) {
      throw new Error('Failed to query one or more tables from Supabase');
    }

    _data = {
      adminPin: localStorage.getItem('kaka_admin_pin') || 'Kaka@123',
      firms: firms ? firms.map(keysToCamel) : [],
      companies: companies ? companies.map(keysToCamel) : [],
      products: products ? products.map(keysToCamel) : [],
      shops: shops ? shops.map(keysToCamel) : [],
      staff: staff ? staff.map(keysToCamel) : [],
      orders: orders ? orders.map(keysToCamel) : [],
      routes: routes ? routes.map(keysToCamel) : [],
      ledgers: ledgers ? ledgers.map(keysToCamel) : [],
      staffLocations: staffLocations ? staffLocations.map(keysToCamel) : []
    };
    initLedgers();

    console.log('Data loaded successfully from Supabase:', _data);

    // Setup Supabase Realtime listeners
    supabase.channel('kaka-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          handleRealtimeChange(payload);
        }
      )
      .subscribe((status) => {
        console.log('Supabase Realtime status:', status);
      });

  } catch (error) {
    console.error('Supabase initialization failed, falling back to local mode:', error);
    initStore(fallbackSeedData);
  }
}

function handleRealtimeChange(payload) {
  const { table, eventType, new: newRow, old: oldRow } = payload;
  let dataKey = table;
  if (table === 'staff_locations') dataKey = 'staffLocations';
  
  if (!_data || !_data[dataKey]) return;

  const camelNew = keysToCamel(newRow);
  const camelOld = keysToCamel(oldRow);

  console.log(`Realtime change received: [${table}] ${eventType}`, payload);

  const keyField = (dataKey === 'staffLocations') ? 'staffId' : 'id';

  if (eventType === 'INSERT') {
    if (!_data[dataKey].some(item => item[keyField] === camelNew[keyField])) {
      _data[dataKey].push(camelNew);
    }
  } else if (eventType === 'UPDATE') {
    const idx = _data[dataKey].findIndex(item => item[keyField] === camelNew[keyField]);
    if (idx !== -1) {
      _data[dataKey][idx] = { ..._data[dataKey][idx], ...camelNew };
    }
  } else if (eventType === 'DELETE') {
    _data[dataKey] = _data[dataKey].filter(item => item[keyField] !== camelOld[keyField]);
  }

  // Trigger reactive redraws
  emit(`${dataKey}:change`, _data[dataKey]);
  emit('data:change', _data);
}

// ---------- UUID ----------
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- Firms ----------
function getFirms() {
  return _data.firms || [];
}

function getFirmById(id) {
  return (_data.firms || []).find(f => f.id === id);
}

// ---------- Companies ----------
function getCompanies(firmId) {
  let companies = _data.companies || [];
  if (firmId) companies = companies.filter(c => c.firmId === firmId);
  return companies;
}

function getCompanyById(id) {
  return (_data.companies || []).find(c => c.id === id);
}

function addCompany(company) {
  const newCompany = { id: uid(), isActive: true, ...company };
  _data.companies.push(newCompany);
  emit('companies:change', _data.companies);

  if (isSupabaseConfigured) {
    supabase.from('companies').insert(keysToSnake(newCompany))
      .then(({ error }) => { if (error) console.error('Error adding company:', error); });
  } else {
    persist();
  }
  return newCompany;
}

function updateCompany(id, updates) {
  const idx = _data.companies.findIndex(c => c.id === id);
  if (idx === -1) return null;
  _data.companies[idx] = { ..._data.companies[idx], ...updates };
  emit('companies:change', _data.companies);

  if (isSupabaseConfigured) {
    supabase.from('companies').update(keysToSnake(updates)).eq('id', id)
      .then(({ error }) => { if (error) console.error('Error updating company:', error); });
  } else {
    persist();
  }
  return _data.companies[idx];
}

function deleteCompany(id) {
  _data.companies = _data.companies.filter(c => c.id !== id);
  // Also delete products of this company
  _data.products = _data.products.filter(p => p.companyId !== id);
  emit('companies:change', _data.companies);
  emit('products:change', _data.products);

  if (isSupabaseConfigured) {
    Promise.all([
      supabase.from('companies').delete().eq('id', id),
      supabase.from('products').delete().eq('company_id', id)
    ]).then(results => {
      results.forEach(({ error }) => { if (error) console.error('Error deleting company/products:', error); });
    });
  } else {
    persist();
  }
  return true;
}

// ---------- Products ----------
function getProducts(filters = {}) {
  let products = _data.products || [];
  if (filters.firmId) products = products.filter(p => p.firmId === filters.firmId);
  if (filters.companyId) products = products.filter(p => p.companyId === filters.companyId);
  if (filters.isActive !== undefined) products = products.filter(p => p.isActive === filters.isActive);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q));
  }
  return products;
}

function getProductById(id) {
  return (_data.products || []).find(p => p.id === id);
}

function getProductPrice(product, qty) {
  if (!product) return 0;
  if (!qty || qty <= 0) return product.sellingPrice;
  if (!product.tierPrices || product.tierPrices.length === 0) return product.sellingPrice;
  const sorted = [...product.tierPrices].sort((a, b) => b.minQty - a.minQty);
  const matched = sorted.find(t => qty >= t.minQty);
  return matched ? matched.price : product.sellingPrice;
}

function addProduct(product) {
  const newProduct = { id: uid(), isActive: true, ...product };
  _data.products.push(newProduct);
  emit('products:change', _data.products);

  if (isSupabaseConfigured) {
    supabase.from('products').insert(keysToSnake(newProduct))
      .then(({ error }) => { if (error) console.error('Error adding product:', error); });
  } else {
    persist();
  }
  return newProduct;
}

function updateProduct(id, updates) {
  const idx = _data.products.findIndex(p => p.id === id);
  if (idx === -1) return null;
  _data.products[idx] = { ..._data.products[idx], ...updates };
  emit('products:change', _data.products);

  if (isSupabaseConfigured) {
    supabase.from('products').update(keysToSnake(updates)).eq('id', id)
      .then(({ error }) => { if (error) console.error('Error updating product:', error); });
  } else {
    persist();
  }
  return _data.products[idx];
}

function deleteProduct(id) {
  _data.products = _data.products.filter(p => p.id !== id);
  emit('products:change', _data.products);

  if (isSupabaseConfigured) {
    supabase.from('products').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('Error deleting product:', error); });
  } else {
    persist();
  }
  return true;
}

// ---------- Shops ----------
function getShops(filters = {}) {
  let shops = _data.shops || [];
  if (filters.routeId) shops = shops.filter(s => s.routeId === filters.routeId);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    shops = shops.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.ownerName.toLowerCase().includes(q)
    );
  }
  return shops;
}

function getShopById(id) {
  return (_data.shops || []).find(s => s.id === id);
}

function addShop(shop) {
  const newShop = { id: uid(), ...shop };
  _data.shops.push(newShop);
  emit('shops:change', _data.shops);

  if (isSupabaseConfigured) {
    supabase.from('shops').insert(keysToSnake(newShop))
      .then(({ error }) => { if (error) console.error('Error adding shop:', error); });
  } else {
    persist();
  }
  return newShop;
}

function updateShop(id, updates) {
  const idx = _data.shops.findIndex(s => s.id === id);
  if (idx === -1) return null;
  _data.shops[idx] = { ..._data.shops[idx], ...updates };
  emit('shops:change', _data.shops);

  if (isSupabaseConfigured) {
    supabase.from('shops').update(keysToSnake(updates)).eq('id', id)
      .then(({ error }) => { if (error) console.error('Error updating shop:', error); });
  } else {
    persist();
  }
  return _data.shops[idx];
}

function deleteShop(id) {
  _data.shops = _data.shops.filter(s => s.id !== id);
  // Remove from routes
  _data.routes.forEach(r => {
    r.shopIds = (r.shopIds || []).filter(sid => sid !== id);
  });
  
  emit('shops:change', _data.shops);
  emit('routes:change', _data.routes);

  if (isSupabaseConfigured) {
    const routeUpdates = _data.routes.map(r => 
      supabase.from('routes').update({ shop_ids: r.shopIds }).eq('id', r.id)
    );
    Promise.all([
      supabase.from('shops').delete().eq('id', id),
      ...routeUpdates
    ]).then(results => {
      results.forEach(({ error }) => { if (error) console.error('Error deleting shop/updating routes:', error); });
    });
  } else {
    persist();
  }
  return true;
}

function getShopOutstanding(shopId) {
  const entries = (_data.ledgers || []).filter(e => e.shopId === shopId);
  if (entries.length === 0) {
    return {
      totalOutstanding: 0,
      totalPenalty: 0,
      unpaidOrdersCount: 0,
      details: []
    };
  }
  
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  const latestEntry = entries[entries.length - 1];
  const ledgerBalance = latestEntry.runningBalance;
  
  const unpaidDetails = [];
  let totalPenalty = 0;
  const now = new Date();
  
  // Find unpaid debit transactions (orders)
  const debitEntries = entries.filter(e => e.type === 'debit');
  const creditEntries = entries.filter(e => e.type === 'credit');
  const creditRefIds = new Set(creditEntries.map(e => e.refId).filter(Boolean));
  
  debitEntries.forEach(debit => {
    if (!creditRefIds.has(debit.refId)) {
      const order = getOrderById(debit.refId);
      if (order && order.status !== 'cancelled' && order.paymentStatus !== 'paid') {
        const created = new Date(order.createdAt);
        const diffTime = Math.abs(now - created);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        let penalty = 0;
        if (diffDays > 7) {
          penalty = (diffDays - 7) * 50;
          totalPenalty += penalty;
        }
        
        unpaidDetails.push({
          orderId: order.id,
          originalTotal: order.total,
          penalty,
          daysOld: diffDays,
          outstanding: order.total + penalty
        });
      }
    }
  });

  return {
    totalOutstanding: Math.max(0, ledgerBalance + totalPenalty),
    totalPenalty,
    unpaidOrdersCount: unpaidDetails.length,
    details: unpaidDetails
  };
}

function settleShopOutstanding(shopId) {
  const outstanding = getShopOutstanding(shopId);
  if (outstanding.totalOutstanding <= 0) return 0;
  
  // Add credit entry
  addLedgerEntry(shopId, outstanding.totalOutstanding, 'credit', null, 'Full outstanding balance settlement');
  
  // Mark unpaid orders as paid
  const orders = _data.orders || [];
  const dbUpdates = [];
  
  orders.forEach(o => {
    if (o.shopId === shopId && o.paymentStatus === 'unpaid' && o.status !== 'cancelled') {
      o.paymentStatus = 'paid';
      
      if (isSupabaseConfigured) {
        dbUpdates.push(
          supabase.from('orders').update({ payment_status: 'paid' }).eq('id', o.id)
        );
      }
    }
  });

  emit('orders:change', _data.orders);

  if (isSupabaseConfigured) {
    Promise.all(dbUpdates).then(results => {
      results.forEach(({ error }) => { if (error) console.error('Error settling orders on Supabase:', error); });
    });
  } else {
    persist();
  }
  return 1;
}

// ---------- Orders ----------
function getOrders(filters = {}) {
  let orders = _data.orders || [];
  if (filters.firmId) orders = orders.filter(o => o.firmId === filters.firmId);
  if (filters.staffId) orders = orders.filter(o => o.staffId === filters.staffId);
  if (filters.status) orders = orders.filter(o => o.status === filters.status);
  if (filters.shopId) orders = orders.filter(o => o.shopId === filters.shopId);
  // Sort by createdAt descending
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return orders;
}

function getOrderById(id) {
  return (_data.orders || []).find(o => o.id === id);
}

function addOrder(order) {
  const newOrder = {
    id: uid(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    penaltyAdded: 0,
    ...order
  };
  _data.orders.push(newOrder);
  emit('orders:change', _data.orders);

  if (isSupabaseConfigured) {
    supabase.from('orders').insert(keysToSnake(newOrder))
      .then(({ error }) => { if (error) console.error('Error adding order:', error); });
  } else {
    persist();
  }
  return newOrder;
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
    
    // Debit order
    addLedgerEntry(_data.orders[idx].shopId, _data.orders[idx].total, 'debit', id, `Order #${id.slice(-6).toUpperCase()} approved`);
  } else if (status === 'delivered') {
    _data.orders[idx].deliveredAt = new Date().toISOString();
    updates.deliveredAt = _data.orders[idx].deliveredAt;
    
    if (_data.orders[idx].paymentStatus === 'paid') {
      addLedgerEntry(_data.orders[idx].shopId, _data.orders[idx].total, 'credit', id, `Payment received on delivery for Order #${id.slice(-6).toUpperCase()}`);
    }
  } else if (status === 'cancelled') {
    if (oldStatus === 'confirmed' || oldStatus === 'delivered') {
      addLedgerEntry(_data.orders[idx].shopId, _data.orders[idx].total, 'credit', id, `Order #${id.slice(-6).toUpperCase()} cancelled (Reverted debit)`);
    }
  }
  
  emit('orders:change', _data.orders);

  if (isSupabaseConfigured) {
    supabase.from('orders').update(keysToSnake(updates)).eq('id', id)
      .then(({ error }) => { if (error) console.error('Error updating order status:', error); });
  } else {
    persist();
  }
  return _data.orders[idx];
}

function updateOrder(id, updates) {
  const idx = _data.orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  
  const oldOrder = { ..._data.orders[idx] };
  _data.orders[idx] = { ..._data.orders[idx], ...updates };
  const newOrder = _data.orders[idx];
  
  // Ledger operations
  if (updates.status === 'confirmed' && oldOrder.status !== 'confirmed') {
    addLedgerEntry(newOrder.shopId, newOrder.total, 'debit', id, `Order #${id.slice(-6).toUpperCase()} approved`);
  }
  
  if (updates.status === 'delivered' && oldOrder.status !== 'delivered') {
    if (newOrder.paymentStatus === 'paid') {
      addLedgerEntry(newOrder.shopId, newOrder.total, 'credit', id, `Payment received for Order #${id.slice(-6).toUpperCase()}`);
    }
  }
  
  if (updates.paymentStatus === 'paid' && oldOrder.paymentStatus !== 'paid') {
    addLedgerEntry(newOrder.shopId, newOrder.total, 'credit', id, `Payment received for Order #${id.slice(-6).toUpperCase()}`);
  }
  
  if (updates.status === 'cancelled' && oldOrder.status !== 'cancelled') {
    if (oldOrder.status === 'confirmed' || oldOrder.status === 'delivered') {
      addLedgerEntry(newOrder.shopId, newOrder.total, 'credit', id, `Order #${id.slice(-6).toUpperCase()} cancelled (Reverted debit)`);
    }
  }
  
  emit('orders:change', _data.orders);

  if (isSupabaseConfigured) {
    supabase.from('orders').update(keysToSnake(updates)).eq('id', id)
      .then(({ error }) => { if (error) console.error('Error updating order:', error); });
  } else {
    persist();
  }
  return _data.orders[idx];
}

function deleteOrder(id) {
  _data.orders = _data.orders.filter(o => o.id !== id);
  emit('orders:change', _data.orders);

  if (isSupabaseConfigured) {
    supabase.from('orders').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('Error deleting order:', error); });
  } else {
    persist();
  }
  return true;
}

// ---------- Routes ----------
function getRoutes(firmId) {
  let routes = _data.routes || [];
  if (firmId) routes = routes.filter(r => r.firmId === firmId);
  return routes;
}

function getRouteById(id) {
  return (_data.routes || []).find(r => r.id === id);
}

function addRoute(route) {
  const newRoute = { id: uid(), shopIds: [], ...route };
  _data.routes.push(newRoute);
  emit('routes:change', _data.routes);

  if (isSupabaseConfigured) {
    supabase.from('routes').insert(keysToSnake(newRoute))
      .then(({ error }) => { if (error) console.error('Error adding route:', error); });
  } else {
    persist();
  }
  return newRoute;
}

function updateRoute(id, updates) {
  const idx = _data.routes.findIndex(r => r.id === id);
  if (idx === -1) return null;
  _data.routes[idx] = { ..._data.routes[idx], ...updates };
  emit('routes:change', _data.routes);

  if (isSupabaseConfigured) {
    supabase.from('routes').update(keysToSnake(updates)).eq('id', id)
      .then(({ error }) => { if (error) console.error('Error updating route:', error); });
  } else {
    persist();
  }
  return _data.routes[idx];
}

function deleteRoute(id) {
  // Unassign shops from this route
  _data.shops.forEach(s => {
    if (s.routeId === id) s.routeId = null;
  });
  _data.routes = _data.routes.filter(r => r.id !== id);
  
  emit('routes:change', _data.routes);
  emit('shops:change', _data.shops);

  if (isSupabaseConfigured) {
    const shopUpdates = _data.shops.map(s => 
      supabase.from('shops').update({ route_id: s.routeId }).eq('id', s.id)
    );
    Promise.all([
      supabase.from('routes').delete().eq('id', id),
      ...shopUpdates
    ]).then(results => {
      results.forEach(({ error }) => { if (error) console.error('Error deleting route/updating shops:', error); });
    });
  } else {
    persist();
  }
  return true;
}

// ---------- Staff ----------
function getStaff() {
  return _data.staff || [];
}

function getStaffById(id) {
  return (_data.staff || []).find(s => s.id === id);
}

function addStaff(staff) {
  const newStaff = { id: uid(), ...staff };
  _data.staff.push(newStaff);
  emit('staff:change', _data.staff);

  if (isSupabaseConfigured) {
    supabase.from('staff').insert(keysToSnake(newStaff))
      .then(({ error }) => { if (error) console.error('Error adding staff:', error); });
  } else {
    persist();
  }
  return newStaff;
}

function updateStaff(id, updates) {
  const idx = _data.staff.findIndex(s => s.id === id);
  if (idx === -1) return null;
  _data.staff[idx] = { ..._data.staff[idx], ...updates };
  emit('staff:change', _data.staff);

  if (isSupabaseConfigured) {
    supabase.from('staff').update(keysToSnake(updates)).eq('id', id)
      .then(({ error }) => { if (error) console.error('Error updating staff:', error); });
  } else {
    persist();
  }
  return _data.staff[idx];
}

function deleteStaff(id) {
  _data.staff = _data.staff.filter(s => s.id !== id);
  emit('staff:change', _data.staff);

  if (isSupabaseConfigured) {
    supabase.from('staff').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('Error deleting staff:', error); });
  } else {
    persist();
  }
  return true;
}

// ---------- Auth ----------
function getAdminPin() {
  return _data.adminPin || '1234';
}

function setAdminPin(pin) {
  _data.adminPin = pin;
  persist();
}

function authenticate(username, password) {
  const u = (username || '').trim().toLowerCase();
  const p = (password || '').trim();

  // Check admin
  if (u === 'kaka' && p === 'Kaka@123') {
    return { role: 'admin', requires2fa: true, user: { name: 'Kaka', id: 'admin' } };
  }

  // Check staff
  const staff = (_data.staff || []).find(s => {
    const sUser = (s.username || s.name || '').trim().toLowerCase();
    const sPass = (s.password || s.pin || '').trim();
    return sUser === u && sPass === p;
  });

  if (staff) {
    if (staff.isBlocked) {
      return { role: 'staff', blocked: true, user: { name: staff.name, id: staff.id } };
    }
    return { role: 'staff', user: { name: staff.name, id: staff.id } };
  }
  return null;
}

function getSession() {
  try {
    const raw = sessionStorage.getItem('kaka_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSession(session) {
  sessionStorage.setItem('kaka_session', JSON.stringify(session));
}

function clearSession() {
  sessionStorage.removeItem('kaka_session');
}

// ---------- Stats ----------
function getStats(firmId) {
  const orders = getOrders(firmId ? { firmId } : {});
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.createdAt.split('T')[0] === today);
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const todayRevenue = todayOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return {
    totalOrders: orders.length,
    todayOrders: todayOrders.length,
    pendingOrders: pendingOrders.length,
    todayRevenue,
    totalRevenue,
    totalProducts: getProducts(firmId ? { firmId } : {}).length,
    totalCompanies: getCompanies(firmId).length,
    totalShops: getShops().length,
    totalStaff: getStaff().length,
    activeRoutes: getRoutes(firmId).length
  };
}

// ---------- Reset ----------
function resetData(seedData) {
  _data = seedData;
  saveData(_data);
  emit('data:reset');
}

// ---------- Export ----------
export const Store = {
  init: initStore,
  initSupabase,
  // Events
  on,
  emit,
  // Firms
  getFirms,
  getFirmById,
  // Companies
  getCompanies,
  getCompanyById,
  addCompany,
  updateCompany,
  deleteCompany,
  // Products
  getProducts,
  getProductById,
  getProductPrice,
  addProduct,
  updateProduct,
  deleteProduct,
  // Shops
  getShops,
  getShopById,
  addShop,
  updateShop,
  deleteShop,
  getShopOutstanding,
  settleShopOutstanding,
  // Ledger & Geolocation
  getLedger,
  addLedgerEntry,
  addLedgerPayment,
  saveStaffLocation,
  getStaffLocations,
  getStaffLocation,
  // Orders
  getOrders,
  getOrderById,
  addOrder,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
  // Routes
  getRoutes,
  getRouteById,
  addRoute,
  updateRoute,
  deleteRoute,
  // Staff
  getStaff,
  getStaffById,
  addStaff,
  updateStaff,
  deleteStaff,
  // Auth
  getAdminPin,
  setAdminPin,
  authenticate,
  getSession,
  setSession,
  clearSession,
  // Stats
  getStats,
  // Utility
  reset: resetData,
  uid
};
