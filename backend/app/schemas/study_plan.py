"""
Study Plan schemas for request/response validation
"""
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class StudyTopicSchema(BaseModel):
    """Schema for a single study topic"""
    id: int
    title: str
    duration: str
    difficulty: str  # Easy, Medium, Hard
    status: str = "not-started"  # completed, in-progress, not-started
    key_points: List[str] = []
    resources: List[str] = []


class WeekPlanSchema(BaseModel):
    """Schema for a week's study plan"""
    week: int
    title: str
    topics: List[StudyTopicSchema]


class StudyPlanCreateRequest(BaseModel):
    """Request to create a study plan from AI"""
    subject_name: str = Field(..., min_length=1, max_length=255)
    subject_icon: str = Field(default="book", max_length=50)
    subject_color: str = Field(default="#2563EB", max_length=20)
    description: Optional[str] = None
    plan_data: List[WeekPlanSchema]


class StudyPlanResponse(BaseModel):
    """Response for a single study plan"""
    id: int
    user_id: int
    subject_name: str
    subject_icon: str
    subject_color: str
    description: Optional[str]
    total_topics: int
    total_hours: int
    plan_data: list
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudyPlanListItem(BaseModel):
    """Lightweight response for listing study plans"""
    id: int
    subject_name: str
    subject_icon: str
    subject_color: str
    description: Optional[str]
    total_topics: int
    total_hours: int
    created_at: datetime

    class Config:
        from_attributes = True


class StudyPlanListResponse(BaseModel):
    """Response for listing all study plans"""
    success: bool = True
    message: str = "Study plans retrieved"
    data: List[StudyPlanListItem]


class StudyPlanDetailResponse(BaseModel):
    """Response for a single study plan detail"""
    success: bool = True
    message: str = "Study plan retrieved"
    data: StudyPlanResponse


class StudyPlanCreateResponse(BaseModel):
    """Response after creating a study plan"""
    success: bool = True
    message: str = "Study plan created successfully"
    data: StudyPlanResponse
