# LogisticsAI v2 — Warehouse Dispatch Management System

## Login credentials
| Role    | Email              | Password    |
|---------|--------------------|-------------|
| Manager | manager@lms.com    | manager123  |
| Driver  | deepak@lms.com     | driver123   |
| Driver  | suresh@lms.com     | driver123   |
| Driver  | mohan@lms.com      | driver123   |

## Run — Terminal 1 (Backend)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
pip install "bcrypt==4.0.1"
python database/init_db.py
uvicorn main:app --reload
```

## Run — Terminal 2 (Frontend)
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173
