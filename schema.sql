-- ==========================================================================
-- KAKA FMCG - SUPABASE POSTGRESQL SCHEMA
-- Paste this script into your Supabase SQL Editor to create and seed tables.
-- ==========================================================================

-- Drop existing tables if any
drop table if exists orders cascade;
drop table if exists routes cascade;
drop table if exists shops cascade;
drop table if exists products cascade;
drop table if exists companies cascade;
drop table if exists staff cascade;
drop table if exists firms cascade;

-- 1. Firms Table
create table firms (
    id text primary key,
    name text not null,
    short_name text,
    owner text,
    phone text,
    phone2 text,
    address text,
    type text
);

-- 2. Companies Table
create table companies (
    id text primary key,
    firm_id text references firms(id) on delete cascade,
    name text not null,
    icon text,
    is_active boolean default true
);

-- 3. Products Table
create table products (
    id text primary key,
    company_id text references companies(id) on delete cascade,
    firm_id text references firms(id) on delete cascade,
    name text not null,
    mrp numeric not null,
    selling_price numeric not null,
    unit text not null,
    stock integer default 0,
    is_active boolean default true,
    tier_prices jsonb default '[]'::jsonb
);

-- 4. Shops Table
create table shops (
    id text primary key,
    name text not null,
    owner_name text,
    phone text,
    address text,
    route_id text
);

-- 5. Staff (Workers) Table
create table staff (
    id text primary key,
    name text not null,
    phone text,
    pin text,
    username text unique,
    password text,
    is_blocked boolean default false
);

-- 6. Orders Table
create table orders (
    id text primary key,
    shop_id text references shops(id) on delete set null,
    shop_name text,
    staff_id text references staff(id) on delete set null,
    staff_name text,
    firm_id text references firms(id) on delete cascade,
    items jsonb not null,
    total numeric not null,
    status text default 'pending',
    created_at timestamptz default now(),
    payment_mode text,
    payment_status text,
    notes text,
    penalty_added numeric default 0
);

-- 7. Routes Table
create table routes (
    id text primary key,
    name text not null,
    firm_id text references firms(id) on delete cascade,
    shop_ids jsonb default '[]'::jsonb,
    assigned_staff_id text references staff(id) on delete set null
);

-- Enable Realtime for all tables to support instant sync
alter publish replication_group_realtime add table firms;
alter publish replication_group_realtime add table companies;
alter publish replication_group_realtime add table products;
alter publish replication_group_realtime add table shops;
alter publish replication_group_realtime add table staff;
alter publish replication_group_realtime add table orders;
alter publish replication_group_realtime add table routes;

-- SEED DATA

-- Insert Firms
insert into firms (id, name, short_name, owner, phone, phone2, address, type) values
('firm_ka', 'Kaka Agencies', 'KA', 'Nitesh Kumar Bhawara', '+91 75979 07444', '+91 99296 48852', 'Kaka Building, Mochi Bazar, Kherwara – 313803, Rajasthan', 'Wholesale · FMCG Distributor'),
('firm_km', 'Kaka Marketing', 'KM', 'Divya Jain', '+91 75979 07444', '+91 99296 48852', 'Kaka Building, Mochi Bazar, Kherwara – 313803, Rajasthan', 'Wholesale · FMCG Distributor');

-- Insert Staff
insert into staff (id, name, phone, pin, username, password, is_blocked) values
('staff1', 'Raju', '+91 99887 76655', '5678', 'raju', 'Raju@123', false);

