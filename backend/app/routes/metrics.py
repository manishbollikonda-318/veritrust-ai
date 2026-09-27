from typing import Optional
from fastapi import APIRouter, Query
from app.models.schemas import MetricData
from app.services.metrics_tracker import metrics_tracker

router = APIRouter()

@router.get("/metrics", response_model=MetricData)
async def get_metrics(workspace_id: Optional[str] = Query(default=None)):
    return metrics_tracker.get_metrics(workspace_id=workspace_id)
