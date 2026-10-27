from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, FoodItemViewSet, MealPlanViewSet,
    SubscriptionViewSet, OrderViewSet, MonthlyMenuViewSet,
    DeliveryRouteViewSet, DeliveryPartnerViewSet, UserViewSet,
    custom_plan_recommendation, admin_analytics,
    login_view, register_view
)

router = DefaultRouter()
router.register('categories', CategoryViewSet)
router.register('food-items', FoodItemViewSet)
router.register('meal-plans', MealPlanViewSet)
router.register('subscriptions', SubscriptionViewSet)
router.register('orders', OrderViewSet)
router.register('monthly-menu', MonthlyMenuViewSet)
router.register('delivery-routes', DeliveryRouteViewSet)
router.register('delivery-partners', DeliveryPartnerViewSet)
router.register('users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('recommend-plan/', custom_plan_recommendation, name='custom_plan_recommendation'),
    path('admin-analytics/', admin_analytics, name='admin_analytics'),
    path('auth/login/', login_view, name='login_view'),
    path('auth/register/', register_view, name='register_view'),
]


