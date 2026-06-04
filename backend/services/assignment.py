import math
from sqlalchemy.orm import Session
from models.schemas import Driver, Dispatch, AssignmentResult


def _haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def assign_best_driver(dispatch: Dispatch, db: Session) -> AssignmentResult | None:
    already_rejected = set(
        int(x) for x in (dispatch.rejected_drivers or "").split(",") if x.strip()
    )
    candidates = db.query(Driver).filter(
        Driver.availability == True,
        ~Driver.id.in_(already_rejected)
    ).all()

    if not candidates:
        return None

    # Default to Delhi if no coords
    dest_lat = dispatch.destination_lat or 28.613
    dest_lng = dispatch.destination_lng or 77.209
    priority_bonus = {"urgent": 10, "high": 5, "normal": 2}.get(dispatch.priority, 2)

    best, best_score, best_dist = None, -1, 0.0

    for d in candidates:
        dlat = d.latitude  or 20.593
        dlng = d.longitude or 78.962
        dist = _haversine(dlat, dlng, dest_lat, dest_lng)

        dist_score     = max(0, 40 * (1 - dist / 2000))   # scaled for all-India (max ~2000km)
        rating_score   = (d.rating / 5.0) * 30
        active         = db.query(Dispatch).filter(
            Dispatch.assigned_driver == d.id,
            Dispatch.status.in_(["awaiting_driver", "accepted", "in_transit"])
        ).count()
        workload_score = max(0, 20 - active * 7)
        score = dist_score + rating_score + workload_score + priority_bonus

        if score > best_score:
            best_score = score; best = d; best_dist = dist

    if not best:
        return None

    best.availability = False
    db.commit()

    eta = max(30, int((best_dist / 60) * 60))   # assume 60km/h avg
    return AssignmentResult(
        dispatch_id=dispatch.id, driver_id=best.id, driver_name=best.name,
        score=round(best_score, 1), distance_km=round(best_dist, 1),
        eta_minutes=eta,
        reason=f"Best driver — {best_dist:.0f}km away, rating ★{best.rating}, score {best_score:.0f}/100"
    )
