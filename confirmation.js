// confirmation.js

function loadOrderData() {
  try {
    const orderDataString = sessionStorage.getItem('orderData');
    if (!orderDataString) {
      return null;
    }
    const orderData = JSON.parse(orderDataString);
    return orderData;
  } catch (error) {
    console.error('Error loading order data:', error);
    return null;
  }
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderConfirmation(orderData) {
  try {
    const confirmationItemsList = document.getElementById('confirmation-items-list');
    const confirmationTotal = document.getElementById('confirmation-total');
    const confirmationAddress = document.getElementById('confirmation-address');

    if (!confirmationItemsList || !confirmationTotal || !confirmationAddress) {
      console.error('Required DOM elements not found');
      return;
    }

    confirmationItemsList.innerHTML = '';
    
    if (orderData.products && Array.isArray(orderData.products)) {
      orderData.products.forEach(product => {
        const listItem = document.createElement('li');
        listItem.textContent = `${product.name} - ${product.grade} - €${product.price.toFixed(2)}`;
        confirmationItemsList.appendChild(listItem);
      });
    }

    if (orderData.total !== undefined && orderData.total !== null) {
      confirmationTotal.textContent = `€${orderData.total.toFixed(2)}`;
    }

    if (orderData.formData) {
      const formData = orderData.formData;
      const addressLines = [];
      
      if (formData.name) {
        addressLines.push(formData.name);
      }
      
      const streetLine = [formData.street, formData.housenumber].filter(Boolean).join(' ');
      if (streetLine) {
        addressLines.push(streetLine);
      }
      
      const cityLine = [formData.zipcode, formData.city].filter(Boolean).join(' ');
      if (cityLine) {
        addressLines.push(cityLine);
      }
      
      if (formData.country) {
        addressLines.push(formData.country);
      }
      
      confirmationAddress.innerHTML = addressLines.map(line => `<p>${escapeHTML(line)}</p>`).join('');
    }
  } catch (error) {
    console.error('Error rendering confirmation:', error);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  try {
    const orderData = loadOrderData();
    
    if (!orderData) {
      console.warn('No order data found, redirecting to index');
      window.location.href = './index.html';
      return;
    }
    
    renderConfirmation(orderData);
    
    sessionStorage.removeItem('orderData');
  } catch (error) {
    console.error('Error initializing confirmation page:', error);
    console.warn('Error loading order data, redirecting to index');
    window.location.href = './index.html';
  }
});