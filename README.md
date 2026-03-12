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
