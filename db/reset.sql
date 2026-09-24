-- ============================================================================
--  HD STUDIOS - RESET   (development only)
--
--  !!  THIS DELETES ALL TABLES AND ALL DATA IN THE SELECTED DATABASE  !!
--
--  Use it only while developing, when you want a clean start:
--     1. run reset.sql   2. run schema.sql   3. run seed.sql
--  Never run it on a database that has real users in it.
-- ============================================================================

-- Tables with foreign keys first, tables they point to last
DROP TABLE IF EXISTS recommendations;
DROP TABLE IF EXISTS user_activity;
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS news;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS film_cast;
DROP TABLE IF EXISTS films;
DROP TABLE IF EXISTS media;
DROP TABLE IF EXISTS credits;
DROP TABLE IF EXISTS actor_languages;
DROP TABLE IF EXISTS languages;
DROP TABLE IF EXISTS actor_profiles;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS users;