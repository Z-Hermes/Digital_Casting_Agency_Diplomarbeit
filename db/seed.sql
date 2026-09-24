-- ============================================================================
--  HD STUDIOS - DEMO DATA
--
--  Goes in the project at:  db/seed.sql   (outside src/, it is not app code)
--
--  Run it AFTER schema.sql, on EMPTY tables. It has no DROP or DELETE, so if
--  you run it twice it stops with a "duplicate" error instead of erasing
--  anything. For a clean start run reset.sql -> schema.sql -> seed.sql.
--  The images belong in the website folder under  static/media/seed/
--
--  Login: admin@hdstudios.test      Password (all accounts): hdstudios123
--  Public profile URLs use the username, e.g.  /user/brad-pitt
-- ============================================================================

INSERT INTO languages (id, name) VALUES
  (1,'Albanian'),(2,'English'),(3,'German'),(4,'Italian'),(5,'French'),
  (6,'Spanish'),(7,'Greek'),(8,'Turkish'),(9,'Serbian'),(10,'Macedonian');

-- ids 1-10 actors, 11 admin, 12-15 directors/producer, 16 spectator
INSERT INTO users (id, username, email, password_hash, name, role, avatar_url) VALUES
  (1, 'brad-pitt', 'brad@hdstudios.test', '$2b$10$6IE2yhgZWlkkhUJXQHGKxunMPyDTyalx/LyeuLDQm2CFNLK3ciTS2', 'Brad Pitt', 'actor','/media/seed/brad-pitt.jpg'),
  (2, 'jake-gyllenhaal', 'jake@hdstudios.test', '$2b$10$6IE2yhgZWlkkhUJXQHGKxunMPyDTyalx/LyeuLDQm2CFNLK3ciTS2', 'Jake Gyllenhaal', 'actor','/media/seed/jake-gyllenhaal.jpg'),
  (3, 'tom-hanks', 'tom@hdstudios.test', '$2b$10$6IE2yhgZWlkkhUJXQHGKxunMPyDTyalx/LyeuLDQm2CFNLK3ciTS2', 'Tom Hanks', 'actor','/media/seed/tom-hanks.jpg'),
  (4, 'hugh-jackman', 'hugh@hdstudios.test', '$2b$10$6IE2yhgZWlkkhUJXQHGKxunMPyDTyalx/LyeuLDQm2CFNLK3ciTS2', 'Hugh Jackman', 'actor','/media/seed/hugh-jackman.jpg'),
  (5, 'scarlett-johansson', 'scarlett@hdstudios.test', '$2b$10$6IE2yhgZWlkkhUJXQHGKxunMPyDTyalx/LyeuLDQm2CFNLK3ciTS2', 'Scarlett Johansson', 'actor','/media/seed/scarlett-johansson.jpg'),
  (6, 'jennifer-aniston', 'jennifer@hdstudios.test', '$2b$10$6IE2yhgZWlkkhUJXQHGKxunMPyDTyalx/LyeuLDQm2CFNLK3ciTS2', 'Jennifer Aniston', 'actor','/media/seed/jennifer-aniston.jpg'),
  (7, 'anthony-mackie', 'anthony@hdstudios.test', '$2b$10$6IE2yhgZWlkkhUJXQHGKxunMPyDTyalx/LyeuLDQm2CFNLK3ciTS2', 'Anthony Mackie', 'actor','/media/seed/anthony-mackie.jpg'),
  (8, 'salma-hayek', 'salma@hdstudios.test', '$2b$10$6IE2yhgZWlkkhUJXQHGKxunMPyDTyalx/LyeuLDQm2CFNLK3ciTS2', 'Salma Hayek', 'actor','/media/seed/salma-hayek.jpg'),
  (9, 'ana-de-armas', 'ana@hdstudios.test', '$2b$10$6IE2yhgZWlkkhUJXQHGKxunMPyDTyalx/LyeuLDQm2CFNLK3ciTS2', 'Ana de Armas', 'actor','/media/seed/ana-de-armas.jpg'),
  (10, 'kevin-hart', 'kevin@hdstudios.test', '$2b$10$6IE2yhgZWlkkhUJXQHGKxunMPyDTyalx/LyeuLDQm2CFNLK3ciTS2', 'Kevin Hart', 'actor','/media/seed/kevin-hart.jpg'),
  (11, 'admin', 'admin@hdstudios.test', '$2b$10$6IE2yhgZWlkkhUJXQHGKxunMPyDTyalx/LyeuLDQm2CFNLK3ciTS2', 'HD Studios Admin', 'admin','/media/seed/logo.png'),
  (12, 'steven-spielberg', 'spielberg@hdstudios.test', '$2b$10$6IE2yhgZWlkkhUJXQHGKxunMPyDTyalx/LyeuLDQm2CFNLK3ciTS2', 'Steven Spielberg', 'director',NULL),
  (13, 'martin-scorsese', 'scorsese@hdstudios.test', '$2b$10$6IE2yhgZWlkkhUJXQHGKxunMPyDTyalx/LyeuLDQm2CFNLK3ciTS2', 'Martin Scorsese', 'director',NULL),
  (14, 'christopher-nolan', 'nolan@hdstudios.test', '$2b$10$6IE2yhgZWlkkhUJXQHGKxunMPyDTyalx/LyeuLDQm2CFNLK3ciTS2', 'Christopher Nolan', 'director',NULL),
  (15, 'stanley-kubrick', 'kubrick@hdstudios.test', '$2b$10$6IE2yhgZWlkkhUJXQHGKxunMPyDTyalx/LyeuLDQm2CFNLK3ciTS2', 'Stanley Kubrick', 'producer',NULL),
  (16, 'film-fan', 'fan@hdstudios.test', '$2b$10$6IE2yhgZWlkkhUJXQHGKxunMPyDTyalx/LyeuLDQm2CFNLK3ciTS2', 'Film Fan', 'spectator',NULL);

