#!/usr/bin/env bash
# Call every endpoint in English and French and check the status code (Backend Guide section 9).
#   backend/scripts/smoke.sh                      # http://127.0.0.1:8000
#   backend/scripts/smoke.sh https://your-api.example
BASE="${1:-http://127.0.0.1:8000}"
fail=0

check() { # expected_status method path [json_body]
  local want="$1" method="$2" path="$3" body="$4" got
  if [ -n "$body" ]; then
    got=$(curl -s -o /dev/null -w "%{http_code}" -m 15 -X "$method" -H "Content-Type: application/json" -d "$body" "$BASE$path")
  else
    got=$(curl -s -o /dev/null -w "%{http_code}" -m 15 -X "$method" "$BASE$path")
  fi
  if [ "$got" = "$want" ]; then echo "ok   $got $method $path"; else echo "FAIL $got (wanted $want) $method $path"; fail=1; fi
}

check 200 GET /api/health
# a real plan id for this place (mock ids and database ids differ)
PLAN_ID=$(curl -s -m 30 -X POST -H "Content-Type: application/json" -d '{"lat":4.05,"lon":9.70}' "$BASE/api/rotations" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
for lang in en fr; do
  check 200 GET "/api/zones?lang=$lang"
  check 200 GET "/api/profile?lat=4.05&lon=9.70&lang=$lang"
  check 200 GET "/api/twins?lat=4.05&lon=9.70&lang=$lang"
  check 200 GET "/api/window?lat=4.05&lon=9.70&lang=$lang"
  check 200 GET "/api/crops?lang=$lang"
  check 200 GET "/api/passport?lat=4.05&lon=9.70&lang=$lang"
  check 200 GET "/api/faq?lang=$lang"
  check 200 POST /api/rotations "{\"lat\":4.05,\"lon\":9.70,\"lang\":\"$lang\"}"
  check 200 POST /api/ask "{\"question\":\"my field floods\",\"lang\":\"$lang\"}"
  check 200 POST /api/explain "{\"lat\":4.05,\"lon\":9.70,\"plan_id\":\"$PLAN_ID\",\"lang\":\"$lang\"}"
done
check 200 GET /api/proof
check 200 GET /api/advice-index
check 200 POST /api/feedback '{"target":"smoke","value":"up"}'
check 200 POST /api/event '{"name":"smoke"}'
check 200 GET "/api/profile?lat=80&lon=0"          # outside coverage: friendly 200 {outside:true} (what S3 expects), never a crash
check 422 POST /api/rotations "{\"lat\":80,\"lon\":0}"   # rotations outside coverage is a 422
check 422 POST /api/rotations '{"lat":4.05}'       # missing field
exit $fail
