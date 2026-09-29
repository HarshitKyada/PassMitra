import {
  User,
  PublicUser,
  GarbaEvent,
  Listing,
  WantedPost,
  SwapRequest,
  Connection,
  Rating,
  Report,
  AppNotification,
  Area,
  AdminAction,
  PassType
} from '../src/types/index.ts';
import {
  SEED_AREAS,
  SEED_EVENTS,
  SEED_USERS,
  SEED_LISTINGS,
  SEED_WANTED
} from './seed.ts';

// In-Memory Database Store with persistence support & strict business rule validation
class PassMitraDB {
  public areas: Area[] = [...SEED_AREAS];
  public events: GarbaEvent[] = [...SEED_EVENTS];
  public users: User[] = [...SEED_USERS];
  public listings: Listing[] = [...SEED_LISTINGS];
  public wantedPosts: WantedPost[] = [...SEED_WANTED];
  public requests: SwapRequest[] = [];
  public connections: Connection[] = [];
  public ratings: Rating[] = [];
  public reports: Report[] = [];
  public notifications: AppNotification[] = [];
  public adminActions: AdminAction[] = [];

  // Rate Limiting Tables
  private otpRequests: { phoneOrIp: string; timestamp: number }[] = [];
  private userPostTimestamps: { userId: string; timestamp: number }[] = [];
  private userRequestTimestamps: { userId: string; timestamp: number }[] = [];

  // OTP Store: phoneNumber -> { code, expiresAt, attempts }
  public activeOtps: Map<string, { code: string; expiresAt: number; attempts: number }> = new Map();

  constructor() {
    // Initial seeded connection to demo /connected/conn-demo-9921 matching screenshot!
    this.connections.push({
      id: 'conn-demo-9921',
      requestId: 'req-demo-1',
      sellerId: 'user-parthiv',
      sellerPhone: '+919825044218',
      sellerName: 'Parthiv Shah',
      sellerImage: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
      buyerId: 'user-aarav',
      buyerPhone: '+919825088421',
      buyerName: 'Aarav Mehta',
      buyerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      listingId: 'listing-uwb-88421',
      eventId: 'evt-uwb',
      night: 4,
      items: [{ type: 'COUPLE', quantity: 2, pricePerPass: 800 }],
      total: 1600,
      format: 'WRISTBAND',
      meetingPoint: {
        location: { type: 'Point', coordinates: [72.5073, 23.0338] },
        landmark: 'Gate 2 Security Cabin & Amul Milk Kiosk (Adjacent to Police Post #04)'
      },
      status: 'CONNECTED',
      createdAt: new Date().toISOString()
    });

    // Seed initial notifications for demo
    this.notifications.push(
      {
        id: 'notif-1',
        userId: 'user-aarav',
        type: 'REQUEST_ACCEPTED',
        title: 'Request Accepted!',
        body: 'Parthiv S. accepted your pass request for United Way of Baroda (Night 4).',
        link: '/connected/conn-demo-9921',
        readAt: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString()
      },
      {
        id: 'notif-2',
        userId: 'user-aarav',
        type: 'PRICE_DROP',
        title: 'Price Drop on Night 4',
        body: 'YMCA Club Navratri Mahotsav price dropped to ₹500.',
        link: '/l/listing-ymca-44510',
        readAt: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
      },
      {
        id: 'notif-3',
        userId: 'user-aarav',
        type: 'NEW_LISTING',
        title: 'New Passes Near You',
        body: 'Tanvi M. posted 2 Couple passes for United Way of Baroda.',
        link: '/l/listing-uwb-88421',
        readAt: null,
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      }
    );
  }

  // --- Geolocation Calculations (Haversine formula) ---
  public calculateDistanceKm(
    point1: [number, number], // [lng, lat]
    point2: [number, number]
  ): number {
    const [lon1, lat1] = point1;
    const [lon2, lat2] = point2;
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  public findNearestArea(point: [number, number]): Area {
    let nearest = this.areas[0];
    let minDistance = Infinity;

    for (const area of this.areas) {
      const dist = this.calculateDistanceKm(point, area.location.coordinates);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = area;
      }
    }
    return nearest;
  }

  // Format friendly distance: "under 500 m", "1.2 km"
  public formatFriendlyDistance(km: number): string {
    if (km < 0.5) return 'under 500 m';
    if (km < 1.0) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  }

