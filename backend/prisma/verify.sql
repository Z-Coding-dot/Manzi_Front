-- Verification-only SQL mirroring prisma/schema.prisma.
-- Not used by the app at runtime — `prisma migrate dev` generates the real
-- migration once run on a machine with normal internet access. This file
-- exists purely so the schema's relational design could be tested against
-- a real Postgres instance in this sandbox.

CREATE TYPE "UserRole" AS ENUM ('customer','property_owner','property_manager','receptionist','property_staff','verification_agent','support_agent','finance_agent','content_manager','admin','super_admin');
CREATE TYPE "UserStatus" AS ENUM ('active','suspended','pending_verification');
CREATE TYPE "Language" AS ENUM ('en','fa_AF','ps_AF');
CREATE TYPE "Currency" AS ENUM ('AFN','USD');
CREATE TYPE "AccommodationType" AS ENUM ('hotel','hostel','dormitory','guesthouse','room','apartment');
CREATE TYPE "VerificationStatus" AS ENUM ('draft','submitted','under_review','changes_requested','approved','rejected','suspended');
CREATE TYPE "PropertyStaffRole" AS ENUM ('property_manager','receptionist','property_staff');
CREATE TYPE "StaffStatus" AS ENUM ('active','suspended');
CREATE TYPE "RoomStatus" AS ENUM ('available','occupied','reserved','dirty','cleaning','maintenance','out_of_service');
CREATE TYPE "BedGender" AS ENUM ('male','female','any');
CREATE TYPE "BedStatus" AS ENUM ('available','occupied','reserved','maintenance');
CREATE TYPE "ReservationStatus" AS ENUM ('draft','pending','payment_pending','confirmed','checked_in','checked_out','cancelled','expired','no_show','refunded','failed');
CREATE TYPE "ReservationSource" AS ENUM ('walk_in','phone','marketplace');
CREATE TYPE "GuestIdType" AS ENUM ('tazkira','passport','other');
CREATE TYPE "PaymentMethod" AS ENUM ('cash','hesabpay','afpay');
CREATE TYPE "PaymentStatus" AS ENUM ('pending','authorized','paid','failed','refunded','partially_refunded');
CREATE TYPE "PayoutStatus" AS ENUM ('pending','processing','paid','failed');
CREATE TYPE "ReviewStatus" AS ENUM ('pending','published','hidden','flagged');
CREATE TYPE "DocumentStatus" AS ENUM ('pending','approved','rejected');
CREATE TYPE "TicketCategory" AS ENUM ('reservation_issue','payment_issue','refund_issue','property_issue','guest_issue','fraud_report','other');
CREATE TYPE "TicketPriority" AS ENUM ('low','medium','high');
CREATE TYPE "TicketStatus" AS ENUM ('open','investigating','waiting','resolved','closed');
CREATE TYPE "SyncOperationType" AS ENUM ('create','update','delete');
CREATE TYPE "SyncStatus" AS ENUM ('pending','syncing','synced','failed','conflict');

CREATE TABLE "users" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role "UserRole" NOT NULL,
  language "Language" NOT NULL DEFAULT 'en',
  currency "Currency" NOT NULL DEFAULT 'AFN',
  status "UserStatus" NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "users" (role);

CREATE TABLE "refresh_tokens" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  device_label TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  replaced_by_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "refresh_tokens" (user_id);

CREATE TABLE "properties" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES "users"(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type "AccommodationType" NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  district TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT,
  email TEXT,
  check_in_time TEXT,
  check_out_time TEXT,
  languages_spoken "Language"[] NOT NULL DEFAULT '{}',
  payment_methods "PaymentMethod"[] NOT NULL DEFAULT '{}',
  policies TEXT,
  verification_status "VerificationStatus" NOT NULL DEFAULT 'draft',
  published BOOLEAN NOT NULL DEFAULT false,
  rating DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "properties" (type);
CREATE INDEX ON "properties" (district);
CREATE INDEX ON "properties" (verification_status);

CREATE TABLE "property_staff" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES "properties"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "users"(id),
  role "PropertyStaffRole" NOT NULL,
  status "StaffStatus" NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, user_id)
);

