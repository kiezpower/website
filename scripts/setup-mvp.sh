#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# KiezPower MVP Setup Script
# Run this after providing credentials in step 0 below.
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

echo "=== KiezPower MVP Setup ==="
echo ""

# -----------------------------------------------------------
# Step 0: Prerequisites check
# -----------------------------------------------------------
echo "[0/5] Checking prerequisites..."

if ! command -v supabase &>/dev/null; then
  echo "ERROR: supabase CLI not found. Install it first:"
  echo "  brew install supabase/tap/supabase"
  exit 1
fi

if ! command -v gh &>/dev/null; then
  echo "ERROR: gh CLI not found. Install it first:"
  echo "  brew install gh"
  exit 1
fi

SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "ERROR: SUPABASE_ACCESS_TOKEN not set."
  echo "  Get one from: https://supabase.com/dashboard/account/tokens"
  echo "  Then: export SUPABASE_ACCESS_TOKEN=sbp_xxxxx"
  exit 1
fi

GITHUB_TOKEN="${GITHUB_TOKEN:-}"
if [ -z "$GITHUB_TOKEN" ]; then
  echo "ERROR: GITHUB_TOKEN not set."
  echo "  Get one from: https://github.com/settings/tokens"
  echo "  Then: export GITHUB_TOKEN=ghp_xxxxx"
  exit 1
fi

RESEND_API_KEY="${RESEND_API_KEY:-}"
if [ -z "$RESEND_API_KEY" ]; then
  echo "ERROR: RESEND_API_KEY not set."
  echo "  Get one from: https://resend.com/api-keys"
  echo "  Then: export RESEND_API_KEY=re_xxxxx"
  exit 1
fi

SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "ERROR: SUPABASE_SERVICE_ROLE_KEY not set."
  echo "  Find it at: https://supabase.com/dashboard/project/xctbktqwpzbnsynofqtu/settings/api"
  echo "  Then: export SUPABASE_SERVICE_ROLE_KEY=eyJxxx"
  exit 1
fi

PROJECT_REF="xctbktqwpzbnsynofqtu"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

echo "  All prerequisites satisfied."
echo ""

# -----------------------------------------------------------
# Step 1: Push migrations
# -----------------------------------------------------------
echo "[1/5] Pushing database migrations..."

supabase link --project-ref "$PROJECT_REF"
supabase db push

echo "  Migrations applied."
echo ""

# -----------------------------------------------------------
# Step 2: Deploy Edge Function
# -----------------------------------------------------------
echo "[2/5] Deploying send-welcome-email Edge Function..."

supabase functions deploy send-welcome-email --project-ref "$PROJECT_REF"

echo "  Edge Function deployed."
echo ""

# -----------------------------------------------------------
# Step 3: Configure secrets
# -----------------------------------------------------------
echo "[3/5] Configuring Supabase secrets..."

supabase secrets set \
  RESEND_API_KEY="$RESEND_API_KEY" \
  SUPABASE_URL="$SUPABASE_URL" \
  SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  --project-ref "$PROJECT_REF"

echo "  Secrets configured."
echo ""

# -----------------------------------------------------------
# Step 4: Set up DB webhook (via Supabase Management API)
# -----------------------------------------------------------
echo "[4/5] Setting up database webhook..."

WEBHOOK_PAYLOAD=$(cat <<EOF
{
  "name": "Send Welcome Email",
  "table": "waitlist",
  "event": "INSERT",
  "type": "http_hook_with_secret",
  "url": "https://${PROJECT_REF}.functions.supabase.co/send-welcome-email",
  "headers": [{"key": "Content-Type", "value": "application/json"}],
  "auth_method": "service_key"
}
EOF
)

curl -s -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/hooks" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_PAYLOAD" > /dev/null

echo "  Database webhook created."
echo ""

# -----------------------------------------------------------
# Step 5: Configure GitHub secrets
# -----------------------------------------------------------
echo "[5/5] Configuring GitHub secrets..."

echo "$GITHUB_TOKEN" | gh auth login --with-token

gh secret set PUBLIC_SUPABASE_URL \
  --repo kiezpower/website \
  --body "$SUPABASE_URL"

gh secret set PUBLIC_SUPABASE_ANON_KEY \
  --repo kiezpower/website \
  --body "$(grep PUBLIC_SUPABASE_ANON_KEY .env | cut -d= -f2-)"

echo "  GitHub secrets configured."
echo ""

echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Verify: open the website and submit the waitlist form"
echo "  2. Check: https://supabase.com/dashboard/project/${PROJECT_REF}/logs/edge-logs"
echo "  3. Check: https://resend.com/emails for delivery"
echo ""