INSERT INTO actor_profiles
  (user_id, birth_date, gender, height_cm, weight_kg, eye_color, hair_color, city, education, awards, bio, availability) VALUES
  (1, '1963-12-18','male',  180,78,  'Blue', 'Blonde',    'Tirana', NULL, NULL,
      'Weight varies depending on film role preparation. Naturally dark blonde to light brown hair; often changes style and color for roles.','available'),
  (2, '1980-12-19','male',  183,78,  'Blue', 'Dark Brown','Tirana',
      'Attended Columbia University (did not graduate)',
      'British Academy Film Awards - Best Supporting Actor (Brokeback Mountain, winner)\nAcademy Awards - Best Supporting Actor (Brokeback Mountain, nominee)\nGolden Globe Awards - Multiple nominations',
      'Weight varies depending on role preparation.','available'),
  (3, '1956-07-09','male',  183,NULL,'Green','Grey',      'Shkoder',NULL,NULL,NULL,'booked'),
  (4, '1968-10-12','male',  188,NULL,'Blue', 'Brown',     'Tirana', NULL,NULL,NULL,'available'),
  (5, '1984-11-22','female',160,NULL,'Green','Blonde',    'Tirana', NULL,NULL,NULL,'available'),
  (6, '1969-02-11','female',164,NULL,'Blue', 'Blonde',    'Durres', NULL,NULL,NULL,'available'),
  (7, '1978-09-23','male',  178,NULL,'Brown','Black',     'Tirana', NULL,NULL,NULL,'booked'),
  (8, '1966-09-02','female',157,NULL,'Brown','Black',     'Vlore',  NULL,NULL,NULL,'booked'),
  (9, '1988-04-30','female',168,NULL,'Hazel','Brown',     'Shkoder',NULL,NULL,NULL,'available'),
  (10,'1979-07-06','male',  157,NULL,'Brown','Black',     'Tirana', NULL,NULL,NULL,'on_set');

INSERT INTO actor_languages (actor_id, language_id) VALUES
  (1,2),(1,5), (2,2),(2,6), (3,2), (4,2), (5,2),(5,5),
  (6,2), (7,2), (8,6),(8,2), (9,6),(9,2), (10,2);

