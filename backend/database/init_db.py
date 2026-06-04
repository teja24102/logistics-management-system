import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lms.db")
engine  = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
Session = sessionmaker(bind=engine)


def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from models.schemas import Base
    Base.metadata.create_all(bind=engine)
    _seed()


def _seed():
    from models.schemas import User, Driver, StockItem
    from passlib.context import CryptContext
    pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    db  = Session()

    if db.query(User).count() == 0:
        users = [
            User(name="Rajesh Kumar",  email="manager@lms.com",  hashed_password=pwd.hash("manager123"), role="manager"),
            User(name="Deepak Raj",    email="deepak@lms.com",   hashed_password=pwd.hash("driver123"),  role="driver"),
            User(name="Suresh Kumar",  email="suresh@lms.com",   hashed_password=pwd.hash("driver123"),  role="driver"),
            User(name="Mohan Verma",   email="mohan@lms.com",    hashed_password=pwd.hash("driver123"),  role="driver"),
        ]
        db.add_all(users); db.commit()
        print("✓ Users created")
        print("  manager@lms.com  / manager123")
        print("  deepak@lms.com   / driver123")
        print("  suresh@lms.com   / driver123")
        print("  mohan@lms.com    / driver123")

    if db.query(Driver).count() == 0:
        drivers = [
            Driver(name="Deepak Raj",  email="deepak@lms.com",  current_location="Hyderabad, Telangana",  availability=True,  rating=4.8, latitude=17.385, longitude=78.486, vehicle_type="Truck", phone="9876543210", total_deliveries=142),
            Driver(name="Suresh Kumar",email="suresh@lms.com",  current_location="Mumbai, Maharashtra",    availability=True,  rating=4.6, latitude=19.076, longitude=72.877, vehicle_type="Van",   phone="9876543211", total_deliveries=98),
            Driver(name="Mohan Verma", email="mohan@lms.com",   current_location="Delhi, NCR",             availability=True,  rating=4.9, latitude=28.613, longitude=77.209, vehicle_type="Truck", phone="9876543212", total_deliveries=210),
            Driver(name="Ravi Teja",   email="ravi@lms.com",    current_location="Chennai, Tamil Nadu",    availability=False, rating=4.4, latitude=13.082, longitude=80.270, vehicle_type="Van",   phone="9876543213", total_deliveries=67),
            Driver(name="Kiran Rao",   email="kiran@lms.com",   current_location="Bangalore, Karnataka",   availability=True,  rating=4.7, latitude=12.971, longitude=77.594, vehicle_type="Bike",  phone="9876543214", total_deliveries=55),
        ]
        db.add_all(drivers); db.commit()
        print("✓ Drivers created across India")

    if db.query(StockItem).count() == 0:
        stock = [
            StockItem(name="Rice Bags 25kg",     sku="RICE-25",  category="Grains",     quantity=240, unit="bags",    low_stock_threshold=20),
            StockItem(name="Wheat Flour 10kg",   sku="WFLR-10",  category="Grains",     quantity=180, unit="bags",    low_stock_threshold=15),
            StockItem(name="Cooking Oil 5L",     sku="OIL-5L",   category="Oils",       quantity=8,   unit="cans",    low_stock_threshold=10),
            StockItem(name="Sugar 50kg",         sku="SUGR-50",  category="Sweeteners", quantity=120, unit="bags",    low_stock_threshold=10),
            StockItem(name="Salt 1kg",           sku="SALT-1",   category="Condiments", quantity=500, unit="packets", low_stock_threshold=50),
            StockItem(name="Cement Bags 50kg",   sku="CEM-50",   category="Building",   quantity=300, unit="bags",    low_stock_threshold=30),
            StockItem(name="Steel Rods 12mm",    sku="STL-12",   category="Building",   quantity=6,   unit="bundles", low_stock_threshold=10),
            StockItem(name="Bottled Water 1L",   sku="WAT-1L",   category="Beverages",  quantity=600, unit="bottles", low_stock_threshold=100),
            StockItem(name="Electronic Boards",  sku="ELEC-B1",  category="Electronics",quantity=45,  unit="units",   low_stock_threshold=5),
            StockItem(name="Fertilizer 25kg",    sku="FERT-25",  category="Agriculture",quantity=85,  unit="bags",    low_stock_threshold=15),
        ]
        db.add_all(stock); db.commit()
        print("✓ Stock items created")

    db.close()


if __name__ == "__main__":
    init_db()
    print("✓ Database ready")