  // --- Rule 2 & 3: User Sanitation (Strip phone number and private home coordinates) ---
  public sanitizeUser(user: User, viewerLocation?: [number, number]): PublicUser {
    const totalRatings = user.thumbsUp + user.thumbsDown;
    const positivePercentage =
      totalRatings === 0 ? 100 : Math.round((user.thumbsUp / totalRatings) * 100);

    const approxDistanceKm = viewerLocation
      ? this.calculateDistanceKm(viewerLocation, user.homeLocation.coordinates)
      : undefined;

    return {
      id: user.id,
      name: user.name.split(' ')[0], // First name only as per Section 5 Rule 2
      image: user.image,
      role: user.role,
      verified: user.phoneNumberVerified,
      positivePercentage,
      thumbsUp: user.thumbsUp,
      thumbsDown: user.thumbsDown,
      completedExchanges: user.completedExchanges,
      homeArea: user.homeArea,
      approxDistanceKm
    };
  }

  // Check if two users share an active/completed connection
  public shareConnection(userA: string, userB: string): boolean {
    return this.connections.some(
      (c) =>
        (c.sellerId === userA && c.buyerId === userB) ||
        (c.sellerId === userB && c.buyerId === userA)
    );
  }

  // Check if either user has blocked the other
  public isBlocked(userAId: string, userBId: string): boolean {
    const userA = this.users.find((u) => u.id === userAId);
    const userB = this.users.find((u) => u.id === userBId);
    if (!userA || !userB) return false;
    return (
      userA.blockedUserIds.includes(userBId) ||
      userB.blockedUserIds.includes(userAId)
    );
  }

  // --- Rule 5: Rate Limiting ---
  public checkRateLimitOtp(phoneOrIp: string): boolean {
    const now = Date.now();
    const tenMinAgo = now - 10 * 60 * 1000;
    this.otpRequests = this.otpRequests.filter((r) => r.timestamp > tenMinAgo);
    const count = this.otpRequests.filter((r) => r.phoneOrIp === phoneOrIp).length;
    if (count >= 3) return false;
    this.otpRequests.push({ phoneOrIp, timestamp: now });
    return true;
  }

  public checkRateLimitNewPost(userId: string): boolean {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    this.userPostTimestamps = this.userPostTimestamps.filter((r) => r.timestamp > oneDayAgo);
    const count = this.userPostTimestamps.filter((r) => r.userId === userId).length;
    if (count >= 10) return false;
    this.userPostTimestamps.push({ userId, timestamp: now });
    return true;
  }

  public checkRateLimitRequest(userId: string): boolean {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    this.userRequestTimestamps = this.userRequestTimestamps.filter((r) => r.timestamp > oneHourAgo);
    const count = this.userRequestTimestamps.filter((r) => r.userId === userId).length;
    if (count >= 20) return false;
    this.userRequestTimestamps.push({ userId, timestamp: now });
    return true;
  }

  // --- Rule 1: Price Cap Enforcement ---
  public validatePriceCap(
    eventId: string,
    validity: 'DAILY' | 'SEASON',
    type: PassType,
    askingPrice: number,
    printedPrice: number
  ): { valid: boolean; maxAllowed: number; needsReview: boolean } {
    const event = this.events.find((e) => e.id === eventId);
    if (!event || event.status === 'PENDING') {
      // For PENDING events: cap at printedPrice and set needsReview: true
      return {
        valid: askingPrice <= printedPrice,
        maxAllowed: printedPrice,
        needsReview: true
      };
    }

    const priceRule = event.passPrices.find(
      (p) => p.type === type && p.validity === validity
    );
    const officialPrice = priceRule ? priceRule.officialPrice : printedPrice;
    return {
      valid: askingPrice <= officialPrice,
      maxAllowed: officialPrice,
      needsReview: false
    };
  }

