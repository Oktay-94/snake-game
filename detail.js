const CART_MANAGER = {
  STORAGE_KEY: 'shopping_cart',
  
  getCart() {
    try {
      const cart = localStorage.getItem(this.STORAGE_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error('Fehler beim Laden des Warenkorbs:', error);
      return [];
    }
  },
  
  saveCart(cart) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
      return true;
    } catch (error) {
      console.error('Fehler beim Speichern des Warenkorbs:', error);
      return false;
    }
  },
  
  addToCart(productId) {
    const cart = this.getCart();
    if (!cart.includes(productId)) {
      cart.push(productId);
      this.saveCart(cart);
      return true;
    }
    return false;
  },
  
  removeFromCart(productId) {
    let cart = this.getCart();
    cart = cart.filter(id => id !== productId);
    this.saveCart(cart);
  },
  
  clearCart() {
    this.saveCart([]);
  }
};

const UI_MANAGER = {
  updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
      const cart = CART_MANAGER.getCart();
      const count = cart.length;
      badge.textContent = count;
      if (count > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  },
  
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  },
  
  showLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
      loading.classList.remove('hidden');
    }
  },
  
  hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
      loading.classList.add('hidden');
    }
  }
};

function getProductIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

async function loadProductDetail(productId) {
  try {
    const response = await fetch('./data/products.json');
    if (!response.ok) {
      throw new Error('Fehler beim Laden der Produkte');
    }
    const products = await response.json();
    const product = products.find(p => p.id === productId);
    return product || null;
  } catch (error) {
    console.error('Fehler beim Laden des Produkts:', error);
    return null;
  }
}

function renderProductDetail(product) {
  const productName = document.getElementById('product-name');
  const productGrade = document.getElementById('product-grade');
  const productPrice = document.getElementById('product-price');
  const productDescription = document.getElementById('product-description');
  const productAccessories = document.getElementById('product-accessories');
  const productImages = document.querySelector('.product-images');
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  
  if (productName) {
    productName.textContent = product.name;
  }
  
  if (productGrade) {
    productGrade.textContent = product.grade;
  }
  
  if (productPrice) {
    const formattedPrice = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(product.price);
    productPrice.textContent = formattedPrice;
  }
  
  if (productDescription) {
    productDescription.textContent = product.description;
  }
  
  if (productAccessories && product.accessories) {
    productAccessories.innerHTML = '';
    const ul = document.createElement('ul');
    product.accessories.forEach(accessory => {
      const li = document.createElement('li');
      li.textContent = accessory;
      ul.appendChild(li);
    });
    productAccessories.appendChild(ul);
  }
  
  if (productImages && product.images) {
    productImages.innerHTML = '';
    product.images.forEach(imageSrc => {
      const img = document.createElement('img');
      img.src = imageSrc;
      img.alt = product.name;
      productImages.appendChild(img);
    });
  }
  
  if (addToCartBtn) {
    const cart = CART_MANAGER.getCart();
    if (cart.includes(product.id)) {
      addToCartBtn.textContent = 'Im Warenkorb (1x)';
      addToCartBtn.classList.add('in-cart');
      addToCartBtn.disabled = true;
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  UI_MANAGER.showLoading();
  UI_MANAGER.updateCartBadge();
  
  const productId = getProductIdFromUrl();
  
  if (!productId) {
    const errorState = document.getElementById('error-state');
    const productDetailContainer = document.getElementById('product-detail-container');
    
    if (errorState) {
      errorState.classList.add('active');
    }
    if (productDetailContainer) {
      productDetailContainer.classList.add('hidden');
    }
    
    UI_MANAGER.hideLoading();
    return;
  }
  
  const product = await loadProductDetail(productId);
  
  if (product) {
    const errorState = document.getElementById('error-state');
    const productDetailContainer = document.getElementById('product-detail-container');
    
    if (errorState) {
      errorState.classList.remove('active');
    }
    if (productDetailContainer) {
      productDetailContainer.classList.remove('hidden');
    }
    
    renderProductDetail(product);
    
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', (event) => {
        event.preventDefault();
        
        const success = CART_MANAGER.addToCart(productId);
        
        if (success) {
          addToCartBtn.textContent = 'Im Warenkorb (1x)';
          addToCartBtn.classList.add('in-cart');
          addToCartBtn.disabled = true;
          
          UI_MANAGER.showToast('Produkt wurde zum Warenkorb hinzugefügt', 'success');
          UI_MANAGER.updateCartBadge();
        }
      });
    }
  } else {
    const errorState = document.getElementById('error-state');
    const productDetailContainer = document.getElementById('product-detail-container');
    
    if (errorState) {
      errorState.classList.add('active');
    }
    if (productDetailContainer) {
      productDetailContainer.classList.add('hidden');
    }
  }
  
  UI_MANAGER.hideLoading();
});
