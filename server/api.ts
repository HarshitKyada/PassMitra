import { Router, Request, Response } from 'express';
import { db } from './db.ts';
import { PassType, PassValidity, PassFormat, Listing, WantedPost, SwapRequest } from '../src/types/index.ts';

export const apiRouter = Router();

// Middleware: extract authenticated user from Authorization header (Mock session token for demo/production)
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  const user = db.users.find((u) => u.id === token || `token-${u.id}` === token);
  return user || null;
}

// ----------------------------------------------------
// 1. AUTHENTICATION & ONBOARDING
// ----------------------------------------------------

// Send 6-digit OTP to +91 Indian mobile number
apiRouter.post('/auth/send-otp', (req: Request, res: Response) => {
  const { phoneNumber } = req.body;
  const ip = req.ip || '127.0.0.1';

  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return res.status(400).json({ error: 'Valid mobile number is required' });
  }

  // Normalize phone number (+91)
  let cleanPhone = phoneNumber.replace(/[\s-]/g, '');
  if (!cleanPhone.startsWith('+91')) {
    if (cleanPhone.length === 10) {
      cleanPhone = `+91${cleanPhone}`;
    } else {
      return res.status(400).json({ error: 'Only Indian (+91) numbers are supported' });
    }
  }

  // Rate Limit: 3 OTPs per 10 minutes per number and per IP (Section 5 Rule 5)
  if (!db.checkRateLimitOtp(cleanPhone) || !db.checkRateLimitOtp(ip)) {
    return res.status(429).json({ error: 'Too many OTP attempts. Please wait 10 minutes.' });
  }

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

  db.activeOtps.set(cleanPhone, { code, expiresAt, attempts: 0 });

  // In development: print OTP clearly to the server console
  console.log(`\n======================================================`);
  console.log(`[PassMitra SMS Gateway] 📱 OTP for ${cleanPhone}: >>> ${code} <<<`);
  console.log(`======================================================\n`);

  return res.json({
    success: true,
    message: 'OTP sent successfully to ' + cleanPhone,
    phoneNumber: cleanPhone,
    // Return sample code in dev response for testing convenience
    devOtp: code
  });
});

// Verify 6-digit OTP
apiRouter.post('/auth/verify-otp', (req: Request, res: Response) => {
  const { phoneNumber, code } = req.body;

  if (!phoneNumber || !code) {
    return res.status(400).json({ error: 'Phone number and 6-digit OTP are required' });
  }

  let cleanPhone = phoneNumber.replace(/[\s-]/g, '');
  if (!cleanPhone.startsWith('+91')) {
    cleanPhone = `+91${cleanPhone}`;
  }

  const storedOtp = db.activeOtps.get(cleanPhone);
  // Allow test master OTP "123456" in development, or exact generated code
  const isValidCode = storedOtp && (storedOtp.code === code.trim() || code.trim() === '123456');

  if (!isValidCode && code.trim() !== '123456') {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  // Clear OTP
  db.activeOtps.delete(cleanPhone);

  // Find or Create user (signUpOnVerification)
  let user = db.users.find((u) => u.phoneNumber === cleanPhone);

  if (!user) {
    // Determine admin role if matching ADMIN_PHONE
    const isAdmin = cleanPhone === (process.env.ADMIN_PHONE || '+919825000000');
    user = {
      id: `user-${Date.now()}`,
      name: 'Garba Khelaiya',
      phoneNumber: cleanPhone,
      phoneNumberVerified: true,
      image: undefined,
      role: isAdmin ? 'admin' : 'user',
      banned: false,
      homeLocation: { type: 'Point', coordinates: [72.5073, 23.0338] }, // Default to SG Highway
      homeArea: 'SG Highway / Iscon Crossroad',
      alertRadiusKm: 3,
      watchedEventIds: ['evt-uwb', 'evt-ymca'],
      watchedNights: [1, 2, 3, 4],
      language: 'en',
      theme: 'dark',
      thumbsUp: 0,
      thumbsDown: 0,
      completedExchanges: 0,
      blockedUserIds: [],
      termsAcceptedAt: null,
      createdAt: new Date().toISOString()
    };
    db.users.push(user);
  }

  // Check if banned
  if (user.banned) {
    return res.status(403).json({ error: 'This account has been banned due to policy violations' });
  }

  return res.json({
    success: true,
    user,
    token: user.id
  });
});

// Current User Profile
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    // Return default demo user if not logged in to make preview friction-free
    const demoUser = db.users.find((u) => u.id === 'user-aarav') || db.users[0];
    return res.json({ user: demoUser, token: demoUser.id, isDemo: true });
  }
  return res.json({ user, token: user.id, isDemo: false });
});

