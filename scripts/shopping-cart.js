document.addEventListener("DOMContentLoaded", () => {
    console.log("Shopping cart script loaded")

    displayCart()

    const clearCartButton = document.getElementById("clear-cart")
    if (clearCartButton) {
        clearCartButton.addEventListener("click", clearCart)
    }

    const checkoutButton = document.getElementById("checkout-btn")
    if (checkoutButton) {
        checkoutButton.addEventListener("click", (e) => {
            e.preventDefault()
            showNotification("Checkout functionality would be implemented here")
        })
    }

    updateCartCount()
})

function parsePrice(priceString) {
    if (!priceString) return 0

    const cleanPrice = priceString
        .replace(/[€$]/g, "")
        .replace(",", ".")

    const price = Number.parseFloat(cleanPrice)
    return price || 0
}

function formatPrice(price) {
    return `€${price.toFixed(2)}`.replace(".", ",")
}

function addToCart(productId, quantity = 1) {
    console.log(`Adding product ${productId} with quantity ${quantity} to cart`)

    productId = String(productId)

    let cart = JSON.parse(localStorage.getItem("cart")) || []

    const existingProductIndex = cart.findIndex((item) => String(item.id) === productId)

    if (existingProductIndex !== -1) {
        cart[existingProductIndex].quantity += quantity
    } else {
        cart.push({
            id: productId,
            quantity: quantity,
        })
    }

    localStorage.setItem("cart", JSON.stringify(cart))
    console.log("Updated cart:", cart)

    showNotification("Product added to cart!")

    updateCartCount()
}

function removeFromCart(productId) {
    productId = String(productId)

    let cart = JSON.parse(localStorage.getItem("cart")) || []

    cart = cart.filter((item) => String(item.id) !== productId)

    localStorage.setItem("cart", JSON.stringify(cart))

    displayCart()

    updateCartCount()
}

function updateQuantity(productId, newQuantity) {
    productId = String(productId)

    let cart = JSON.parse(localStorage.getItem("cart")) || []

    const productIndex = cart.findIndex((item) => String(item.id) === productId)

    if (productIndex !== -1) {
        if (newQuantity <= 0) {
            removeFromCart(productId)
        } else {
            cart[productIndex].quantity = newQuantity
            localStorage.setItem("cart", JSON.stringify(cart))
            displayCart()
        }
    }

    updateCartCount()
}

function clearCart() {
    localStorage.removeItem("cart")
    displayCart()
    updateCartCount()
    showNotification("Cart cleared")
}

