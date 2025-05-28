// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  loadOrderSummary();
  updateCartCount();
  initializeForm();
  
  // Check if cart is empty and redirect
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length === 0) {
    alert('Je winkelwagen is leeg. Je wordt doorgestuurd naar de shop.');
    window.location.href = '../index.html';
    return;
  }
});

function initializeForm() {
  const form = document.getElementById('checkout-form');
  const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
  const creditCardDetails = document.getElementById('credit-card-details');

  // Handle payment method selection
  paymentMethods.forEach(method => {
    method.addEventListener('change', function() {
      // Remove selected class from all methods
      document.querySelectorAll('.payment-method').forEach(pm => {
        pm.classList.remove('selected');
      });
      
      // Add selected class to current method
      this.closest('.payment-method').classList.add('selected');
      
      // Show/hide credit card details
      if (this.value === 'creditCard') {
        creditCardDetails.style.display = 'block';
        document.getElementById('cardNumber').required = true;
        document.getElementById('expiryDate').required = true;
        document.getElementById('cvv').required = true;
      } else {
        creditCardDetails.style.display = 'none';
        document.getElementById('cardNumber').required = false;
        document.getElementById('expiryDate').required = false;
        document.getElementById('cvv').required = false;
      }
    });
  });

  // Handle form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (validateForm()) {
      processOrder();
    }
  });

  // Format card number input
  document.getElementById('cardNumber').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    if (formattedValue !== e.target.value) {
      e.target.value = formattedValue;
    }
  });

  // Format expiry date input
  document.getElementById('expiryDate').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
  });

  // CVV input validation
  document.getElementById('cvv').addEventListener('input', function(e) {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
  });
}

function validateForm() {
  let isValid = true;
  const requiredFields = [
    'email', 'firstName', 'lastName', 'address', 
    'city', 'postalCode', 'country'
  ];

  // Clear previous errors
  document.querySelectorAll('.error-message').forEach(error => {
    error.style.display = 'none';
  });

  // Validate required fields
  requiredFields.forEach(fieldName => {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(fieldName + '-error');
    
    if (!field.value.trim()) {
      errorElement.style.display = 'block';
      isValid = false;
    }
  });

  // Validate email format
  const email = document.getElementById('email');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email.value && !emailRegex.test(email.value)) {
    document.getElementById('email-error').style.display = 'block';
    isValid = false;
  }

  // Validate payment method selection
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
  if (!paymentMethod) {
    alert('Selecteer een betaalmethode.');
    isValid = false;
  }

  // Validate credit card details if selected
  if (paymentMethod && paymentMethod.value === 'creditCard') {
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    const expiryDate = document.getElementById('expiryDate').value;
    const cvv = document.getElementById('cvv').value;

    if (!cardNumber || cardNumber.length < 13) {
      alert('Voer een geldig kaartnummer in.');
      isValid = false;
    }

    if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
      alert('Voer een geldige vervaldatum in (MM/YY).');
      isValid = false;
    }

    if (!cvv || cvv.length < 3) {
      alert('Voer een geldige CVV code in.');
      isValid = false;
    }
  }

  return isValid;
}

async function processOrder() {
  const loadingOverlay = document.getElementById('loading-overlay');
  const placeOrderBtn = document.getElementById('place-order-btn');
  
  // Show loading state
  loadingOverlay.style.display = 'flex';
  placeOrderBtn.disabled = true;
  placeOrderBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Verwerken...';

  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get form data
    const formData = new FormData(document.getElementById('checkout-form'));
    const orderData = {
      customer: {
        email: formData.get('email'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        address: formData.get('address'),
        city: formData.get('city'),
        postalCode: formData.get('postalCode'),
        country: formData.get('country')
      },
      paymentMethod: formData.get('paymentMethod'),
      items: JSON.parse(localStorage.getItem('cart')) || [],
      total: document.getElementById('order-total').textContent,
      orderDate: new Date().toISOString(),
      orderNumber: generateOrderNumber()
    };

    // Store order in localStorage (in real app, this would be sent to server)
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders.push(orderData);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Clear cart
    localStorage.removeItem('cart');
    
    // Show success
    showOrderConfirmation(orderData.orderNumber);
    
  } catch (error) {
    console.error('Order processing failed:', error);
    alert('Er is een fout opgetreden bij het verwerken van je bestelling. Probeer het opnieuw.');
  } finally {
    // Hide loading state
    loadingOverlay.style.display = 'none';
    placeOrderBtn.disabled = false;
    placeOrderBtn.innerHTML = '<i class="bi bi-lock-fill"></i> Bestelling Plaatsen';
  }
}

function generateOrderNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `LYF-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}${random.toString().padStart(3, '0')}`;
}

function showOrderConfirmation(orderNumber) {
  document.getElementById('checkout-form-container').style.display = 'none';
  document.getElementById('order-confirmation').style.display = 'block';
  document.getElementById('order-number-display').textContent = '#' + orderNumber;
  
  // Update cart count
  updateCartCount();
  
  // Scroll to top
  window.scrollTo(0, 0);
}

async function loadOrderSummary() {
  const orderItemsContainer = document.getElementById('order-items');
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (cart.length === 0) {
    orderItemsContainer.innerHTML = '<p>Geen producten in winkelwagen.</p>';
    return;
  }

  try {
    let productsData;
    
    try {
      if (localStorage.getItem('products')) {
        productsData = JSON.parse(localStorage.getItem('products'));
      } else {
        const response = await fetch('/json/products.json');
        productsData = await response.json();
        localStorage.setItem('products', JSON.stringify(productsData));
      }
    } catch (e) {
      try {
        const response = await fetch('../json/products.json');
        productsData = await response.json();
        localStorage.setItem('products', JSON.stringify(productsData));
      } catch (e2) {
        console.error('Failed to load products:', e2);
        orderItemsContainer.innerHTML = '<p>Kon producten niet laden.</p>';
        return;
      }
    }

    let orderHTML = '';
    let subtotal = 0;

    cart.forEach(cartItem => {
      const product = productsData.find(p => p.id === cartItem.id);
      if (product) {
        const itemTotal = product.price * cartItem.quantity;
        subtotal += itemTotal;

        orderHTML += `
          <div class="order-item">
            <img src="${product.image}" alt="${product.name}" class="order-item-image">
            <div class="order-item-details">
              <div class="order-item-name">${product.name}</div>
              <div class="order-item-quantity">Aantal: ${cartItem.quantity}</div>
            </div>
            <div class="order-item-price">€${itemTotal.toFixed(2)}</div>
          </div>
        `;
      }
    });

    orderItemsContainer.innerHTML = orderHTML;
    document.getElementById('order-subtotal').textContent = `€${subtotal.toFixed(2)}`;
    document.getElementById('order-total').textContent = `€${subtotal.toFixed(2)}`;

  } catch (error) {
    console.error('Error loading order summary:', error);
    orderItemsContainer.innerHTML = '<p>Fout bij laden van bestelling.</p>';
  }
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountElement = document.getElementById('cart-count');
  
  if (cartCountElement) {
    cartCountElement.textContent = totalItems;
    
    if (totalItems === 0) {
      cartCountElement.style.display = 'none';
    } else {
      cartCountElement.style.display = 'inline';
    }
  }
}