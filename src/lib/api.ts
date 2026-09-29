/**
 * PassMitra Client API Bridge
 */

import {
  User,
  Listing,
  WantedPost,
  SwapRequest,
  Connection,
  GarbaEvent,
  Area,
  AppNotification,
  Report,
  Rating
} from '../types/index.ts';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('passmitra_token') || 'user-aarav';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error('Failed to fetch user');
  const data = await res.json();
  return data.user || data;
}

export async function switchDemoUser(userId: string): Promise<{ success: boolean; user: User }> {
  localStorage.setItem('passmitra_token', userId);
  const user = await fetchCurrentUser();
  return { success: true, user };
}

export async function sendPhoneOtp(phoneNumber: string): Promise<{ success: boolean; simulatedOtp?: string; message: string }> {
  const res = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
  return {
    success: true,
    simulatedOtp: data.devOtp || data.simulatedOtp || '123456',
    message: data.message || 'OTP sent successfully'
  };
}

export async function verifyPhoneOtp(phoneNumber: string, code: string): Promise<{ success: boolean; user: User; token: string }> {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, code })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Invalid OTP');
  localStorage.setItem('passmitra_token', data.token);
  return data;
}

export const sendOtp = sendPhoneOtp;
export const verifyOtp = verifyPhoneOtp;

export async function updateProfile(payload: {
  name?: string;
  image?: string;
  homeArea?: string;
  alertRadiusKm?: number;
  homeLocation?: { type: 'Point'; coordinates: [number, number] };
  acceptTerms?: boolean;
  language?: 'en' | 'gu';
  theme?: 'DARK' | 'LIGHT';
}): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update profile');
  return data.user || data;
}

export async function fetchAreas(): Promise<Area[]> {
  const res = await fetch(`${API_BASE}/areas`);
  if (!res.ok) throw new Error('Failed to fetch areas');
  const data = await res.json();
  return data.areas || data;
}

export async function fetchEvents(): Promise<GarbaEvent[]> {
  const res = await fetch(`${API_BASE}/events`);
  if (!res.ok) throw new Error('Failed to fetch events');
  const data = await res.json();
  return data.events || data;
}

export async function fetchListings(params?: {
  eventId?: string;
  night?: number | string;
  type?: string;
  maxDistanceKm?: number | string;
  userLat?: number;
  userLng?: number;
}): Promise<Listing[]> {
  const query = new URLSearchParams();
  if (params?.eventId) query.append('eventId', params.eventId);
  if (params?.night) query.append('night', String(params.night));
  if (params?.type) query.append('type', params.type);
  if (params?.maxDistanceKm) query.append('maxDistanceKm', String(params.maxDistanceKm));
  if (params?.userLat) query.append('userLat', String(params.userLat));
  if (params?.userLng) query.append('userLng', String(params.userLng));

  const res = await fetch(`${API_BASE}/listings?${query.toString()}`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error('Failed to fetch listings');
  const data = await res.json();
  return data.listings || data;
}

export async function fetchListing(id: string): Promise<Listing> {
  const res = await fetch(`${API_BASE}/listings/${id}`, { headers: getAuthHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch listing');
  return data.listing || data;
}

export async function createListing(payload: any): Promise<{ success: boolean; listing: Listing }> {
  const res = await fetch(`${API_BASE}/listings`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create listing');
  return data;
}

export async function closeListing(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/listings/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to close listing');
  return data;
}

export async function fetchWantedPosts(params?: { eventId?: string; night?: number | string }): Promise<WantedPost[]> {
  const query = new URLSearchParams();
  if (params?.eventId) query.append('eventId', params.eventId);
  if (params?.night) query.append('night', String(params.night));

  const res = await fetch(`${API_BASE}/wanted?${query.toString()}`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error('Failed to fetch wanted posts');
  const data = await res.json();
  return data.wantedPosts || data;
}

export async function createWantedPost(payload: any): Promise<{ success: boolean; wantedPost: WantedPost }> {
  const res = await fetch(`${API_BASE}/wanted`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create wanted post');
  return data;
}

export async function fetchRequests(): Promise<SwapRequest[]> {
  const res = await fetch(`${API_BASE}/requests`, { headers: getAuthHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch requests');
  const list = [...(data.received || []), ...(data.sent || [])];
  return list;
}

export async function sendSwapRequest(payload: {
  kind: 'REQUEST' | 'OFFER';
  listingId?: string;
  wantedPostId?: string;
  items: { type: string; quantity: number; pricePerPass: number }[];
  message?: string;
}): Promise<{ success: boolean; request: SwapRequest }> {
  const res = await fetch(`${API_BASE}/requests`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send request');
  return data;
}

export async function acceptRequest(id: string): Promise<{ success: boolean; connection: Connection }> {
  const res = await fetch(`${API_BASE}/requests/${id}/accept`, {
    method: 'POST',
    headers: getAuthHeader()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to accept request');
  return data;
}

export const acceptSwapRequest = acceptRequest;

export async function declineRequest(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/requests/${id}/decline`, {
    method: 'POST',
    headers: getAuthHeader()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to decline request');
  return data;
}

export const declineSwapRequest = declineRequest;

export async function cancelRequest(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/requests/${id}/cancel`, {
    method: 'POST',
    headers: getAuthHeader()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to cancel request');
  return data;
}

export async function fetchConnection(id: string): Promise<Connection> {
  const cleanId = id.replace(/^conn-/, '');
  const res = await fetch(`${API_BASE}/connections/${cleanId}`, { headers: getAuthHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch connection');
  return data.connection || data;
}

export async function completeConnection(id: string): Promise<Connection> {
  const res = await fetch(`${API_BASE}/connections/${id}/done`, {
    method: 'POST',
    headers: getAuthHeader()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to mark done');
  return data.connection || data;
}

export async function cancelConnection(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/connections/${id}/cancel`, {
    method: 'POST',
    headers: getAuthHeader()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to cancel connection');
  return data;
}

export async function submitRating(payload: {
  connectionId: string;
  toUserId: string;
  value: 'UP' | 'DOWN';
  tags: string[];
  comment?: string;
}): Promise<{ success: boolean; rating: Rating }> {
  const res = await fetch(`${API_BASE}/ratings`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit rating');
  return data;
}

export async function submitReport(payload: {
  targetType: 'LISTING' | 'WANTED' | 'USER' | 'CONNECTION';
  targetId: string;
  reason: string;
  details?: string;
  blockUser?: boolean;
}): Promise<{ success: boolean; report: Report }> {
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit report');
  return data;
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const res = await fetch(`${API_BASE}/notifications`, { headers: getAuthHeader() });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  const data = await res.json();
  return data.notifications || data;
}

export async function markNotificationRead(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'POST',
    headers: getAuthHeader()
  });
  return res.json();
}

export async function fetchReports(): Promise<Report[]> {
  const res = await fetch(`${API_BASE}/admin/reports`, { headers: getAuthHeader() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Admin access required');
  return data.reports || data;
}

export async function handleReportAction(id: string, action: 'DISMISS' | 'REMOVE_ITEM' | 'BAN_USER', note?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/reports/${id}/action`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ action, adminNote: note })
  });
  return res.json();
}

export async function banUser(userId: string, reason?: string): Promise<any> {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/ban`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify({ reason })
  });
  return res.json();
}
