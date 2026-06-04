from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.schemas import (Dispatch, DispatchItem, StockItem, Driver,
                             DispatchCreate, DispatchResponse, DispatchItemResponse)
from database.init_db import get_db
from services.assignment import assign_best_driver
from routes.auth import get_current_user
from models.schemas import User

router = APIRouter()


def _resp(d: Dispatch, db: Session) -> DispatchResponse:
    drv_name = None
    if d.assigned_driver:
        drv = db.get(Driver, d.assigned_driver)
        drv_name = drv.name if drv else None
    items = []
    for di in d.items:
        si = db.get(StockItem, di.stock_item_id)
        if si:
            items.append(DispatchItemResponse(
                stock_item_id=si.id, quantity=di.quantity,
                stock_name=si.name, sku=si.sku, unit=si.unit))
    return DispatchResponse(
        id=d.id, reference=d.reference, destination=d.destination,
        notes=d.notes, status=d.status, priority=d.priority,
        assigned_driver=d.assigned_driver, rejection_count=d.rejection_count,
        created_by=d.created_by, created_at=d.created_at,
        items=items, driver_name=drv_name)


@router.post("/", response_model=DispatchResponse, status_code=201)
def create_dispatch(payload: DispatchCreate, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    if current_user.role != "manager":
        raise HTTPException(403, "Only managers can create dispatches")

    for it in payload.items:
        stock = db.get(StockItem, it.stock_item_id)
        if not stock: raise HTTPException(404, f"Stock item {it.stock_item_id} not found")
        if stock.quantity < it.quantity:
            raise HTTPException(400, f"Insufficient stock for '{stock.name}': have {stock.quantity}, need {it.quantity}")

    count = db.query(Dispatch).count()
    ref   = f"DISP-{str(count + 1).zfill(4)}"

    dispatch = Dispatch(
        reference=ref, destination=payload.destination,
        destination_lat=payload.destination_lat,
        destination_lng=payload.destination_lng,
        notes=payload.notes, priority=payload.priority,
        created_by=payload.created_by or current_user.name,
        status="pending")
    db.add(dispatch); db.commit(); db.refresh(dispatch)

    for it in payload.items:
        stock = db.get(StockItem, it.stock_item_id)
        stock.quantity -= it.quantity
        db.add(DispatchItem(dispatch_id=dispatch.id,
                            stock_item_id=it.stock_item_id, quantity=it.quantity))
    db.commit()

    result = assign_best_driver(dispatch, db)
    if result:
        dispatch.assigned_driver = result.driver_id
        dispatch.status = "awaiting_driver"
        db.commit()

    db.refresh(dispatch)
    return _resp(dispatch, db)


@router.get("/", response_model=list[DispatchResponse])
def list_dispatches(db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    if current_user.role == "manager":
        dispatches = db.query(Dispatch).order_by(Dispatch.created_at.desc()).all()
    else:
        drv = db.query(Driver).filter(Driver.email == current_user.email).first()
        if not drv: return []
        dispatches = db.query(Dispatch).filter(
            Dispatch.assigned_driver == drv.id,
            Dispatch.status.in_(["awaiting_driver", "accepted", "in_transit"])
        ).order_by(Dispatch.created_at.desc()).all()
    return [_resp(d, db) for d in dispatches]


@router.get("/history/", response_model=list[DispatchResponse])
def dispatch_history(db: Session = Depends(get_db),
                     current_user: User = Depends(get_current_user)):
    drv = db.query(Driver).filter(Driver.email == current_user.email).first()
    if not drv: return []
    dispatches = db.query(Dispatch).filter(
        Dispatch.assigned_driver == drv.id,
        Dispatch.status.in_(["delivered", "cancelled"])
    ).order_by(Dispatch.created_at.desc()).limit(20).all()
    return [_resp(d, db) for d in dispatches]


@router.get("/{dispatch_id}/", response_model=DispatchResponse)
def get_dispatch(dispatch_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    d = db.get(Dispatch, dispatch_id)
    if not d: raise HTTPException(404, "Not found")
    return _resp(d, db)


@router.post("/{dispatch_id}/accept/", response_model=DispatchResponse)
def accept(dispatch_id: int, db: Session = Depends(get_db),
           current_user: User = Depends(get_current_user)):
    if current_user.role != "driver":
        raise HTTPException(403, "Only drivers can accept")
    d = db.get(Dispatch, dispatch_id)
    if not d: raise HTTPException(404, "Not found")
    if d.status != "awaiting_driver":
        raise HTTPException(400, f"Cannot accept — status is '{d.status}'")
    d.status = "accepted"
    db.commit(); db.refresh(d)
    return _resp(d, db)


@router.post("/{dispatch_id}/reject/", response_model=DispatchResponse)
def reject(dispatch_id: int, db: Session = Depends(get_db),
           current_user: User = Depends(get_current_user)):
    if current_user.role != "driver":
        raise HTTPException(403, "Only drivers can reject")
    d = db.get(Dispatch, dispatch_id)
    if not d: raise HTTPException(404, "Not found")
    if d.status != "awaiting_driver":
        raise HTTPException(400, "Not awaiting a driver")

    drv = db.query(Driver).filter(Driver.email == current_user.email).first()
    rejected = set(x for x in (d.rejected_drivers or "").split(",") if x)
    if drv: rejected.add(str(drv.id))
    d.rejected_drivers = ",".join(rejected)
    d.rejection_count += 1
    d.assigned_driver = None
    if drv: drv.availability = True
    db.commit()

    result = assign_best_driver(d, db)
    if result:
        d.assigned_driver = result.driver_id
        d.status = "awaiting_driver"
    else:
        d.status = "pending"
    db.commit(); db.refresh(d)
    return _resp(d, db)


@router.post("/{dispatch_id}/start/", response_model=DispatchResponse)
def start(dispatch_id: int, db: Session = Depends(get_db),
          current_user: User = Depends(get_current_user)):
    d = db.get(Dispatch, dispatch_id)
    if not d: raise HTTPException(404, "Not found")
    if d.status != "accepted": raise HTTPException(400, "Accept first")
    d.status = "in_transit"
    db.commit(); db.refresh(d)
    return _resp(d, db)


@router.post("/{dispatch_id}/deliver/", response_model=DispatchResponse)
def deliver(dispatch_id: int, db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user)):
    d = db.get(Dispatch, dispatch_id)
    if not d: raise HTTPException(404, "Not found")
    d.status = "delivered"
    if d.assigned_driver:
        drv = db.get(Driver, d.assigned_driver)
        if drv: drv.availability = True; drv.total_deliveries += 1
    db.commit(); db.refresh(d)
    return _resp(d, db)


@router.post("/{dispatch_id}/cancel/", response_model=DispatchResponse)
def cancel(dispatch_id: int, db: Session = Depends(get_db),
           current_user: User = Depends(get_current_user)):
    if current_user.role != "manager": raise HTTPException(403, "Managers only")
    d = db.get(Dispatch, dispatch_id)
    if not d: raise HTTPException(404, "Not found")
    if d.status in ("delivered", "cancelled"): raise HTTPException(400, "Cannot cancel")
    for di in d.items:
        stock = db.get(StockItem, di.stock_item_id)
        if stock: stock.quantity += di.quantity
    if d.assigned_driver:
        drv = db.get(Driver, d.assigned_driver)
        if drv: drv.availability = True
    d.status = "cancelled"
    db.commit(); db.refresh(d)
    return _resp(d, db)