-- Insert Companies
insert into companies (id, firm_id, name, icon, is_active) values
('comp_hul', 'firm_ka', 'Hindustan Unilever (HUL)', '🧴', true),
('comp_dabur', 'firm_ka', 'Dabur', '🌿', true),
('comp_reckitt', 'firm_ka', 'Reckitt Benckiser', '🧹', true),
('comp_cadbury', 'firm_ka', 'Cadbury (Mondelez)', '🍫', true),
('comp_nestle', 'firm_ka', 'Nestlé', '☕', true),
('comp_pg', 'firm_ka', 'P&G', '🪥', true),
('comp_himalaya', 'firm_ka', 'Himalaya', '🏔️', true),
('comp_scj', 'firm_ka', 'SC Johnson', '🏠', true),
('comp_godrej', 'firm_ka', 'Godrej', '✨', true),
('comp_wipro', 'firm_ka', 'Wipro Consumer', '🌸', true),
('comp_brit', 'firm_ka', 'Britannia', '🍪', true),
('comp_ferrero', 'firm_ka', 'Ferrero', '🍬', true),
('comp_vini', 'firm_ka', 'Vini Cosmetics', '💄', true),
('comp_zydus', 'firm_ka', 'Zydus Wellness', '💊', true),
('comp_garnier', 'firm_ka', 'Garnier (L''Oréal)', '💆', true),
('comp_patanjali', 'firm_ka', 'Patanjali', '🧘', true),
('comp_gsk', 'firm_ka', 'GSK (Haleon)', '💉', true),
('comp_marico', 'firm_ka', 'Marico', '🥥', true),
('comp_amul', 'firm_km', 'Amul', '🥛', true);

