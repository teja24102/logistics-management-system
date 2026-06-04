from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import DeclarativeBase, relationship
from pydantic import BaseModel


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String(100), nullable=False)
    email           = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role            = Column(String(20), default="driver")
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, default=datetime.utcnow)


class StockItem(Base):
    __tablename__ = "stock_items"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(150), nullable=False)
    sku         = Column(String(50),  unique=True, nullable=False)
    category    = Column(String(80),  default="General")
    quantity    = Column(Integer,     default=0)
    unit        = Column(String(30),  default="units")
    warehouse   = Column(String(100), default="Main Warehouse")
    low_stock_threshold = Column(Integer, default=10)
    created_at  = Column(DateTime, default=datetime.utcnow)
    dispatch_items = relationship("DispatchItem", back_populates="stock_item")


class Driver(Base):
    __tablename__ = "drivers"
    id               = Column(Integer, primary_key=True, index=True)
    name             = Column(String(100), nullable=False)
    email            = Column(String(150), unique=True, nullable=True)
    current_location = Column(Text, nullable=True)
    availability     = Column(Boolean, default=True)
    rating           = Column(Float, default=4.5)
    latitude         = Column(Float, nullable=True)
    longitude        = Column(Float, nullable=True)
    vehicle_type     = Column(String(50), default="Van")
    phone            = Column(String(20), nullable=True)
    total_deliveries = Column(Integer, default=0)
    dispatches       = relationship("Dispatch", back_populates="driver")


class Dispatch(Base):
    __tablename__ = "dispatches"
    id               = Column(Integer, primary_key=True, index=True)
    reference        = Column(String(30), unique=True, nullable=False)
    destination      = Column(Text, nullable=False)
    destination_lat  = Column(Float, nullable=True)
    destination_lng  = Column(Float, nullable=True)
    notes            = Column(Text, nullable=True)
    status           = Column(String(30), default="pending")
    priority         = Column(String(20), default="normal")
    assigned_driver  = Column(Integer, ForeignKey("drivers.id"), nullable=True)
    rejection_count  = Column(Integer, default=0)
    rejected_drivers = Column(Text, default="")
    created_by       = Column(String(100), nullable=True)
    created_at       = Column(DateTime, default=datetime.utcnow)
    updated_at       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    driver  = relationship("Driver", back_populates="dispatches")
    items   = relationship("DispatchItem", back_populates="dispatch", cascade="all, delete-orphan")


class DispatchItem(Base):
    __tablename__ = "dispatch_items"
    id            = Column(Integer, primary_key=True, index=True)
    dispatch_id   = Column(Integer, ForeignKey("dispatches.id"), nullable=False)
    stock_item_id = Column(Integer, ForeignKey("stock_items.id"), nullable=False)
    quantity      = Column(Integer, nullable=False)
    dispatch   = relationship("Dispatch",  back_populates="items")
    stock_item = relationship("StockItem", back_populates="dispatch_items")


# ── Pydantic ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str; email: str; password: str; role: str = "driver"

class TokenResponse(BaseModel):
    access_token: str; token_type: str = "bearer"
    role: str; name: str; user_id: int

class UserResponse(BaseModel):
    id: int; name: str; email: str; role: str
    class Config: from_attributes = True

class StockItemCreate(BaseModel):
    name: str; sku: str; category: str = "General"
    quantity: int = 0; unit: str = "units"
    warehouse: str = "Main Warehouse"; low_stock_threshold: int = 10

class StockItemUpdate(BaseModel):
    quantity: Optional[int] = None; category: Optional[str] = None
    low_stock_threshold: Optional[int] = None; name: Optional[str] = None

class StockItemResponse(BaseModel):
    id: int; name: str; sku: str; category: str
    quantity: int; unit: str; warehouse: str; low_stock_threshold: int
    class Config: from_attributes = True

class DispatchItemIn(BaseModel):
    stock_item_id: int; quantity: int

class DispatchCreate(BaseModel):
    destination: str
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None
    notes: Optional[str] = None
    priority: str = "normal"
    created_by: Optional[str] = None
    items: List[DispatchItemIn]

class DispatchItemResponse(BaseModel):
    stock_item_id: int; quantity: int
    stock_name: str; sku: str; unit: str
    class Config: from_attributes = True

class DispatchResponse(BaseModel):
    id: int; reference: str; destination: str
    notes: Optional[str]; status: str; priority: str
    assigned_driver: Optional[int]; rejection_count: int
    created_by: Optional[str]; created_at: datetime
    items: List[DispatchItemResponse] = []
    driver_name: Optional[str] = None
    class Config: from_attributes = True

class DriverResponse(BaseModel):
    id: int; name: str; current_location: Optional[str]
    availability: bool; rating: float; vehicle_type: str
    phone: Optional[str]; latitude: Optional[float]; longitude: Optional[float]
    total_deliveries: int
    class Config: from_attributes = True

class AssignmentResult(BaseModel):
    dispatch_id: int; driver_id: int; driver_name: str
    score: float; distance_km: float; eta_minutes: int; reason: str
