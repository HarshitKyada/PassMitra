/**
 * PassMitra - Ahmedabad Navratri Garba Pass Exchange
 * Type definitions & Data Models
 */

export type PassType = 'MALE' | 'FEMALE' | 'COUPLE' | 'KIDS';
export type PassValidity = 'DAILY' | 'SEASON';
export type PassFormat = 'PHYSICAL' | 'EPASS' | 'WRISTBAND';
export type EventStatus = 'VERIFIED' | 'PENDING' | 'HIDDEN';
export type ListingStatus = 'ACTIVE' | 'ALL_GIVEN' | 'EXPIRED' | 'CLOSED' | 'HIDDEN';
export type WantedStatus = 'ACTIVE' | 'FULFILLED' | 'EXPIRED' | 'CLOSED' | 'HIDDEN';
export type RequestKind = 'REQUEST' | 'OFFER';
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'AUTO_DECLINED' | 'EXPIRED' | 'CANCELLED';
export type ConnectionStatus = 'CONNECTED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
export type RatingValue = 'UP' | 'DOWN';
export type ReportTargetType = 'LISTING' | 'WANTED' | 'USER' | 'CONNECTION';
export type ReportStatus = 'OPEN' | 'DISMISSED' | 'ACTIONED';
export type UserRole = 'user' | 'admin' | 'USER' | 'ADMIN';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface User {
  id: string;
  name: string;
  phoneNumber: string; // Private, only revealed on Connection
  phoneNumberVerified: boolean;
  image?: string;
  role: UserRole;
  banned: boolean;
  homeLocation: GeoPoint;
  homeArea: string;
  alertRadiusKm: number; // 1 to 10, default 3
  watchedEventIds: string[];
  watchedNights: number[]; // 1 to 9
  language: 'en' | 'gu';
  theme: 'dark' | 'light' | 'DARK' | 'LIGHT';
  thumbsUp: number;
  thumbsDown: number;
  completedExchanges: number;
  trustRating?: number;
  blockedUserIds: string[];
  termsAcceptedAt: string | null;
  createdAt: string;
}

// Sanitized public user representation (never exposes phone number or exact GPS)
export interface PublicUser {
  id: string;
  name: string; // First name or display name
  phoneNumber?: string;
  image?: string;
  role: UserRole;
  verified: boolean;
  positivePercentage: number;
  thumbsUp: number;
  thumbsDown: number;
  completedExchanges: number;
  trustRating?: number;
  homeArea: string;
  approxDistanceKm?: number;
}

export interface EventNight {
  night: number; // 1 to 9
  date: string; // YYYY-MM-DD
  entryStart: string; // e.g. "20:00"
  entryCutoff: string; // e.g. "23:00"
}

export interface PassPrice {
  type: PassType;
  validity: PassValidity;
  officialPrice: number;
}

export interface GarbaEvent {
  id: string;
  name: string;
  organiser: string;
  venueName: string;
  area: string;
  location: GeoPoint;
  nights: EventNight[];
  passPrices: PassPrice[];
  status: EventStatus;
  createdBy: string;
}

export interface ListingItem {
  type: PassType;
  quantity: number;
  remaining: number;
  printedPrice: number;
  askingPrice: number;
}

export interface MeetingPoint {
  location: GeoPoint;
  landmark: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  seller?: PublicUser;
  eventId: string;
  event?: GarbaEvent;
  validity: PassValidity;
  night: number; // DAILY only (1-9)
  items: ListingItem[];
  format: PassFormat;
  namePrinted: boolean;
  photoUrl: string;
  meetingPoint: MeetingPoint;
  area: string;
  contactPrefs: 'CALL' | 'WHATSAPP' | 'BOTH';
  note?: string;
  status: ListingStatus;
  expiresAt: string;
  needsReview: boolean;
  reportCount?: number;
  distanceKm?: number;
  createdAt: string;
}

export interface WantedPostItem {
  type: PassType;
  quantity: number;
  remaining: number;
}

export interface WantedPost {
  id: string;
  buyerId: string;
  buyer?: PublicUser;
  eventId: string;
  event?: GarbaEvent;
  validity: PassValidity;
  night: number;
  items: WantedPostItem[];
  maxPricePerPass: number;
  location: GeoPoint;
  area: string;
  note?: string;
  status: WantedStatus;
  expiresAt: string;
  reportCount?: number;
  distanceKm?: number;
  createdAt: string;
}

export interface RequestItem {
  type: PassType;
  quantity: number;
  pricePerPass: number;
}

export interface SwapRequest {
  id: string;
  kind: RequestKind;
  listingId?: string;
  listing?: Listing;
  wantedPostId?: string;
  wantedPost?: WantedPost;
  fromUserId: string;
  fromUser?: PublicUser;
  toUserId: string;
  toUser?: PublicUser;
  items: RequestItem[];
  message?: string;
  status: RequestStatus;
  expiresAt: string;
  connectionId?: string;
  createdAt: string;
}

export interface Connection {
  id: string;
  requestId: string;
  sellerId: string;
  seller?: PublicUser;
  sellerPhone?: string; // Revealed inside connection!
  sellerName?: string;
  sellerImage?: string;
  buyerId: string;
  buyer?: PublicUser;
  buyerPhone?: string; // Revealed inside connection!
  buyerName?: string;
  buyerImage?: string;
  listingId?: string;
  wantedPostId?: string;
  eventId: string;
  event?: GarbaEvent;
  night: number;
  items: RequestItem[];
  total: number;
  format: PassFormat;
  meetingPoint: MeetingPoint;
  status: ConnectionStatus;
  sellerDoneAt?: string;
  buyerDoneAt?: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  connectionId: string;
  fromUserId: string;
  toUserId: string;
  value: RatingValue;
  tags: string[];
  comment?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporter?: PublicUser;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  adminNote?: string;
  handledBy?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
}

export interface Area {
  id: string;
  name: string;
  location: GeoPoint;
}

export interface AdminAction {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string;
  note?: string;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
}
