from django.core.management.base import BaseCommand
from api.models import Category, FoodItem, MealPlan, DeliveryPartner, Order, OrderItem

class Command(BaseCommand):
    help = 'Seeds initial database data for categories, food items, meal plans, delivery partners, and orders.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting database seeding...'))

        # 1. Categories
        cat_eggs, _ = Category.objects.get_or_create(slug='eggs-toast', defaults={'name': 'Eggs & Toast', 'icon': 'Egg', 'description': 'Protein-rich egg breakfasts & avocado toasts.'})
        cat_fruits, _ = Category.objects.get_or_create(slug='fruit-bowls', defaults={'name': 'Fruit Bowls', 'icon': 'Apple', 'description': 'Fresh seasonal fruit bowls packed with vitamins & antioxidants.'})
        cat_rice, _ = Category.objects.get_or_create(slug='rice-bowls', defaults={'name': 'Rice Bowls', 'icon': 'Utensils', 'description': 'Wholesome protein rice bowls with steamed salads.'})
        cat_salads, _ = Category.objects.get_or_create(slug='salads', defaults={'name': 'Healthy Salads', 'icon': 'Salad', 'description': 'Low-calorie fresh green vegetable salads.'})

        # 2. Food Items
        items_data = [
            {
                'id': 1,
                'name': 'Boiled Eggs (3 Eggs)',
                'description': 'Simple, healthy & protein rich. Perfectly boiled eggs served with pink salt and cracked black pepper.',
                'price': 50,
                'unit_info': '(3 EGGS)',
                'calories': 210,
                'protein': 18.0,
                'carbs': 2.0,
                'fat': 14.0,
                'fiber': 0.0,
                'category': cat_eggs,
                'ingredients': '3 Eggs, Pink Himalayan Salt, Cracked Black Pepper',
                'diet_type': 'non_veg',
                'is_bestseller': True,
                'is_available': True,
                'image_url': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80'
            },
            {
                'id': 2,
                'name': 'Scrambled Egg & Avocado Toast',
                'description': 'Creamy slow-scrambled eggs paired with fresh avocado paste on toasted multigrain sourdough bread.',
                'price': 100,
                'unit_info': '1 Plate',
                'calories': 410,
                'protein': 24.0,
                'carbs': 34.0,
                'fat': 22.0,
                'fiber': 9.0,
                'category': cat_eggs,
                'ingredients': 'Multigrain Bread, Hass Avocado, 3 Eggs, Extra Virgin Olive Oil, Microgreens',
                'diet_type': 'non_veg',
                'is_bestseller': True,
                'is_available': True,
                'image_url': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80'
            },
            {
                'id': 3,
                'name': 'Premium Berry & Fruit Bowl',
                'description': 'Pineapple, Dragon Fruit, Papaya, Guava, Blueberries, Kiwi & Honey Lime Glaze.',
                'price': 85,
                'unit_info': '350g Bowl',
                'calories': 220,
                'protein': 4.0,
                'carbs': 52.0,
                'fat': 1.0,
                'fiber': 8.0,
                'category': cat_fruits,
                'ingredients': 'Fresh Dragon Fruit, Kiwi, Blueberries, Papaya, Guava, Mint Leaves',
                'diet_type': 'vegan',
                'is_bestseller': True,
                'is_available': True,
                'image_url': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
            },
            {
                'id': 4,
                'name': 'Grilled Chicken Breast & Dal Rice Bowl',
                'description': 'Tender grilled chicken breast fillet served with high-protein yellow dal rice and steamed vegetable salad.',
                'price': 179,
                'unit_info': '450g Bowl',
                'calories': 480,
                'protein': 38.0,
                'carbs': 52.0,
                'fat': 12.0,
                'fiber': 7.0,
                'category': cat_rice,
                'ingredients': 'Chicken Breast (180g), Brown Basmati Rice, Yellow Dal, Broccoli, Carrots, Beans, Capsicum',
                'diet_type': 'non_veg',
                'is_bestseller': True,
                'is_available': True,
                'image_url': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
            },
            {
                'id': 5,
                'name': 'Paneer Tikka & Veg Pulao Bowl',
                'description': 'Low-fat grilled paneer cubes with aromatic vegetable pulao rice and crunchy garden salad.',
                'price': 179,
                'unit_info': '450g Bowl',
                'calories': 490,
                'protein': 26.0,
                'carbs': 54.0,
                'fat': 18.0,
                'fiber': 8.0,
                'category': cat_rice,
                'ingredients': 'Low-fat Paneer, Basmati Rice, Green Peas, Carrots, Broccoli, Bell Peppers',
                'diet_type': 'veg',
                'is_bestseller': True,
                'is_available': True,
                'image_url': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80'
            },
            {
                'id': 6,
                'name': 'Quinoa & Avocado Goddess Salad',
                'description': 'Superfood quinoa salad with diced Hass avocado, cherry tomatoes, cucumbers, baby spinach and lemon vinaigrette.',
                'price': 169,
                'unit_info': '350g Bowl',
                'calories': 320,
                'protein': 14.0,
                'carbs': 38.0,
                'fat': 14.0,
                'fiber': 11.0,
                'category': cat_salads,
                'ingredients': 'Organic White Quinoa, Hass Avocado, Cherry Tomatoes, Baby Spinach, Cucumber, Lemon Dressing',
                'diet_type': 'vegan',
                'is_bestseller': False,
                'is_available': True,
                'image_url': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80'
            }
        ]

        for item in items_data:
            FoodItem.objects.update_or_create(id=item['id'], defaults=item)

        # 3. Meal Plans
        MealPlan.objects.update_or_create(id=1, defaults={
            'name': 'Starter Plan',
            'tag': '1 Meal per Day',
            'meals_per_day': 1,
            'total_meals': 26,
            'duration_days': 30,
            'price': 4999,
            'description': 'Perfect for beginners focusing on a healthy daily lunch or breakfast routine.',
            'features': '1 Fresh Meal Daily, 26 Meals/Month, Calorie & Macro Tracked, Free Doorstep Delivery, Skip Any Day'
        })
        MealPlan.objects.update_or_create(id=2, defaults={
            'name': 'Standard Plan',
            'tag': 'Breakfast + Lunch',
            'meals_per_day': 2,
            'total_meals': 52,
            'duration_days': 30,
            'price': 8999,
            'description': 'Ideal for busy working professionals who want guilt-free morning and noon nutrition.',
            'features': 'Breakfast + Lunch Daily, 52 Meals/Month, Rotating Monthly Menu, Priority Morning Delivery, Skip Any Day'
        })
        MealPlan.objects.update_or_create(id=3, defaults={
            'name': 'Premium Plan',
            'tag': 'Breakfast + Lunch + Dinner',
            'meals_per_day': 3,
            'total_meals': 78,
            'duration_days': 30,
            'price': 12999,
            'description': 'Complete 360-degree monthly diet management for maximum health & fitness results.',
            'features': 'Breakfast + Lunch + Dinner, 78 Meals/Month, Full Macro Customization, VIP Delivery Slots, 1-on-1 Dietitian Integration'
        })

        # 4. Delivery Partners
        p1, _ = DeliveryPartner.objects.update_or_create(id=1, defaults={
            'name': 'Rahul Kumar',
            'phone': '+91 98765 43210',
            'email': 'rahul@delivery.com',
            'vehicle_number': 'TS 09 EQ 4521',
            'assigned_area': 'Hitech City & Madhapur',
            'rating': 4.9,
            'total_deliveries': 58
        })
        p2, _ = DeliveryPartner.objects.update_or_create(id=2, defaults={
            'name': 'Suresh Verma',
            'phone': '+91 98123 45678',
            'email': 'suresh@delivery.com',
            'vehicle_number': 'TS 08 AB 8812',
            'assigned_area': 'Gachibowli & Kondapur',
            'rating': 4.8,
            'total_deliveries': 42
        })
        p3, _ = DeliveryPartner.objects.update_or_create(id=3, defaults={
            'name': 'Priya Singh',
            'phone': '+91 97654 32109',
            'email': 'priya@delivery.com',
            'vehicle_number': 'TS 07 CD 3341',
            'assigned_area': 'Jubilee Hills & Banjara Hills',
            'rating': 5.0,
            'total_deliveries': 31
        })

        # 5. Initial Sample Orders
        food_chicken = FoodItem.objects.get(id=4)
        food_toast = FoodItem.objects.get(id=2)
        food_fruit = FoodItem.objects.get(id=3)

        o1, created1 = Order.objects.get_or_create(order_number='MYM-88912', defaults={
            'customer_name': 'Ananya Rao',
            'email': 'ananya@example.com',
            'phone': '+91 98765 12345',
            'delivery_address': 'Flat 402, Landmark Residency, Hitech City, Hyderabad',
            'landmark': 'Opposite Mindspace Gate 2',
            'delivery_area': 'Hitech City',
            'total_amount': 458.00,
            'payment_method': 'UPI',
            'payment_status': 'Paid',
            'status': 'Out for Delivery',
            'delivery_partner': p1
        })
        if created1:
            OrderItem.objects.create(order=o1, food_item=food_chicken, quantity=2, price=food_chicken.price)
            OrderItem.objects.create(order=o1, food_item=food_toast, quantity=1, price=food_toast.price)

        o2, created2 = Order.objects.get_or_create(order_number='MYM-91024', defaults={
            'customer_name': 'Vikram Sharma',
            'email': 'vikram@example.com',
            'phone': '+91 98111 22334',
            'delivery_address': 'Plot 18, Road No 36, Jubilee Hills, Hyderabad',
            'landmark': 'Near Peddamma Temple metro',
            'delivery_area': 'Jubilee Hills',
            'total_amount': 264.00,
            'payment_method': 'Card',
            'payment_status': 'Paid',
            'status': 'Preparing',
            'delivery_partner': p3
        })
        if created2:
            OrderItem.objects.create(order=o2, food_item=food_fruit, quantity=1, price=food_fruit.price)
            OrderItem.objects.create(order=o2, food_item=food_chicken, quantity=1, price=food_chicken.price)

        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
