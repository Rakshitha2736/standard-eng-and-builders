# Standard Engineering and Builders Product Display and Enquiry Platform

This workspace is split into separate folders as requested:

- `frontend/` - React + Vite user interface
- `backend/` - Node.js + Express API for products and enquiries

## Features Implemented

- Home page with company intro, product banner, and quick navigation
- Products page with category filtering and product cards
- Product details page with full specifications and enquiry CTA
- Customer enquiry form connected to backend API
- Admin dashboard with login, enquiry viewing, and response management
- Responsive industrial/professional design (steel gray, blue, white)
- Top navigation: Home, Products, Enquiry, Contact
- Enquiry persistence using JSON file storage (`backend/src/data/enquiries.json`)
- Enquiry email notifications to admin inboxes

## Run Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

## MongoDB Products (Optional)

Products can now be served from MongoDB instead of `backend/src/data/products.js`.

Set these variables in `backend/.env`:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=standard-engineering
MONGODB_PRODUCTS_COLLECTION=products
```

Then replace existing products in MongoDB (Mongo shell in Compass):

```javascript
use("standard-engineering");
db.products.deleteMany({});
db.products.insertMany([/* paste product objects here */]);
```

If `MONGODB_URI` is not set or connection fails, backend automatically falls back to file-based products.

## Enquiry Email Notification Setup

When a customer submits the enquiry form, the backend sends an email to:

- `rakshitham.23it@kongu.edu`
- `sivadurgeshk.23it@kongu.edu`

Configure SMTP in `backend/.env` (copy from `.env.example`):

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM="Standard Engineering and Builders <your_email@gmail.com>"
```

Note: For Gmail, use an App Password if 2FA is enabled.

## Admin Login

- Default username: `admin`
- Default password: `admin123`

You can override these values using environment variables. Copy `backend/.env.example` and set your values before running in production.

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Hosted Deployment Notes

If the frontend is deployed on Vercel and the backend is deployed on Render:

- The frontend will call the Render API automatically when it is not running on localhost.
- The file `backend/.env` is only for local development. Render does not read it from your machine.
- You must set backend environment variables in Render service settings or via `render.yaml` blueprint sync.

For frontend hosting on a custom domain, set these variables in your frontend host before building:

```bash
VITE_API_URL=https://standard-eng-and-builders.onrender.com
VITE_FALLBACK_API_URL=https://standard-eng-and-builders.onrender.com
```

Do not set `VITE_API_URL` to `http://localhost:5000` in production builds.

Required on Render for admin login and email sending:

```bash
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
ADMIN_JWT_SECRET=your_strong_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM="Standard Engineering and Builders <your_email@gmail.com>"
```

If these are missing on Render:

- Admin login can fail or use unexpected fallback credentials.
- Enquiries can be saved but customer/admin emails will not be delivered.

After updating Render environment variables, redeploy the backend service.

Also ensure backend CORS allows your frontend domain by setting:

```bash
CORS_ORIGINS=https://www.standardengineering.me,https://standardengineering.me
```
