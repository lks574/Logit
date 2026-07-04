#!/usr/bin/env bash
# 실기기 원격 접속용: Cloudflare 터널 + Metro(dev-client) 한 방 실행.
# ngrok(= expo --tunnel)이 막힌 망에서 cloudflared로 우회한다. URL을 EXPO_PACKAGER_PROXY_URL로
# 물려 매니페스트·번들이 터널 호스트로 나가게 하므로 셀룰러에서도 붙는다.
# 사용: npm run tunnel   (Ctrl-C 로 종료 시 터널도 함께 닫힘)
set -euo pipefail
cd "$(dirname "$0")/.."

command -v cloudflared >/dev/null || {
  echo "cloudflared 가 없습니다. 먼저: brew install cloudflared"; exit 1;
}

# 잔여 프로세스 정리
pkill -f "expo start" 2>/dev/null || true
pkill -f cloudflared 2>/dev/null || true
lsof -ti:8081 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

LOG=$(mktemp)
cloudflared tunnel --url http://localhost:8081 --no-autoupdate >"$LOG" 2>&1 &
CF_PID=$!
trap 'kill $CF_PID 2>/dev/null || true' EXIT

echo "터널 여는 중..."
URL=""
for _ in $(seq 1 30); do
  URL=$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1 || true)
  [ -n "$URL" ] && break
  sleep 1
done
[ -z "$URL" ] && { echo "터널 연결 실패:"; cat "$LOG"; exit 1; }

cat <<EOF

  ┌─ 실기기 접속 (Wi-Fi/셀룰러 무관) ──────────────
  │ URL:     $URL
  │ 딥링크:  logit://expo-development-client/?url=$URL
  │ 폰: Logit dev 앱 → "Enter URL manually" → 위 URL
  └────────────────────────────────────────────────

EOF

export EXPO_PACKAGER_PROXY_URL="$URL"
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
npx expo start --dev-client
