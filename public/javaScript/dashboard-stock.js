
function showNotification(title, message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationTitle = document.getElementById('notificationTitle');
    const notificationMessage = document.getElementById('notificationMessage');
    
    notification.className = `notification ${type}`;
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Global variables
let currentOperation = null; // 'stock-in' or 'stock-out'
let bulkMode = false;
let cart = []; // Array to store cart items

// Initialize session storage
function initializeSession() {
  // Check if cart exists in session storage
  const savedCart = sessionStorage.getItem('inventoryCart');
  const savedOperation = sessionStorage.getItem('inventoryOperation');
  
  if (savedCart && savedOperation) {
    cart = JSON.parse(savedCart);
    currentOperation = savedOperation;
    updateCartDisplay();
  }
}

// Save to session storage
function saveToSession() {
  sessionStorage.setItem('inventoryCart', JSON.stringify(cart));
  if (currentOperation) {
    sessionStorage.setItem('inventoryOperation', currentOperation);
  }
}

// Toggle bulk mode
function toggleBulkMode() {
  bulkMode = !bulkMode;
  
  const bulkActionBar = document.getElementById('bulkActionBar');
  const checkboxes = document.querySelectorAll('.select-checkbox');
  
  if (bulkMode) {
    bulkActionBar.style.display = 'flex';
    checkboxes.forEach(checkbox => {
      checkbox.style.display = 'block';
    });
  } else {
    bulkActionBar.style.display = 'none';
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
      checkbox.style.display = 'none';
    });
    updateBulkSelectionCount();
  }
}

// Toggle select all
function toggleSelectAll() {
  const selectAllCheckbox = document.getElementById('selectAll');
  const productCheckboxes = document.querySelectorAll('.product-checkbox');
  
  productCheckboxes.forEach(checkbox => {
    checkbox.checked = selectAllCheckbox.checked;
  });
  
  updateBulkSelectionCount();
}

// Update bulk selection count
function updateBulkSelectionCount() {
  const selectedItems = document.querySelectorAll('.product-checkbox:checked');
  const countElement = document.querySelector('.bulk-action-count');
  
  countElement.textContent = selectedItems.length;
}