CREATE TABLE "property_documents" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES "properties"(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file TEXT NOT NULL,
  status "DocumentStatus" NOT NULL DEFAULT 'pending',
  reviewed_by_id UUID REFERENCES "users"(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "rooms" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES "properties"(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL,
  capacity INT NOT NULL,
  status "RoomStatus" NOT NULL DEFAULT 'available',
  base_price INT NOT NULL,
  UNIQUE (property_id, room_number)
);
CREATE INDEX ON "rooms" (property_id, status);

CREATE TABLE "beds" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES "rooms"(id) ON DELETE CASCADE,
  bed_number TEXT NOT NULL,
  gender "BedGender" NOT NULL DEFAULT 'any',
  status "BedStatus" NOT NULL DEFAULT 'available',
  price INT NOT NULL,
  UNIQUE (room_id, bed_number)
);

CREATE TABLE "amenities" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT
);

CREATE TABLE "property_amenities" (
  property_id UUID NOT NULL REFERENCES "properties"(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES "amenities"(id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, amenity_id)
);

CREATE TABLE "room_amenities" (
  room_id UUID NOT NULL REFERENCES "rooms"(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES "amenities"(id) ON DELETE CASCADE,
  PRIMARY KEY (room_id, amenity_id)
);

CREATE TABLE "guests" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES "users"(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  nationality TEXT,
  id_type "GuestIdType",
  id_number_encrypted TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "reservations" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES "properties"(id),
  customer_id UUID REFERENCES "users"(id),
  room_id UUID REFERENCES "rooms"(id),
  bed_id UUID REFERENCES "beds"(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests_count INT NOT NULL,
  status "ReservationStatus" NOT NULL DEFAULT 'draft',
  source "ReservationSource" NOT NULL,
  subtotal INT NOT NULL,
  tax INT NOT NULL DEFAULT 0,
  discount INT NOT NULL DEFAULT 0,
  service_fee INT NOT NULL DEFAULT 0,
  total INT NOT NULL,
  currency "Currency" NOT NULL DEFAULT 'AFN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (check_out > check_in)
);
CREATE INDEX ON "reservations" (property_id, status);
CREATE INDEX ON "reservations" (room_id, check_in, check_out);
CREATE INDEX ON "reservations" (bed_id, check_in, check_out);
CREATE INDEX ON "reservations" (customer_id);

CREATE TABLE "reservation_guests" (
  reservation_id UUID NOT NULL REFERENCES "reservations"(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES "guests"(id),
  PRIMARY KEY (reservation_id, guest_id)
);

CREATE TABLE "payments" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES "reservations"(id),
  property_id UUID NOT NULL REFERENCES "properties"(id),
  customer_id UUID,
  amount INT NOT NULL,
  currency "Currency" NOT NULL DEFAULT 'AFN',
  method "PaymentMethod" NOT NULL,
  status "PaymentStatus" NOT NULL DEFAULT 'pending',
  provider_reference TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "payments" (reservation_id);
CREATE INDEX ON "payments" (property_id, status);

CREATE TABLE "payouts" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES "properties"(id),
  amount INT NOT NULL,
  currency "Currency" NOT NULL DEFAULT 'AFN',
  status "PayoutStatus" NOT NULL DEFAULT 'pending',
  provider_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "payouts" (property_id);

CREATE TABLE "reviews" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID UNIQUE NOT NULL REFERENCES "reservations"(id),
  customer_id UUID NOT NULL REFERENCES "users"(id),
  property_id UUID NOT NULL REFERENCES "properties"(id),
  overall_rating INT NOT NULL,
  cleanliness INT,
  location INT,
  staff_rating INT,
  value INT,
  facilities INT,
  comment TEXT,
  photos TEXT[] NOT NULL DEFAULT '{}',
  status "ReviewStatus" NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (overall_rating BETWEEN 1 AND 5)
);
CREATE INDEX ON "reviews" (property_id, status);

CREATE TABLE "notifications" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "notifications" (user_id, read_at);

CREATE TABLE "support_tickets" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "users"(id),
  reservation_id UUID REFERENCES "reservations"(id),
  category "TicketCategory" NOT NULL,
  priority "TicketPriority" NOT NULL DEFAULT 'medium',
  status "TicketStatus" NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "support_tickets" (status);

CREATE TABLE "audit_logs" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES "users"(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON "audit_logs" (entity_type, entity_id);

CREATE TABLE "sync_operations" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  operation_type "SyncOperationType" NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  version INT NOT NULL,
  status "SyncStatus" NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ
);
CREATE INDEX ON "sync_operations" (device_id, status);