INSERT INTO credits (actor_id, title, year, role_name, poster_url) VALUES
  (1,'Fight Club',1999,'Tyler Durden','/media/seed/poster-fight-club.jpg'),
  (1,'Se7en',1995,'Detective David Mills','/media/seed/poster-se7en.jpg'),
  (1,'Once Upon a Time in Hollywood',2019,'Cliff Booth','/media/seed/poster-once-upon-a-time.jpg'),
  (1,'Inglourious Basterds',2009,'Lt. Aldo Raine','/media/seed/poster-inglourious-basterds.jpg'),
  (1,'The Curious Case of Benjamin Button',2008,'Benjamin Button','/media/seed/poster-benjamin-button.jpg'),
  (1,'Moneyball',2011,'Billy Beane','/media/seed/poster-moneyball.jpg'),
  (1,'Troy',2004,'Achilles',NULL),
  (1,'World War Z',2013,'Gerry Lane',NULL),
  (1,'Bullet Train',2022,'Ladybug',NULL),
  (2,'Prisoners',2013,'Detective Loki','/media/seed/poster-prisoners.jpg'),
  (2,'Nightcrawler',2014,'Louis Bloom','/media/seed/poster-nightcrawler.jpg'),
  (2,'Brokeback Mountain',2005,'Jack Twist','/media/seed/poster-brokeback-mountain.jpg'),
  (2,'Zodiac',2007,'Robert Graysmith','/media/seed/poster-zodiac.jpg'),
  (2,'Southpaw',2015,'Billy Hope','/media/seed/poster-southpaw.jpg'),
  (2,'Source Code',2011,'Captain Colter Stevens','/media/seed/poster-source-code.jpg'),
  (2,'Donnie Darko',2001,'Donnie Darko',NULL),
  (2,'End of Watch',2012,'Officer Brian Taylor',NULL),
  (3,'Forrest Gump',1994,'Forrest Gump',NULL),
  (3,'Saving Private Ryan',1998,'Captain John H. Miller',NULL),
  (3,'Cast Away',2000,'Chuck Noland',NULL),
  (4,'X-Men',2000,'Logan / Wolverine',NULL),
  (4,'The Prestige',2006,'Robert Angier',NULL),
  (4,'The Greatest Showman',2017,'P. T. Barnum',NULL),
  (5,'Lost in Translation',2003,'Charlotte',NULL),
  (5,'Lucy',2014,'Lucy',NULL),
  (5,'Marriage Story',2019,'Nicole Barber',NULL),
  (6,'Friends',1994,'Rachel Green',NULL),
  (6,'Horrible Bosses',2011,'Dr. Julia Harris',NULL),
  (6,'The Morning Show',2019,'Alex Levy',NULL),
  (7,'The Hurt Locker',2008,'Sgt. J. T. Sanborn',NULL),
  (7,'Captain America: The Winter Soldier',2014,'Sam Wilson / Falcon',NULL),
  (7,'Altered Carbon',2020,'Takeshi Kovacs',NULL),
  (8,'Desperado',1995,'Carolina',NULL),
  (8,'Frida',2002,'Frida Kahlo',NULL),
  (8,'House of Gucci',2021,'Giuseppina Auriemma',NULL),
  (9,'Blade Runner 2049',2017,'Joi',NULL),
  (9,'Knives Out',2019,'Marta Cabrera',NULL),
  (9,'No Time to Die',2021,'Paloma',NULL),
  (10,'Ride Along',2014,'Ben Barber',NULL),
  (10,'Central Intelligence',2016,'Calvin Joyner',NULL),
  (10,'Jumanji: Welcome to the Jungle',2017,'Franklin Finbar',NULL);

-- Note: \n inside a text means a new line (used in the long message texts)

-- gallery of Jake Gyllenhaal
INSERT INTO media (user_id, type, url, size, sort_order) VALUES
  (2,'photo','/media/seed/jake-gallery-1.jpg','narrow',1),
  (2,'photo','/media/seed/jake-gallery-2.jpg','wide',2),
  (2,'photo','/media/seed/jake-gallery-3.jpg','narrow',3),
  (2,'photo','/media/seed/jake-gyllenhaal.jpg','large',4),
  (2,'photo','/media/seed/jake-gallery-5.jpg','wide',5),
  (2,'photo','/media/seed/jake-gallery-6.jpg','narrow',6),
  (2,'photo','/media/seed/jake-gallery-7.jpg','narrow',7),
  (2,'photo','/media/seed/jake-gallery-8.jpg','wide',8),
  (2,'photo','/media/seed/jake-gallery-9.jpg','narrow',9),
  (2,'photo','/media/seed/jake-gallery-10.jpg','narrow',10),
  (2,'photo','/media/seed/jake-gallery-4.jpg','wide',11);