  // --- Rule 4: Atomic Transaction for Accepting Request / Offer ---
  public acceptRequest(
    requestId: string,
    acceptingUserId: string
  ): { success: boolean; connection?: Connection; error?: string } {
    const request = this.requests.find((r) => r.id === requestId);
    if (!request) return { success: false, error: 'Request not found' };
    if (request.status !== 'PENDING') return { success: false, error: 'Request is no longer pending' };

    // Ensure only the intended recipient can accept
    if (request.toUserId !== acceptingUserId) {
      return { success: false, error: 'Unauthorized to accept this request' };
    }

    // Handshake on Listing
    if (request.listingId) {
      const listing = this.listings.find((l) => l.id === request.listingId);
      if (!listing) return { success: false, error: 'Listing not found' };
      if (listing.status !== 'ACTIVE') return { success: false, error: 'Listing is no longer active' };

      // Atomic verification: check if each requested type has enough remaining
      for (const reqItem of request.items) {
        const listingItem = listing.items.find((item) => item.type === reqItem.type);
        if (!listingItem || listingItem.remaining < reqItem.quantity) {
          return {
            success: false,
            error: `Not enough passes remaining for type ${reqItem.type}`
          };
        }
      }

      // Decrement remaining passes atomically
      for (const reqItem of request.items) {
        const listingItem = listing.items.find((item) => item.type === reqItem.type);
        if (listingItem) {
          listingItem.remaining -= reqItem.quantity;
        }
      }

      // Check total remaining on listing
      const totalRemaining = listing.items.reduce((acc, it) => acc + it.remaining, 0);

      // Create Connection
      const seller = this.users.find((u) => u.id === listing.sellerId);
      const buyer = this.users.find((u) => u.id === request.fromUserId);
      const totalAmount = request.items.reduce(
        (sum, item) => sum + item.quantity * item.pricePerPass,
        0
      );

      const connection: Connection = {
        id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        requestId: request.id,
        sellerId: listing.sellerId,
        sellerPhone: seller?.phoneNumber,
        sellerName: seller?.name,
        sellerImage: seller?.image,
        buyerId: request.fromUserId,
        buyerPhone: buyer?.phoneNumber,
        buyerName: buyer?.name,
        buyerImage: buyer?.image,
        listingId: listing.id,
        eventId: listing.eventId,
        night: listing.night,
        items: request.items,
        total: totalAmount,
        format: listing.format,
        meetingPoint: listing.meetingPoint,
        status: 'CONNECTED',
        createdAt: new Date().toISOString()
      };

      this.connections.push(connection);
      request.status = 'ACCEPTED';
      request.connectionId = connection.id;

      // When remaining hits 0, listing becomes ALL_GIVEN, auto-decline other pending requests
      if (totalRemaining <= 0) {
        listing.status = 'ALL_GIVEN';
        this.requests
          .filter(
            (r) =>
              r.listingId === listing.id &&
              r.id !== request.id &&
              r.status === 'PENDING'
          )
          .forEach((otherReq) => {
            otherReq.status = 'AUTO_DECLINED';
            this.sendNotification(
              otherReq.fromUserId,
              'REQUEST_AUTO_DECLINED',
              'Passes No Longer Available',
              'The passes you requested have been given to another buyer.',
              `/l/${listing.id}`
            );
          });
      }

      // Notify buyer of acceptance
      this.sendNotification(
        request.fromUserId,
        'REQUEST_ACCEPTED',
        'Request Accepted! 🎉',
        `${seller?.name.split(' ')[0]} accepted your request. Meetup contact details are now unlocked.`,
        `/connected/${connection.id}`
      );

      return { success: true, connection };
    }

    // Handshake on Wanted Post (Reverse Flow)
    if (request.wantedPostId) {
      const wanted = this.wantedPosts.find((w) => w.id === request.wantedPostId);
      if (!wanted) return { success: false, error: 'Wanted post not found' };
      if (wanted.status !== 'ACTIVE') return { success: false, error: 'Wanted post is no longer active' };

      for (const reqItem of request.items) {
        const wantedItem = wanted.items.find((item) => item.type === reqItem.type);
        if (!wantedItem || wantedItem.remaining < reqItem.quantity) {
          return {
            success: false,
            error: `Wanted post only needs ${wantedItem ? wantedItem.remaining : 0} of ${reqItem.type}`
          };
        }
      }

      for (const reqItem of request.items) {
        const wantedItem = wanted.items.find((item) => item.type === reqItem.type);
        if (wantedItem) {
          wantedItem.remaining -= reqItem.quantity;
        }
      }

      const totalRemaining = wanted.items.reduce((acc, it) => acc + it.remaining, 0);
      const buyer = this.users.find((u) => u.id === wanted.buyerId);
      const seller = this.users.find((u) => u.id === request.fromUserId);
      const totalAmount = request.items.reduce(
        (sum, item) => sum + item.quantity * item.pricePerPass,
        0
      );

      const connection: Connection = {
        id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        requestId: request.id,
        sellerId: request.fromUserId,
        sellerPhone: seller?.phoneNumber,
        sellerName: seller?.name,
        sellerImage: seller?.image,
        buyerId: wanted.buyerId,
        buyerPhone: buyer?.phoneNumber,
        buyerName: buyer?.name,
        buyerImage: buyer?.image,
        wantedPostId: wanted.id,
        eventId: wanted.eventId,
        night: wanted.night,
        items: request.items,
        total: totalAmount,
        format: 'PHYSICAL',
        meetingPoint: {
          location: wanted.location,
          landmark: `Nearby ${wanted.area}`
        },
        status: 'CONNECTED',
        createdAt: new Date().toISOString()
      };

      this.connections.push(connection);
      request.status = 'ACCEPTED';
      request.connectionId = connection.id;

      if (totalRemaining <= 0) {
        wanted.status = 'FULFILLED';
        this.requests
          .filter(
            (r) =>
              r.wantedPostId === wanted.id &&
              r.id !== request.id &&
              r.status === 'PENDING'
          )
          .forEach((otherReq) => {
            otherReq.status = 'AUTO_DECLINED';
            this.sendNotification(
              otherReq.fromUserId,
              'OFFER_AUTO_DECLINED',
              'Passes Fulfilled',
              'The buyer has fulfilled their pass requirement.',
              `/w/${wanted.id}`
            );
          });
      }

      this.sendNotification(
        request.fromUserId,
        'OFFER_ACCEPTED',
        'Offer Accepted! 🎉',
        `${buyer?.name.split(' ')[0]} accepted your offer. Contact details unlocked.`,
        `/connected/${connection.id}`
      );

      return { success: true, connection };
    }

    return { success: false, error: 'Invalid request target' };
  }

