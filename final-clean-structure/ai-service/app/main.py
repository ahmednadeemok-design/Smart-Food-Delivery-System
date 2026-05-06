from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

from app.recommendation.recommender import recommend_food
from app.routing.multi_order_optimizer import optimize_multi_order_route
from app.routing.route_predictor import predict_route_eta
from app.complaints.intent_detector import detect_intent
from app.complaints.complaint_chatbot import generate_complaint_reply
from app.complaints.refund_decision import decide_refund
from app.prediction.kitchen_load_predictor import predict_kitchen_load
from app.prediction.delivery_time_predictor import predict_delivery_time
from app.prediction.order_accuracy_predictor import predict_order_accuracy
from app.prediction.freshness_score import calculate_freshness_score
from app.health.calorie_tracker import calculate_calories
from app.health.goal_based_food_filter import filter_food_by_goal

app = FastAPI(title="Smart Food AI Service", version="1.0.0")

class FoodItem(BaseModel):
    id: str
    name: str
    category: Optional[str] = ""
    tags: List[str] = []
    calories: int = 0
    taste_score: int = 100
    price: float = 0

class RecommendationRequest(BaseModel):
    user_goal: Optional[str] = ""
    time_of_day: Optional[str] = ""
    location: Optional[str] = ""
    past_orders: List[str] = []
    food_items: List[FoodItem]

class Stop(BaseModel):
    id: str
    lat: float
    lng: float
    label: str

class RouteRequest(BaseModel):
    start_lat: float
    start_lng: float
    stops: List[Stop]

class ComplaintRequest(BaseModel):
    message: str
    order_status: Optional[str] = ""
    freshness_score: Optional[int] = 100
    order_total: Optional[float] = 0

class KitchenLoadRequest(BaseModel):
    active_orders: int
    average_preparation_time: Optional[int] = 20

class DeliveryTimeRequest(BaseModel):
    distance_km: float
    kitchen_load: str = "low"
    weather: str = "normal"
    emergency_mode: bool = False

class AccuracyRequest(BaseModel):
    total_orders: int
    wrong_item_complaints: int
    missing_item_complaints: int

class FreshnessRequest(BaseModel):
    estimated_minutes: int
    actual_minutes: int
    weather: str = "normal"

class CalorieRequest(BaseModel):
    items: List[FoodItem]

class GoalFilterRequest(BaseModel):
    goal: str
    items: List[FoodItem]

@app.get("/")
def health_check():
    return {"success": True, "message": "Smart Food AI Service is running"}

@app.post("/recommendations")
def recommendations(payload: RecommendationRequest):
    return {"success": True, "data": recommend_food(payload.dict())}

@app.post("/route/optimize")
def route_optimize(payload: RouteRequest):
    return {"success": True, "data": optimize_multi_order_route(payload.dict())}

@app.post("/route/eta")
def route_eta(payload: DeliveryTimeRequest):
    return {"success": True, "data": predict_route_eta(payload.dict())}

@app.post("/complaints/intent")
def complaint_intent(payload: ComplaintRequest):
    intent = detect_intent(payload.message)
    return {"success": True, "data": {"intent": intent, "reply": generate_complaint_reply(intent)}}

@app.post("/complaints/refund")
def complaint_refund(payload: ComplaintRequest):
    intent = detect_intent(payload.message)
    return {"success": True, "data": decide_refund(intent, payload.order_status, payload.freshness_score, payload.order_total)}

@app.post("/prediction/kitchen-load")
def kitchen_load(payload: KitchenLoadRequest):
    return {"success": True, "data": predict_kitchen_load(payload.active_orders, payload.average_preparation_time)}

@app.post("/prediction/delivery-time")
def delivery_time(payload: DeliveryTimeRequest):
    return {"success": True, "data": predict_delivery_time(payload.dict())}

@app.post("/prediction/order-accuracy")
def order_accuracy(payload: AccuracyRequest):
    return {"success": True, "data": predict_order_accuracy(payload.total_orders, payload.wrong_item_complaints, payload.missing_item_complaints)}

@app.post("/prediction/freshness-score")
def freshness(payload: FreshnessRequest):
    return {"success": True, "data": calculate_freshness_score(payload.estimated_minutes, payload.actual_minutes, payload.weather)}

@app.post("/health/calories")
def calories(payload: CalorieRequest):
    return {"success": True, "data": calculate_calories(payload.dict())}

@app.post("/health/goal-filter")
def goal_filter(payload: GoalFilterRequest):
    return {"success": True, "data": filter_food_by_goal(payload.goal, payload.dict()["items"])}
