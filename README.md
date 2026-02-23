# Outkry

Community site (Reddit + Discord + 4chan style) with Info Panel design.

## Setup

1. **Database (Railway)**
   - Create a PostgreSQL database on Railway
   - Copy the connection URL and add to `.env`:
   ```
   DATABASE_URL=postgresql://...
   ```

2. **Background & logo**
   - Put `background.jpg` in `public/`
   - Put `logo.png` in `public/` (or root; it's copied to public for Next.js)

3. **Install & run**
   ```bash
   npm install
   npm run db:push
   npm run dev
   ```

4. **Admin**
   - Register with `tjabate@gmail.com` to get admin access
   - Visit `/admin`

## Features

- 12 main categories with subcategories (collapsible sidebar)
- Post form: title, body (5k words, max 3 links), featured image
- Voting (up/down), score-based ranking
- Tabs: Most Recent, Highest Score (25+), Archived (500+)
- User profiles with stats
- Login/Register (email, phone, username, bio)
- Admin panel at `/admin` (tjabate@gmail.com only)
"# outkry" 