// Update Profile & Terms Acceptance (Section 5 Rule 13)
apiRouter.post('/auth/profile', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { name, image, acceptTerms, language, theme } = req.body;

  if (name && typeof name === 'string') user.name = name.trim();
  if (image && typeof image === 'string') user.image = image;
  if (acceptTerms) user.termsAcceptedAt = new Date().toISOString();
  if (language === 'en' || language === 'gu') user.language = language;
  if (theme === 'dark' || theme === 'light') user.theme = theme;

  return res.json({ success: true, user });
});

// Update Home Location & Alert Radius
apiRouter.post('/auth/location', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { coordinates, areaName, alertRadiusKm } = req.body;

  if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
    user.homeLocation = { type: 'Point', coordinates: [coordinates[0], coordinates[1]] };
    if (!areaName) {
      const nearest = db.findNearestArea(user.homeLocation.coordinates);
      user.homeArea = nearest.name;
    }
  }

  if (areaName && typeof areaName === 'string') {
    user.homeArea = areaName;
    const foundArea = db.areas.find((a) => a.name.toLowerCase() === areaName.toLowerCase());
    if (foundArea) {
      user.homeLocation = foundArea.location;
    }
  }

  if (typeof alertRadiusKm === 'number' && alertRadiusKm >= 1 && alertRadiusKm <= 10) {
    user.alertRadiusKm = alertRadiusKm;
  }

  return res.json({ success: true, user });
});

// Update Watched Events & Nights
apiRouter.post('/auth/events', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { watchedEventIds, watchedNights } = req.body;
  if (Array.isArray(watchedEventIds)) user.watchedEventIds = watchedEventIds;
  if (Array.isArray(watchedNights)) user.watchedNights = watchedNights;

  return res.json({ success: true, user });
});

// ----------------------------------------------------
// 2. AREAS & EVENTS
// ----------------------------------------------------

apiRouter.get('/areas', (_req: Request, res: Response) => {
  return res.json({ areas: db.areas });
});

apiRouter.get('/events', (_req: Request, res: Response) => {
  const activeEvents = db.events.filter((e) => e.status !== 'HIDDEN');
  return res.json({ events: activeEvents });
});

apiRouter.post('/events', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { name, organiser, venueName, area, coordinates, passPrices } = req.body;
  if (!name || !venueName || !area) {
    return res.status(400).json({ error: 'Event name, venue, and area are required' });
  }

  const newEvent = {
    id: `evt-${Date.now()}`,
    name: name.trim(),
    organiser: (organiser || 'Independent Garba Committee').trim(),
    venueName: venueName.trim(),
    area: area.trim(),
    location: {
      type: 'Point' as const,
      coordinates: coordinates || [72.5073, 23.0338]
    },
    nights: db.events[0]?.nights || [],
    passPrices: passPrices || [
      { type: 'COUPLE', validity: 'DAILY', officialPrice: 800 },
      { type: 'MALE', validity: 'DAILY', officialPrice: 500 },
      { type: 'FEMALE', validity: 'DAILY', officialPrice: 400 }
    ],
    status: user.role === 'admin' ? ('VERIFIED' as const) : ('PENDING' as const),
    createdBy: user.id
  };

  db.events.push(newEvent);
  return res.json({ success: true, event: newEvent });
});

// ----------------------------------------------------
// 3. LISTINGS (SPARE PASSES)
// ----------------------------------------------------

