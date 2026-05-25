-- Seed: FIFA World Cup 2026 fixture (fase de grupos)
-- Sede: USA, México, Canadá | Inicio: 11 Junio 2026
-- Los partidos se insertan en UTC-5 (hora este USA aprox)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.matches WHERE stage = 'group') THEN
    RAISE NOTICE 'Fixture ya cargado, saltando seed.';
    RETURN;
  END IF;

  INSERT INTO public.matches (home_team, away_team, home_team_code, away_team_code, scheduled_at, stage, group_label, venue) VALUES

  -- GRUPO A
  ('México', 'Polonia',       'MEX', 'POL', '2026-06-11 18:00:00-05', 'group', 'A', 'Estadio Azteca, Ciudad de México'),
  ('Arabia Saudita', 'Argentina', 'KSA', 'ARG', '2026-06-12 15:00:00-05', 'group', 'A', 'SoFi Stadium, Los Ángeles'),
  ('Polonia', 'Arabia Saudita', 'POL', 'KSA', '2026-06-16 12:00:00-05', 'group', 'A', 'MetLife Stadium, Nueva York'),
  ('Argentina', 'México',       'ARG', 'MEX', '2026-06-16 15:00:00-05', 'group', 'A', 'Estadio Azteca, Ciudad de México'),
  ('Arabia Saudita', 'México', 'KSA', 'MEX', '2026-06-21 12:00:00-05', 'group', 'A', 'SoFi Stadium, Los Ángeles'),
  ('Argentina', 'Polonia',      'ARG', 'POL', '2026-06-21 12:00:00-05', 'group', 'A', 'MetLife Stadium, Nueva York'),

  -- GRUPO B
  ('Francia', 'Australia',      'FRA', 'AUS', '2026-06-12 12:00:00-05', 'group', 'B', 'AT&T Stadium, Dallas'),
  ('Dinamarca', 'Túnez',        'DEN', 'TUN', '2026-06-12 18:00:00-05', 'group', 'B', 'Estadio Universitario, Monterrey'),
  ('Australia', 'Dinamarca',    'AUS', 'DEN', '2026-06-17 12:00:00-05', 'group', 'B', 'AT&T Stadium, Dallas'),
  ('Túnez', 'Francia',          'TUN', 'FRA', '2026-06-17 15:00:00-05', 'group', 'B', 'Estadio Universitario, Monterrey'),
  ('Australia', 'Túnez',        'AUS', 'TUN', '2026-06-22 12:00:00-05', 'group', 'B', 'AT&T Stadium, Dallas'),
  ('Francia', 'Dinamarca',      'FRA', 'DEN', '2026-06-22 12:00:00-05', 'group', 'B', 'SoFi Stadium, Los Ángeles'),

  -- GRUPO C
  ('Brasil', 'Serbia',          'BRA', 'SRB', '2026-06-13 12:00:00-05', 'group', 'C', 'MetLife Stadium, Nueva York'),
  ('Suiza', 'Camerún',          'SUI', 'CMR', '2026-06-13 15:00:00-05', 'group', 'C', 'Levi''s Stadium, San Francisco'),
  ('Serbia', 'Suiza',           'SRB', 'SUI', '2026-06-17 12:00:00-05', 'group', 'C', 'MetLife Stadium, Nueva York'),
  ('Camerún', 'Brasil',         'CMR', 'BRA', '2026-06-18 12:00:00-05', 'group', 'C', 'Levi''s Stadium, San Francisco'),
  ('Serbia', 'Camerún',         'SRB', 'CMR', '2026-06-22 16:00:00-05', 'group', 'C', 'MetLife Stadium, Nueva York'),
  ('Brasil', 'Suiza',           'BRA', 'SUI', '2026-06-22 16:00:00-05', 'group', 'C', 'SoFi Stadium, Los Ángeles'),

  -- GRUPO D
  ('Portugal', 'Ghana',         'POR', 'GHA', '2026-06-13 18:00:00-05', 'group', 'D', 'Estadio Azteca, Ciudad de México'),
  ('Uruguay', 'Corea del Sur',  'URU', 'KOR', '2026-06-14 12:00:00-05', 'group', 'D', 'Education City, Qatar'),
  ('Corea del Sur', 'Ghana',    'KOR', 'GHA', '2026-06-18 15:00:00-05', 'group', 'D', 'AT&T Stadium, Dallas'),
  ('Portugal', 'Uruguay',       'POR', 'URU', '2026-06-19 12:00:00-05', 'group', 'D', 'Estadio Azteca, Ciudad de México'),
  ('Ghana', 'Uruguay',          'GHA', 'URU', '2026-06-23 16:00:00-05', 'group', 'D', 'AT&T Stadium, Dallas'),
  ('Corea del Sur', 'Portugal', 'KOR', 'POR', '2026-06-23 16:00:00-05', 'group', 'D', 'Estadio Universitario, Monterrey'),

  -- GRUPO E
  ('España', 'Costa Rica',      'ESP', 'CRC', '2026-06-14 15:00:00-05', 'group', 'E', 'Levi''s Stadium, San Francisco'),
  ('Alemania', 'Japón',         'GER', 'JPN', '2026-06-14 18:00:00-05', 'group', 'E', 'MetLife Stadium, Nueva York'),
  ('Japón', 'Costa Rica',       'JPN', 'CRC', '2026-06-19 15:00:00-05', 'group', 'E', 'AT&T Stadium, Dallas'),
  ('España', 'Alemania',        'ESP', 'GER', '2026-06-19 18:00:00-05', 'group', 'E', 'Estadio Azteca, Ciudad de México'),
  ('Japón', 'España',           'JPN', 'ESP', '2026-06-24 16:00:00-05', 'group', 'E', 'Levi''s Stadium, San Francisco'),
  ('Costa Rica', 'Alemania',    'CRC', 'GER', '2026-06-24 16:00:00-05', 'group', 'E', 'MetLife Stadium, Nueva York'),

  -- GRUPO F
  ('Bélgica', 'Canadá',         'BEL', 'CAN', '2026-06-15 12:00:00-05', 'group', 'F', 'BMO Field, Toronto'),
  ('Croacia', 'Marruecos',      'CRO', 'MAR', '2026-06-15 15:00:00-05', 'group', 'F', 'AT&T Stadium, Dallas'),
  ('Canadá', 'Croacia',         'CAN', 'CRO', '2026-06-20 12:00:00-05', 'group', 'F', 'BMO Field, Toronto'),
  ('Marruecos', 'Bélgica',      'MAR', 'BEL', '2026-06-20 15:00:00-05', 'group', 'F', 'Estadio Azteca, Ciudad de México'),
  ('Canadá', 'Marruecos',       'CAN', 'MAR', '2026-06-25 16:00:00-05', 'group', 'F', 'BMO Field, Toronto'),
  ('Croacia', 'Bélgica',        'CRO', 'BEL', '2026-06-25 16:00:00-05', 'group', 'F', 'SoFi Stadium, Los Ángeles');

END $$;
