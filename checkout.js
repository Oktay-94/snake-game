// checkout.js

const CART_MANAGER = {
  getCart() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  },
  saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  },
  clearCart() {
    localStorage.setItem('cart', JSON.stringify([]));
    this.updateCartBadge();
  },
  updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
      const cart = this.getCart();
      const itemCount = cart.length;
      badge.textContent = itemCount;
      if (itemCount === 0) {
        badge.classList.add('hidden');
      } else {
        badge.classList.remove('hidden');
      }
    }
  }
};

const UI_MANAGER = {
  showToast(message, type = 'error') {
    const notificationArea = document.getElementById('notification-area');
    if (!notificationArea) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    notificationArea.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        notificationArea.removeChild(toast);
      }, 300);
    }, 3000);
  }
};

async function loadCheckoutItems() {
  try {
    const cart = CART_MANAGER.getCart();
    const response = await fetch('./data/products.json');
    if (!response.ok) throw new Error('Failed to load products');
    const allProducts = await response.json();
    
    const cartProducts = allProducts.filter(product => 
      cart.includes(product.id)
    );
    
    return cartProducts;
  } catch (error) {
    console.error('Error loading checkout items:', error);
    UI_MANAGER.showToast('Fehler beim Laden der Produkte', 'error');
    return [];
  }
}

function renderCheckoutSummary(products) {
  const checkoutItemsList = document.getElementById('checkout-items-list');
  const checkoutTotal = document.getElementById('checkout-total');
  
  if (!checkoutItemsList || !checkoutTotal) return;
  
  checkoutItemsList.innerHTML = '';
  
  let total = 0;
  
  products.forEach(product => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'checkout-item';
    itemDiv.innerHTML = `
      <span class="checkout-item-name">${product.name}</span>
      <span class="checkout-item-grade">${product.grade}</span>
      <span class="checkout-item-price">${product.price.toFixed(2)} €</span>
    `;
    checkoutItemsList.appendChild(itemDiv);
    total += product.price;
  });
  
  checkoutTotal.textContent = `${total.toFixed(2)} €`;
}

function validateForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return false;
  
  let isValid = true;
  
  const requiredFields = [
    { id: 'firstname', name: 'Vorname' },
    { id: 'lastname', name: 'Nachname' },
    { id: 'email', name: 'E-Mail' },
    { id: 'street', name: 'Straße' },
    { id: 'housenumber', name: 'Hausnummer' },
    { id: 'zipcode', name: 'PLZ' },
    { id: 'city', name: 'Stadt' },
    { id: 'country', name: 'Land' }
  ];
  
  requiredFields.forEach(field => {
    const input = document.getElementById(field.id);
    const errorSpan = document.querySelector(`#${field.id} + span.error`);
    
    if (!input) return;
    
    const value = input.value.trim();
    
    if (value === '') {
      input.classList.add('error');
      if (errorSpan) {
        errorSpan.textContent = `${field.name} ist erforderlich`;
        errorSpan.classList.remove('hidden');
      }
      isValid = false;
    } else if (field.id === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        input.classList.add('error');
        if (errorSpan) {
          errorSpan.textContent = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
          errorSpan.classList.remove('hidden');
        }
        isValid = false;
      } else {
        input.classList.remove('error');
        if (errorSpan) {
          errorSpan.classList.add('hidden');
        }
      }
    } else {
      input.classList.remove('error');
      if (errorSpan) {
        errorSpan.classList.add('hidden');
      }
    }
  });
  
  return isValid;
}

function collectFormData() {
  return {
    firstname: document.getElementById('firstname')?.value.trim() || '',
    lastname: document.getElementById('lastname')?.value.trim() || '',
    email: document.getElementById('email')?.value.trim() || '',
    street: document.getElementById('street')?.value.trim() || '',
    housenumber: document.getElementById('housenumber')?.value.trim() || '',
    zipcode: document.getElementById('zipcode')?.value.trim() || '',
    city: document.getElementById('city')?.value.trim() || '',
    country: document.getElementById('country')?.value.trim() || ''
  };
}

async function init() {
  try {
    const cart = CART_MANAGER.getCart();
    
    if (cart.length === 0) {
      UI_MANAGER.showToast('Warenkorb leer', 'error');
      setTimeout(() => {
        window.location.href = './cart.html';
      }, 500);
      return;
    }
    
    const products = await loadCheckoutItems();
    renderCheckoutSummary(products);
    CART_MANAGER.updateCartBadge();
    
    const form = document.getElementById('checkout-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (validateForm()) {
          try {
            const formData = collectFormData();
            const products = await loadCheckoutItems();
            
            const checkoutTotal = document.getElementById('checkout-total');
            const totalText = checkoutTotal ? checkoutTotal.textContent : '0.00 €';
            const total = parseFloat(totalText.replace(' €', '').replace(',', '.'));
            
            const orderData = {
              products,
              formData,
              total
            };
            
            sessionStorage.setItem('orderData', JSON.stringify(orderData));
            CART_MANAGER.clearCart();
            window.location.href = './confirmation.html';
          } catch (error) {
            console.error('Error processing order:', error);
            UI_MANAGER.showToast('Fehler beim Verarbeiten der Bestellung', 'error');
          }
        } else {
          UI_MANAGER.showToast('Bitte füllen Sie alle Pflichtfelder korrekt aus', 'error');
        }
      });
      
      const formInputs = form.querySelectorAll('input');
      formInputs.forEach(input => {
        input.addEventListener('input', () => {
          input.classList.remove('error');
          const errorSpan = document.querySelector(`#${input.id} + span.error`);
          if (errorSpan) {
            errorSpan.classList.add('hidden');
          }
        });
      });
    }
  } catch (error) {
    console.error('Error initializing checkout:', error);
    UI_MANAGER.showToast('Fehler beim Laden der Seite', 'error');
  }
}

document.addEventListener('DOMContentLoaded', init);