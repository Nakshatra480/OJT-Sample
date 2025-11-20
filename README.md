# Custom Menu Builder for Mini CMS

A drag-and-drop menu builder application built with Django, Python, HTML, CSS, and JavaScript.

## Features

- **Drag and Drop Interface**: Easily reorder menu items by dragging and dropping
- **Nested Menus**: Create multi-level menu structures with parent-child relationships
- **Live Preview**: See how your menu will look in real-time
- **Menu Management**: Create and manage multiple menus
- **Item Properties**: Set URLs, icons, CSS classes, and external link flags
- **Django Admin Integration**: Full admin interface for menu management

## Installation

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Migrations**:
   ```bash
   python manage.py migrate
   ```

3. **Create Superuser** (optional, for admin access):
   ```bash
   python manage.py createsuperuser
   ```

4. **Run Development Server**:
   ```bash
   python manage.py runserver
   ```

5. **Access the Application**:
   - Menu Builder: http://localhost:8000/
   - Admin Panel: http://localhost:8000/admin/

## Usage

### Creating a Menu

1. Go to the Django admin panel
2. Navigate to "Menu Builder" > "Menus"
3. Click "Add Menu"
4. Enter a name and slug for your menu
5. Save the menu

### Building a Menu

1. Go to the menu list page (homepage)
2. Click "Edit Menu" on any menu
3. Use the "Add Item" button to create menu items
4. Drag and drop items to reorder them
5. Click the "+" button to add child items
6. Click the edit icon (✎) to modify an item
7. Click "Save Menu" when done

### Menu Item Properties

- **Title**: Display text for the menu item
- **URL**: Link destination (e.g., `/about/` or `https://example.com`)
- **External URL**: Check if linking to an external site
- **Icon Class**: Optional icon (e.g., `fa fa-home`)
- **CSS Class**: Optional custom CSS class

## Project Structure

```
.
├── cms_project/          # Django project settings
├── menu_builder/         # Menu builder app
│   ├── models.py        # Menu and MenuItem models
│   ├── views.py         # View functions and API endpoints
│   ├── admin.py         # Django admin configuration
│   ├── urls.py          # URL routing
│   └── templates/       # HTML templates
├── static/              # Static files
│   ├── css/            # Stylesheets
│   └── js/             # JavaScript files
└── manage.py           # Django management script
```

## API Endpoints

- `GET /api/menu/<menu_id>/items/` - Get menu items as JSON
- `POST /api/menu/<menu_id>/save/` - Save menu structure
- `POST /api/menu/<menu_id>/item/create/` - Create new menu item
- `POST /api/item/<item_id>/delete/` - Delete menu item

## Technologies Used

- **Backend**: Django 4.2+
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: SQLite (default, can be changed in settings)

## License

This project is open source and available for use.

