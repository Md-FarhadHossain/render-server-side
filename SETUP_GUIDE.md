# Setup Guide: Real-Time Facebook CAPI with Render & Turso

## 1. Turso Database Setup (SQLite/LibSQL)
1. Go to [Turso](https://turso.tech/) and create a free account.
2. Install Turso CLI or just use their web dashboard.
3. Create a new database: `turso db create fb-capi`
4. Get your URL and generate a token:
   ```bash
   turso db show --url fb-capi
   turso db tokens create fb-capi
   ```
5. Connect to your DB console in Turso web UI or via CLI `turso db shell fb-capi` and run this SQL to create the table:
   ```sql
   CREATE TABLE fb_events (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     event_name TEXT NOT NULL,
     event_id TEXT NOT NULL,
     event_time INTEGER NOT NULL,
     page_url TEXT,
     user_ip TEXT,
     user_agent TEXT,
     fbc TEXT,
     fbp TEXT,
     custom_data TEXT,
     fb_response TEXT,
     status TEXT DEFAULT 'pending',
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );
   ```

## 2. Obtain Facebook Tokens
1. Go to Facebook Events Manager -> Data Sources.
2. Under your Pixel Settings, scroll to **Conversions API**.
3. Under "Set up manually", click **Generate access token**. Save this.
4. While there, scroll down slightly and find **Test Event Code**. Save this if you want to test in real-time.
5. And of course, keep your standard Pixel ID.

## 3. Render (Free Tier) Setup
1. Push this Next.js project to a GitHub repository.
2. Create an account on [Render.com](https://render.com/).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub and select the repository.
5. Configure the Web Service:
   - **Environment**: Node
   - **Build Command**: `npm install; npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: Free Plan
6. Under **Environment Variables**, add the variables from `.env.example`:
   - `FACEBOOK_PIXEL_ID`
   - `FACEBOOK_ACCESS_TOKEN`
   - `FACEBOOK_TEST_EVENT_CODE` (only needed when testing)
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
7. Click **Create Web Service**. Wait for the build and deployment to finish.

## 4. Keep Free Tier Alive with UptimeRobot
Render free tier spins down after 15 minutes of inactivity. To keep CAPI running 24/7 without fail:
1. Copy your Render app URL (e.g., `https://your-app.onrender.com`).
2. Go to [UptimeRobot](https://uptimerobot.com/) and create a free account.
3. Click **Add New Monitor**.
   - Monitor Type: **HTTP(s)**
   - Friendly Name: `FB CAPI Ping`
   - URL: `https://your-app.onrender.com/api/healthz`
   - Monitoring Interval: **5 minutes**
4. Click **Create Monitor**. The Render server will now stay continuously awake.

## 5. Using it in your frontend
1. First, inside your Next.js root layout (`app/layout.tsx`), inject the base Pixel.
   ```tsx
   import FacebookPixel from "@/components/FacebookPixel";
   
   export default function RootLayout({ children }) {
     return (
       <html lang="en">
         <body>
           {children}
           <FacebookPixel pixelId={process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || ""} />
         </body>
       </html>
     );
   }
   ```
2. Any time you want to track a conversion, use the `useFacebookTrack` hook. It safely deduplicates:
   ```tsx
   import { useFacebookTrack } from "@/hooks/useFacebookTrack";

   export function CheckoutButton() {
     const { track } = useFacebookTrack();

     return (
       <button onClick={() => {
         track("Purchase", 
           { value: 99.99, currency: "USD" }, // Custom Data
           { email: "user@example.com" }      // User Data (automatically hashed!)
         );
       }}>Buy Now</button>
     );
   }
   ```

## 6. Testing
- Test endpoints directly: `GET https://your-app.onrender.com/api/fb/test`
- Verify events and deduplication in the Facebook Events Manager strictly by comparing the matching `event_id`.
