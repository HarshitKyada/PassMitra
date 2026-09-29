import { Area, GarbaEvent, Listing, WantedPost, User, SwapRequest, Connection, Rating, Report, AppNotification } from '../src/types/index.ts';

// 25 Ahmedabad Areas with realistic coordinates [longitude, latitude]
export const SEED_AREAS: Area[] = [
  { id: 'area-sbr', name: 'Sindhu Bhavan Road (SBR)', location: { type: 'Point', coordinates: [72.5012, 23.0456] } },
  { id: 'area-sg-hwy', name: 'SG Highway / Iscon Crossroad', location: { type: 'Point', coordinates: [72.5073, 23.0338] } },
  { id: 'area-bodakdev', name: 'Bodakdev & Judges Bungalow', location: { type: 'Point', coordinates: [72.5152, 23.0423] } },
  { id: 'area-satellite', name: 'Satellite & Jodhpur', location: { type: 'Point', coordinates: [72.5186, 23.0276] } },
  { id: 'area-prahladnagar', name: 'Prahlad Nagar & Anandnagar', location: { type: 'Point', coordinates: [72.5113, 23.0125] } },
  { id: 'area-vastrapur', name: 'Vastrapur & IIM Road', location: { type: 'Point', coordinates: [72.5293, 23.0359] } },
  { id: 'area-thaltej', name: 'Thaltej & Shilaj', location: { type: 'Point', coordinates: [72.5089, 23.0538] } },
  { id: 'area-bopal', name: 'Bopal & South Bopal', location: { type: 'Point', coordinates: [72.4634, 23.0338] } },
  { id: 'area-shela', name: 'Shela & Club O7 Road', location: { type: 'Point', coordinates: [72.4419, 23.0139] } },
  { id: 'area-navrangpura', name: 'Navrangpura & University', location: { type: 'Point', coordinates: [72.5528, 23.0373] } },
  { id: 'area-naranpura', name: 'Naranpura & Vijay Cross', location: { type: 'Point', coordinates: [72.5539, 23.0558] } },
  { id: 'area-paldi', name: 'Paldi & Fatehpura', location: { type: 'Point', coordinates: [72.5624, 23.0135] } },
  { id: 'area-maninagar', name: 'Maninagar & Kankaria', location: { type: 'Point', coordinates: [72.6033, 22.9978] } },
  { id: 'area-gota', name: 'Gota & Vandematram', location: { type: 'Point', coordinates: [72.5369, 23.0984] } },
  { id: 'area-chandkheda', name: 'Chandkheda & Tragad', location: { type: 'Point', coordinates: [72.5855, 23.1118] } },
  { id: 'area-motera', name: 'Motera & Stadium Enclave', location: { type: 'Point', coordinates: [72.5982, 23.0997] } },
  { id: 'area-ghatlodiya', name: 'Ghatlodiya & Chanakyapuri', location: { type: 'Point', coordinates: [72.5348, 23.0654] } },
  { id: 'area-memnagar', name: 'Memnagar & Subhash Chowk', location: { type: 'Point', coordinates: [72.5381, 23.0504] } },
  { id: 'area-ambawadi', name: 'Ambawadi & Nehrunagar', location: { type: 'Point', coordinates: [72.5447, 23.0225] } },
  { id: 'area-usmanpura', name: 'Usmanpura & Ashram Road', location: { type: 'Point', coordinates: [72.5702, 23.0478] } },
  { id: 'area-nikol', name: 'Nikol & Naroda', location: { type: 'Point', coordinates: [72.6687, 23.0489] } },
  { id: 'area-gandhinagar', name: 'Gandhinagar / Shankus Corridor', location: { type: 'Point', coordinates: [72.6186, 23.1758] } },
  { id: 'area-bhadaj', name: 'Science City & Bhadaj', location: { type: 'Point', coordinates: [72.4981, 23.0782] } },
  { id: 'area-sanand', name: 'Sanand Circle & Ambli', location: { type: 'Point', coordinates: [72.4821, 23.0194] } },
  { id: 'area-vasna', name: 'Vasna & Anjali Circle', location: { type: 'Point', coordinates: [72.5512, 22.9984] } }
];

