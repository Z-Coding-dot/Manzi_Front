import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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
    images: [],
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

export const marketplaceApi = createApi({
  reducerPath: "marketplaceApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL ?? "/api/v1",
  }),
  endpoints: (builder) => ({
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

export const { useGetPublishedPropertiesQuery, useGetPublishedPropertyQuery } =
  marketplaceApi;