INSERT INTO jobs (id, created_by, title, production_type, description, role_description,
                  wanted_gender, wanted_age_min, wanted_age_max, city, deadline, status, created_at) VALUES
  (1,12,'Supporting role - historical drama','film',
     'A feature film about a family in northern Albania in the 1930s. Shooting takes place in and around Shkoder in spring 2027.',
     'Male, 35-55, calm presence, comfortable on horseback. Albanian required.',
     'male',35,55,'Shkoder','2026-10-15','open','2026-09-08 10:00:00'),
  (2,13,'Lead role - crime series','series',
     'Six-part crime series set in the port of Durres. Shooting from January to April 2027.',
     'Any gender, 25-40, strong dramatic range.',
     'any',25,40,'Durres','2026-11-01','open','2026-09-11 09:30:00'),
  (3,14,'Supporting role - thriller','film',
     'Independent thriller shot at night in Tirana. Small crew, four weeks of shooting.',
     'Female, 20-35, English and Albanian, comfortable with night shoots.',
     'female',20,35,'Tirana','2026-10-01','open','2026-09-14 16:20:00'),
  (4,15,'Theatre ensemble - autumn season','theatre',
     'Ensemble for the autumn season of a city theatre. Rehearsals start in October.',
     'Any gender, 18-60, stage experience required.',
     'any',18,60,'Tirana','2026-09-10','closed','2026-08-20 11:00:00');

-- conversations: one per pair of people. user_one_id is always the smaller id.
INSERT INTO conversations (id, user_one_id, user_two_id) VALUES
  (1,  1, 12),   -- Brad Pitt      - Steven Spielberg
  (2,  1, 13),   -- Brad Pitt      - Martin Scorsese
  (3,  1, 15),   -- Brad Pitt      - Stanley Kubrick
  (4,  2, 12),   -- Jake Gyllenhaal- Steven Spielberg
  (5,  2, 13),   -- Jake Gyllenhaal- Martin Scorsese
  (6,  9, 14),   -- Ana de Armas   - Christopher Nolan
  (7, 10, 13),   -- Kevin Hart     - Martin Scorsese
  (8,  1, 14);   -- Brad Pitt      - Christopher Nolan

-- messages
--   type 'invitation'  = director/producer -> actor
--   type 'application' = actor -> job owner (job_id filled in)
--   type 'message'     = normal chat message (status NULL, job_id NULL)
-- Note: \n inside a text means a new line
INSERT INTO messages (conversation_id, sender_id, recipient_id, job_id, type, subject, body, status, read_at, created_at) VALUES
  -- invitations (director -> actor)
  (1,12,1,1,'invitation','Casting interest: Brad Pitt',
     'Hello Mr. Pitt,\n\nI have long admired your work, and I believe you would be a fantastic fit for my upcoming film. I would love the opportunity to discuss the project with you.\n\nBest regards,\nSteven Spielberg',
     'pending',NULL,'2026-09-09 12:34:00'),
  (2,13,1,NULL,'invitation','Casting interest: Brad Pitt',
     'Hello Mr. Pitt,\n\nI would like to talk to you about a role in my next production.\n\nBest regards,\nMartin Scorsese',
     'accepted','2026-03-15 08:00:00','2026-03-14 17:12:00'),
  (3,15,1,4,'invitation','Casting interest: Brad Pitt',
     'Hello Mr. Pitt,\n\nWe are putting together the ensemble for the autumn season.\n\nBest regards,\nStanley Kubrick',
     'declined','2026-08-26 09:00:00','2026-08-25 08:55:00'),
  (4,12,2,1,'invitation','Casting interest: Jake Gyllenhaal',
     'Hello Mr. Gyllenhaal,\n\nWe are casting a historical drama that shoots in Shkoder next spring. Could we set up a call?\n\nBest regards,\nSteven Spielberg',
     'pending',NULL,'2026-09-12 10:15:00'),
  -- applications (actor -> job owner)
  (5,2,13,2,'application','Application: Lead role - crime series',
     'Hello, I am very interested in this role. I have worked on two series before and I am free from January.',
     'pending',NULL,'2026-09-12 18:05:00'),
  (6,9,14,3,'application','Application: Supporting role - thriller',
     NULL,'pending',NULL,'2026-09-15 08:40:00'),
  (7,10,13,2,'application','Application: Lead role - crime series',
     'I would like to be considered for a supporting part in this series.',
     'declined','2026-09-14 10:00:00','2026-09-13 12:00:00'),
  -- normal chat messages
  (8,14,1,NULL,'message','Script pages',
     'Hello Mr. Pitt,\n\nThank you for the call last week. I will send the first script pages as soon as the draft is final.\n\nBest regards,\nChristopher Nolan',
     NULL,NULL,'2025-11-30 21:05:00'),
  (2,1,13,NULL,'message',NULL,
     'Thank you for the message. I am interested and available from spring.\n\nBrad',
     NULL,'2026-03-15 09:00:00','2026-03-14 19:40:00');

