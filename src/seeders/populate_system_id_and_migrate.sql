alter table "Origin" add column system_id int references "System";
update "Origin" set system_id = (select id from "System" where system = 'Origin') WHERE id > 0;

alter table "Steam" add column system_id int references "System";
update "Steam" set system_id = (select id from "System" where system = 'Steam') WHERE id > 0;

alter table "Ubisoft" add column system_id int references "System";
update "Ubisoft" set system_id = (select id from "System" where system = 'Ubisoft') WHERE id > 0;

alter table "GameCube" add column system_id int references "System";
update "GameCube" set system_id = (select id from "System" where system = 'GameCube') WHERE id > 0;

alter table "Wii" add column system_id int references "System";
update "Wii" set system_id = (select id from "System" where system = 'Wii' And platform = 'Console') WHERE id > 0;

alter table "WiiU" add column system_id int references "System";
update "WiiU" set system_id = (select id from "System" where system = 'WiiU' And platform = 'Console') WHERE id > 0;

alter table "VirtualConsole" add column system_id int references "System";

UPDATE "VirtualConsole" SET system_id = 10 WHERE id = 24;

UPDATE "VirtualConsole" SET system_id = 10 WHERE id = 25;

UPDATE "VirtualConsole" SET system_id = 9 WHERE id = 19;

UPDATE "VirtualConsole" SET system_id = 8 WHERE id = 14;

UPDATE "VirtualConsole" SET system_id = 11 WHERE id = 11;

UPDATE "VirtualConsole" SET system_id = 8 WHERE id = 12;

UPDATE "VirtualConsole" SET system_id = 8 WHERE id = 13;

UPDATE "VirtualConsole" SET system_id = 9 WHERE id = 18;

UPDATE "VirtualConsole" SET system_id = 14 WHERE id = 10;

UPDATE "VirtualConsole" SET system_id = 12 WHERE id = 4;

UPDATE "VirtualConsole" SET system_id = 12 WHERE id = 5;

UPDATE "VirtualConsole" SET system_id = 9 WHERE id = 20;

UPDATE "VirtualConsole" SET system_id = 15 WHERE id = 7;

UPDATE "VirtualConsole" SET system_id = 10 WHERE id = 26;

UPDATE "VirtualConsole" SET system_id = 15 WHERE id = 6;

UPDATE "VirtualConsole" SET system_id = 8 WHERE id = 16;

UPDATE "VirtualConsole" SET system_id = 10 WHERE id = 21;

UPDATE "VirtualConsole" SET system_id = 8 WHERE id = 17;

UPDATE "VirtualConsole" SET system_id = 8 WHERE id = 15;

UPDATE "VirtualConsole" SET system_id = 10 WHERE id = 22;

UPDATE "VirtualConsole" SET system_id = 10 WHERE id = 23;

UPDATE "VirtualConsole" SET system_id = 15 WHERE id = 3;

UPDATE "VirtualConsole" SET system_id = 15 WHERE id = 1;

UPDATE "VirtualConsole" SET system_id = 15 WHERE id = 2;

UPDATE "VirtualConsole" SET system_id = 12 WHERE id = 8;

UPDATE "VirtualConsole" SET system_id = 14 WHERE id = 9;

create or replace function which_platform(system_id int)
    returns TEXT
    language plpgsql
    as
$$
    declare
       r_platform TEXT;
    begin
        select platform from "System" where id = system_id INTO r_platform ;

          return r_platform;
        end;
$$;


create or replace function which_system(system_id int)
    returns TEXT
    language plpgsql
    as
$$
    declare
       r_system TEXT;
    begin
        select system from "System" where id = system_id INTO r_system ;

          return r_system;
        end;
$$;

-- FIX AllGames View
create OR REPLACE view all_games (app_id, id, title, finished, finished_at, collection, platform, system, genuine, system_id) as
SELECT "Origin".app_id,
       "Origin".id,
       "Origin".title,
       "Origin".finished,
       "Origin".finished_at,
       false          AS collection,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
       true           AS genuine,
       "Origin".system_id AS system_id
FROM "Origin"
UNION
SELECT "Ubisoft".app_id,
       "Ubisoft".id,
       "Ubisoft".title,
       "Ubisoft".finished,
       "Ubisoft".finished_at,
       false           AS collection,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
       true            AS genuine,
       "Ubisoft".system_id AS system_id
FROM "Ubisoft"
UNION
SELECT "Steam".app_id,
       "Steam".id,
       "Steam".title,
       "Steam".finished,
       "Steam".finished_at,
       "Steam".collection,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
       true          AS genuine,
       "Steam".system_id AS system_id
FROM "Steam"
UNION
SELECT "GameCube".app_id,
       "GameCube".id,
       "GameCube".title,
       "GameCube".finished,
       "GameCube".finished_at,
       "GameCube".collection,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
       "GameCube".genuine AS genuine,
       "GameCube".system_id AS system_id
FROM "GameCube"
UNION
SELECT "Wii".app_id,
       "Wii".id,
       "Wii".title,
       "Wii".finished,
       "Wii".finished_at,
       "Wii".collection,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
       "Wii".genuine AS genuine,
       "Wii".system_id AS system_id
