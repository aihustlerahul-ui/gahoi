-- New profiles receive a 6-digit public profile_id (100000+)
SELECT setval(
  pg_get_serial_sequence('profiles', 'profile_id'),
  GREATEST(100000, COALESCE((SELECT MAX(profile_id) FROM profiles), 0)),
  true
);