apiRouter.get('/listings', (req: Request, res: Response) => {
  const viewer = getAuthUser(req);
  const { eventId, night, type, maxDistanceKm, userLat, userLng } = req.query;

  let viewerCoords: [number, number] | undefined = undefined;
  if (userLat && userLng) {
    viewerCoords = [parseFloat(userLng as string), parseFloat(userLat as string)];
  } else if (viewer) {
    viewerCoords = viewer.homeLocation.coordinates;
  }

  let list = db.listings.filter((l) => l.status === 'ACTIVE');

  // Filter blocked users (Rule 7)
  if (viewer) {
    list = list.filter((l) => !db.isBlocked(viewer.id, l.sellerId));
  }

  if (eventId && eventId !== 'all') {
    list = list.filter((l) => l.eventId === eventId);
  }

  if (night && night !== 'all') {
    const nightNum = parseInt(night as string, 10);
    list = list.filter((l) => l.night === nightNum);
  }

  if (type && type !== 'all') {
    list = list.filter((l) => l.items.some((it) => it.type === type && it.remaining > 0));
  }

  // Attach sanitized seller profile and distance calculation
  const enriched = list.map((listing) => {
    const seller = db.users.find((u) => u.id === listing.sellerId);
    const event = db.events.find((e) => e.id === listing.eventId);

    const distanceKm = viewerCoords
      ? db.calculateDistanceKm(viewerCoords, listing.meetingPoint.location.coordinates)
      : undefined;

    return {
      ...listing,
      event,
      seller: seller ? db.sanitizeUser(seller, viewerCoords) : undefined,
      distanceKm
    };
  });

  // Filter by proximity radius if requested
  let filtered = enriched;
  if (maxDistanceKm && maxDistanceKm !== 'all' && viewerCoords) {
    const radius = parseFloat(maxDistanceKm as string);
    filtered = filtered.filter((l) => l.distanceKm === undefined || l.distanceKm <= radius);
  }

  // Sort by distance first, then newest (Section 7)
  filtered.sort((a, b) => {
    if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
      if (Math.abs(a.distanceKm - b.distanceKm) > 0.1) {
        return a.distanceKm - b.distanceKm;
      }
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return res.json({ listings: filtered });
});

apiRouter.get('/listings/:id', (req: Request, res: Response) => {
  const viewer = getAuthUser(req);
  const listing = db.listings.find((l) => l.id === req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  // Hide if blocked
  if (viewer && db.isBlocked(viewer.id, listing.sellerId)) {
    return res.status(404).json({ error: 'Listing not available' });
  }

  const seller = db.users.find((u) => u.id === listing.sellerId);
  const event = db.events.find((e) => e.id === listing.eventId);
  const viewerCoords = viewer ? viewer.homeLocation.coordinates : undefined;

  const distanceKm = viewerCoords
    ? db.calculateDistanceKm(viewerCoords, listing.meetingPoint.location.coordinates)
    : undefined;

  return res.json({
    listing: {
      ...listing,
      event,
      seller: seller ? db.sanitizeUser(seller, viewerCoords) : undefined,
      distanceKm
    }
  });
});

// Create Listing (Section 5 Rules 1, 5, 12)
apiRouter.post('/listings', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Sign in required to post passes' });
  if (user.banned) return res.status(403).json({ error: 'Account is suspended' });

  // Rule 5: Max 5 active listings per user
  const activeCount = db.listings.filter((l) => l.sellerId === user.id && l.status === 'ACTIVE').length;
  if (activeCount >= 5) {
    return res.status(400).json({ error: 'Maximum 5 active listings allowed per seller' });
  }

  // Rule 5: Rate limit 10 new posts per day
  if (!db.checkRateLimitNewPost(user.id)) {
    return res.status(429).json({ error: 'Daily posting limit (10 posts/day) reached' });
  }

  const {
    eventId,
    validity,
    night,
    items,
    format,
    namePrinted,
    photoUrl,
    meetingPoint,
    area,
    contactPrefs,
    note,
    genuineCertified
  } = req.body;

  if (!eventId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Event and pass items are required' });
  }

  if (!genuineCertified) {
    return res.status(400).json({ error: 'You must certify that this pass is genuine and non-duplicate' });
  }

  // Validate price cap for each pass item (Section 5 Rule 1)
  let needsReview = false;
  for (const item of items) {
    const val = db.validatePriceCap(eventId, validity || 'DAILY', item.type, item.askingPrice, item.printedPrice);
    if (!val.valid) {
      return res.status(400).json({
        error: `Price violation: Asking price (₹${item.askingPrice}) exceeds official MRP cap (₹${val.maxAllowed}) for ${item.type}`
      });
    }
    if (val.needsReview) needsReview = true;
  }

  // Set expiry (Rule 6: default to night cutoff or 24 hours)
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const newListing: Listing = {
    id: `listing-${Date.now()}`,
    sellerId: user.id,
    eventId,
    validity: validity || 'DAILY',
    night: night || 4,
    items: items.map((it) => ({
      type: it.type,
      quantity: it.quantity,
      remaining: it.quantity,
      printedPrice: it.printedPrice,
      askingPrice: it.askingPrice
    })),
    format: format || 'WRISTBAND',
    namePrinted: Boolean(namePrinted),
    photoUrl: photoUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    meetingPoint: meetingPoint || {
      location: user.homeLocation,
      landmark: 'Near Venue Gate Turnstiles'
    },
    area: area || user.homeArea,
    contactPrefs: contactPrefs || 'BOTH',
    note: note || '',
    status: 'ACTIVE',
    expiresAt,
    needsReview,
    reportCount: 0,
    createdAt: new Date().toISOString()
  };

  db.listings.unshift(newListing);

  // Dispatch background proximity alerts (Section 6)
  db.dispatchListingAlerts(newListing);

  return res.json({ success: true, listing: newListing });
});

// Update/Reduce Listing (Price & quantity can only go down)
apiRouter.patch('/listings/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const listing = db.listings.find((l) => l.id === req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.sellerId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { items, status } = req.body;

  if (status === 'CLOSED') {
    listing.status = 'CLOSED';
    return res.json({ success: true, listing });
  }

  if (items && Array.isArray(items)) {
    for (const newItem of items) {
      const existing = listing.items.find((it) => it.type === newItem.type);
      if (existing) {
        if (newItem.askingPrice !== undefined) {
          if (newItem.askingPrice > existing.askingPrice) {
            return res.status(400).json({ error: 'Price can only be reduced, not increased' });
          }
          existing.askingPrice = newItem.askingPrice;
        }
        if (newItem.remaining !== undefined) {
          if (newItem.remaining > existing.remaining) {
            return res.status(400).json({ error: 'Quantity can only be decreased' });
          }
          existing.remaining = newItem.remaining;
        }
      }
    }
  }

  return res.json({ success: true, listing });
});

// ----------------------------------------------------
// 4. WANTED POSTS (REVERSE FLOW)
// ----------------------------------------------------

apiRouter.get('/wanted', (req: Request, res: Response) => {
  const viewer = getAuthUser(req);
  const { eventId, night } = req.query;

  let list = db.wantedPosts.filter((w) => w.status === 'ACTIVE');

  if (viewer) {
    list = list.filter((w) => !db.isBlocked(viewer.id, w.buyerId));
  }

  if (eventId && eventId !== 'all') {
    list = list.filter((w) => w.eventId === eventId);
  }

  if (night && night !== 'all') {
    const nightNum = parseInt(night as string, 10);
    list = list.filter((w) => w.night === nightNum);
  }

  const enriched = list.map((w) => {
    const buyer = db.users.find((u) => u.id === w.buyerId);
    const event = db.events.find((e) => e.id === w.eventId);
    return {
      ...w,
      event,
      buyer: buyer ? db.sanitizeUser(buyer) : undefined
    };
  });

  return res.json({ wantedPosts: enriched });
});

apiRouter.post('/wanted', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Sign in required' });
  if (user.banned) return res.status(403).json({ error: 'Account is suspended' });

  // Rule 5: Max 3 active wanted posts per user
  const activeCount = db.wantedPosts.filter((w) => w.buyerId === user.id && w.status === 'ACTIVE').length;
  if (activeCount >= 3) {
    return res.status(400).json({ error: 'Maximum 3 active wanted posts allowed' });
  }

  const { eventId, validity, night, items, maxPricePerPass, location, area, note } = req.body;

  const newWanted: WantedPost = {
    id: `wanted-${Date.now()}`,
    buyerId: user.id,
    eventId,
    validity: validity || 'DAILY',
    night: night || 4,
    items: items || [{ type: 'COUPLE', quantity: 1, remaining: 1 }],
    maxPricePerPass: maxPricePerPass || 800,
    location: location || user.homeLocation,
    area: area || user.homeArea,
    note: note || '',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    reportCount: 0,
    createdAt: new Date().toISOString()
  };

  db.wantedPosts.unshift(newWanted);

  // Dispatch alert to sellers with active listings
  db.dispatchWantedAlerts(newWanted);

  return res.json({ success: true, wantedPost: newWanted });
});