// Helper to generate 9 Navratri nights for 2026 (Oct 11 to Oct 19, 2026)
export function getNavratriNights() {
  const dates = [
    '2026-10-11', // Night 1 - Sun
    '2026-10-12', // Night 2 - Mon
    '2026-10-13', // Night 3 - Tue
    '2026-10-14', // Night 4 - Wed
    '2026-10-15', // Night 5 - Thu
    '2026-10-16', // Night 6 - Fri
    '2026-10-17', // Night 7 - Sat
    '2026-10-18', // Night 8 - Sun
    '2026-10-19', // Night 9 - Mon
  ];

  return dates.map((date, idx) => ({
    night: idx + 1,
    date,
    entryStart: '20:00',
    entryCutoff: '23:00'
  }));
}

// 6 Seeded Garba Events in Ahmedabad
export const SEED_EVENTS: GarbaEvent[] = [
  {
    id: 'evt-uwb',
    name: 'United Way of Baroda (Ahm Express)',
    organiser: 'United Way of Baroda & Vadodara Cultural Foundation',
    venueName: 'Navlakhi Grounds / SG Highway Relay Hub',
    area: 'SG Highway / Iscon Crossroad',
    location: { type: 'Point', coordinates: [72.5073, 23.0338] },
    nights: getNavratriNights(),
    passPrices: [
      { type: 'COUPLE', validity: 'DAILY', officialPrice: 800 },
      { type: 'MALE', validity: 'DAILY', officialPrice: 600 },
      { type: 'FEMALE', validity: 'DAILY', officialPrice: 400 },
      { type: 'COUPLE', validity: 'SEASON', officialPrice: 5500 }
    ],
    status: 'VERIFIED',
    createdBy: 'admin'
  },
  {
    id: 'evt-ymca',
    name: "Mirchi Rock 'N Dhol - YMCA Club",
    organiser: 'Radio Mirchi & YMCA International',
    venueName: 'YMCA International Club Grounds',
    area: 'SG Highway / Iscon Crossroad',
    location: { type: 'Point', coordinates: [72.5085, 23.0189] },
    nights: getNavratriNights(),
    passPrices: [
      { type: 'FEMALE', validity: 'DAILY', officialPrice: 450 },
      { type: 'MALE', validity: 'DAILY', officialPrice: 650 },
      { type: 'COUPLE', validity: 'DAILY', officialPrice: 850 },
      { type: 'COUPLE', validity: 'SEASON', officialPrice: 4800 }
    ],
    status: 'VERIFIED',
    createdBy: 'admin'
  },
  {
    id: 'evt-shankus',
    name: 'Shankus Dandiya - Gandhinagar Arena',
    organiser: 'Shankus Entertainment & Water World Resorts',
    venueName: 'Shankus Open Lawns, Gandhinagar Ring Road',
    area: 'Gandhinagar / Shankus Corridor',
    location: { type: 'Point', coordinates: [72.6186, 23.1758] },
    nights: getNavratriNights(),
    passPrices: [
      { type: 'FEMALE', validity: 'DAILY', officialPrice: 400 },
      { type: 'MALE', validity: 'DAILY', officialPrice: 700 },
      { type: 'COUPLE', validity: 'DAILY', officialPrice: 900 },
      { type: 'COUPLE', validity: 'SEASON', officialPrice: 2200 }
    ],
    status: 'VERIFIED',
    createdBy: 'admin'
  },
  {
    id: 'evt-karnavati',
    name: 'Karnavati Club Cultural Enclave',
    organiser: 'Karnavati Club Garba Committee',
    venueName: 'Karnavati Club Lawns, SG Highway Central',
    area: 'Satellite & Jodhpur',
    location: { type: 'Point', coordinates: [72.5186, 23.0276] },
    nights: getNavratriNights(),
    passPrices: [
      { type: 'FEMALE', validity: 'DAILY', officialPrice: 500 },
      { type: 'MALE', validity: 'DAILY', officialPrice: 800 },
      { type: 'COUPLE', validity: 'DAILY', officialPrice: 1200 },
      { type: 'COUPLE', validity: 'SEASON', officialPrice: 6000 }
    ],
    status: 'VERIFIED',
    createdBy: 'admin'
  },
  {
    id: 'evt-gmdc',
    name: 'GMDC Mega Garba Grounds',
    organiser: 'Gujarat Tourism & Ahmedabad Municipal Corp',
    venueName: 'GMDC Grounds, Helmet Cross Road',
    area: 'Vastrapur & IIM Road',
    location: { type: 'Point', coordinates: [72.5293, 23.0359] },
    nights: getNavratriNights(),
    passPrices: [
      { type: 'FEMALE', validity: 'DAILY', officialPrice: 250 },
      { type: 'MALE', validity: 'DAILY', officialPrice: 350 },
      { type: 'COUPLE', validity: 'DAILY', officialPrice: 500 }
    ],
    status: 'VERIFIED',
    createdBy: 'admin'
  },
  {
    id: 'evt-rajpath',
    name: 'Rajpath Club Heritage Ring',
    organiser: 'Rajpath Club Managing Committee',
    venueName: 'Rajpath Club Heritage Lawns, Bodakdev',
    area: 'Bodakdev & Judges Bungalow',
    location: { type: 'Point', coordinates: [72.5152, 23.0423] },
    nights: getNavratriNights(),
    passPrices: [
      { type: 'FEMALE', validity: 'DAILY', officialPrice: 450 },
      { type: 'MALE', validity: 'DAILY', officialPrice: 750 },
      { type: 'COUPLE', validity: 'DAILY', officialPrice: 1000 },
      { type: 'COUPLE', validity: 'SEASON', officialPrice: 5200 }
    ],
    status: 'VERIFIED',
    createdBy: 'admin'
  }
];

