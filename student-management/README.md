# Student Information Management System
**Three-Tier Cloud Architecture: Netlify + Render + MongoDB Atlas**

```
User → Netlify (Frontend) → Render (Node/Express API) → MongoDB Atlas (DB)
```

| Tier | Platform | Tech | Folder |
|------|----------|------|--------|
| Presentation | Netlify | HTML, CSS, JS | `frontend/` |
| Application | Render | Node.js, Express, Mongoose | `backend/` |
| Database | MongoDB Atlas | `studentDB.students` | – |

## API Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/students` | Add student |
| GET | `/api/students` | View all (`?search=` to search) |
| GET | `/api/students/:id` | Get one (by Student ID, e.g. ST101) |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |

---

## What You Need To Do (Step by Step)

### Step 1: MongoDB Atlas (Database)
1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a **free (M0) cluster**.
2. **Database Access** → Add Database User → set a username and password (avoid special characters like `@ : /` in the password).
3. **Network Access** → Add IP Address → **Allow access from anywhere (0.0.0.0/0)** (Render IPs change).
4. **Connect** → Drivers → copy the connection string and add the database name `studentDB`:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/studentDB?retryWrites=true&w=majority
   ```

### Step 2: Test Backend Locally (recommended)
```bash
cd backend
cp .env.example .env     # open .env and paste your MONGODB_URI
npm install
npm start
```
Open `http://localhost:5000/api/students` → should show `{"success":true,"data":[]}`.
For local testing, set `FRONTEND_URL` in `.env` to your local frontend address (e.g. `http://127.0.0.1:5500`).

### Step 3: Push to GitHub
Create a GitHub repository and push this whole folder. `.env` is git-ignored, so your credentials are not uploaded.

### Step 4: Deploy Backend on Render
1. [render.com](https://render.com) → **New → Web Service** → select your GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. **Environment Variables:**
   - `MONGODB_URI` = your Atlas connection string
   - `FRONTEND_URL` = `https://placeholder.netlify.app` (update in Step 7)
4. Deploy and copy the URL, e.g. `https://student-api.onrender.com`.
5. Open `https://student-api.onrender.com/api/students` to confirm it works.

### Step 5: Connect Frontend to Backend
Edit `frontend/config.js`:
```js
const API_URL = "https://student-api.onrender.com/api/students";
```
Commit and push.

### Step 6: Deploy Frontend on Netlify
1. [netlify.com](https://www.netlify.com) → **Add new site → Import from GitHub**.
2. **Base directory:** `frontend`, **Publish directory:** `frontend`, no build command.
3. Deploy and copy the URL, e.g. `https://student-management-system.netlify.app`.

### Step 7: Configure CORS
In Render → Environment, set:
```
FRONTEND_URL=https://student-management-system.netlify.app
```
(no trailing slash). Render redeploys automatically.

> The free Render service sleeps when idle; the first request may take ~50 seconds.

---

## Testing Checklist
| # | Test | Expected |
|---|------|----------|
| 1 | Add student ST101 (Sem 5) | "Student added successfully" |
| 2 | Open Student List | All records shown |
| 3 | Search "ST101" | Matching record shown |
| 4 | Edit ST101, Sem 5 → 6 | Updated in Atlas |
| 5 | Delete ST101 | Removed from Atlas |
| 6 | Atlas → Browse Collections | Changes visible in `studentDB.students` |

## Security Practices Used
- DB credentials only in environment variables (never in frontend code)
- `.env` excluded from Git
- Backend input validation and safe error messages
- CORS restricted to the Netlify domain
- HTTPS on Netlify and Render
- Atlas user with a strong password

## Project Structure
```
student-management/
├── README.md
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/database.js
│   ├── models/Student.js
│   ├── routes/studentRoutes.js
│   └── controllers/studentController.js
└── frontend/
    ├── index.html
    ├── style.css
    ├── script.js
    └── config.js
```