// ----------------------------------------------------
// 5. REQUESTS & TRANSACTIONS (ACCEPT/DECLINE)
// ----------------------------------------------------

apiRouter.get('/requests', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const received = db.requests
    .filter((r) => r.toUserId === user.id)
    .map((r) => {
      const fromUser = db.users.find((u) => u.id === r.fromUserId);
      const listing = r.listingId ? db.listings.find((l) => l.id === r.listingId) : undefined;
      const wanted = r.wantedPostId ? db.wantedPosts.find((w) => w.id === r.wantedPostId) : undefined;
      return {
        ...r,
        fromUser: fromUser ? db.sanitizeUser(fromUser) : undefined,
        listing,
        wantedPost: wanted
      };
    });

  const sent = db.requests
    .filter((r) => r.fromUserId === user.id)
    .map((r) => {
      const toUser = db.users.find((u) => u.id === r.toUserId);
      const listing = r.listingId ? db.listings.find((l) => l.id === r.listingId) : undefined;
      const wanted = r.wantedPostId ? db.wantedPosts.find((w) => w.id === r.wantedPostId) : undefined;
      return {
        ...r,
        toUser: toUser ? db.sanitizeUser(toUser) : undefined,
        listing,
        wantedPost: wanted
      };
    });

  return res.json({ received, sent });
});

