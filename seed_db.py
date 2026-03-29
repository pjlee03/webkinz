"""
seed_db.py

Creates and seeds webkinz.db (SQLite database) with zoo locations 
and animale data. 
Run once (or as needed): python3 seed_db.py

Table schema:
zoos - location data + live cam URL from mapping.py
animals - species data used in both games (geoguessr and species guessing gaiem)
        (links to a zoo via zoo_id; NULL of no matching zoo yet)

The API layer reads from webkinz.db - This script only writes it. 
"""

import sqlite3
import json

DB_PATH = 'webkinz.db'

# --------------------------------------------------------------
#  Zoo data - from mapping.py - extended w/ missing coordinates corrected 
# --------------------------------------------------------------

ZOOS = [
    {
        "name": "Pittsburgh Zoo",
        "lat": 40.4843,
        "lon": -79.9222,
        "cam": "https://www.pittsburghzoo.org/animals/webcams-online-activities/penguin-webcam/"
    },
    {
        "name": "Smithsonian National Zoo",
        "lat": 38.9296,
        "lon": -77.0502,
        "cam": "https://nationalzoo.si.edu/webcams/panda-cam"
    },
    {
        "name": "Houston Zoo",
        "lat": 29.7134,
        "lon": -95.3909,
        "cam": "https://www.houstonzoo.org/explore/webcams/elephant-yard-cam/"
    },
    {
        "name": "San Diego Zoo",
        "lat": 32.7353,
        "lon": -117.1490,
        "cam": "https://zoo.sandiegozoo.org/cams/baboon-cam"
    },
    {
        "name": "Edinburgh Zoo",
        "lat": 55.9460,
        "lon": -3.2050, 
        "cam": "https://www.edinburghzoo.org.uk/webcams/rockhopper-cam"
    },
    {
        "name": "Awaji Island Monkey Center",
        "lat": 34.2569,
        "lon": 135.1020,
        "cam": "http://skylinewebcams.com/en/webcam/japan/hyogo/sumoto/awaji-monkey-center.html"
    },
    {
        "name": "Wolong Grove",
        "lat": 31.0200,
        "lon": 103.1000,
        "cam": "https://explore.org/livecams/panda-bears/china-panda-cam-1"
    },
    {
       "name": "Vancouver Aquarium",
       "lat": 49.3005,
       "lon": -123.1309,
       "cam": "https://www.youtube.com/watch?v=9mg9PoFEX2U"
    },
    {
        "name": "Hoedspruit Endangered Species Centre",
        "lat": -24.5138,
        "lon": 31.0323,
        "cam": "https://www.youtube.com/watch?v=oruIH1ZadqE"
    },
    {
        "name": "Zarafa Camp",
        "lat": -18.5858,
        "lon": 23.5339,
        "cam": "https://www.youtube.com/watch?v=2EZavJUNdLI"
    },
    {
        "name": "Gesellschaft zur Erhaltung",
        "lat": 51.3380,
        "lon": 9.8590,
        "cam": "https://www.youtube.com/watch?v=_EmLriL9494"
    },
    {
        "name": "Canopy Lodge",
        "lat": 8.6200,
        "lon": -80.1400,
        "cam": "https://www.youtube.com/watch?v=WtoxxHADnGk"
    }   
]

# --------------------------------------------------------------
# Animal data - merged form GeoGuessr/data.js and Species game/app.js
# zoo_name must match a name in ZOOS to link the animal to a zoo; otherwise, zoo_id will be NULL
# --------------------------------------------------------------