// Seeded Users
export const SEED_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Hardik Patel',
    phoneNumber: process.env.ADMIN_PHONE || '+919825000000',
    phoneNumberVerified: true,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    role: 'admin',
    banned: false,
    homeLocation: { type: 'Point', coordinates: [72.5073, 23.0338] },
    homeArea: 'SG Highway / Iscon Crossroad',
    alertRadiusKm: 5,
    watchedEventIds: ['evt-uwb', 'evt-ymca', 'evt-rajpath'],
    watchedNights: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    language: 'en',
    theme: 'dark',
    thumbsUp: 45,
    thumbsDown: 0,
    completedExchanges: 42,
    blockedUserIds: [],
    termsAcceptedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-aarav',
    name: 'Aarav Mehta',
    phoneNumber: '+919825088421',
    phoneNumberVerified: true,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    role: 'user',
    banned: false,
    homeLocation: { type: 'Point', coordinates: [72.5085, 23.0338] },
    homeArea: 'SG Highway / Iscon Crossroad',
    alertRadiusKm: 4,
    watchedEventIds: ['evt-uwb', 'evt-ymca'],
    watchedNights: [4, 5],
    language: 'en',
    theme: 'dark',
    thumbsUp: 38,
    thumbsDown: 0,
    completedExchanges: 14,
    blockedUserIds: [],
    termsAcceptedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-khushi',
    name: 'Khushi Dave',
    phoneNumber: '+919825012345',
    phoneNumberVerified: true,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    role: 'user',
    banned: false,
    homeLocation: { type: 'Point', coordinates: [72.5095, 23.0210] },
    homeArea: 'SG Highway / Iscon Crossroad',
    alertRadiusKm: 3,
    watchedEventIds: ['evt-ymca', 'evt-shankus'],
    watchedNights: [4],
    language: 'en',
    theme: 'dark',
    thumbsUp: 12,
    thumbsDown: 0,
    completedExchanges: 6,
    blockedUserIds: [],
    termsAcceptedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-rohan',
    name: 'Rohan N.',
    phoneNumber: '+919825077123',
    phoneNumberVerified: true,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    role: 'user',
    banned: false,
    homeLocation: { type: 'Point', coordinates: [72.6186, 23.1758] },
    homeArea: 'Gandhinagar / Shankus Corridor',
    alertRadiusKm: 5,
    watchedEventIds: ['evt-shankus'],
    watchedNights: [4, 5, 6, 7, 8, 9],
    language: 'en',
    theme: 'dark',
    thumbsUp: 18,
    thumbsDown: 1,
    completedExchanges: 9,
    blockedUserIds: [],
    termsAcceptedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-parthiv',
    name: 'Parthiv Shah',
    phoneNumber: '+919825044218',
    phoneNumberVerified: true,
    image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
    role: 'user',
    banned: false,
    homeLocation: { type: 'Point', coordinates: [72.5065, 23.0345] },
    homeArea: 'SG Highway / Iscon Crossroad',
    alertRadiusKm: 3,
    watchedEventIds: ['evt-uwb', 'evt-rajpath'],
    watchedNights: [4],
    language: 'en',
    theme: 'dark',
    thumbsUp: 24,
    thumbsDown: 0,
    completedExchanges: 14,
    blockedUserIds: [],
    termsAcceptedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

