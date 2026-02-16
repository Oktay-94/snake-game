const CART_MANAGER = {
  getCart() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  },
  
  removeFromCart(productId) {
    let cart = this.getCart();
    cart = cart.filter(id => id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    return cart;
  },
  
  getCartCount() {
    return this.getCart().length;
  }
};

const UI_MANAGER = {
  showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }
  },
  
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  },
  
  showToast(message, type = 'success') {
    const notificationArea = document.getElementById('notification-area');
    if (!notificationArea) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    notificationArea.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },
  
  updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
      const count = CART_MANAGER.getCartCount();
      badge.textContent = count;
      if (count > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }
};

async function loadCartProducts() {
  try {
    const response = await fetch('./data/products.json');
    if (!response.ok) {
      throw new Error('Fehler beim Laden der Produkte');
    }
    const data = await response.json();
    const products = data.products || [];
    
    const cartIds = CART_MANAGER.getCart();
    const cartProducts = [];
    
    for (const id of cartIds) {
      const product = products.find(p => p.id === id);
      if (product) {
        cartProducts.push(product);
      } else {
        console.warn(`Produkt mit ID ${id} ist im Warenkorb, aber nicht in products.json gefunden`);
      }
    }
    
    return cartProducts;
  } catch (error) {
    console.error('Fehler beim Laden der Warenkorb-Produkte:', error);
    throw error;
  }
}

function calculateTotal(products) {
  const total = products.reduce((sum, product) => sum + product.price, 0);
  return total.toFixed(2) + ' €';
}

function renderCartItems(products) {
  const container = document.getElementById('cart-items-container');
  if (!container) return;
  
  if (products.length === 0) {
    container.classList.add('hidden');
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) {
      emptyState.classList.remove('hidden');
    }
    return;
  }
  
  container.classList.remove('hidden');
  const emptyState = document.querySelector('.empty-state');
  if (emptyState) {
    emptyState.classList.add('hidden');
  }
  
  container.innerHTML = '';
  
  products.forEach(product => {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    
    const img = document.createElement('img');
    img.src = product.images && product.images.length > 0 ? product.images[0] : '';
    img.alt = product.name;
    
    const itemInfo = document.createElement('div');
    itemInfo.className = 'cart-item-info';
    
    const name = document.createElement('h3');
    name.textContent = product.name;
    
    const grade = document.createElement('p');
    grade.textContent = product.grade;
    
    const price = document.createElement('p');
    price.textContent = product.price.toFixed(2) + ' €';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-danger';
    removeBtn.textContent = 'Entfernen';
    removeBtn.onclick = () => handleRemove(product.id);
    
    itemInfo.appendChild(name);
    itemInfo.appendChild(grade);
    itemInfo.appendChild(price);
    
    cartItem.appendChild(img);
    cartItem.appendChild(itemInfo);
    cartItem.appendChild(removeBtn);
    
    container.appendChild(cartItem);
  });
}

async function handleRemove(productId) {
  CART_MANAGER.removeFromCart(productId);
  
  const products = await loadCartProducts();
  renderCartItems(products);
  
  const total = calculateTotal(products);
  const totalElement = document.getElementById('cart-total');
  if (totalElement) {
    totalElement.textContent = total;
  }
  
  updateCheckoutButton();
  UI_MANAGER.updateCartBadge();
  UI_MANAGER.showToast('Produkt wurde entfernt', 'success');
}

function updateCheckoutButton() {
  const checkoutBtn = document.getElementById('checkout-btn');
  if (!checkoutBtn) return;
  
  const cart = CART_MANAGER.getCart();
  if (cart.length === 0) {
    checkoutBtn.classList.add('disabled');
  } else {
    checkoutBtn.classList.remove('disabled');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  UI_MANAGER.showLoading();
  
  try {
    const products = await loadCartProducts();
    renderCartItems(products);
    
    const total = calculateTotal(products);
    const totalElement = document.getElementById('cart-total');
    if (totalElement) {
      totalElement.textContent = total;
    }
    
    updateCheckoutButton();
    UI_MANAGER.updateCartBadge();
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => {
        if (!checkoutBtn.classList.contains('disabled')) {
          const cart = CART_MANAGER.getCart();
          if (cart.length > 0) {
            window.location.href = './checkout.html';
          }
        }
      });
    }
  } catch (error) {
    UI_MANAGER.showToast('Fehler beim Laden des Warenkorbs', 'error');
  } finally {
    UI_MANAGER.hideLoading();
  }
});
