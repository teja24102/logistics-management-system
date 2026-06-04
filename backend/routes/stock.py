from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.schemas import StockItem, StockItemCreate, StockItemUpdate, StockItemResponse
from database.init_db import get_db

router = APIRouter()


@router.get("/", response_model=list[StockItemResponse])
def list_stock(db: Session = Depends(get_db)):
    return db.query(StockItem).order_by(StockItem.category, StockItem.name).all()


@router.get("/low/", response_model=list[StockItemResponse])
def low_stock(db: Session = Depends(get_db)):
    return [i for i in db.query(StockItem).all() if i.quantity <= i.low_stock_threshold]


@router.post("/", response_model=StockItemResponse, status_code=201)
def add_item(p: StockItemCreate, db: Session = Depends(get_db)):
    if db.query(StockItem).filter(StockItem.sku == p.sku).first():
        raise HTTPException(400, f"SKU '{p.sku}' already exists")
    item = StockItem(**p.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item


@router.patch("/{item_id}/", response_model=StockItemResponse)
def update_item(item_id: int, p: StockItemUpdate, db: Session = Depends(get_db)):
    item = db.get(StockItem, item_id)
    if not item: raise HTTPException(404, "Item not found")
    for k, v in p.model_dump(exclude_none=True).items():
        setattr(item, k, v)
    db.commit(); db.refresh(item)
    return item


@router.delete("/{item_id}/", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(StockItem, item_id)
    if not item: raise HTTPException(404, "Item not found")
    db.delete(item); db.commit()
