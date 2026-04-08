from django.urls import path
from .views import SessionDetailView, AllSessionsView

urlpatterns = [
    path('sessions/', AllSessionsView.as_view()),
    path('sessions/<int:session_id>/', SessionDetailView.as_view()),
]