// Seeded active listings matching the design mockups
export const SEED_LISTINGS: Listing[] = [
  {
    id: 'listing-uwb-88421',
    sellerId: 'user-aarav',
    eventId: 'evt-uwb',
    validity: 'DAILY',
    night: 4,
    items: [
      {
        type: 'COUPLE',
        quantity: 1,
        remaining: 1,
        printedPrice: 800,
        askingPrice: 800
      }
    ],
    format: 'WRISTBAND',
    namePrinted: false,
    photoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    meetingPoint: {
      location: { type: 'Point', coordinates: [72.5073, 23.0338] },
      landmark: 'Gate 2 Amul Parlour, Main Entrance (Police Post #04 Nearby)'
    },
    area: 'SG Highway / Iscon Crossroad',
    contactPrefs: 'BOTH',
    note: 'Physical couple wristband in hand. Intact locking teeth, holographic stamp verified.',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    needsReview: false,
    reportCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'listing-ymca-44510',
    sellerId: 'user-khushi',
    eventId: 'evt-ymca',
    validity: 'DAILY',
    night: 4,
    items: [
      {
        type: 'FEMALE',
        quantity: 1,
        remaining: 1,
        printedPrice: 450,
        askingPrice: 450
      }
    ],
    format: 'WRISTBAND',
    namePrinted: false,
    photoUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=600&q=80',
    meetingPoint: {
      location: { type: 'Point', coordinates: [72.5085, 23.0189] },
      landmark: 'Cafe Coffee Day outside YMCA Gate 1'
    },
    area: 'SG Highway / Iscon Crossroad',
    contactPrefs: 'BOTH',
    note: 'College ID + Govt verified seller. Direct in-person handover.',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
    needsReview: false,
    reportCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'listing-shankus-99120',
    sellerId: 'user-rohan',
    eventId: 'evt-shankus',
    validity: 'SEASON',
    night: 4,
    items: [
      {
        type: 'COUPLE',
        quantity: 1,
        remaining: 1,
        printedPrice: 2200,
        askingPrice: 2200
      }
    ],
    format: 'WRISTBAND',
    namePrinted: true,
    photoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    meetingPoint: {
      location: { type: 'Point', coordinates: [72.6186, 23.1758] },
      landmark: 'Main Turnstile Ticket Counter 3, Shankus Arena'
    },
    area: 'Gandhinagar / Shankus Corridor',
    contactPrefs: 'CALL',
    note: 'All-Nights Season Pass (Nights 4 through 9 remaining). Gold RFID Wristband.',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    needsReview: false,
    reportCount: 0,
    createdAt: new Date().toISOString()
  }
];

// Seeded Wanted Posts
export const SEED_WANTED: WantedPost[] = [
  {
    id: 'wanted-gmdc-101',
    buyerId: 'user-khushi',
    eventId: 'evt-gmdc',
    validity: 'DAILY',
    night: 4,
    items: [
      { type: 'MALE', quantity: 2, remaining: 2 }
    ],
    maxPricePerPass: 350,
    location: { type: 'Point', coordinates: [72.5293, 23.0359] },
    area: 'Vastrapur & IIM Road',
    note: 'Outside Food Court near Gate 3. Need 2 Male passes.',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    reportCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'wanted-rajpath-202',
    buyerId: 'user-parthiv',
    eventId: 'evt-rajpath',
    validity: 'DAILY',
    night: 4,
    items: [
      { type: 'COUPLE', quantity: 1, remaining: 1 }
    ],
    maxPricePerPass: 1000,
    location: { type: 'Point', coordinates: [72.5152, 23.0423] },
    area: 'Bodakdev & Judges Bungalow',
    note: 'Standing near Gate 1 VIP Box. Couple pass needed.',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    reportCount: 0,
    createdAt: new Date().toISOString()
  }
];