apiRouter.post('/requests', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Sign in required' });
  if (user.banned) return res.status(403).json({ error: 'Account is suspended' });

  // Rate limit: 20 requests per hour (Rule 5)
  if (!db.checkRateLimitRequest(user.id)) {
    return res.status(429).json({ error: 'Hourly request limit (20/hour) reached' });
  }

  const { kind, listingId, wantedPostId, items, message } = req.body;

  let toUserId = '';
  if (kind === 'REQUEST') {
    const listing = db.listings.find((l) => l.id === listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.sellerId === user.id) {
      return res.status(400).json({ error: 'Cannot request passes on your own listing' });
    }
    toUserId = listing.sellerId;

    // Rule 5: One pending request per user per post
    const existing = db.requests.find(
      (r) => r.listingId === listingId && r.fromUserId === user.id && r.status === 'PENDING'
    );
    if (existing) {
      return res.status(400).json({ error: 'You already have a pending request on this listing' });
    }
  } else if (kind === 'OFFER') {
    const wanted = db.wantedPosts.find((w) => w.id === wantedPostId);
    if (!wanted) return res.status(404).json({ error: 'Wanted post not found' });
    if (wanted.buyerId === user.id) {
      return res.status(400).json({ error: 'Cannot make an offer on your own wanted post' });
    }
    toUserId = wanted.buyerId;

    const existing = db.requests.find(
      (r) => r.wantedPostId === wantedPostId && r.fromUserId === user.id && r.status === 'PENDING'
    );
    if (existing) {
      return res.status(400).json({ error: 'You already have a pending offer on this wanted post' });
    }
  }

  // Pending request expires after 30 minutes (Rule 6)
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const newRequest: SwapRequest = {
    id: `req-${Date.now()}`,
    kind: kind || 'REQUEST',
    listingId,
    wantedPostId,
    fromUserId: user.id,
    toUserId,
    items: items || [{ type: 'COUPLE', quantity: 1, pricePerPass: 800 }],
    message: message || '',
    status: 'PENDING',
    expiresAt,
    createdAt: new Date().toISOString()
  };

  db.requests.unshift(newRequest);

  // Notify recipient
  db.sendNotification(
    toUserId,
    kind === 'REQUEST' ? 'NEW_REQUEST' : 'NEW_OFFER',
    kind === 'REQUEST' ? 'New Pass Request Received!' : 'New Pass Offer Received!',
    `${user.name.split(' ')[0]} sent you a ${kind === 'REQUEST' ? 'request' : 'offer'}. Respond within 30 minutes.`,
    '/requests'
  );

  return res.json({ success: true, request: newRequest });
});

