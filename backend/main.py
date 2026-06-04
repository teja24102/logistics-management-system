from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database.init_db import init_db
from routes.auth      import router as auth_router
from routes.stock     import router as stock_router
from routes.dispatches import router as dispatch_router
from routes.drivers   import router as driver_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="LMS - Logistics Management System", version="2.0.0", lifespan=lifespan)

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth_router,     prefix="/api/auth",       tags=["Auth"])
app.include_router(stock_router,    prefix="/api/stock",      tags=["Stock"])
app.include_router(dispatch_router, prefix="/api/dispatches", tags=["Dispatches"])
app.include_router(driver_router,   prefix="/api/drivers",    tags=["Drivers"])


@app.get("/")
def root(): return {"status": "ok", "app": "Logistics Management System v2"}
