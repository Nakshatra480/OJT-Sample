from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
import json
from .models import Menu, MenuItem
from .forms import MenuForm


def signup_view(request):
    """User registration view"""
    if request.user.is_authenticated:
        return redirect('menu_list')
    
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            username = form.cleaned_data.get('username')
            messages.success(request, f'Account created successfully for {username}! You can now log in.')
            return redirect('login')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = UserCreationForm()
    
    return render(request, 'menu_builder/signup.html', {'form': form})


def login_view(request):
    """User login view"""
    if request.user.is_authenticated:
        return redirect('menu_list')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            next_url = request.GET.get('next', 'menu_list')
            return redirect(next_url)
        else:
            messages.error(request, 'Invalid username or password.')
    
    return render(request, 'menu_builder/login.html')


def logout_view(request):
    """User logout view"""
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('login')


def menu_builder(request, menu_id=None):
    """Main menu builder interface"""
    if menu_id:
        menu = get_object_or_404(Menu, id=menu_id)
    else:
        # Get the first menu or create a default one
        menu = Menu.objects.first()
        if not menu:
            menu = Menu.objects.create(name="Main Menu", slug="main-menu")
    
    menus = Menu.objects.all()
    return render(request, 'menu_builder/builder.html', {
        'menu': menu,
        'menus': menus,
    })


def menu_list(request):
    """List all menus"""
    menus = Menu.objects.all()
    return render(request, 'menu_builder/menu_list.html', {
        'menus': menus,
    })


def create_menu(request):
    """Create a new menu"""
    if request.method == 'POST':
        form = MenuForm(request.POST)
        if form.is_valid():
            menu = form.save(commit=False)
            # Auto-generate slug if not provided
            if not menu.slug:
                from django.utils.text import slugify
                menu.slug = slugify(menu.name)
                # Ensure slug is unique
                base_slug = menu.slug
                counter = 1
                while Menu.objects.filter(slug=menu.slug).exists():
                    menu.slug = f"{base_slug}-{counter}"
                    counter += 1
            else:
                # If slug is provided, ensure it's unique
                from django.utils.text import slugify
                original_slug = menu.slug
                base_slug = slugify(original_slug)
                menu.slug = base_slug
                counter = 1
                while Menu.objects.filter(slug=menu.slug).exists():
                    menu.slug = f"{base_slug}-{counter}"
                    counter += 1
            menu.save()
            messages.success(request, f'Menu "{menu.name}" created successfully!')
            return redirect('menu_builder', menu_id=menu.id)
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = MenuForm()
    
    return render(request, 'menu_builder/create_menu.html', {
        'form': form,
    })


def edit_menu(request, menu_id):
    """Edit menu settings"""
    menu = get_object_or_404(Menu, id=menu_id)
    
    if request.method == 'POST':
        form = MenuForm(request.POST, instance=menu)
        if form.is_valid():
            menu = form.save(commit=False)
            # Handle slug uniqueness (allow current menu's slug)
            from django.utils.text import slugify
            if menu.slug:
                original_slug = menu.slug
                base_slug = slugify(original_slug)
                menu.slug = base_slug
                # Check if slug exists for another menu
                existing_menu = Menu.objects.filter(slug=menu.slug).exclude(id=menu.id).first()
                if existing_menu:
                    counter = 1
                    while Menu.objects.filter(slug=menu.slug).exclude(id=menu.id).exists():
                        menu.slug = f"{base_slug}-{counter}"
                        counter += 1
            else:
                # Auto-generate if empty
                menu.slug = slugify(menu.name)
                counter = 1
                while Menu.objects.filter(slug=menu.slug).exclude(id=menu.id).exists():
                    menu.slug = f"{slugify(menu.name)}-{counter}"
                    counter += 1
            menu.save()
            messages.success(request, f'Menu "{menu.name}" updated successfully!')
            return redirect('menu_builder', menu_id=menu.id)
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = MenuForm(instance=menu)
    
    return render(request, 'menu_builder/edit_menu.html', {
        'form': form,
        'menu': menu,
    })


