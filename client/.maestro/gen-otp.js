// Mint a fresh 6-digit email OTP for tester@example.com against the local Supabase
// admin API. Runs AFTER the app's "Send code" so this code supersedes it and is the
// one `verifyOtp` will accept. SERVICE_ROLE is passed by `dev.sh smoke` via -e.
// (Local-only, service-role key never leaves the machine.)
const key = SERVICE_ROLE
const res = http.post('http://127.0.0.1:54321/auth/v1/admin/generate_link', {
  headers: {
    apikey: key,
    Authorization: 'Bearer ' + key,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ type: 'magiclink', email: 'tester@example.com' }),
})
output.otp = JSON.parse(res.body).email_otp
