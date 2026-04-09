from django.urls import path, include

urlpatterns = [
    path('api/content/', include('content.urls')),
]
