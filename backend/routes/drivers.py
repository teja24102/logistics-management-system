from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.schemas import Driver, DriverResponse
from database.init_db import get_db
from routes.auth import get_current_user
from models.schemas import User

router = APIRouter()


@router.get("/", response_model=list[DriverResponse])
def list_drivers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Driver).all()


@router.get("/me/", response_model=DriverResponse)
def my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    drv = db.query(Driver).filter(Driver.email == current_user.email).first()
    if not drv: raise HTTPException(404, "Driver profile not found")
    return drv


@router.post("/{driver_id}/location/")
def update_location(driver_id: int, lat: float, lng: float,
                    db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    drv = db.get(Driver, driver_id)
    if not drv: raise HTTPException(404, "Not found")
    drv.latitude = lat; drv.longitude = lng
    db.commit()
    return {"status": "updated"}
