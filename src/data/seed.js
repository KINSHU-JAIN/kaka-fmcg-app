// ============================================
// KAKA FMCG — Seed Data
// All 19 authorized brands pre-loaded
// ============================================

export function getSeedData() {
  return {
    adminPin: '1234',
    adminName: 'Nitesh Kumar Bhawara',

    firms: [
      {
        id: 'firm_ka',
        name: 'Kaka Agencies',
        shortName: 'KA',
        owner: 'Nitesh Kumar Bhawara',
        phone: '+91 75979 07444',
        phone2: '+91 99296 48852',
        address: 'Kaka Building, Mochi Bazar, Kherwara – 313803, Rajasthan',
        type: 'Wholesale · FMCG Distributor'
      },
      {
        id: 'firm_km',
        name: 'Kaka Marketing',
        shortName: 'KM',
        owner: 'Divya Jain',
        phone: '+91 75979 07444',
        phone2: '+91 99296 48852',
        address: 'Kaka Building, Mochi Bazar, Kherwara – 313803, Rajasthan',
        type: 'Wholesale · FMCG Distributor'
      }
    ],

    companies: [
      // === KAKA AGENCIES (18 brands) ===
      { id: 'comp_hul',     firmId: 'firm_ka', name: 'Hindustan Unilever (HUL)', icon: '/logos/hul.png', isActive: true },
      { id: 'comp_dabur',   firmId: 'firm_ka', name: 'Dabur',                    icon: '/logos/dabur.png', isActive: true },
      { id: 'comp_reckitt', firmId: 'firm_ka', name: 'Reckitt Benckiser',        icon: '/logos/reckitt.png', isActive: true },
      { id: 'comp_cadbury', firmId: 'firm_ka', name: 'Cadbury (Mondelez)',        icon: '/logos/cadbury.png', isActive: true },
      { id: 'comp_nestle',  firmId: 'firm_ka', name: 'Nestlé',                   icon: '/logos/nestle.png', isActive: true },
      { id: 'comp_pg',      firmId: 'firm_ka', name: 'P&G',                      icon: '/logos/pg.png', isActive: true },
      { id: 'comp_himalaya',firmId: 'firm_ka', name: 'Himalaya',                 icon: '/logos/himalaya.png', isActive: true },
      { id: 'comp_scj',     firmId: 'firm_ka', name: 'SC Johnson',               icon: '/logos/scj.png', isActive: true },
      { id: 'comp_godrej',  firmId: 'firm_ka', name: 'Godrej',                   icon: '/logos/godrej.png', isActive: true },
      { id: 'comp_wipro',   firmId: 'firm_ka', name: 'Wipro Consumer',           icon: '/logos/wipro.png', isActive: true },
      { id: 'comp_denver',  firmId: 'firm_ka', name: 'Denver',                   icon: '/logos/denver.png', isActive: true },
      { id: 'comp_ferrero', firmId: 'firm_ka', name: 'Ferrero',                  icon: '/logos/ferrero.png', isActive: true },
      { id: 'comp_vini',    firmId: 'firm_ka', name: 'Vini Cosmetics',           icon: '/logos/vini.png', isActive: true },
      { id: 'comp_zydus',   firmId: 'firm_ka', name: 'Zydus Wellness',           icon: '/logos/zydus.png', isActive: true },
      { id: 'comp_garnier', firmId: 'firm_ka', name: 'Garnier (L\'Oréal)',       icon: '/logos/garnier.png', isActive: true },
      { id: 'comp_patanjali',firmId:'firm_ka', name: 'Patanjali',                icon: '/logos/patanjali.png', isActive: true },
      { id: 'comp_gsk',     firmId: 'firm_ka', name: 'GSK (Haleon)',             icon: '/logos/gsk.png', isActive: true },
      { id: 'comp_marico',  firmId: 'firm_ka', name: 'Marico',                   icon: '/logos/marico.png', isActive: true },

      // === KAKA MARKETING (1 brand) ===
      { id: 'comp_amul',    firmId: 'firm_km', name: 'Amul',                     icon: '/logos/amul.png', isActive: true },
    ],

    products: [
      // --- HUL Products ---
      { id: 'p001', companyId: 'comp_hul', firmId: 'firm_ka', name: 'Surf Excel Easy Wash 1kg', mrp: 125, sellingPrice: 118, unit: 'pack', stock: 200, isActive: true },
      { id: 'p002', companyId: 'comp_hul', firmId: 'firm_ka', name: 'Lux Soap 100g (Pack of 4)', mrp: 155, sellingPrice: 146, unit: 'pack', stock: 300, isActive: true },
      { id: 'p003', companyId: 'comp_hul', firmId: 'firm_ka', name: 'Clinic Plus Shampoo 340ml', mrp: 199, sellingPrice: 185, unit: 'bottle', stock: 150, isActive: true },
      { id: 'p004', companyId: 'comp_hul', firmId: 'firm_ka', name: 'Vim Dishwash Bar 300g', mrp: 30, sellingPrice: 28, unit: 'piece', stock: 500, isActive: true },
      { id: 'p005', companyId: 'comp_hul', firmId: 'firm_ka', name: 'Lifebuoy Hand Wash 190ml', mrp: 99, sellingPrice: 92, unit: 'bottle', stock: 200, isActive: true },
      { id: 'p006', companyId: 'comp_hul', firmId: 'firm_ka', name: 'Brooke Bond Red Label 500g', mrp: 260, sellingPrice: 245, unit: 'pack', stock: 180, isActive: true },
      { id: 'p007', companyId: 'comp_hul', firmId: 'firm_ka', name: 'Ponds Talcum Powder 300g', mrp: 175, sellingPrice: 162, unit: 'bottle', stock: 120, isActive: true },

      // --- Dabur Products ---
      { id: 'p010', companyId: 'comp_dabur', firmId: 'firm_ka', name: 'Dabur Red Toothpaste 200g', mrp: 109, sellingPrice: 100, unit: 'tube', stock: 250, isActive: true },
      { id: 'p011', companyId: 'comp_dabur', firmId: 'firm_ka', name: 'Dabur Chyawanprash 500g', mrp: 285, sellingPrice: 268, unit: 'jar', stock: 100, isActive: true },
      { id: 'p012', companyId: 'comp_dabur', firmId: 'firm_ka', name: 'Dabur Amla Hair Oil 450ml', mrp: 210, sellingPrice: 195, unit: 'bottle', stock: 160, isActive: true },
      { id: 'p013', companyId: 'comp_dabur', firmId: 'firm_ka', name: 'Dabur Honey 500g', mrp: 299, sellingPrice: 280, unit: 'bottle', stock: 90, isActive: true },
      { id: 'p014', companyId: 'comp_dabur', firmId: 'firm_ka', name: 'Réal Fruit Juice 1L', mrp: 110, sellingPrice: 102, unit: 'pack', stock: 200, isActive: true },

      // --- Reckitt Benckiser Products ---
      { id: 'p020', companyId: 'comp_reckitt', firmId: 'firm_ka', name: 'Dettol Soap 125g (Pack of 3)', mrp: 177, sellingPrice: 165, unit: 'pack', stock: 300, isActive: true },
      { id: 'p021', companyId: 'comp_reckitt', firmId: 'firm_ka', name: 'Harpic Power Plus 500ml', mrp: 109, sellingPrice: 100, unit: 'bottle', stock: 200, isActive: true },
      { id: 'p022', companyId: 'comp_reckitt', firmId: 'firm_ka', name: 'Lizol Floor Cleaner 500ml', mrp: 125, sellingPrice: 116, unit: 'bottle', stock: 180, isActive: true },
      { id: 'p023', companyId: 'comp_reckitt', firmId: 'firm_ka', name: 'Mortein All Insect Killer 425ml', mrp: 220, sellingPrice: 205, unit: 'can', stock: 120, isActive: true },

      // --- Cadbury/Mondelez Products ---
      { id: 'p030', companyId: 'comp_cadbury', firmId: 'firm_ka', name: 'Cadbury Dairy Milk 50g', mrp: 50, sellingPrice: 47, unit: 'piece', stock: 500, isActive: true },
      { id: 'p031', companyId: 'comp_cadbury', firmId: 'firm_ka', name: 'Cadbury 5 Star 40g', mrp: 30, sellingPrice: 28, unit: 'piece', stock: 600, isActive: true },
      { id: 'p032', companyId: 'comp_cadbury', firmId: 'firm_ka', name: 'Oreo Biscuits 120g', mrp: 35, sellingPrice: 33, unit: 'pack', stock: 400, isActive: true },
      { id: 'p033', companyId: 'comp_cadbury', firmId: 'firm_ka', name: 'Bournvita Health Drink 500g', mrp: 260, sellingPrice: 242, unit: 'jar', stock: 150, isActive: true },
      { id: 'p034', companyId: 'comp_cadbury', firmId: 'firm_ka', name: 'Tang Orange 500g', mrp: 150, sellingPrice: 140, unit: 'pack', stock: 200, isActive: true },

      // --- Nestlé Products ---
      { id: 'p040', companyId: 'comp_nestle', firmId: 'firm_ka', name: 'Maggi 2-Minute Noodles (Pack of 12)', mrp: 168, sellingPrice: 156, unit: 'pack', stock: 300, isActive: true },
      { id: 'p041', companyId: 'comp_nestle', firmId: 'firm_ka', name: 'Nescafé Classic 100g', mrp: 310, sellingPrice: 290, unit: 'jar', stock: 120, isActive: true },
      { id: 'p042', companyId: 'comp_nestle', firmId: 'firm_ka', name: 'Nestlé Everyday Dairy Whitener 400g', mrp: 199, sellingPrice: 185, unit: 'pack', stock: 200, isActive: true },
      { id: 'p043', companyId: 'comp_nestle', firmId: 'firm_ka', name: 'KitKat 37.3g', mrp: 30, sellingPrice: 28, unit: 'piece', stock: 500, isActive: true },
      { id: 'p044', companyId: 'comp_nestle', firmId: 'firm_ka', name: 'Cerelac Baby Food 300g', mrp: 255, sellingPrice: 238, unit: 'pack', stock: 80, isActive: true },

      // --- P&G Products ---
      { id: 'p050', companyId: 'comp_pg', firmId: 'firm_ka', name: 'Head & Shoulders Shampoo 340ml', mrp: 340, sellingPrice: 318, unit: 'bottle', stock: 100, isActive: true },
      { id: 'p051', companyId: 'comp_pg', firmId: 'firm_ka', name: 'Gillette Guard Razor', mrp: 55, sellingPrice: 50, unit: 'piece', stock: 200, isActive: true },
      { id: 'p052', companyId: 'comp_pg', firmId: 'firm_ka', name: 'Tide Plus Detergent 1kg', mrp: 95, sellingPrice: 88, unit: 'pack', stock: 250, isActive: true },
      { id: 'p053', companyId: 'comp_pg', firmId: 'firm_ka', name: 'Whisper Choice Wings (Pack of 7)', mrp: 55, sellingPrice: 51, unit: 'pack', stock: 300, isActive: true },
      { id: 'p054', companyId: 'comp_pg', firmId: 'firm_ka', name: 'Ariel Matic Top Load 1kg', mrp: 199, sellingPrice: 185, unit: 'pack', stock: 150, isActive: true },

      // --- Himalaya Products ---
      { id: 'p060', companyId: 'comp_himalaya', firmId: 'firm_ka', name: 'Himalaya Neem Face Wash 200ml', mrp: 210, sellingPrice: 196, unit: 'tube', stock: 120, isActive: true },
      { id: 'p061', companyId: 'comp_himalaya', firmId: 'firm_ka', name: 'Himalaya Baby Cream 200ml', mrp: 199, sellingPrice: 185, unit: 'tube', stock: 100, isActive: true },
      { id: 'p062', companyId: 'comp_himalaya', firmId: 'firm_ka', name: 'Himalaya Anti-Hair Fall Shampoo 400ml', mrp: 310, sellingPrice: 290, unit: 'bottle', stock: 80, isActive: true },

      // --- SC Johnson Products ---
      { id: 'p070', companyId: 'comp_scj', firmId: 'firm_ka', name: 'Good Knight Gold Flash Refill', mrp: 85, sellingPrice: 78, unit: 'piece', stock: 200, isActive: true },
      { id: 'p071', companyId: 'comp_scj', firmId: 'firm_ka', name: 'All Out Ultra Refill (Twin Pack)', mrp: 130, sellingPrice: 120, unit: 'pack', stock: 150, isActive: true },

      // --- Godrej Products ---
      { id: 'p080', companyId: 'comp_godrej', firmId: 'firm_ka', name: 'Godrej No.1 Soap 100g (Pack of 4)', mrp: 118, sellingPrice: 110, unit: 'pack', stock: 250, isActive: true },
      { id: 'p081', companyId: 'comp_godrej', firmId: 'firm_ka', name: 'Cinthol Deo Spray 150ml', mrp: 199, sellingPrice: 185, unit: 'can', stock: 120, isActive: true },
      { id: 'p082', companyId: 'comp_godrej', firmId: 'firm_ka', name: 'Godrej Expert Hair Colour', mrp: 45, sellingPrice: 42, unit: 'pack', stock: 200, isActive: true },

      // --- Wipro Consumer Products ---
      { id: 'p090', companyId: 'comp_wipro', firmId: 'firm_ka', name: 'Santoor Sandal Soap 100g (Pack of 4)', mrp: 130, sellingPrice: 120, unit: 'pack', stock: 300, isActive: true },
      { id: 'p091', companyId: 'comp_wipro', firmId: 'firm_ka', name: 'Chandrika Ayurvedic Soap 125g', mrp: 40, sellingPrice: 37, unit: 'piece', stock: 200, isActive: true },

      // --- Denver Products ---
      { id: 'p100', companyId: 'comp_denver', firmId: 'firm_ka', name: 'Denver Deo Spray Hamilton 150ml', mrp: 230, sellingPrice: 210, unit: 'can', stock: 150, isActive: true },
      { id: 'p101', companyId: 'comp_denver', firmId: 'firm_ka', name: 'Denver Deo Spray Imperial 150ml', mrp: 230, sellingPrice: 210, unit: 'can', stock: 150, isActive: true },
      { id: 'p102', companyId: 'comp_denver', firmId: 'firm_ka', name: 'Denver Shaving Foam 200g', mrp: 150, sellingPrice: 135, unit: 'can', stock: 200, isActive: true },
      { id: 'p103', companyId: 'comp_denver', firmId: 'firm_ka', name: 'Denver Beer Shampoo 200ml', mrp: 180, sellingPrice: 165, unit: 'bottle', stock: 100, isActive: true },

      // --- Ferrero Products ---
      { id: 'p110', companyId: 'comp_ferrero', firmId: 'firm_ka', name: 'Ferrero Rocher T16', mrp: 499, sellingPrice: 465, unit: 'box', stock: 50, isActive: true },
      { id: 'p111', companyId: 'comp_ferrero', firmId: 'firm_ka', name: 'Nutella 290g', mrp: 399, sellingPrice: 370, unit: 'jar', stock: 60, isActive: true },
      { id: 'p112', companyId: 'comp_ferrero', firmId: 'firm_ka', name: 'Kinder Joy', mrp: 50, sellingPrice: 47, unit: 'piece', stock: 200, isActive: true },

      // --- Vini Cosmetics Products ---
      { id: 'p120', companyId: 'comp_vini', firmId: 'firm_ka', name: 'Fogg Body Spray 150ml', mrp: 250, sellingPrice: 232, unit: 'can', stock: 100, isActive: true },
      { id: 'p121', companyId: 'comp_vini', firmId: 'firm_ka', name: 'IBA Lipstick', mrp: 175, sellingPrice: 162, unit: 'piece', stock: 80, isActive: true },

      // --- Zydus Wellness Products ---
      { id: 'p130', companyId: 'comp_zydus', firmId: 'firm_ka', name: 'Sugar Free Gold Pellets 100', mrp: 130, sellingPrice: 120, unit: 'box', stock: 80, isActive: true },
      { id: 'p131', companyId: 'comp_zydus', firmId: 'firm_ka', name: 'Complan Royale Chocolate 500g', mrp: 290, sellingPrice: 270, unit: 'pack', stock: 100, isActive: true },
      { id: 'p132', companyId: 'comp_zydus', firmId: 'firm_ka', name: 'Glucon-D Orange 450g', mrp: 152, sellingPrice: 140, unit: 'pack', stock: 150, isActive: true },

      // --- Garnier Products ---
      { id: 'p140', companyId: 'comp_garnier', firmId: 'firm_ka', name: 'Garnier Men Acno Fight Face Wash 100g', mrp: 199, sellingPrice: 185, unit: 'tube', stock: 100, isActive: true },
      { id: 'p141', companyId: 'comp_garnier', firmId: 'firm_ka', name: 'Garnier Fructis Shampoo 340ml', mrp: 225, sellingPrice: 210, unit: 'bottle', stock: 80, isActive: true },
      { id: 'p142', companyId: 'comp_garnier', firmId: 'firm_ka', name: 'Garnier Colour Naturals Hair Colour', mrp: 145, sellingPrice: 135, unit: 'pack', stock: 100, isActive: true },

      // --- Patanjali Products ---
      { id: 'p150', companyId: 'comp_patanjali', firmId: 'firm_ka', name: 'Patanjali Dant Kanti 200g', mrp: 100, sellingPrice: 93, unit: 'tube', stock: 200, isActive: true },
      { id: 'p151', companyId: 'comp_patanjali', firmId: 'firm_ka', name: 'Patanjali Cow Ghee 500ml', mrp: 320, sellingPrice: 298, unit: 'bottle', stock: 80, isActive: true },
      { id: 'p152', companyId: 'comp_patanjali', firmId: 'firm_ka', name: 'Patanjali Aloe Vera Gel 150ml', mrp: 85, sellingPrice: 78, unit: 'tube', stock: 120, isActive: true },
      { id: 'p153', companyId: 'comp_patanjali', firmId: 'firm_ka', name: 'Patanjali Atta Noodles (Pack of 4)', mrp: 60, sellingPrice: 55, unit: 'pack', stock: 200, isActive: true },

      // --- GSK / Haleon Products ---
      { id: 'p160', companyId: 'comp_gsk', firmId: 'firm_ka', name: 'Sensodyne Original 100g', mrp: 200, sellingPrice: 186, unit: 'tube', stock: 100, isActive: true },
      { id: 'p161', companyId: 'comp_gsk', firmId: 'firm_ka', name: 'Horlicks Classic Malt 500g', mrp: 285, sellingPrice: 265, unit: 'jar', stock: 120, isActive: true },
      { id: 'p162', companyId: 'comp_gsk', firmId: 'firm_ka', name: 'Boost Health Drink 500g', mrp: 272, sellingPrice: 255, unit: 'jar', stock: 100, isActive: true },
      { id: 'p163', companyId: 'comp_gsk', firmId: 'firm_ka', name: 'Crocin Advance 20 Tablets', mrp: 30, sellingPrice: 28, unit: 'strip', stock: 300, isActive: true },

      // --- Marico Products ---
      { id: 'p170', companyId: 'comp_marico', firmId: 'firm_ka', name: 'Parachute Coconut Oil 500ml', mrp: 165, sellingPrice: 154, unit: 'bottle', stock: 200, isActive: true },
      { id: 'p171', companyId: 'comp_marico', firmId: 'firm_ka', name: 'Saffola Gold Oil 1L', mrp: 199, sellingPrice: 185, unit: 'bottle', stock: 100, isActive: true },
      { id: 'p172', companyId: 'comp_marico', firmId: 'firm_ka', name: 'Set Wet Hair Gel 250ml', mrp: 175, sellingPrice: 162, unit: 'tube', stock: 80, isActive: true },
      { id: 'p173', companyId: 'comp_marico', firmId: 'firm_ka', name: 'Livon Hair Serum 100ml', mrp: 210, sellingPrice: 196, unit: 'bottle', stock: 70, isActive: true },

      // === AMUL Products (Kaka Marketing) ===
      { id: 'p200', companyId: 'comp_amul', firmId: 'firm_km', name: 'Amul Taaza Toned Milk 500ml', mrp: 30, sellingPrice: 28, unit: 'pack', stock: 500, isActive: true },
      { id: 'p201', companyId: 'comp_amul', firmId: 'firm_km', name: 'Amul Gold Full Cream Milk 500ml', mrp: 35, sellingPrice: 33, unit: 'pack', stock: 400, isActive: true },
      { id: 'p202', companyId: 'comp_amul', firmId: 'firm_km', name: 'Amul Butter 500g', mrp: 280, sellingPrice: 268, unit: 'pack', stock: 150, isActive: true },
      { id: 'p203', companyId: 'comp_amul', firmId: 'firm_km', name: 'Amul Cheese Slices 200g', mrp: 130, sellingPrice: 122, unit: 'pack', stock: 100, isActive: true },
      { id: 'p204', companyId: 'comp_amul', firmId: 'firm_km', name: 'Amul Fresh Paneer 200g', mrp: 100, sellingPrice: 93, unit: 'pack', stock: 80, isActive: true },
      { id: 'p205', companyId: 'comp_amul', firmId: 'firm_km', name: 'Amul Kool Koko 200ml', mrp: 25, sellingPrice: 23, unit: 'piece', stock: 300, isActive: true },
      { id: 'p206', companyId: 'comp_amul', firmId: 'firm_km', name: 'Amul Ghee 500ml', mrp: 310, sellingPrice: 292, unit: 'tin', stock: 100, isActive: true },
      { id: 'p207', companyId: 'comp_amul', firmId: 'firm_km', name: 'Amul Ice Cream (Vanilla) 1L', mrp: 220, sellingPrice: 205, unit: 'tub', stock: 60, isActive: true },
      { id: 'p208', companyId: 'comp_amul', firmId: 'firm_km', name: 'Amul Masti Dahi 400g', mrp: 45, sellingPrice: 42, unit: 'cup', stock: 200, isActive: true },
      { id: 'p209', companyId: 'comp_amul', firmId: 'firm_km', name: 'Amul Dark Chocolate 150g', mrp: 150, sellingPrice: 140, unit: 'bar', stock: 120, isActive: true },
      { id: 'p210', companyId: 'comp_amul', firmId: 'firm_km', name: 'Amul Cream 200ml', mrp: 60, sellingPrice: 56, unit: 'pack', stock: 100, isActive: true },
      { id: 'p211', companyId: 'comp_amul', firmId: 'firm_km', name: 'Amul Lassi Mango 200ml', mrp: 25, sellingPrice: 23, unit: 'piece', stock: 250, isActive: true },
    ],

    shops: [
      { id: 'shop1', name: 'Sharma General Store', ownerName: 'Ramesh Sharma', phone: '+91 98765 43210', address: 'Main Market, Kherwara', routeId: null },
      { id: 'shop2', name: 'Gupta Kirana', ownerName: 'Suresh Gupta', phone: '+91 98765 43211', address: 'Station Road, Kherwara', routeId: null },
      { id: 'shop3', name: 'Patel Supermart', ownerName: 'Nitin Patel', phone: '+91 98765 43212', address: 'Bus Stand, Kherwara', routeId: null },
      { id: 'shop4', name: 'Singh Provision Store', ownerName: 'Harbhajan Singh', phone: '+91 98765 43213', address: 'Mochi Bazar, Kherwara', routeId: null },
      { id: 'shop5', name: 'Agarwal Traders', ownerName: 'Vinod Agarwal', phone: '+91 98765 43214', address: 'New Colony, Kherwara', routeId: null },
    ],

    orders: [],

    routes: [
      { id: 'route1', name: 'Main Market Route', firmId: 'firm_ka', shopIds: ['shop1', 'shop4'], assignedStaffId: 'staff1' },
      { id: 'route2', name: 'Station Road Route', firmId: 'firm_ka', shopIds: ['shop2', 'shop3', 'shop5'], assignedStaffId: null },
    ],

    staff: [
      { id: 'staff1', name: 'Raju', phone: '+91 99887 76655', username: 'raju', password: 'Raju@123', pin: '5678' },
    ]
  };
}
