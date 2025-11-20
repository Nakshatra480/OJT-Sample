from django.urls import path
from . import views

urlpatterns = [
    path('', views.menu_list, name='menu_list'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('signup/', views.signup_view, name='signup'),
    path('menu/create/', views.create_menu, name='create_menu'),
    path('menu/<int:menu_id>/edit/', views.edit_menu, name='edit_menu'),
    path('builder/', views.menu_builder, name='menu_builder'),
    path('builder/<int:menu_id>/', views.menu_builder, name='menu_builder'),
    path('api/menu/<int:menu_id>/items/', views.get_menu_items, name='get_menu_items'),
    path('api/menu/<int:menu_id>/save/', views.save_menu_structure, name='save_menu_structure'),
    path('api/menu/<int:menu_id>/item/create/', views.create_menu_item, name='create_menu_item'),
    path('api/item/<int:item_id>/delete/', views.delete_menu_item, name='delete_menu_item'),
]