  // --- Rule 8: Auto-hiding on 3 open reports ---
  public submitReport(report: Omit<Report, 'id' | 'createdAt' | 'status'>): Report {
    const newReport: Report = {
      ...report,
      id: `rep-${Date.now()}`,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };
    this.reports.push(newReport);

    // Count open reports on target
    if (newReport.targetType === 'LISTING') {
      const openCount = this.reports.filter(
        (r) => r.targetType === 'LISTING' && r.targetId === newReport.targetId && r.status === 'OPEN'
      ).length;
      if (openCount >= 3) {
        const listing = this.listings.find((l) => l.id === newReport.targetId);
        if (listing) {
          listing.status = 'HIDDEN';
          this.logAdminAction(
            'system',
            'AUTO_HIDE_LISTING',
            'LISTING',
            listing.id,
            `Auto-hidden due to ${openCount} open reports`
          );
        }
      }
    } else if (newReport.targetType === 'WANTED') {
      const openCount = this.reports.filter(
        (r) => r.targetType === 'WANTED' && r.targetId === newReport.targetId && r.status === 'OPEN'
      ).length;
      if (openCount >= 3) {
        const wanted = this.wantedPosts.find((w) => w.id === newReport.targetId);
        if (wanted) {
          wanted.status = 'HIDDEN';
          this.logAdminAction(
            'system',
            'AUTO_HIDE_WANTED',
            'WANTED',
            wanted.id,
            `Auto-hidden due to ${openCount} open reports`
          );
        }
      }
    }

    return newReport;
  }

  // --- Rule 9: Mark as Done & Ratings ---
  public markDone(connectionId: string, userId: string): { connection: Connection; isCompleted: boolean } {
    const conn = this.connections.find((c) => c.id === connectionId);
    if (!conn) throw new Error('Connection not found');

    const now = new Date().toISOString();
    if (conn.sellerId === userId) {
      conn.sellerDoneAt = now;
    } else if (conn.buyerId === userId) {
      conn.buyerDoneAt = now;
    } else {
      throw new Error('Not part of this connection');
    }

    const isCompleted = Boolean(conn.sellerDoneAt && conn.buyerDoneAt);
    if (isCompleted) {
      conn.status = 'COMPLETED';

      // Update completedExchanges count for both parties
      const seller = this.users.find((u) => u.id === conn.sellerId);
      const buyer = this.users.find((u) => u.id === conn.buyerId);
      if (seller) seller.completedExchanges += 1;
      if (buyer) buyer.completedExchanges += 1;

      // Trigger rating notifications
      this.sendNotification(
        conn.sellerId,
        'RATE_EXCHANGE',
        'How was your exchange?',
        `Please rate your exchange with ${buyer?.name.split(' ')[0]}.`,
        `/rate/${conn.id}`
      );
      this.sendNotification(
        conn.buyerId,
        'RATE_EXCHANGE',
        'How was your exchange?',
        `Please rate your exchange with ${seller?.name.split(' ')[0]}.`,
        `/rate/${conn.id}`
      );
    }

    return { connection: conn, isCompleted };
  }