async function displayCart() {
    const cartContainer = document.getElementById("cart-items")
    if (!cartContainer) {
        console.log("Cart container not found, not on cart page")
        return
    }

    let cart = JSON.parse(localStorage.getItem("cart")) || []
    console.log("Original cart data from localStorage:", cart)

    console.log("Processed cart data:", cart)

    if (cart.length === 0) {
        cartContainer.innerHTML = "<p class='empty-cart-message'>Your cart is empty.</p>"
        updateCartTotal(0)

        const cartFooter = document.querySelector(".cart-footer")
        if (cartFooter) {
            cartFooter.style.display = "none"
        }
        return
    }

    const cartFooter = document.querySelector(".cart-footer")
    if (cartFooter) {
        cartFooter.style.display = "flex"
    }

    try {
        let productsData

        async function loadCart() {
  let productsData;

  if (localStorage.getItem("products")) {
    productsData = JSON.parse(localStorage.getItem("products"));
  } else {
    try {
      const response = await fetch("/json/products.json");
      productsData = await response.json();
    } catch (e) {
      try {
        const response = await fetch("../json/products.json");
        productsData = await response.json();
      } catch (e2) {
        const response = await fetch("json/products.json");
        productsData = await response.json();
      }
    }
    if (productsData) {
      localStorage.setItem("products", JSON.stringify(productsData));
    }
  }

  console.log("Products data:", productsData);

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  console.log("Cart items:", cart);

  if (cart.length === 0) {
    document.getElementById("cart-container").innerHTML = "<p>Empty cart</p>";
    return;
  }

  cart.forEach(item => {
    const product = productsData.find(p => p.id === item.id);
    if (product) {
      console.log("Render product:", product);
    }
  });
}

loadCart();


        console.log("Products data loaded:", productsData)

        const products = productsData.products || []
        console.log("Products array:", products)

        if (products.length === 0) {
            throw new Error("No products found in the data")
        }

        let cartHTML = ""
        let totalPrice = 0
        let productsFound = 0

        cart.forEach((cartItem) => {
            const cartItemId = String(cartItem.id)

            const product = products.find((p) => String(p.id) === cartItemId)

            if (product) {
                productsFound++
                const price = parsePrice(product.price)
                const itemTotal = price * cartItem.quantity
                totalPrice += itemTotal

                console.log(`Rendering product: ${product.name}, ID: ${product.id}, Price: ${price}`)

                let imagePath =
                    product.frontImage || (product.productImage && product.productImage[0]) || "/img/placeholder.jpg"

                if (imagePath.startsWith("../")) {
                    imagePath = imagePath.substring(3)
                } else if (!imagePath.startsWith("/")) {
                    imagePath = "/" + imagePath
                }

                cartHTML += `
          <div class="cart-item" data-id="${product.id}">
            <div class="cart-item-image">
              <img src="${imagePath}" alt="${product.name}" onerror="this.src='/img/placeholder.jpg'">
            </div>
            <div class="cart-item-details">
              <h3>${product.name}</h3>
              <p class="price">${product.price}</p>
            </div>
            <div class="cart-item-quantity">
              <button class="quantity-btn decrease" onclick="updateQuantity('${product.id}', ${cartItem.quantity - 1})">-</button>
              <span class="quantity">${cartItem.quantity}</span>
              <button class="quantity-btn increase" onclick="updateQuantity('${product.id}', ${cartItem.quantity + 1})">+</button>
            </div>
            <div class="cart-item-total">
              <p>${product.price.replace(/[0-9,.]+/, (Number.parseFloat(price) * cartItem.quantity).toFixed(2).replace(".", ","))}</p>
            </div>
            <button class="remove-btn" onclick="removeFromCart('${product.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="trash-icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        `
            } else {
                console.warn(`Product with ID ${cartItem.id} not found in products data`)
                console.log(
                    "Available product IDs:",
                    products.map((p) => p.id),
                )
            }
        })

        if (productsFound === 0) {
            cartHTML = `
        <p class='empty-cart-message'>
          No products could be found in the database that match your cart items.<br>
          <small>This might be due to a mismatch between your cart and the products database.</small>
        </p>`
        }

        cartContainer.innerHTML = cartHTML

        const firstProduct = products[0]
        const currencySymbol = firstProduct.price.match(/[€$]/)[0]
        const formattedTotal = `${currencySymbol}${totalPrice.toFixed(2).replace(".", ",")}`

        updateCartTotal(formattedTotal)
    } catch (error) {
        console.error("Error loading products:", error)
        cartContainer.innerHTML = `
      <p class='empty-cart-message'>
        Error loading products. Please try again later.<br>
        <small>Error details: ${error.message}</small>
      </p>`
        updateCartTotal("€0,00")
    }
}

function updateCartTotal(formattedTotal) {
    const totalElement = document.getElementById("cart-total")
    if (totalElement) {
        totalElement.textContent = formattedTotal
    }

    const totalWithShippingElement = document.getElementById("cart-total-with-shipping")
    if (totalWithShippingElement) {
        totalWithShippingElement.textContent = formattedTotal
    }
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCountElement = document.getElementById('cart-count');
    cartCountElement.textContent = cart.reduce((a, b) => a + b.quantity, 0);
}

function showNotification(message) {
    let notification = document.getElementById("cart-notification")
    if (!notification) {
        notification = document.createElement("div")
        notification.id = "cart-notification"
        document.body.appendChild(notification)
    }

    notification.textContent = message
    notification.classList.add("show")

    setTimeout(() => {
        notification.classList.remove("show")
    }, 3000)
}

window.addToCart = addToCart
window.removeFromCart = removeFromCart
window.updateQuantity = updateQuantity
window.clearCart = clearCart
window.updateCartCount = updateCartCount
