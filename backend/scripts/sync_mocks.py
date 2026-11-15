"""Copy the frontend mock files that the backend mirrors from public/mock/ into backend/app/mock/.

Run from the repo root:  backend/.venv/Scripts/python backend/scripts/sync_mocks.py
A test (tests/test_mock_drift.py) fails if the two copies differ, so a teammate editing a frontend mock is noticed.
crops.json and zones_meta.json are generated from frontend source files, not copied, so they are not synced here.
"""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FILES = ["zones.geojson", "profiles.json", "rotations.json", "twins.json", "watch.json", "faq.json", "advice-index.json"]

for name in FILES:
    shutil.copyfile(ROOT / "public/mock" / name, ROOT / "backend/app/mock" / name)
    print("synced", name)