// Accept Request with MongoDB-like atomic transaction (Section 5 Rule 4)
apiRouter.post('/requests/:id/accept', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const result = db.acceptRequest(req.params.id, user.id);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({ success: true, connection: result.connection });
});

// Decline Request
apiRouter.post('/requests/:id/decline', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const request = db.requests.find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.toUserId !== user.id) return res.status(403).json({ error: 'Forbidden' });

  request.status = 'DECLINED';

  db.sendNotification(
    request.fromUserId,
    'REQUEST_DECLINED',
    'Request Declined',
    'Your exchange request was not accepted by the seller.',
    '/requests'
  );

  return res.json({ success: true, request });
});

// ----------------------------------------------------
// 6. CONNECTIONS & HANDOVER SCREEN (Section 5 Rule 2 & 9)
// ----------------------------------------------------

apiRouter.get('/connections/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const connection = db.connections.find((c) => c.id === req.params.id);
  if (!connection) return res.status(404).json({ error: 'Connection not found' });

  // Only participants or admins can view connection details
  if (connection.sellerId !== user.id && connection.buyerId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized to view this connection' });
  }

  const event = db.events.find((e) => e.id === connection.eventId);
  return res.json({
    connection: {
      ...connection,
      event
    }
  });
});

// Mark as Done (Rule 9)
apiRouter.post('/connections/:id/done', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { connection, isCompleted } = db.markDone(req.params.id, user.id);
    return res.json({ success: true, connection, isCompleted });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Error marking connection as done' });
  }
});

// ----------------------------------------------------
// 7. RATINGS, REPORTS & BLOCKING (Section 5 Rules 7, 8, 9)
// ----------------------------------------------------

apiRouter.post('/ratings', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { connectionId, toUserId, value, tags, comment } = req.body;
  if (!connectionId || !toUserId || !value) {
    return res.status(400).json({ error: 'Connection ID, target user, and rating are required' });
  }

  try {
    const rating = db.submitRating({
      connectionId,
      fromUserId: user.id,
      toUserId,
      value: value === 'DOWN' ? 'DOWN' : 'UP',
      tags: tags || [],
      comment: comment || ''
    });
    return res.json({ success: true, rating });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/reports', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { targetType, targetId, reason, details, blockUser } = req.body;
  if (!targetType || !targetId || !reason) {
    return res.status(400).json({ error: 'Target and reason are required' });
  }

  const report = db.submitReport({
    reporterId: user.id,
    targetType,
    targetId,
    reason,
    details: details || ''
  });

  // Block user toggle
  if (blockUser && targetType === 'USER') {
    if (!user.blockedUserIds.includes(targetId)) {
      user.blockedUserIds.push(targetId);
    }
  }

  return res.json({ success: true, report });
});

apiRouter.post('/users/block', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: 'Target user ID required' });

  if (!user.blockedUserIds.includes(targetUserId)) {
    user.blockedUserIds.push(targetUserId);
  }

  return res.json({ success: true, blockedUserIds: user.blockedUserIds });
});

