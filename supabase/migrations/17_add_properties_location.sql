-- Add lat/lng columns for map functionality in Landing Page and Dashboard Map

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS lat double precision,
ADD COLUMN IF NOT EXISTS lng double precision;