-- Insert Products
insert into products (id, company_id, firm_id, name, mrp, selling_price, unit, stock, is_active, tier_prices) values
('p001', 'comp_hul', 'firm_ka', 'Surf Excel Easy Wash 1kg', 125, 118, 'pack', 200, true, '[]'::jsonb),
('p002', 'comp_hul', 'firm_ka', 'Lux Soap 100g (Pack of 4)', 155, 146, 'pack', 300, true, '[]'::jsonb),
('p003', 'comp_hul', 'firm_ka', 'Clinic Plus Shampoo 340ml', 199, 185, 'bottle', 150, true, '[]'::jsonb),
('p004', 'comp_hul', 'firm_ka', 'Vim Dishwash Bar 300g', 30, 28, 'piece', 500, true, '[]'::jsonb),
('p005', 'comp_hul', 'firm_ka', 'Lifebuoy Hand Wash 190ml', 99, 92, 'bottle', 200, true, '[]'::jsonb),
('p006', 'comp_hul', 'firm_ka', 'Brooke Bond Red Label 500g', 260, 245, 'pack', 180, true, '[]'::jsonb),
('p007', 'comp_hul', 'firm_ka', 'Ponds Talcum Powder 300g', 175, 162, 'bottle', 120, true, '[]'::jsonb),
('p010', 'comp_dabur', 'firm_ka', 'Dabur Red Toothpaste 200g', 109, 100, 'tube', 250, true, '[]'::jsonb),
('p011', 'comp_dabur', 'firm_ka', 'Dabur Chyawanprash 500g', 285, 268, 'jar', 100, true, '[]'::jsonb),
('p012', 'comp_dabur', 'firm_ka', 'Dabur Amla Hair Oil 450ml', 210, 195, 'bottle', 160, true, '[]'::jsonb),
('p013', 'comp_dabur', 'firm_ka', 'Dabur Honey 500g', 299, 280, 'bottle', 90, true, '[]'::jsonb),
('p014', 'comp_dabur', 'firm_ka', 'Réal Fruit Juice 1L', 110, 102, 'pack', 200, true, '[]'::jsonb),
('p020', 'comp_reckitt', 'firm_ka', 'Dettol Soap 125g (Pack of 3)', 177, 165, 'pack', 300, true, '[]'::jsonb),
('p021', 'comp_reckitt', 'firm_ka', 'Harpic Power Plus 500ml', 109, 100, 'bottle', 200, true, '[]'::jsonb),
('p022', 'comp_reckitt', 'firm_ka', 'Lizol Floor Cleaner 500ml', 125, 116, 'bottle', 180, true, '[]'::jsonb),
('p023', 'comp_reckitt', 'firm_ka', 'Mortein All Insect Killer 425ml', 220, 205, 'can', 120, true, '[]'::jsonb),
('p030', 'comp_cadbury', 'firm_ka', 'Cadbury Dairy Milk 50g', 50, 47, 'piece', 500, true, '[]'::jsonb),
('p031', 'comp_cadbury', 'firm_ka', 'Cadbury 5 Star 40g', 30, 28, 'piece', 600, true, '[]'::jsonb),
('p032', 'comp_cadbury', 'firm_ka', 'Oreo Biscuits 120g', 35, 33, 'pack', 400, true, '[]'::jsonb),
('p033', 'comp_cadbury', 'firm_ka', 'Bournvita Health Drink 500g', 260, 242, 'jar', 150, true, '[]'::jsonb),
('p034', 'comp_cadbury', 'firm_ka', 'Tang Orange 500g', 150, 140, 'pack', 200, true, '[]'::jsonb),
('p040', 'comp_nestle', 'firm_ka', 'Maggi 2-Minute Noodles (Pack of 12)', 168, 156, 'pack', 300, true, '[]'::jsonb),
('p041', 'comp_nestle', 'firm_ka', 'Nescafé Classic 100g', 310, 290, 'jar', 120, true, '[]'::jsonb),
('p042', 'comp_nestle', 'firm_ka', 'Nestlé Everyday Dairy Whitener 400g', 199, 185, 'pack', 200, true, '[]'::jsonb),
('p043', 'comp_nestle', 'firm_ka', 'KitKat 37.3g', 30, 28, 'piece', 500, true, '[]'::jsonb),
('p044', 'comp_nestle', 'firm_ka', 'Cerelac Baby Food 300g', 255, 238, 'pack', 80, true, '[]'::jsonb),
('p050', 'comp_pg', 'firm_ka', 'Head & Shoulders Shampoo 340ml', 340, 318, 'bottle', 100, true, '[]'::jsonb),
('p051', 'comp_pg', 'firm_ka', 'Gillette Guard Razor', 55, 50, 'piece', 200, true, '[]'::jsonb),
('p052', 'comp_pg', 'firm_ka', 'Tide Plus Detergent 1kg', 95, 88, 'pack', 250, true, '[]'::jsonb),
('p053', 'comp_pg', 'firm_ka', 'Whisper Choice Wings (Pack of 7)', 55, 51, 'pack', 300, true, '[]'::jsonb),
('p054', 'comp_pg', 'firm_ka', 'Ariel Matic Top Load 1kg', 199, 185, 'pack', 150, true, '[]'::jsonb),
('p060', 'comp_himalaya', 'firm_ka', 'Himalaya Neem Face Wash 200ml', 210, 196, 'tube', 120, true, '[]'::jsonb),
('p061', 'comp_himalaya', 'firm_ka', 'Himalaya Baby Cream 200ml', 199, 185, 'tube', 100, true, '[]'::jsonb),
('p062', 'comp_himalaya', 'firm_ka', 'Himalaya Anti-Hair Fall Shampoo 400ml', 310, 290, 'bottle', 80, true, '[]'::jsonb),
('p070', 'comp_scj', 'firm_ka', 'Good Knight Gold Flash Refill', 85, 78, 'piece', 200, true, '[]'::jsonb),
('p071', 'comp_scj', 'firm_ka', 'All Out Ultra Refill (Twin Pack)', 130, 120, 'pack', 150, true, '[]'::jsonb),
('p080', 'comp_godrej', 'firm_ka', 'Godrej No.1 Soap 100g (Pack of 4)', 118, 110, 'pack', 250, true, '[]'::jsonb),
('p081', 'comp_godrej', 'firm_ka', 'Cinthol Deo Spray 150ml', 199, 185, 'can', 120, true, '[]'::jsonb),
('p082', 'comp_godrej', 'firm_ka', 'Godrej Expert Hair Colour', 45, 42, 'pack', 200, true, '[]'::jsonb),
('p090', 'comp_wipro', 'firm_ka', 'Santoor Sandal Soap 100g (Pack of 4)', 130, 120, 'pack', 300, true, '[]'::jsonb),
('p091', 'comp_wipro', 'firm_ka', 'Chandrika Ayurvedic Soap 125g', 40, 37, 'piece', 200, true, '[]'::jsonb),
('p100', 'comp_brit', 'firm_ka', 'Britannia Good Day 250g', 55, 51, 'pack', 400, true, '[]'::jsonb),
('p101', 'comp_brit', 'firm_ka', 'Britannia Marie Gold 250g', 35, 33, 'pack', 500, true, '[]'::jsonb),
('p102', 'comp_brit', 'firm_ka', 'Britannia 50-50 Maska Chaska 120g', 25, 23, 'pack', 400, true, '[]'::jsonb),
('p103', 'comp_brit', 'firm_ka', 'Britannia Bread (White) 400g', 45, 42, 'piece', 100, true, '[]'::jsonb),
('p110', 'comp_ferrero', 'firm_ka', 'Ferrero Rocher T16', 499, 465, 'box', 50, true, '[]'::jsonb),
('p111', 'comp_ferrero', 'firm_ka', 'Nutella 290g', 399, 370, 'jar', 60, true, '[]'::jsonb),
('p112', 'comp_ferrero', 'firm_ka', 'Kinder Joy', 50, 47, 'piece', 200, true, '[]'::jsonb),
('p120', 'comp_vini', 'firm_ka', 'Fogg Body Spray 150ml', 250, 232, 'can', 100, true, '[]'::jsonb),
('p121', 'comp_vini', 'firm_ka', 'IBA Lipstick', 175, 162, 'piece', 80, true, '[]'::jsonb),
('p130', 'comp_zydus', 'firm_ka', 'Sugar Free Gold Pellets 100', 130, 120, 'box', 80, true, '[]'::jsonb),
('p131', 'comp_zydus', 'firm_ka', 'Complan Royale Chocolate 500g', 290, 270, 'pack', 100, true, '[]'::jsonb),
('p132', 'comp_zydus', 'firm_ka', 'Glucon-D Orange 450g', 152, 140, 'pack', 150, true, '[]'::jsonb),
('p140', 'comp_garnier', 'firm_ka', 'Garnier Men Acno Fight Face Wash 100g', 199, 185, 'tube', 100, true, '[]'::jsonb),
('p141', 'comp_garnier', 'firm_ka', 'Garnier Fructis Shampoo 340ml', 225, 210, 'bottle', 80, true, '[]'::jsonb),
('p142', 'comp_garnier', 'firm_ka', 'Garnier Colour Naturals Hair Colour', 145, 135, 'pack', 100, true, '[]'::jsonb),
('p150', 'comp_patanjali', 'firm_ka', 'Patanjali Dant Kanti 200g', 100, 93, 'tube', 200, true, '[]'::jsonb),
('p151', 'comp_patanjali', 'firm_ka', 'Patanjali Cow Ghee 500ml', 320, 298, 'bottle', 80, true, '[]'::jsonb),
('p152', 'comp_patanjali', 'firm_ka', 'Patanjali Aloe Vera Gel 150ml', 85, 78, 'tube', 120, true, '[]'::jsonb),
('p153', 'comp_patanjali', 'firm_ka', 'Patanjali Atta Noodles (Pack of 4)', 60, 55, 'pack', 200, true, '[]'::jsonb),
('p160', 'comp_gsk', 'firm_ka', 'Sensodyne Original 100g', 200, 186, 'tube', 100, true, '[]'::jsonb),
('p161', 'comp_gsk', 'firm_ka', 'Horlicks Classic Malt 500g', 285, 265, 'jar', 120, true, '[]'::jsonb),
('p162', 'comp_gsk', 'firm_ka', 'Boost Health Drink 500g', 272, 255, 'jar', 100, true, '[]'::jsonb),
('p163', 'comp_gsk', 'firm_ka', 'Crocin Advance 20 Tablets', 30, 28, 'strip', 300, true, '[]'::jsonb),
('p170', 'comp_marico', 'firm_ka', 'Parachute Coconut Oil 500ml', 165, 154, 'bottle', 200, true, '[]'::jsonb),
('p171', 'comp_marico', 'firm_ka', 'Saffola Gold Oil 1L', 199, 185, 'bottle', 100, true, '[]'::jsonb),
('p172', 'comp_marico', 'firm_ka', 'Set Wet Hair Gel 250ml', 175, 162, 'tube', 80, true, '[]'::jsonb),
('p173', 'comp_marico', 'firm_ka', 'Livon Hair Serum 100ml', 210, 196, 'bottle', 70, true, '[]'::jsonb),
('p200', 'comp_amul', 'firm_km', 'Amul Taaza Toned Milk 500ml', 30, 28, 'pack', 500, true, '[]'::jsonb),
('p201', 'comp_amul', 'firm_km', 'Amul Gold Full Cream Milk 500ml', 35, 33, 'pack', 400, true, '[]'::jsonb),
('p202', 'comp_amul', 'firm_km', 'Amul Butter 500g', 280, 268, 'pack', 150, true, '[]'::jsonb),
('p203', 'comp_amul', 'firm_km', 'Amul Cheese Slices 200g', 130, 122, 'pack', 100, true, '[]'::jsonb),
('p204', 'comp_amul', 'firm_km', 'Amul Fresh Paneer 200g', 100, 93, 'pack', 80, true, '[]'::jsonb),
('p205', 'comp_amul', 'firm_km', 'Amul Kool Koko 200ml', 25, 23, 'piece', 300, true, '[]'::jsonb),
('p206', 'comp_amul', 'firm_km', 'Amul Ghee 500ml', 310, 292, 'tin', 100, true, '[]'::jsonb),
('p207', 'comp_amul', 'firm_km', 'Amul Ice Cream (Vanilla) 1L', 220, 205, 'tub', 60, true, '[]'::jsonb),
('p208', 'comp_amul', 'firm_km', 'Amul Masti Dahi 400g', 45, 42, 'cup', 200, true, '[]'::jsonb),
('p209', 'comp_amul', 'firm_km', 'Amul Dark Chocolate 150g', 150, 140, 'bar', 120, true, '[]'::jsonb),
('p210', 'comp_amul', 'firm_km', 'Amul Cream 200ml', 60, 56, 'pack', 100, true, '[]'::jsonb),
('p211', 'comp_amul', 'firm_km', 'Amul Lassi Mango 200ml', 25, 23, 'piece', 250, true, '[]'::jsonb);

-- Insert Shops
insert into shops (id, name, owner_name, phone, address, route_id) values
('shop1', 'Sharma General Store', 'Ramesh Sharma', '+91 98765 43210', 'Main Market, Kherwara', null),
('shop2', 'Gupta Kirana', 'Suresh Gupta', '+91 98765 43211', 'Station Road, Kherwara', null),
('shop3', 'Patel Supermart', 'Nitin Patel', '+91 98765 43212', 'Bus Stand, Kherwara', null),
('shop4', 'Singh Provision Store', 'Harbhajan Singh', '+91 98765 43213', 'Mochi Bazar, Kherwara', null),
('shop5', 'Agarwal Traders', 'Vinod Agarwal', '+91 98765 43214', 'New Colony, Kherwara', null);

-- Insert Routes
insert into routes (id, name, firm_id, shop_ids, assigned_staff_id) values
('route1', 'Main Market Route', 'firm_ka', '["shop1", "shop4"]'::jsonb, 'staff1'),
('route2', 'Station Road Route', 'firm_ka', '["shop2", "shop3", "shop5"]'::jsonb, null);