INSERT INTO bookings (actor_id, booked_by, job_id, start_date, end_date) VALUES
  (3,12,NULL,'2026-09-01','2026-12-15'),
  (3,13,NULL,'2025-03-01','2025-06-30'),
  (3,14,NULL,'2024-05-01','2024-08-30'),
  (3,15,NULL,'2023-09-01','2023-11-30'),
  (4,13,NULL,'2026-01-10','2026-04-20'),
  (4,14,NULL,'2025-02-01','2025-05-01'),
  (4,12,NULL,'2024-01-15','2024-03-30'),
  (5,14,NULL,'2026-02-01','2026-05-30'),
  (5,12,NULL,'2024-09-01','2024-11-30'),
  (6,13,NULL,'2025-05-01','2025-09-30'),
  (6,15,NULL,'2024-02-01','2024-04-15'),
  (7,12,NULL,'2026-08-15','2026-11-30'),
  (8,15,4,   '2026-10-01','2026-12-20');

-- films shown on /films (the poster files are the same ones the credits use)
-- trailer_url is empty on purpose: paste a real YouTube link in /admin/films
INSERT INTO films (id, title, year, description, poster_url, trailer_url, published) VALUES
  (1,'Fight Club',1999,
     'An insomniac office worker and a charismatic soap salesman start an underground fight club that grows into something much bigger than either of them planned.',
     '/media/seed/poster-fight-club.jpg',NULL,1),
  (2,'Se7en',1995,
     'Two detectives, one close to retirement and one new to the city, hunt a killer whose crimes follow the seven deadly sins.',
     '/media/seed/poster-se7en.jpg',NULL,1),
  (3,'Prisoners',2013,
     'When two young girls disappear, a desperate father and a determined detective search for them in very different ways.',
     '/media/seed/poster-prisoners.jpg',NULL,1),
  (4,'Nightcrawler',2014,
     'A driven freelancer discovers crime journalism in Los Angeles and pushes further and further for the next shocking shot.',
     '/media/seed/poster-nightcrawler.jpg',NULL,1),
  (5,'Once Upon a Time in Hollywood',2019,
     'In 1969 Los Angeles, a fading TV actor and his stunt double try to keep their place in a changing film industry.',
     '/media/seed/poster-once-upon-a-time.jpg',NULL,1),
  (6,'Brokeback Mountain',2005,
     'Two young men working as sheep herders form a bond that shapes their lives over the next twenty years.',
     '/media/seed/poster-brokeback-mountain.jpg',NULL,1);

INSERT INTO film_cast (film_id, actor_id, role_name) VALUES
  (1,1,'Tyler Durden'),
  (2,1,'Detective David Mills'),
  (3,2,'Detective Loki'),
  (3,4,'Keller Dover'),
  (4,2,'Louis Bloom'),
  (5,1,'Cliff Booth'),
  (6,2,'Jack Twist');

INSERT INTO news (author_id, title, excerpt, body, image_url, category, created_at) VALUES
  (11,'TIFF 2026 Returns to Tirana',
     'The Tirana International Film Festival returns this September, bringing a new selection of international and Albanian films to the capital.',
     'The Tirana International Film Festival returns this September, bringing a new selection of international and Albanian films to the capital.\n\nScreenings run across several venues in the city center, with competition programs for feature films, short films and documentaries. Filmmakers and actors will join audiences for talks after selected screenings.',
     '/media/seed/news-tiff.png','breaking','2026-09-15 09:00:00'),
  (11,'Balkan Theatre Takes the Stage',
     'A new regional theatre festival brings Albanian and Balkan performers together for a week of new productions.',
     'A new regional theatre festival brings Albanian and Balkan performers together for a week of new productions.\n\nEnsembles from across the region present contemporary plays and reworked classics. Workshops for young actors take place every morning.',
     '/media/seed/news-balkan-theatre.jpg','current','2026-09-10 14:30:00'),
  (11,'DEA Open Air Celebrates International Cinema',
     'The open-air festival turns summer evenings into a meeting point for film lovers from around the world.',
     'The open-air festival turns summer evenings into a meeting point for film lovers from around the world.\n\nThis year the programme mixes international premieres with Albanian productions.',
     '/media/seed/news-dea-open-air.jpg','current','2026-08-02 19:00:00');

-- user_activity, recommendations, password_reset_tokens and contact_messages
-- stay empty at the start.