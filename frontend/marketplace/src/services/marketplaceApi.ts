import { sessionStorageForAuth } from '@/api/session';
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { refreshSession } from '@/api/httpClient';

import type { Property } from "@/data/mock/properties";

interface BackendProperty {
  id: string;
  slug: string;
  name: string;
  type: Property["type"];
  description: string | null;
  address: string;
  district: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  policies: string | null;
  rating: number;
  photos: string[];
  rooms: {
    id: string;
    roomType: string;
    capacity: number;
    basePrice: number;
  }[];
  amenities: { amenity: { name: string } }[];
  _count: { reviews: number };
  reviews?: {
    id: string;
    customer: { name: string };
    overallRating: number;
    comment: string | null;
    createdAt: string;
  }[];
}

export interface MarketplaceProperty extends Property {
  reviews: NonNullable<BackendProperty["reviews"]>;
}
export interface ServerBooking {
  id: string; checkIn: string; checkOut: string; guestsCount: number; total: number; currency: 'AFN' | 'USD'; status: string;
  property: { name: string; slug: string }; room: { roomType: string } | null;
}

function mapProperty(property: BackendProperty): MarketplaceProperty {
  return {
    id: property.id,
    slug: property.slug,
    name: property.name,
    type: property.type,
    area: property.district,
    address: property.address,
    description: property.description ?? "",
    rating: property.rating,
    reviewsCount: property._count.reviews,
    fromPrice: property.rooms[0]?.basePrice ?? 0,
    currency: "AFN",
    verified: true,
    amenities: property.amenities.map(({ amenity }) => amenity.name),
    images: property.photos ?? [],
    checkInTime: property.checkInTime ?? "14:00",
    checkOutTime: property.checkOutTime ?? "12:00",
    policies: property.policies ?? "",
    latitude: property.latitude,
    longitude: property.longitude,
    rooms: property.rooms.map((room) => ({
      id: room.id,
      name: room.roomType,
      capacity: room.capacity,
      price: room.basePrice,
      amenities: [],
    })),
    reviews: property.reviews ?? [],
  };
}

const rawQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL ?? "/api/v1",
    prepareHeaders: headers => { const token = sessionStorageForAuth().getItem('manzil_access_token'); if (token) headers.set('Authorization', `Bearer ${token}`); return headers; },
  });
const authenticatedQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, options) => {
  const token = sessionStorageForAuth().getItem('manzil_access_token');
  let result = await rawQuery(args, api, options);
  if (result.error?.status === 401 && sessionStorageForAuth().getItem('manzil_refresh_token')) {
    try { if (token === sessionStorageForAuth().getItem('manzil_access_token')) await refreshSession(); result = await rawQuery(args, api, options); } catch { return result; }
  }
  return result;
};
export const marketplaceApi = createApi({
  reducerPath: "marketplaceApi",
  baseQuery: authenticatedQuery,
  tagTypes: ['Bookings'],
  endpoints: (builder) => ({
    getCmsPage: builder.query<{ title: string; body: string; seoTitle?: string; seoDescription?: string }, { slug: string; locale: string }>({ query: ({ slug, locale }) => ({ url: `/cms/pages/${encodeURIComponent(slug)}`, params: { locale: locale.replace('-', '_') } }) }),
    getCmsBanners: builder.query<{ id: string; title: string; body: string; image?: string; link?: string }[], string>({ query: locale => ({ url: '/cms/banners', params: { locale: locale.replace('-', '_') } }) }),
    getBookings: builder.query<ServerBooking[], void>({ query: () => '/reservations', providesTags: ['Bookings'] }),
    createBooking: builder.mutation<ServerBooking, { propertyId: string; roomId: string; checkIn: string; checkOut: string; guestsCount: number; guestName: string; guestPhone: string; source: 'marketplace' }>({ query: body => ({ url: '/reservations', method: 'POST', body }), invalidatesTags: ['Bookings'] }),
    cancelBooking: builder.mutation<ServerBooking, string>({ query: id => ({ url: `/reservations/${id}/cancel`, method: 'POST' }), invalidatesTags: ['Bookings'] }),
    getPublishedProperties: builder.query<MarketplaceProperty[], void>({
      query: () => "/marketplace/properties",
      transformResponse: (response: BackendProperty[]) =>
        response.map(mapProperty),
    }),
    getPublishedProperty: builder.query<MarketplaceProperty, string>({
      query: (slug) => `/marketplace/properties/${encodeURIComponent(slug)}`,
      transformResponse: (response: BackendProperty) => mapProperty(response),
    }),
  }),
});

export const { useGetPublishedPropertiesQuery, useGetPublishedPropertyQuery, useGetBookingsQuery, useCreateBookingMutation, useCancelBookingMutation, useGetCmsPageQuery, useGetCmsBannersQuery } =
  marketplaceApi;
