from django.urls import path
from .views import ProcessContentView, ChatStreamView

urlpatterns = [
    path('process/', ProcessContentView.as_view()),
    path('chat/', ChatStreamView.as_view()),
]