// Cancel bulk selection
function cancelBulkSelection() {
  const checkboxes = document.querySelectorAll('.select-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  
  updateBulkSelectionCount();
  toggleBulkMode();
}

// Add item to stock in cart
function addToStockIn(productId, weightId, productName, weight, price, currentStock, imageUrl) {
  if (currentOperation && currentOperation !== 'stock-in') {
    showNotification('Cannot mix operations', 'Please complete or clear your current stock-out operation first.', 'error');
    return;
  }
  
  currentOperation = 'stock-in';
  addToCart(productId, weightId, productName, weight, price, currentStock, imageUrl);
}

// Add item to stock out cart
function addToStockOut(productId, weightId, productName, weight, price, currentStock, imageUrl) {
  if (currentStock <= 0) {
    showNotification('Cannot stock out', 'This product is out of stock.', 'error');
    return;
  }
  
  if (currentOperation && currentOperation !== 'stock-out') {
    showNotification('Cannot mix operations', 'Please complete or clear your current stock-in operation first.', 'error');
    return;
  }
  
  currentOperation = 'stock-out';
  addToCart(productId, weightId, productName, weight, price, currentStock, imageUrl);
}

// Add to cart
function addToCart(productId, weightId, productName, weight, price, currentStock, imageUrl) {
  // Check if item already exists in cart
  const existingItemIndex = cart.findIndex(item => 
    item.productId === productId && item.weightId === weightId
  );
  
  if (existingItemIndex >= 0) {
    // Update existing item quantity
    cart[existingItemIndex].quantity += 1;
  } else {
    // Add new item to cart
    cart.push({
      productId,
      weightId,
      productName,
      weight,
      price,
      currentStock,
      quantity: 1,
      image_url: imageUrl
    });
  }
  
  updateCartDisplay();
  saveToSession();
  
  // Show notification
  showNotification(
    'Item Added', 
    `${productName} (${weight}) added to ${currentOperation === 'stock-in' ? 'stock in' : 'stock out'} cart.`,
    'success'
  );
}

// Bulk stock in
function bulkStockIn() {
  if (currentOperation && currentOperation !== 'stock-in') {
    showNotification('Cannot mix operations', 'Please complete or clear your current stock-out operation first.', 'error');
    return;
  }
  
  currentOperation = 'stock-in';
  processBulkSelection();
}

// Bulk stock out
function bulkStockOut() {
  if (currentOperation && currentOperation !== 'stock-out') {
    showNotification('Cannot mix operations', 'Please complete or clear your current stock-in operation first.', 'error');
    return;
  }
  
  currentOperation = 'stock-out';
  processBulkSelection();
}

// Process bulk selection
function processBulkSelection() {
  const selectedItems = document.querySelectorAll('.product-checkbox:checked');
  
  if (selectedItems.length === 0) {
    showNotification('No items selected', 'Please select at least one product.', 'error');
    return;
  }
  
  selectedItems.forEach(item => {
    const productId = parseInt(item.dataset.productId);
    const weightId = parseInt(item.dataset.weightId);
    const productName = item.dataset.name;
    const weight = item.dataset.weight;
    const price = parseFloat(item.dataset.price);
    const currentStock = parseInt(item.dataset.currentStock);

    // Get the image URL from the product row
    const productRow = item.closest('tr');
    const imageUrl = productRow.querySelector('.product-info img').src;

    // Skip out-of-stock items for stock-out operations
    if (currentOperation === 'stock-out' && currentStock <= 0) {
      return;
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(cartItem => 
      cartItem.productId === productId && cartItem.weightId === weightId
    );
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      cart[existingItemIndex].quantity += 1;
    } else {
      // Add new item to cart
      cart.push({
        productId,
        weightId,
        productName,
        weight,
        price,
        currentStock,
        quantity: 1,
        image_url: imageUrl
      });
    }
  });
  
  // Uncheck all checkboxes
  selectedItems.forEach(item => {
    item.checked = false;
  });
  document.getElementById('selectAll').checked = false;
  updateBulkSelectionCount();
  
  updateCartDisplay();
  saveToSession();
  
  showNotification(
    'Items Added', 
    `${selectedItems.length} items added to ${currentOperation === 'stock-in' ? 'stock in' : 'stock out'} cart.`,
    'success'
  );
}

// Update cart quantity
function updateQuantity(index, change) {
  cart[index].quantity += change;
  
  if (cart[index].quantity < 1) {
    cart[index].quantity = 1;
  }
  
  // For stock-out, don't allow quantity greater than current stock
  if (currentOperation === 'stock-out' && cart[index].quantity > cart[index].currentStock) {
    cart[index].quantity = cart[index].currentStock;
    showNotification('Maximum stock reached', 'Cannot stock out more than available quantity.', 'error');
  }
  
  updateCartDisplay();
  saveToSession();
}

// Remove item from cart
function removeFromCart(index) {
  cart.splice(index, 1);
  
  if (cart.length === 0) {
    currentOperation = null;
    sessionStorage.removeItem('inventoryOperation');
  }
  
  updateCartDisplay();
  saveToSession();
}

// Clear cart
function clearCart() {
  cart = [];
  currentOperation = null;
  sessionStorage.removeItem('inventoryCart');
  sessionStorage.removeItem('inventoryOperation');
  updateCartDisplay();
}

// Update cart display
function updateCartDisplay() {
  const emptyCartMessage = document.getElementById('emptyCartMessage');
  const cartTable = document.getElementById('cartTable');
  const cartItems = document.getElementById('cartItems');
  const cartActions = document.getElementById('cartActions');
  const clearCartButton = document.getElementById('clearCartButton');
  const operationHeader = document.getElementById('operationType');
  
  if (cart.length === 0) {
    emptyCartMessage.style.display = 'flex';
    cartTable.style.display = 'none';
    cartActions.style.display = 'none';
    clearCartButton.style.display = 'none';
    operationHeader.textContent = 'Select Operation';
  } else {
    emptyCartMessage.style.display = 'none';
    cartTable.style.display = 'table';
    cartActions.style.display = 'flex';
    clearCartButton.style.display = 'block';
    operationHeader.textContent = currentOperation === 'stock-in' ? 'Stock In' : 'Stock Out';
    
    // Set button class based on operation
    const processButton = document.getElementById('processButton');
    if (currentOperation === 'stock-in') {
      processButton.className = 'btn btn-success';
      processButton.textContent = 'Process Stock In';
    } else {
      processButton.className = 'btn btn-danger';
      processButton.textContent = 'Process Stock Out';
    }
    
    // Clear existing items
    cartItems.innerHTML = '';
    
    // Add items to cart table
    cart.forEach((item, index) => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>
          <div class="product-info">
            <img src="${item.image_url || '/assets/product-image/default.jpg'}" alt="${item.productName}" class="product-img">
            <div class="product-name">${item.productName}</div>
          </div>
        </td>
        <td>${item.weight}</td>
        <td>${item.currentStock} units</td>
        <td>
          <div class="stock-actions">
            <button class="btn btn-sm btn-outline" onclick="updateQuantity(${index}, -1)">-</button>
            <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${currentOperation === 'stock-out' ? item.currentStock : 9999}" onchange="setQuantity(${index}, this.value)">
            <button class="btn btn-sm btn-outline" onclick="updateQuantity(${index}, 1)">+</button>
          </div>
        </td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="removeFromCart(${index})">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
            </svg>
          </button>
        </td>
      `;
      
      cartItems.appendChild(row);
    });
  }
}

// Set quantity directly
function setQuantity(index, value) {
  let quantity = parseInt(value);
  
  if (isNaN(quantity) || quantity < 1) {
    quantity = 1;
  }
  
  // For stock-out, don't allow quantity greater than current stock
  if (currentOperation === 'stock-out' && quantity > cart[index].currentStock) {
    quantity = cart[index].currentStock;
    showNotification('Maximum stock reached', 'Cannot stock out more than available quantity.', 'error');
  }
  
  cart[index].quantity = quantity;
  updateCartDisplay();
  saveToSession();
}

// Process stock operation (open confirmation modal)
function processStockOperation() {
  if (cart.length === 0) {
    showNotification('No items in cart', 'Please add items to process.', 'error');
    return;
  }
  
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const confirmButton = document.getElementById('confirmButton');
  
  modalTitle.textContent = currentOperation === 'stock-in' ? 'Confirm Stock In' : 'Confirm Stock Out';
  
  let items = cart.map(item => `${item.productName} (${item.weight}) - ${item.quantity} units`).join('<br>');
  
  modalBody.innerHTML = `
    <p>Are you sure you want to ${currentOperation === 'stock-in' ? 'stock in' : 'stock out'} the following items?</p>
    <div style="margin: 15px 0; padding: 10px; border: 1px solid var(--gray-300); border-radius: var(--border-radius); max-height: 200px; overflow-y: auto;">
      ${items}
    </div>
    <p>This action will update the inventory database.</p>
  `;
  
  if (currentOperation === 'stock-in') {
    confirmButton.className = 'btn btn-success';
  } else {
    confirmButton.className = 'btn btn-danger';
  }
  
  openModal();
}

// Open modal
function openModal() {
  const modal = document.getElementById('confirmationModal');
  modal.style.display = 'flex';
}

// Close modal
function closeModal() {
  const modal = document.getElementById('confirmationModal');
  modal.style.display = 'none';
}

// Confirm operation
function confirmOperation() {
  closeModal();
  processStockOperation();
}

// Load products when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/dashboard/stock/products');
        const products = await response.json();
        renderProducts(products);
        initializeSession();
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error', 'Failed to load products', 'error');
    }
});

function renderProducts(products) {
    const tbody = document.querySelector('#productsTable tbody');
    tbody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');
        
        const stockStatus = getStockStatus(product.stock);
        const safeImageUrl = product.image_url ? `'${product.image_url}'` : "'/assets/product-image/default.jpg'";
        row.innerHTML = `
            <td>
                <div class="checkbox-container">
                    <input type="checkbox" class="select-checkbox product-checkbox" 
                        data-product-id="${product.product_id}" 
                        data-weight-id="${product.weight_id}" 
                        data-name="${product.name}" 
                        data-weight="${product.weight_value}${product.weight_unit}" 
                        data-price="${product.price}" 
                        data-current-stock="${product.stock}"
                        data-image-url="${safeImageUrl}">
                </div>
            </td>
            <td>
                <div class="product-info">
                    <img src="${product.image_url || '/assets/product-image/default.jpg'}" alt="${product.name}" class="product-img">
                    <div>
                        <div class="product-name">${product.name}</div>
                        <div class="product-category">${product.category_name}</div>
                    </div>
                </div>
            </td>
            <td>${product.weight_value}${product.weight_unit}</td>
            <td>
                <div class="stock-status">
                    <span class="status-indicator ${stockStatus.class}"></span>
                    ${product.stock} units
                </div>
            </td>
            <td>${formatDate(product.last_updated)}</td>
            <td>
                <div class="stock-actions">
                    <button class="btn btn-sm btn-success" onclick="addToStockIn(${product.product_id}, ${product.weight_id}, '${product.name}', '${product.weight_value}${product.weight_unit}', ${product.price}, ${product.stock}, ${safeImageUrl})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M8 15a.5.5 0 0 0 .5-.5V2.707l3.146 3.147a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 1 0 .708.708L7.5 2.707V14.5a.5.5 0 0 0 .5.5z"/>
                        </svg>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="addToStockOut(${product.product_id}, ${product.weight_id}, '${product.name}', '${product.weight_value}${product.weight_unit}', ${product.price}, ${product.stock}, ${safeImageUrl})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1z"/>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function getStockStatus(stock) {
    if (stock <= 0) {
        return { class: 'status-out-of-stock', text: 'Out of Stock' };
    } else if (stock <= 10) {
        return { class: 'status-low-stock', text: 'Low Stock' };
    } else {
        return { class: 'status-in-stock', text: 'In Stock' };
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Update the confirmOperation function
async function confirmOperation() {
    try {
        const response = await fetch('/dashboard/stock/operation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: cart,
                operation: currentOperation
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Success', 'Stock operation completed successfully', 'success');
            clearCart();
            closeModal();
            // Refresh product list
            const productsResponse = await fetch('/dashboard/stock/products');
            const products = await productsResponse.json();
            renderProducts(products);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Operation error:', error);
        showNotification('Error', 'Failed to process stock operation', 'error');
        closeModal();
    }
}

// Add this after the products are loaded
async function populateCategoryFilter() {
    try {
        const categories = await fetch('/dashboard/categories').then(res => res.json());
        const categoryFilter = document.getElementById('categoryFilter');
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        
        categories.forEach(category => {
            categoryFilter.innerHTML += `
                <option value="${category.name}">${category.name}</option>
            `;
        });
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Add these functions to handle filtering
function filterProducts() {
    const searchTerm = document.getElementById('searchProducts').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const stockFilter = document.getElementById('stockFilter').value;
    
    const rows = document.querySelectorAll('#productsTable tbody tr');
    
    rows.forEach(row => {
        const productName = row.querySelector('.product-name').textContent.toLowerCase();
        const category = row.querySelector('.product-category').textContent;
        const stock = parseInt(row.querySelector('.stock-status').textContent);
        
        let showRow = true;
        
        if (searchTerm && !productName.includes(searchTerm)) {
            showRow = false;
        }
        
        if (categoryFilter && category !== categoryFilter) {
            showRow = false;
        }
        
        if (stockFilter) {
            const status = getStockStatus(stock);
            if (stockFilter === 'in-stock' && status.text !== 'In Stock') {
                showRow = false;
            } else if (stockFilter === 'low-stock' && status.text !== 'Low Stock') {
                showRow = false;
            } else if (stockFilter === 'out-of-stock' && status.text !== 'Out of Stock') {
                showRow = false;
            }
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

// Add event listeners for filters
document.getElementById('searchProducts').addEventListener('input', filterProducts);
document.getElementById('categoryFilter').addEventListener('change', filterProducts);
document.getElementById('stockFilter').addEventListener('change', filterProducts);
