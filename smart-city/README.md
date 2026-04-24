# CivicPulse

A polished full-stack civic issue response platform that empowers citizens and city teams. CivicPulse uses a **TF-IDF + Cosine Similarity ML engine** to automatically detect and merge duplicate complaints, and a **weighted keyword scoring** AI categorizer to route issues faster.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 + Tailwind CSS v4 + Framer Motion |
| Backend | Node.js + Express 5 |
| Database | MongoDB + Mongoose |
| Image Storage | Cloudinary (optional — graceful demo fallback) |
| Animations | Framer Motion (page transitions, stagger, spring physics) |

---

## ML Features

### 1. Smart Duplicate Clustering
When a new complaint is submitted, the engine:
1. **Pre-filters** open complaints by same category (speed)
2. Runs **TF-IDF vectorization** on the combined title + description text
3. Computes **Cosine Similarity** between the incoming and each existing complaint
4. Computes **Jaccard Similarity** on location word tokens
5. Applies a **category bonus** (+0.15) if categories match
6. Final score = `0.55 × text_cosine + 0.30 × location_jaccard + category_bonus`
7. If score ≥ **0.40 threshold** → merges reporter into existing complaint
8. Detects if same contact already reported the same complaint

### 2. ML Auto-Categorization
Weighted keyword scoring with 3 tiers per category:
- **High weight (+3)**: core keywords (pothole, garbage, water, electricity…)
- **Medium weight (+2)**: related words
- **Low weight (+1)**: contextual hints
- Returns category + **AI confidence %** shown in UI

### Categories
| Keywords | Department |
|---|---|
| garbage, waste, trash, sewage | Sanitation |
| pothole, road, pavement, crack | Roads |
| water, leak, pipe, flood | Water Department |
| electricity, light, power, outage | Electrical |
| (none matched) | General |

---

## Running Locally

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally on port 27017
  - Quick start: `mongod` or use MongoDB Compass

### 1. Backend

```bash
cd smart-city/backend
npm install
# Optional: add Cloudinary keys to .env for image uploads
npm run dev       # nodemon hot-reload on port 5000
```

**`.env` file** (already created at `backend/.env`):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/smart-city-complaints

# Optional — leave blank for demo mode (no image storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Frontend

```bash
cd smart-city/frontend
npm install
npm run dev       # Vite dev server on http://localhost:5173
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/complaints` | Submit complaint (runs ML categorize + duplicate check) |
| `GET` | `/api/complaints` | List all (supports `?category=&status=&sort=`) |
| `GET` | `/api/complaints/stats` | Aggregate stats (total, pending, resolved, totalReports) |
| `GET` | `/api/complaints/:id` | Single complaint with all reporters |
| `PUT` | `/api/complaints/:id` | Update status (Pending / In Progress / Resolved) |

### POST /api/complaints — Request Body
```json
{
  "title": "Large pothole on MG Road",
  "description": "Dangerous pothole causing road accidents",
  "location": "MG Road, Near Bus Stand",
  "reporterName": "John Doe",
  "reporterContact": "john@example.com"
}
```

### POST Response (new complaint)
```json
{
  "success": true,
  "isDuplicate": false,
  "data": { "category": "Roads", "mlConfidence": 0.58, "reportCount": 1, ... }
}
```

### POST Response (merged duplicate — 79% match)
```json
{
  "success": true,
  "isDuplicate": true,
  "alreadyReported": false,
  "similarityScore": 0.79,
  "data": { "reportCount": 2, "reporters": [{...}, {...}], ... },
  "message": "Your report was merged with an existing complaint (79% match)."
}
```

---

## Features

### Citizen Portal
- Submit complaints with name + contact info
- **Live AI category preview** as you type the description
- Image upload (Cloudinary or demo mode)
- After submit: shows complaint ID to copy + track
- **Merged complaint**: special amber screen showing how many people reported it

### Tracking Page  
- Look up any complaint by ID
- Animated **3-step progress timeline** (Submitted → In Progress → Resolved)
- **Expandable reporter list** — see every person who reported this issue
- AI confidence badge
- Evidence image viewer

### Admin Dashboard (password: `admin123`)
- **4 stat cards** with animated counters: Total, Total Reports, Pending, Resolved
- **Sort by Most Reported** to prioritize high-impact complaints
- Per-row **reporter dropdown** — click to see all reporters inline
- Filter by category + status
- Per-row status update with optimistic UI + spinner
- Skeleton loaders while data fetches
- Refresh + Lock buttons

---

## Project Structure

```
smart-city/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js      # Graceful fallback if no keys
│   │   └── db.js
│   ├── controllers/
│   │   └── complaintController.js  # ML merge + categorize logic
│   ├── models/
│   │   └── Complaint.js       # Schema with reporters[] array
│   ├── routes/
│   │   └── complaintRoutes.js
│   ├── utils/
│   │   └── similarity.js      # TF-IDF + Cosine + Jaccard engine
│   └── server.js
└── frontend/
    └── src/
        ├── animations/
        │   └── variants.js    # Centralized Framer Motion variants
        ├── components/
        │   ├── AnimatedCounter.jsx
        │   ├── ProgressTimeline.jsx
        │   ├── SkeletonLoader.jsx
        │   └── StatusBadge.jsx
        ├── pages/
        │   ├── Home.jsx
        │   ├── SubmitComplaint.jsx
        │   ├── TrackComplaint.jsx
        │   └── AdminDashboard.jsx
        └── services/
            └── api.js
```
