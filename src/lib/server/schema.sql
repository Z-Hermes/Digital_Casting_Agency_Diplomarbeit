-- ============================================================================
--  HD STUDIOS - DATABASE SCHEMA  (structure only, no data)
--
--  Goes in the project at:  src/lib/server/schema.sql
--
--  * Does NOT create a database (on the school server you cannot). It creates
--    the tables INSIDE the database that is selected in DataGrip.
--  * Every table uses CREATE TABLE IF NOT EXISTS, so running this file again
--    never deletes anything. To wipe everything use db/reset.sql, and to fill
--    the demo data use db/seed.sql.
--  * Every table is InnoDB + utf8mb4, so Albanian letters (e, c with marks)
--    and emojis are stored correctly, even if the server default is latin1.
--  * Driver for the code: mysql2, with ? placeholders (not Postgres $1 syntax).
--
--  Order to run:   reset.sql (optional)  ->  schema.sql  ->  seed.sql
-- ============================================================================


-- ----------------------------------------------------------------------------
--  1. users  -  every person on the platform
--     username is used in the public profile URL:  /user/[username]
--     (allowed characters are checked in the register code: a-z 0-9 _ -)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(40)  NOT NULL,
  email         VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,           -- bcrypt hash, never the password
  name          VARCHAR(80)  NOT NULL,
  role          ENUM('admin','director','producer','actor','spectator')
                             NOT NULL DEFAULT 'spectator',
  blocked       TINYINT(1)   NOT NULL DEFAULT 0, -- 0 = normal, 1 = blocked by admin
  avatar_url    VARCHAR(500),
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email    (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  2. sessions  -  one row per login, the id is the value in the cookie
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id         VARCHAR(100) PRIMARY KEY,
  user_id    INT      NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_sessions_expires (expires_at)          -- for deleting old sessions
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  3. password_reset_tokens  -  for /reset-password and /reset-password/[token]
--     Store only the HASH (sha256 hex, 64 characters) of the token.
--     The raw token is only sent by email. A token is valid when
--     used_at IS NULL and expires_at is in the future.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT      NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at    DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reset_token_hash (token_hash),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  4. actor_profiles  -  extra data that only actors have
--     availability  (the ONE source of truth for the StatusBadge):
--       available -> "Available"  open for offers
--       booked    -> "Booked"     committed to a production
--       on_set    -> "On set"     shooting right now, hard to reach
--     The bookings table is NOT used to work out this status.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actor_profiles (
  user_id      INT PRIMARY KEY,
  birth_date   DATE,                              -- the age is calculated from this
  gender       ENUM('female','male','other'),
  height_cm    INT,
  weight_kg    INT,
  eye_color    VARCHAR(20),
  hair_color   VARCHAR(20),
  city         VARCHAR(80),
  education    VARCHAR(200),
  awards       TEXT,                              -- one award per line
  bio          TEXT,
  cv_url       VARCHAR(500),                      -- uploaded PDF
  availability ENUM('available','on_set','booked') NOT NULL DEFAULT 'available',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_actor_city         (city),
  KEY idx_actor_gender       (gender),
  KEY idx_actor_availability (availability)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  5. languages + actor_languages  -  for the language filter
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS languages (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(40) NOT NULL,
  UNIQUE KEY uq_languages_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS actor_languages (
  actor_id    INT NOT NULL,
  language_id INT NOT NULL,
  PRIMARY KEY (actor_id, language_id),            -- no duplicates possible
  FOREIGN KEY (actor_id)    REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  6. credits  -  the CV list on an actor's profile (any production, even
--     ones that are not on the platform). Different from the films table.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credits (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  actor_id   INT          NOT NULL,
  title      VARCHAR(150) NOT NULL,
  year       INT,
  role_name  VARCHAR(120),
  poster_url VARCHAR(500),
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  7. media  -  gallery photos (uploaded) and videos (YouTube link)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  type       ENUM('photo','video')          NOT NULL DEFAULT 'photo',
  url        VARCHAR(500) NOT NULL,
  size       ENUM('narrow','wide','large')  NOT NULL DEFAULT 'narrow',  -- size in the gallery
  sort_order INT          NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_media_user_sort (user_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  8. films + film_cast  -  the platform's own film pages
--     /films, /films/[id], /admin/films
--     published = 0 hides a film from the public pages (draft).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS films (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  year        INT,
  description TEXT,
  poster_url  VARCHAR(500),
  trailer_url VARCHAR(500),                       -- YouTube link
  published   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_films_published_year (published, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS film_cast (
  film_id   INT NOT NULL,
  actor_id  INT NOT NULL,
  role_name VARCHAR(120),
  PRIMARY KEY (film_id, actor_id),
  FOREIGN KEY (film_id)  REFERENCES films(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  9. jobs  -  job posts written by directors and producers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  created_by       INT          NOT NULL,
  title            VARCHAR(150) NOT NULL,
  production_type  ENUM('film','series','theatre','commercial') NOT NULL DEFAULT 'film',
  description      TEXT         NOT NULL,
  role_description TEXT,
  wanted_gender    ENUM('female','male','any') NOT NULL DEFAULT 'any',
  wanted_age_min   INT,
  wanted_age_max   INT,
  city             VARCHAR(80),
  deadline         DATE,
  status           ENUM('open','closed') NOT NULL DEFAULT 'open',
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  10. conversations  -  one row per pair of people who write to each other.
--      This is what  /messages/[conversationId]  refers to.
--      RULE: always store the smaller user id in user_one_id and the bigger
--      one in user_two_id, so a pair can only exist once:
--        user_one_id = LEAST(a, b),  user_two_id = GREATEST(a, b)
--      To send a message: find the conversation for the pair, create it if it
--      does not exist yet, then insert the message with its conversation_id.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_one_id INT      NOT NULL,
  user_two_id INT      NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_conversation_pair (user_one_id, user_two_id),
  FOREIGN KEY (user_one_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_two_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_conversation_user_two (user_two_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  11. messages  -  ONE table for chat, invitations and applications.
--      type says what kind of row it is:
--        'message'     normal chat message or reply    (status NULL, job_id NULL)
--        'invitation'  director/producer -> actor ("Express interest"),
--                      job_id optional
--        'application' actor -> job owner, job_id filled in
--      status is only used for invitation and application:
--        'pending' (waiting for an answer), 'accepted' or 'declined'
--      RULE: job_id is only filled for invitation/application, never for chat
--      messages. This is what makes the unique key below safe.
--      The unique key stops the same person sending the same invitation or
--      application for the same job twice. (MySQL treats NULL as different,
--      so chat messages and invitations without a job are not blocked; check
--      those in the code if needed.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id       INT NOT NULL,
  recipient_id    INT NOT NULL,
  job_id          INT,
  type            ENUM('message','invitation','application') NOT NULL DEFAULT 'message',
  subject         VARCHAR(150),                   -- optional, chat replies have none
  body            TEXT,                           -- optional
  status          ENUM('pending','accepted','declined'),
  read_at         DATETIME,                       -- NULL means the message is unread
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_messages_request (sender_id, recipient_id, job_id, type),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)       REFERENCES users(id)         ON DELETE CASCADE,
  FOREIGN KEY (recipient_id)    REFERENCES users(id)         ON DELETE CASCADE,
  FOREIGN KEY (job_id)          REFERENCES jobs(id)          ON DELETE SET NULL,
  KEY idx_messages_unread       (recipient_id, read_at),          -- unread counts
  KEY idx_messages_conversation (conversation_id, created_at),    -- chat history
  KEY idx_messages_type_status  (recipient_id, type, status)      -- invitations page
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  12. bookings  -  history of an actor being booked.
--      Only used for the "featured actors" ranking (most bookings).
--      It does NOT decide the availability badge (see actor_profiles).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  actor_id   INT NOT NULL,
  booked_by  INT,
  job_id     INT,
  start_date DATE,
  end_date   DATE,
  FOREIGN KEY (actor_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (booked_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (job_id)    REFERENCES jobs(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  13. news  -  articles written by admins  (/news, /admin/posts, /api/posts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  author_id  INT,
  title      VARCHAR(150) NOT NULL,
  excerpt    VARCHAR(300) NOT NULL,
  body       TEXT         NOT NULL,
  image_url  VARCHAR(500),
  category   ENUM('breaking','current') NOT NULL DEFAULT 'current',
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  KEY idx_news_category_date (category, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  14. contact_messages  -  the form on /contact  (/api/contact)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(80)  NOT NULL,
  email      VARCHAR(120) NOT NULL,
  subject    VARCHAR(150),
  body       TEXT         NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  15. For You section
--      user_activity   = what the website writes down (input for the algorithm)
--      recommendations = what the algorithm writes back (shown on the home page)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_activity (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  action     ENUM('search','view_actor','view_job') NOT NULL,
  detail     VARCHAR(255),                        -- the search text or the chosen filters
  target_id  INT,                                 -- id of the actor or job that was opened
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_activity_user_date (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recommendations (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT NOT NULL,
  item_type ENUM('actor','job','news') NOT NULL,
  item_id   INT NOT NULL,
  score     INT NOT NULL DEFAULT 0,               -- the highest score is shown first
  UNIQUE KEY uq_recommendation (user_id, item_type, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_recommendations_user_score (user_id, score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
