"""
URL configuration for cms_project project.
"""
from django.urls import path, include
from menu_builder.admin_site import no_auth_admin

urlpatterns = [
    path('admin/', no_auth_admin.urls),  # No-auth admin site
    path('', include('menu_builder.urls')),
]

