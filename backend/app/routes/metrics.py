from fastapi import APIRouter
from app.models.schemas import MetricData
from app.services.metrics_tracker import metrics_tracker

router = APIRouter()

@router.get("/metrics", response_model=MetricData)
async def get_metrics():
    return metrics_tracker.get_metrics()