FROM "Wii"
UNION
SELECT "WiiU".app_id,
       "WiiU".id,
       "WiiU".title,
       "WiiU".finished,
       "WiiU".finished_at,
       "WiiU".collection,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
       "WiiU".genuine AS genuine,
       "WiiU".system_id AS system_id
FROM "WiiU"
UNION
SELECT "VirtualConsole".app_id,
       "VirtualConsole".id,
       "VirtualConsole".title,
       "VirtualConsole".finished,
       "VirtualConsole".finished_at,
       false AS collection,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
       "VirtualConsole".genuine,
       "VirtualConsole".system_id AS system_id
FROM "VirtualConsole";

-- FIX AllGamesListAPI
create OR REPLACE view all_games_list_api (app_id, id, title, finished, finished_at, collection, platform, system, genuine, system_id) as
SELECT tmp.app_id,
       tmp.id,
       tmp.title,
       tmp.finished,
       tmp.finished_at,
       tmp.collection,
       tmp.platform,
       tmp.system,
       tmp.genuine,
       tmp.system_id
FROM (SELECT "Origin".app_id,
             "Origin".id,
             "Origin".title,
             "Origin".finished,
             "Origin".finished_at,
             false          AS collection,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
             true           AS genuine,
             "Origin".system_id AS system_id
      FROM "Origin"
      UNION
      SELECT "Ubisoft".app_id,
             "Ubisoft".id,
             "Ubisoft".title,
             "Ubisoft".finished,
             "Ubisoft".finished_at,
             false           AS collection,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
             true            AS genuine,
             "Ubisoft".system_id AS system_id
      FROM "Ubisoft"
      UNION
      SELECT "Steam".app_id,
             "Steam".id,
             "Steam".title,
             "Steam".finished,
             "Steam".finished_at,
             "Steam".collection,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
             true          AS genuine,
             "Steam".system_id AS system_id
      FROM "Steam"
      WHERE "Steam".collection = false
      UNION
      SELECT "GameCube".app_id,
             "GameCube".id,
             "GameCube".title,
             "GameCube".finished,
             "GameCube".finished_at,
             "GameCube".collection,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
             "GameCube".genuine,
             "GameCube".system_id AS system_id
      FROM "GameCube"
      WHERE "GameCube".collection = false
      UNION
      SELECT "Wii".app_id,
             "Wii".id,
             "Wii".title,
             "Wii".finished,
             "Wii".finished_at,
             "Wii".collection,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
             "Wii".genuine,
             "Wii".system_id AS system_id
      FROM "Wii"
      WHERE "Wii".collection = false
      UNION
      SELECT "WiiU".app_id,
             "WiiU".id,
             "WiiU".title,
             "WiiU".finished,
             "WiiU".finished_at,
             "WiiU".collection,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
             "WiiU".genuine,
             "WiiU".system_id AS system_id
      FROM "WiiU"
      WHERE "WiiU".collection = false
      UNION
      SELECT "VirtualConsole".app_id,
             "VirtualConsole".id,
             "VirtualConsole".title,
             "VirtualConsole".finished,
             "VirtualConsole".finished_at,
             false AS collection,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
             "VirtualConsole".genuine,
             "VirtualConsole".system_id AS system_id
      FROM "VirtualConsole"
      UNION
      SELECT "DLC".app_id,
             "DLC".id,
             "DLC".title,
             "DLC".finished,
             "DLC".finished_at,
             "DLC".collection,
             '-'::text     AS platform,
             '-'::text     AS system,
             NULL::boolean AS genuine,
             null AS system_id
      FROM "DLC"
      WHERE "DLC".collection = true) tmp
ORDER BY tmp.title;

-- FIX AllConsoleGames
create OR REPLACE view all_console_games (app_id, title, finished, finished_at, genuine, collection, fisical_disc, platform, system, system_id) as
SELECT "GameCube".app_id,
       "GameCube".title,
       "GameCube".finished,
       "GameCube".finished_at,
       "GameCube".genuine,
       "GameCube".collection,
       "GameCube".fisical_disc,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
       "GameCube".system_id
FROM "GameCube"
UNION
SELECT "Wii".app_id,
       "Wii".title,
       "Wii".finished,
       "Wii".finished_at,
       "Wii".genuine,
       "Wii".collection,
       "Wii".fisical_disc,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
       "Wii".system_id
FROM "Wii"
UNION
SELECT "WiiU".app_id,
       "WiiU".title,
       "WiiU".finished,
       "WiiU".finished_at,
       "WiiU".genuine,
       "WiiU".collection,
       "WiiU".fisical_disc,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
       "WiiU".system_id
FROM "WiiU"
UNION
SELECT "VirtualConsole".app_id,
       "VirtualConsole".title,
       "VirtualConsole".finished,
       "VirtualConsole".finished_at,
       "VirtualConsole".genuine,
       false           AS collection,
       false           AS fisical_disc,
       which_platform(system_id) AS platform,
       which_system(system_id) AS system,
       "VirtualConsole".system_id
FROM "VirtualConsole";

ALTER table "VirtualConsole" DROP column platform;
ALTER table "VirtualConsole" DROP column system;