ANIMALS = [
    {
        "species_name":         "Giant Panda",
        "image_file":           "animal_images/giant-panda.jpg",
        "fun_fact":             "Giant pandas spend most of their day eating bamboo and can consume over 25 pounds daily.",
        "difficulty_multiplier": 2,
        "accepted_guesses":     ["giant panda", "panda"],
        "zoo_name":             "San Diego Zoo",   # also at Wolong Grove; primary listed here
    },
    {
        "species_name":         "Asian Elephant",
        "image_file":           "animal_images/asian-elephant.jpg",
        "fun_fact":             "Asian elephants have smaller ears than African elephants and are highly social animals.",
        "difficulty_multiplier": 2,
        "accepted_guesses":     ["asian elephant", "elephant"],
        "zoo_name":             "Houston Zoo",
    },
    {
        "species_name":         "African Lion",
        "image_file":           "animal_images/african-lion.jpg",
        "fun_fact":             "A lion's roar can be heard up to five miles away.",
        "difficulty_multiplier": 1,
        "accepted_guesses":     ["african lion", "lion"],
        "zoo_name":             "Hoedspruit Endangered Species Centre",
    },
    {
        "species_name":         "Manatee",
        "image_file":           "animal_images/Manatee.JPG",
        "fun_fact":             "Manatees are herbivores and can eat about 10% of their body weight in plants each day.",
        "difficulty_multiplier": 2,
        "accepted_guesses":     ["manatee", "florida manatee"],
        "zoo_name":             None,   # no matching zoo in current list — add one to ZOOS above
    },
    {
        "species_name":         "Florida Panther",
        "image_file":           "animal_images/florida-panther.jpg",
        "fun_fact":             "The Florida panther is one of the most endangered mammals in North America.",
        "difficulty_multiplier": 3,
        "accepted_guesses":     ["florida panther", "panther"],
        "zoo_name":             None,
    },
    {
        "species_name":         "Southern White Rhino",
        "image_file":           "animal_images/Pilanesberg_Rhino.JPG",
        "fun_fact":             "Southern white rhinos are the larger of the two African rhino species.",
        "difficulty_multiplier": 2,
        "accepted_guesses":     ["southern white rhino", "white rhino", "rhino"],
        "zoo_name":             "Hoedspruit Endangered Species Centre",
    },
    {
        "species_name":         "Brown Bear",
        "image_file":           "animal_images/brown-bear.jpg",
        "fun_fact":             "Katmai brown bears are famous for fishing salmon during seasonal runs.",
        "difficulty_multiplier": 2,
        "accepted_guesses":     ["brown bear", "katmai brown bear", "bear"],
        "zoo_name":             None,   # Katmai National Park — add to ZOOS if needed
    },
    {
        "species_name":         "Bald Eagle",
        "image_file":           "animal_images/bald-eagle.jpg",
        "fun_fact":             "Bald eagles build some of the largest nests of any bird in North America.",
        "difficulty_multiplier": 1,
        "accepted_guesses":     ["bald eagle", "eagle"],
        "zoo_name":             None,
    },
    {
        "species_name":         "Gray Wolf",
        "image_file":           "animal_images/gray-wolf.jpeg",
        "fun_fact":             "Gray wolves communicate with body language, scent marking, and howling.",
        "difficulty_multiplier": 2,
        "accepted_guesses":     ["gray wolf", "grey wolf", "wolf"],
        "zoo_name":             "Gesellschaft zur Erhaltung",
    },
    {
        "species_name":         "Koala",
        "image_file":           "animal_images/koala.jpg",
        "fun_fact":             "Koalas sleep up to 18-20 hours a day to conserve energy from their eucalyptus diet.",
        "difficulty_multiplier": 1,
        "accepted_guesses":     ["koala"],
        "zoo_name":             None,   # Australia Zoo — add to ZOOS if needed
    },
]
# ---------------------------------------------------------------------------

def create_tables(conn):
    conn.executescript("""
        DROP TABLE IF EXISTS animals;
        DROP TABLE IF EXISTS zoos;

        CREATE TABLE zoos (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            name    TEXT    NOT NULL UNIQUE,
            lat     REAL    NOT NULL,
            lon     REAL    NOT NULL,
            cam_url TEXT
        );

        CREATE TABLE animals (
            id                   INTEGER PRIMARY KEY AUTOINCREMENT,
            species_name         TEXT    NOT NULL UNIQUE,
            image_file           TEXT    NOT NULL,
            fun_fact             TEXT,
            difficulty_multiplier INTEGER NOT NULL DEFAULT 1,
            accepted_guesses     TEXT    NOT NULL,   -- JSON array stored as text
            zoo_id               INTEGER,
            FOREIGN KEY (zoo_id) REFERENCES zoos(id)
        );
    """)


def seed_zoos(conn):
    conn.executemany(
        "INSERT INTO zoos (name, lat, lon, cam_url) VALUES (:name, :lat, :lon, :cam)",
        ZOOS
    )
def seed_animals(conn):
    # Build a name→id lookup so we can resolve zoo_name → zoo_id
    zoo_ids = {row[0]: row[1] for row in conn.execute("SELECT name, id FROM zoos")}

    rows = []
    for a in ANIMALS:
        zoo_id = zoo_ids.get(a["zoo_name"]) if a["zoo_name"] else None
        if a["zoo_name"] and zoo_id is None:
            print(f"  WARNING: zoo '{a['zoo_name']}' not found for {a['species_name']} — zoo_id set to NULL")
        rows.append({
            "species_name":          a["species_name"],
            "image_file":            a["image_file"],
            "fun_fact":              a["fun_fact"],
            "difficulty_multiplier": a["difficulty_multiplier"],
            "accepted_guesses":      json.dumps(a["accepted_guesses"]),
            "zoo_id":                zoo_id,
        })

    conn.executemany(
        """INSERT INTO animals
               (species_name, image_file, fun_fact, difficulty_multiplier, accepted_guesses, zoo_id)
           VALUES
               (:species_name, :image_file, :fun_fact, :difficulty_multiplier, :accepted_guesses, :zoo_id)""",
        rows
    )

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")

    print(f"Creating tables in {DB_PATH}...")
    create_tables(conn)

    print("Seeding zoos...")
    seed_zoos(conn)

    print("Seeding animals...")
    seed_animals(conn)

    conn.commit()
    conn.close()

    print(f"\nDone. {DB_PATH} is ready.")
    print("Tables: zoos, animals")
    print("The API layer can now SELECT from these tables instead of reading hardcoded JS data.")


if __name__ == "__main__":
    main()