  public submitRating(rating: Omit<Rating, 'id' | 'createdAt'>): Rating {
    const existing = this.ratings.find(
      (r) => r.connectionId === rating.connectionId && r.fromUserId === rating.fromUserId
    );
    if (existing) {
      throw new Error('You have already submitted a rating for this connection');
    }

    const newRating: Rating = {
      ...rating,
      id: `rat-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.ratings.push(newRating);

    // Update target user's thumbsUp / thumbsDown
    const targetUser = this.users.find((u) => u.id === rating.toUserId);
    if (targetUser) {
      if (rating.value === 'UP') {
        targetUser.thumbsUp += 1;
      } else {
        targetUser.thumbsDown += 1;
      }
    }

    return newRating;
  }

  // --- Rule 6: Proximity Alert Matching for New Listings ---
  public dispatchListingAlerts(listing: Listing) {
    const event = this.events.find((e) => e.id === listing.eventId);
    const seller = this.users.find((u) => u.id === listing.sellerId);

    // 1. Alert users who watch this event and night, and whose homeLocation is within alertRadiusKm of meeting point
    this.users.forEach((user) => {
      if (user.id === listing.sellerId || user.banned) return;
      if (this.isBlocked(user.id, listing.sellerId)) return;

      const watchesEvent = user.watchedEventIds.includes(listing.eventId);
      const watchesNight = user.watchedNights.includes(listing.night);
      const dist = this.calculateDistanceKm(
        listing.meetingPoint.location.coordinates,
        user.homeLocation.coordinates
      );
      const withinRadius = dist <= user.alertRadiusKm;

      if (watchesEvent && watchesNight && withinRadius) {
        this.sendNotification(
          user.id,
          'NEW_LISTING_MATCH',
          `Passes Available: ${event?.name.split(' ')[0]}`,
          `${seller?.name.split(' ')[0]} just posted ${listing.items.map((i) => `${i.quantity} ${i.type}`).join(', ')} passes near ${listing.area}.`,
          `/l/${listing.id}`
        );
      }
    });

    // 2. Alert users with active wanted post for the same event and night (at any distance)
    this.wantedPosts.forEach((wanted) => {
      if (
        wanted.status === 'ACTIVE' &&
        wanted.eventId === listing.eventId &&
        wanted.night === listing.night &&
        wanted.buyerId !== listing.sellerId
      ) {
        if (!this.isBlocked(wanted.buyerId, listing.sellerId)) {
          this.sendNotification(
            wanted.buyerId,
            'WANTED_MATCH',
            `Matching Passes Found!`,
            `Spare passes posted for ${event?.name} matching your wanted request.`,
            `/l/${listing.id}`
          );
        }
      }
    });
  }

  // --- Rule 6: Alert Matching for New Wanted Posts ---
  public dispatchWantedAlerts(wanted: WantedPost) {
    const event = this.events.find((e) => e.id === wanted.eventId);
    const buyer = this.users.find((u) => u.id === wanted.buyerId);
    const wantedTypes = wanted.items.map((it) => it.type);

    this.listings.forEach((listing) => {
      if (
        listing.status === 'ACTIVE' &&
        listing.eventId === wanted.eventId &&
        listing.night === wanted.night &&
        listing.sellerId !== wanted.buyerId
      ) {
        const hasMatchingType = listing.items.some((it) => wantedTypes.includes(it.type) && it.remaining > 0);
        if (hasMatchingType && !this.isBlocked(listing.sellerId, wanted.buyerId)) {
          this.sendNotification(
            listing.sellerId,
            'NEW_WANTED_MATCH',
            `Buyer Looking for Your Passes`,
            `${buyer?.name.split(' ')[0]} is looking for passes at ${event?.name.split(' ')[0]} (Night ${wanted.night}).`,
            `/w/${wanted.id}`
          );
        }
      }
    });
  }

  // Notification helper
  public sendNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    link: string
  ) {
    const notif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      type,
      title,
      body,
      link,
      readAt: null,
      createdAt: new Date().toISOString()
    };
    this.notifications.unshift(notif);
  }

  public logAdminAction(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    note?: string
  ): AdminAction {
    const log: AdminAction = {
      id: `adm-${Date.now()}`,
      adminId,
      action,
      targetType,
      targetId,
      note,
      createdAt: new Date().toISOString()
    };
    this.adminActions.unshift(log);
    return log;
  }
}

export const db = new PassMitraDB();