@require_http_methods(["GET"])
def get_menu_items(request, menu_id):
    """API endpoint to get menu items as JSON"""
    menu = get_object_or_404(Menu, id=menu_id)
    items = menu.items.filter(parent=None).order_by('order')
    
    def serialize_item(item):
        # Get all children, not just active ones (for builder)
        children = item.children.all().order_by('order')
        return {
            'id': item.id,
            'title': item.title,
            'url': item.url,
            'order': item.order,
            'is_external': item.is_external,
            'css_class': item.css_class,
            'icon': item.icon,
            'children': [serialize_item(child) for child in children],
        }
    
    data = [serialize_item(item) for item in items]
    return JsonResponse(data, safe=False)


@csrf_exempt
@require_http_methods(["POST"])
def save_menu_structure(request, menu_id):
    """API endpoint to save menu structure"""
    menu = get_object_or_404(Menu, id=menu_id)
    
    try:
        data = json.loads(request.body)
        
        # Collect all item IDs that should exist
        def collect_item_ids(items, item_ids=None):
            if item_ids is None:
                item_ids = set()
            for item_data in items:
                item_id = item_data.get('id')
                if item_id:
                    item_ids.add(item_id)
                if 'children' in item_data and item_data['children']:
                    collect_item_ids(item_data['children'], item_ids)
            return item_ids
        
        valid_item_ids = collect_item_ids(data)
        
        # Delete items that are no longer in the structure
        existing_items = MenuItem.objects.filter(menu=menu)
        for item in existing_items:
            if item.id not in valid_item_ids:
                item.delete()
        
        def save_items(items, parent=None, order=0):
            for item_data in items:
                item_id = item_data.get('id')
                if item_id:
                    try:
                        item = MenuItem.objects.get(id=item_id, menu=menu)
                        item.title = item_data.get('title', item.title)
                        item.url = item_data.get('url', item.url)
                        item.order = order
                        item.parent = parent
                        item.is_external = item_data.get('is_external', False)
                        item.css_class = item_data.get('css_class', '')
                        item.icon = item_data.get('icon', '')
                        item.save()
                    except MenuItem.DoesNotExist:
                        # Item doesn't exist, create it
                        item = MenuItem.objects.create(
                            menu=menu,
                            parent=parent,
                            title=item_data.get('title', 'New Item'),
                            url=item_data.get('url', '#'),
                            order=order,
                            is_external=item_data.get('is_external', False),
                            css_class=item_data.get('css_class', ''),
                            icon=item_data.get('icon', ''),
                        )
                else:
                    # Create new item
                    item = MenuItem.objects.create(
                        menu=menu,
                        parent=parent,
                        title=item_data.get('title', 'New Item'),
                        url=item_data.get('url', '#'),
                        order=order,
                        is_external=item_data.get('is_external', False),
                        css_class=item_data.get('css_class', ''),
                        icon=item_data.get('icon', ''),
                    )
                
                # Recursively save children
                if 'children' in item_data and item_data['children']:
                    save_items(item_data['children'], parent=item, order=0)
                
                order += 1
        
        # Save the structure
        save_items(data)
        
        return JsonResponse({'success': True, 'message': 'Menu structure saved successfully'})
    except Exception as e:
        import traceback
        return JsonResponse({'success': False, 'error': str(e), 'traceback': traceback.format_exc()}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def delete_menu_item(request, item_id):
    """API endpoint to delete a menu item"""
    item = get_object_or_404(MenuItem, id=item_id)
    item.delete()
    return JsonResponse({'success': True, 'message': 'Menu item deleted successfully'})


@csrf_exempt
@require_http_methods(["POST"])
def create_menu_item(request, menu_id):
    """API endpoint to create a new menu item"""
    menu = get_object_or_404(Menu, id=menu_id)
    
    try:
        data = json.loads(request.body)
        parent_id = data.get('parent_id')
        parent = None
        if parent_id:
            parent = MenuItem.objects.get(id=parent_id, menu=menu)
        
        item = MenuItem.objects.create(
            menu=menu,
            parent=parent,
            title=data.get('title', 'New Item'),
            url=data.get('url', '#'),
            order=data.get('order', 0),
            is_external=data.get('is_external', False),
            css_class=data.get('css_class', ''),
            icon=data.get('icon', ''),
        )
        
        return JsonResponse({
            'success': True,
            'item': {
                'id': item.id,
                'title': item.title,
                'url': item.url,
                'order': item.order,
                'is_external': item.is_external,
                'css_class': item.css_class,
                'icon': item.icon,
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