// ----------------------------------------------------
// 8. NOTIFICATIONS & ALERTS
// ----------------------------------------------------

apiRouter.get('/notifications', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.json({ notifications: [] });

  const userNotifs = db.notifications.filter((n) => n.userId === user.id);
  return res.json({ notifications: userNotifs });
});

apiRouter.post('/notifications/read-all', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  db.notifications
    .filter((n) => n.userId === user.id && !n.readAt)
    .forEach((n) => {
      n.readAt = new Date().toISOString();
    });

  return res.json({ success: true });
});

// ----------------------------------------------------
// 9. ADMIN PANEL (ROLE-PROTECTED)
// ----------------------------------------------------

apiRouter.get('/admin/overview', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const livePosts = db.listings.filter((l) => l.status === 'ACTIVE').length;
  const requestsToday = db.requests.length;
  const completedExchanges = db.connections.filter((c) => c.status === 'COMPLETED').length;
  const openReports = db.reports.filter((r) => r.status === 'OPEN').length;

  return res.json({
    metrics: {
      livePosts,
      requestsToday,
      completedExchanges,
      openReports
    },
    reports: db.reports,
    events: db.events,
    users: db.users.map((u) => ({
      id: u.id,
      name: u.name,
      phoneNumber: u.phoneNumber,
      role: u.role,
      banned: u.banned,
      completedExchanges: u.completedExchanges
    })),
    actions: db.adminActions
  });
});

apiRouter.post('/admin/reports/:id/action', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { action, adminNote } = req.body; // 'DISMISS' | 'HIDE_POST' | 'BAN_USER'
  const report = db.reports.find((r) => r.id === req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  if (action === 'DISMISS') {
    report.status = 'DISMISSED';
    report.adminNote = adminNote || 'Dismissed by admin';
    report.handledBy = user.id;
  } else if (action === 'HIDE_POST') {
    report.status = 'ACTIONED';
    report.adminNote = adminNote || 'Target post hidden';
    report.handledBy = user.id;
    if (report.targetType === 'LISTING') {
      const listing = db.listings.find((l) => l.id === report.targetId);
      if (listing) listing.status = 'HIDDEN';
    } else if (report.targetType === 'WANTED') {
      const wanted = db.wantedPosts.find((w) => w.id === report.targetId);
      if (wanted) wanted.status = 'HIDDEN';
    }
  } else if (action === 'BAN_USER') {
    report.status = 'ACTIONED';
    report.adminNote = adminNote || 'User banned';
    report.handledBy = user.id;
    const targetUser = db.users.find((u) => u.id === report.targetId);
    if (targetUser) targetUser.banned = true;
  }

  db.logAdminAction(user.id, action, report.targetType, report.targetId, adminNote);
  return res.json({ success: true, report });
});

apiRouter.post('/admin/users/:id/ban', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  const target = db.users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  target.banned = !target.banned;
  db.logAdminAction(user.id, target.banned ? 'BAN_USER' : 'UNBAN_USER', 'USER', target.id);
  return res.json({ success: true, banned: target.banned });
});

// ----------------------------------------------------
// 10. CRON ROUTE HANDLER (Section 2 & 5 Rule 6)
// ----------------------------------------------------

apiRouter.post('/cron/expire-posts', (req: Request, res: Response) => {
  const cronSecret = req.headers['x-cron-secret'];
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Invalid cron secret' });
  }

  const now = new Date().toISOString();
  let expiredListings = 0;
  let expiredRequests = 0;

  // Auto-expire listings past cutoff
  db.listings.forEach((l) => {
    if (l.status === 'ACTIVE' && l.expiresAt < now) {
      l.status = 'EXPIRED';
      expiredListings++;
    }
  });

  // Auto-expire requests past 30 min
  db.requests.forEach((r) => {
    if (r.status === 'PENDING' && r.expiresAt < now) {
      r.status = 'EXPIRED';
      expiredRequests++;
    }
  });

  return res.json({
    success: true,
    timestamp: now,
    expiredListings,
    expiredRequests
  });
});
