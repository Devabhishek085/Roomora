-- Migration: Add flat_images column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS flat_images TEXT[] DEFAULT ARRAY[]::TEXT[];
