import os
import random
from datetime import datetime, timedelta
from argparse import ArgumentParser
from pymongo import MongoClient

WORDS = [
    'alpha','bravo','charlie','delta','echo','foxtrot','golf','hotel','india','juliet','kilo','lima',
    'autumn','breeze','crimson','dawn','ember','flora','glimmer','harbor','ivy','jasmine','lagoon',
    'meadow','oasis','petal','quartz','rose','sage','thistle','umber','violet','willow','zenith',
    'river','sunset','tango','velvet','wander','yonder','zephyr','aurora','cascade','horizon','meadow'
]
TAGS = [
    'urgent','ideas','meeting','research','draft','review','home','office','learning','frontend',
    'backend','design','bug','feature','planning','health','finance','travel','reading','shopping'
]

def pick(arr):
    return random.choice(arr)

def cap(s: str) -> str:
    return s[:1].upper() + s[1:]

def build_title() -> str:
    return f"{cap(pick(WORDS))} {cap(pick(WORDS))} {cap(pick(WORDS))}"

def build_desc() -> str:
    return f"{cap(pick(WORDS))} {pick(WORDS)} {pick(WORDS)} {pick(WORDS)} {pick(WORDS)} {pick(WORDS)}."

def sample_tags() -> list[str]:
    n = 1 + random.randrange(3)
    return list({pick(TAGS) for _ in range(n + 1)})

def make_doc(email: str) -> dict:
    now = datetime.utcnow()
    maybe_deadline = random.random() < 0.6
    days_ahead = 1 + random.randrange(60)
    deadline_date = now + timedelta(days=days_ahead)
    doc = {
        'title': build_title(),
        'description': build_desc(),
        'type': 'work' if random.random() < 0.5 else 'personal',
        'createdby': email,
        'completed': random.random() < 0.4,
        'prioritize': random.random() < 0.3,
        'tags': sample_tags(),
        'createdAt': now,
        'updatedAt': now,
    }
    if maybe_deadline:
        doc['deadline'] = deadline_date
    return doc

def main():
    parser = ArgumentParser(description='Seed random notes (no numbers) into MongoDB.')
    parser.add_argument('--uri', default=os.getenv('MONGODB_URI', ''), help='MongoDB connection string')
    parser.add_argument('--db', default=os.getenv('DB_NAME', ''), help='Database name (optional, uses URI default if set)')
    parser.add_argument('--collection', default='notes', help='Collection name')
    parser.add_argument('--count', type=int, default=15, help='Number of notes to insert')
    parser.add_argument('--email', default=os.getenv('SEED_EMAIL', 'admin@example.com'), help='createdby email')
    args = parser.parse_args()

    if not args.uri:
        raise SystemExit('MONGODB_URI not provided. Set env or pass --uri.')

    client = MongoClient(args.uri)
    db = None
    # Prefer explicit db arg; else use URI default db; else fallback to "dbms"
    if args.db:
        db = client[args.db]
    else:
        try:
            db = client.get_default_database()
        except Exception:
            db = None
        if db is None:
            db = client['dbms']

    coll = db[args.collection]
    docs = [make_doc(args.email) for _ in range(max(1, min(args.count, 100)))]
    result = coll.insert_many(docs)
    print(f'Inserted {len(result.inserted_ids)} notes into {db.name}.{args.collection}')

if __name__ == '__main__':
    main()
