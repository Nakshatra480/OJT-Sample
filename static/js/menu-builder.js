// Menu Builder JavaScript
class MenuBuilder {
    constructor() {
        this.menuId = window.menuId;
        this.menuItemsUrl = window.menuItemsUrl;
        this.saveMenuUrl = window.saveMenuUrl;
        this.createItemUrl = window.createItemUrl;
        this.deleteItemUrl = window.deleteItemUrl;
        this.items = [];
        this.currentEditingItem = null;
        this.draggedElement = null;
        
        this.init();
    }
    
    init() {
        this.loadMenuItems();
        this.setupEventListeners();
        this.setupDragAndDrop();
    }
    
    setupEventListeners() {
        // Save menu button
        const saveBtn = document.getElementById('save-menu');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveMenu());
        }
        
        // Add item button
        const addBtn = document.getElementById('add-item');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openItemModal());
        }
        
        // Menu selector
        const menuSelector = document.getElementById('menu-selector');
        if (menuSelector) {
            menuSelector.addEventListener('change', (e) => {
                window.location.href = `/builder/${e.target.value}/`;
            });
        }
        
        // Modal close
        const modal = document.getElementById('item-modal');
        const closeBtn = document.querySelector('.close');
        const cancelBtn = document.getElementById('cancel-edit');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
        
        // Form submit
        const form = document.getElementById('item-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveItem();
            });
        }
        
        // Delete button
        const deleteBtn = document.getElementById('delete-item');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteCurrentItem());
        }
    }
    
    async loadMenuItems() {
        try {
            const response = await fetch(this.menuItemsUrl);
            const data = await response.json();
            this.items = data;
            this.renderMenuStructure();
            this.renderMenuPreview();
        } catch (error) {
            console.error('Error loading menu items:', error);
            this.showError('Failed to load menu items');
        }
    }
    
    renderMenuStructure() {
        const container = document.getElementById('menu-structure');
        if (!container) return;
        
        if (this.items.length === 0) {
            container.innerHTML = `
                <div class="empty-menu">
                    <p>No menu items yet.</p>
                    <button class="btn btn-primary" onclick="menuBuilder.openItemModal()">Add First Item</button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.renderItems(this.items);
        this.attachItemEventListeners();
        // Re-initialize draggable after rendering
        setTimeout(() => this.makeItemsDraggable(), 50);
    }
    
    renderItems(items, parentId = null) {
        return items.map((item, index) => {
            const childrenHtml = item.children && item.children.length > 0
                ? `<div class="menu-item-children">${this.renderItems(item.children, item.id)}</div>`
                : '';
            
            return `
                <div class="drop-zone-before" data-drop-target="before-${item.id}"></div>
                <div class="menu-item" data-id="${item.id}" data-order="${index}" data-parent="${parentId || ''}">
                    <div class="drag-handle" title="Drag to reorder">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                            <circle cx="2" cy="2" r="1"/>
                            <circle cx="6" cy="2" r="1"/>
                            <circle cx="10" cy="2" r="1"/>
                            <circle cx="2" cy="6" r="1"/>
                            <circle cx="6" cy="6" r="1"/>
                            <circle cx="10" cy="6" r="1"/>
                            <circle cx="2" cy="10" r="1"/>
                            <circle cx="6" cy="10" r="1"/>
                            <circle cx="10" cy="10" r="1"/>
                        </svg>
                    </div>
                    <div class="menu-item-content">
                        <div class="menu-item-header">
                            <div class="menu-item-title">
                                ${item.icon ? `<i class="${item.icon}"></i> ` : ''}
                                ${item.title}
                            </div>
                            <div class="menu-item-url">${item.url}</div>
                            <div class="menu-item-actions">
                                <button class="menu-item-btn add-child" onclick="menuBuilder.addChildItem(${item.id})" title="Add Child">
                                    +
                                </button>
                                <button class="menu-item-btn edit" onclick="menuBuilder.editItem(${item.id})" title="Edit">
                                    ✎
                                </button>
                                <button class="menu-item-btn delete" onclick="menuBuilder.deleteItem(${item.id})" title="Delete">
                                    ×
                                </button>
                            </div>
                        </div>
                        ${childrenHtml}
                    </div>
                </div>
                <div class="drop-zone-after" data-drop-target="after-${item.id}"></div>
            `;
        }).join('');
    }
    
    renderMenuPreview() {
        const container = document.getElementById('menu-preview');
        if (!container) return;
        
        if (this.items.length === 0) {
            container.innerHTML = '<p style="color: #999;">No items to preview</p>';
            return;
        }
        
        container.innerHTML = this.renderPreviewItems(this.items);
    }
    
    renderPreviewItems(items) {
        const html = items.map(item => {
            const childrenHtml = item.children && item.children.length > 0
                ? `<ul class="children">${this.renderPreviewItems(item.children)}</ul>`
                : '';
            
            const hasChildren = item.children && item.children.length > 0;
            const url = item.is_external ? item.url : item.url;
            
            return `
                <li class="${hasChildren ? 'has-children' : ''}">
                    <a href="${url}" ${item.is_external ? 'target="_blank" rel="noopener"' : ''} 
                       class="${item.css_class || ''}">
                        ${item.icon ? `<i class="${item.icon}"></i> ` : ''}
                        ${item.title}
                    </a>
                    ${childrenHtml}
                </li>
            `;
        }).join('');
        
        return `<ul>${html}</ul>`;
    }
    
    attachItemEventListeners() {
        // Event listeners are attached via onclick in the HTML for simplicity
        // Drag and drop is handled separately
    }
    
    setupDragAndDrop() {
        const container = document.getElementById('menu-structure');
        if (!container) return;
        
        // Use event delegation for dynamic content
        container.addEventListener('dragstart', (e) => {
            const menuItem = e.target.closest('.menu-item');
            const dragHandle = e.target.closest('.drag-handle');
            if (menuItem && (dragHandle || e.target.closest('.menu-item-content'))) {
                this.draggedElement = menuItem;
                menuItem.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', menuItem.dataset.id);
                // Show all drop zones when dragging starts
                document.querySelectorAll('.drop-zone-before, .drop-zone-after').forEach(zone => {
                    zone.style.display = 'block';
                });
            }
        });
        
        container.addEventListener('dragend', (e) => {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem) {
                menuItem.classList.remove('dragging');
            }
            // Remove all drag-over classes and hide drop zones
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('drag-over');
            });
            document.querySelectorAll('.drop-zone-before, .drop-zone-after').forEach(zone => {
                zone.classList.remove('active');
                zone.style.display = '';
            });
            this.draggedElement = null;
        });
        
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            // Check if over a drop zone
            const dropZone = e.target.closest('.drop-zone-before, .drop-zone-after');
            if (dropZone && this.draggedElement) {
                // Remove active from all drop zones
                document.querySelectorAll('.drop-zone-before, .drop-zone-after').forEach(zone => {
                    zone.classList.remove('active');
                });
                dropZone.classList.add('active');
                return;
            }
            
            // Check if over a menu item
            const menuItem = e.target.closest('.menu-item');
            if (menuItem && menuItem !== this.draggedElement) {
                // Remove drag-over from all items first
                document.querySelectorAll('.menu-item').forEach(item => {
                    item.classList.remove('drag-over');
                });
                menuItem.classList.add('drag-over');
                
                // Show drop zones around this item
                const beforeZone = menuItem.previousElementSibling;
                const afterZone = menuItem.nextElementSibling;
                if (beforeZone && beforeZone.classList.contains('drop-zone-before')) {
                    beforeZone.style.display = 'block';
                }
                if (afterZone && afterZone.classList.contains('drop-zone-after')) {
                    afterZone.style.display = 'block';
                }
            }
        });
        
        container.addEventListener('dragleave', (e) => {
            const dropZone = e.target.closest('.drop-zone-before, .drop-zone-after');
            if (dropZone && !dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('active');
            }
            
            const menuItem = e.target.closest('.menu-item');
            if (menuItem && !menuItem.contains(e.relatedTarget)) {
                menuItem.classList.remove('drag-over');
            }
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            
            // Check if dropped on a drop zone
            const dropZone = e.target.closest('.drop-zone-before, .drop-zone-after');
            if (dropZone && this.draggedElement) {
                const targetId = dropZone.dataset.dropTarget.split('-').pop();
                const target = container.querySelector(`[data-id="${targetId}"]`);
                if (target) {
                    const isBefore = dropZone.classList.contains('drop-zone-before');
                    this.handleDrop(this.draggedElement, target, isBefore);
                }
            } else {
                // Check if dropped on a menu item
                const target = e.target.closest('.menu-item');
                if (target && this.draggedElement && target !== this.draggedElement) {
                    this.handleDrop(this.draggedElement, target, false);
                }
            }
            
            // Clean up
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('drag-over');
            });
            document.querySelectorAll('.drop-zone-before, .drop-zone-after').forEach(zone => {
                zone.classList.remove('active');
                zone.style.display = '';
            });
        });
        
        // Initial setup
        setTimeout(() => this.makeItemsDraggable(), 100);
    }
    
    makeItemsDraggable() {
        document.querySelectorAll('.menu-item').forEach(item => {
            // Make the entire item draggable, but prefer drag handle
            const dragHandle = item.querySelector('.drag-handle');
            if (dragHandle) {
                dragHandle.setAttribute('draggable', 'true');
                dragHandle.style.cursor = 'grab';
            }
            // Also allow dragging from the content area
            const content = item.querySelector('.menu-item-content');
            if (content) {
                content.setAttribute('draggable', 'true');
            }
        });
    }
    
    handleDrop(dragged, target, insertBefore = false) {
        const draggedId = parseInt(dragged.dataset.id);
        const targetId = parseInt(target.dataset.id);
        
        // Don't allow dropping on itself
        if (draggedId === targetId) return;
        
        // Don't allow dropping a parent into its own child
        if (this.isDescendant(draggedId, targetId)) return;
        
        // Find items in data structure
        const draggedItem = this.findItemById(draggedId);
        const targetItem = this.findItemById(targetId);
        
        if (!draggedItem || !targetItem) return;
        
        // Remove dragged item from its current position
        this.removeItemFromStructure(draggedId);
        
        // Find target position
        const targetParent = this.findItemParent(targetId);
        const targetIndex = targetParent ? 
            targetParent.children.findIndex(item => item.id === targetId) : 
            this.items.findIndex(item => item.id === targetId);
        
        // Insert at the correct position
        const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
        
        if (targetParent) {
            targetParent.children.splice(insertIndex, 0, draggedItem);
        } else {
            this.items.splice(insertIndex, 0, draggedItem);
        }
        
        this.renderMenuStructure();
        this.renderMenuPreview();
    }
    
    isDescendant(parentId, childId) {
        const parent = this.findItemById(parentId);
        if (!parent || !parent.children) return false;
        
        for (const child of parent.children) {
            if (child.id === childId) return true;
            if (this.isDescendant(child.id, childId)) return true;
        }
        return false;
    }
    
    findItemById(id, items = null) {
        items = items || this.items;
        for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
                const found = this.findItemById(id, item.children);
                if (found) return found;
            }
        }
        return null;
    }
    
    findItemParent(id, items = null, parent = null) {
        items = items || this.items;
        for (const item of items) {
            if (item.id === id) return parent;
            if (item.children) {
                const found = this.findItemParent(id, item.children, item);
                if (found !== null) return found;
            }
        }
        return null;
    }
    
    removeItemFromStructure(id, items = null) {
        items = items || this.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].id === id) {
                items.splice(i, 1);
                return true;
            }
            if (items[i].children) {
                if (this.removeItemFromStructure(id, items[i].children)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    openItemModal(itemId = null, parentId = null) {
        const modal = document.getElementById('item-modal');
        const form = document.getElementById('item-form');
        
        if (itemId) {
            const item = this.findItemById(itemId);
            if (item) {
                document.getElementById('item-id').value = item.id;
                document.getElementById('item-title').value = item.title;
                document.getElementById('item-url').value = item.url;
                document.getElementById('item-external').checked = item.is_external;
                document.getElementById('item-icon').value = item.icon || '';
                document.getElementById('item-css-class').value = item.css_class || '';
                document.getElementById('item-parent-id').value = parentId || '';
                document.getElementById('modal-title').textContent = 'Edit Menu Item';
                document.getElementById('delete-item').style.display = 'inline-block';
                this.currentEditingItem = item;
            }
        } else {
            form.reset();
            document.getElementById('item-id').value = '';
            document.getElementById('item-parent-id').value = parentId || '';
            document.getElementById('modal-title').textContent = 'Add Menu Item';
            document.getElementById('delete-item').style.display = 'none';
            this.currentEditingItem = null;
        }
        
        modal.classList.add('show');
    }
    
    closeModal() {
        const modal = document.getElementById('item-modal');
        modal.classList.remove('show');
        this.currentEditingItem = null;
    }
    
    async saveItem() {
        const itemId = document.getElementById('item-id').value;
        const title = document.getElementById('item-title').value;
        const url = document.getElementById('item-url').value;
        const isExternal = document.getElementById('item-external').checked;
        const icon = document.getElementById('item-icon').value;
        const cssClass = document.getElementById('item-css-class').value;
        const parentId = document.getElementById('item-parent-id').value;
        
        if (!title || !url) {
            alert('Title and URL are required');
            return;
        }
        
        if (itemId) {
            // Update existing item
            const item = this.findItemById(parseInt(itemId));
            if (item) {
                item.title = title;
                item.url = url;
                item.is_external = isExternal;
                item.icon = icon;
                item.css_class = cssClass;
                this.renderMenuStructure();
                this.renderMenuPreview();
                this.closeModal();
            }
        } else {
            // Create new item
            try {
                const response = await fetch(this.createItemUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.getCsrfToken(),
                    },
                    body: JSON.stringify({
                        title,
                        url,
                        is_external: isExternal,
                        icon,
                        css_class: cssClass,
                        parent_id: parentId || null,
                        order: this.items.length,
                    }),
                });
                
                const data = await response.json();
                if (data.success) {
                    await this.loadMenuItems();
                    this.closeModal();
                } else {
                    alert('Error creating item: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error creating item:', error);
                alert('Failed to create menu item');
            }
        }
    }
    
    editItem(itemId) {
        const item = this.findItemById(itemId);
        if (item) {
            const parent = this.findItemParent(itemId);
            this.openItemModal(itemId, parent ? parent.id : null);
        }
    }
    
    addChildItem(parentId) {
        this.openItemModal(null, parentId);
    }
    
    async deleteItem(itemId) {
        if (!confirm('Are you sure you want to delete this menu item and all its children?')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.deleteItemUrl}${itemId}/delete/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': this.getCsrfToken(),
                },
            });
            
            const data = await response.json();
            if (data.success) {
                await this.loadMenuItems();
            } else {
                alert('Error deleting item');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete menu item');
        }
    }
    
    deleteCurrentItem() {
        const itemId = document.getElementById('item-id').value;
        if (itemId) {
            this.closeModal();
            this.deleteItem(parseInt(itemId));
        }
    }
    
    async saveMenu() {
        const saveBtn = document.getElementById('save-menu');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
        try {
            // Flatten structure for saving
            const flatStructure = this.flattenStructure(this.items);
            
            const response = await fetch(this.saveMenuUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken(),
                },
                body: JSON.stringify(flatStructure),
            });
            
            const data = await response.json();
            if (data.success) {
                this.showSuccess('Menu saved successfully!');
                await this.loadMenuItems();
            } else {
                alert('Error saving menu: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving menu:', error);
            alert('Failed to save menu');
        } finally {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    }
    
    flattenStructure(items, parentId = null, order = 0) {
        const result = [];
        items.forEach((item, index) => {
            const flatItem = {
                id: item.id,
                title: item.title,
                url: item.url,
                order: order + index,
                is_external: item.is_external,
                css_class: item.css_class || '',
                icon: item.icon || '',
                children: [],
            };
            
            if (item.children && item.children.length > 0) {
                flatItem.children = this.flattenStructure(item.children, item.id, 0);
            }
            
            result.push(flatItem);
        });
        return result;
    }
    
    getCsrfToken() {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'csrftoken') {
                return value;
            }
        }
        return '';
    }
    
    showSuccess(message) {
        // Create or update success message
        let successMsg = document.querySelector('.success-message');
        if (!successMsg) {
            successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            const container = document.querySelector('.menu-builder-container');
            container.insertBefore(successMsg, container.firstChild);
        }
        successMsg.textContent = message;
        successMsg.classList.add('show');
        
        setTimeout(() => {
            successMsg.classList.remove('show');
        }, 3000);
    }
    
    showError(message) {
        alert(message);
    }
}

// Initialize menu builder when DOM is ready
let menuBuilder;
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.menuId !== 'undefined') {
        menuBuilder = new MenuBuilder();
    }
});

