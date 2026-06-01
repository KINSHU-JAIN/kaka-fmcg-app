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
    saveData(_data);
  }
}

function persist() {
  saveData(_data);
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
      { data: routes, error: eRoutes }
    ] = await Promise.all([
      supabase.from('firms').select('*'),
      supabase.from('companies').select('*'),
      supabase.from('products').select('*'),
      supabase.from('shops').select('*'),
      supabase.from('staff').select('*'),
      supabase.from('orders').select('*'),
      supabase.from('routes').select('*')
    ]);

    if (eFirms || eCompanies || eProducts || eShops || eStaff || eOrders || eRoutes) {
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
      routes: routes ? routes.map(keysToCamel) : []
    };

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
  const dataKey = table; // firms, companies, products, shops, staff, orders, routes match the table names
  if (!_data || !_data[dataKey]) return;

  const camelNew = keysToCamel(newRow);
  const camelOld = keysToCamel(oldRow);

  console.log(`Realtime change received: [${table}] ${eventType}`, payload);

  if (eventType === 'INSERT') {
    if (!_data[dataKey].some(item => item.id === camelNew.id)) {
      _data[dataKey].push(camelNew);
    }
  } else if (eventType === 'UPDATE') {
    const idx = _data[dataKey].findIndex(item => item.id === camelNew.id);
    if (idx !== -1) {
      _data[dataKey][idx] = { ..._data[dataKey][idx], ...camelNew };
    }
  } else if (eventType === 'DELETE') {
    _data[dataKey] = _data[dataKey].filter(item => item.id !== camelOld.id);
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
  const orders = getOrders({ shopId });
  const unpaidOrders = orders.filter(o => o.paymentStatus === 'unpaid' && o.status !== 'cancelled');
  
  let totalOutstanding = 0;
  let totalPenalty = 0;
  const unpaidDetails = [];
  const now = new Date();
  
  unpaidOrders.forEach(order => {
    const created = new Date(order.createdAt);
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let penalty = 0;
    if (diffDays > 7) {
      penalty = (diffDays - 7) * 50;
    }
    
    const orderOutstanding = order.total + penalty;
    totalOutstanding += orderOutstanding;
    totalPenalty += penalty;
    
    unpaidDetails.push({
      orderId: order.id,
      originalTotal: order.total,
      penalty,
      daysOld: diffDays,
      outstanding: orderOutstanding
    });
  });

  return {
    totalOutstanding,
    totalPenalty,
    unpaidOrdersCount: unpaidOrders.length,
    details: unpaidDetails
  };
}

function settleShopOutstanding(shopId) {
  const orders = _data.orders || [];
  let settledCount = 0;
  const dbUpdates = [];
  
  orders.forEach(o => {
    if (o.shopId === shopId && o.paymentStatus === 'unpaid' && o.status !== 'cancelled') {
      const created = new Date(o.createdAt);
      const diffTime = Math.abs(new Date() - created);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 7) {
        const penalty = (diffDays - 7) * 50;
        o.total += penalty;
        o.penaltyAdded = penalty;
      }
      o.paymentStatus = 'paid';
      settledCount++;

      if (isSupabaseConfigured) {
        dbUpdates.push(
          supabase.from('orders').update({
            total: o.total,
            penalty_added: o.penaltyAdded || 0,
            payment_status: 'paid'
          }).eq('id', o.id)
        );
      }
    }
  });

  emit('orders:change', _data.orders);

  if (isSupabaseConfigured) {
    Promise.all(dbUpdates).then(results => {
      results.forEach(({ error }) => { if (error) console.error('Error settling order outstanding:', error); });
    });
  } else {
    persist();
  }
  return settledCount;
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
  _data.orders[idx].status = status;
  const updates = { status };
  if (status === 'confirmed') {
    _data.orders[idx].confirmedAt = new Date().toISOString();
    updates.confirmedAt = _data.orders[idx].confirmedAt;
  } else if (status === 'delivered') {
    _data.orders[idx].deliveredAt = new Date().toISOString();
    updates.deliveredAt = _data.orders[idx].deliveredAt;
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
    return { role: 'admin', user: { name: 'Kaka', id: 'admin' } };
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
  // Orders
  getOrders,
  getOrderById,
  addOrder,
  updateOrderStatus,
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
