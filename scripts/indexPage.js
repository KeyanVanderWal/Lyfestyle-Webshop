async function loadProducts() {
  try {
    const productsContainer = document.getElementById("products-container");
    if (!productsContainer) return;
    
    productsContainer.innerHTML = "";
    
    const storedProducts = localStorage.getItem('products');
    let productsData;
    
    if (storedProducts) {
      productsData = JSON.parse(storedProducts);
    } else {
      const response = await fetch("./json/products.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      productsData = await response.json();
      
      localStorage.setItem('products', JSON.stringify(productsData));
    }

    productsData.products.forEach((product) => {
      const productHTML = `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
          <div class="card product-card h-100">
            <div class="position-relative product-image-container">
              <a href="${product.detailsLink}" class="product-image-link"></a>
              <img src="${product.frontImage}" alt="${product.name}" class="product-image img-front w-100 position-absolute top-0 start-0">
              <img src="${product.hoverImage}" alt="${product.name} Hover" class="product-image img-hover w-100 position-absolute top-0 start-0">
              <div style="padding-top: 100%; visibility: hidden;"></div>
            </div>
            <div class="card-body">
              <h5 class="card-title">${product.name}</h5>
              <p class="card-text">${product.price}</p>
              <button class="btn btn-primary mt-auto add-to-cart" data-product-id="${product.id}">
                Voeg toe aan winkelwagen
              </button>
            </div>
          </div>
        </div>
      `;
      productsContainer.innerHTML += productHTML;
    });

    setupProductImageInteractions();

    document.querySelectorAll(".add-to-cart").forEach((button) => {
      button.addEventListener("click", function() {
        const productId = this.getAttribute("data-product-id");
        addToCart(productId);
      });
    });
  } catch (error) {
    console.error("Error loading products:", error);
    const productsContainer = document.getElementById("products-container");
    if (productsContainer) {
      productsContainer.innerHTML =
        '<div class="col-12 text-center text-white">Error loading products. Please try again later.</div>';
    }
  }
}

function setupProductImageInteractions() {
  const productContainers = document.querySelectorAll(".product-image-container");
  const longPressThreshold = 300;
  let longPressTimers = {};
  let touchStartTime = 0;
  
  productContainers.forEach((container, index) => {
    container.addEventListener("mouseenter", function() {
      const frontImg = this.querySelector(".img-front");
      const hoverImg = this.querySelector(".img-hover");
      if (frontImg && hoverImg) {
        frontImg.style.opacity = "0";
        hoverImg.style.opacity = "1";
      }
    });

    container.addEventListener("mouseleave", function() {
      const frontImg = this.querySelector(".img-front");
      const hoverImg = this.querySelector(".img-hover");
      if (frontImg && hoverImg) {
        frontImg.style.opacity = "1";
        hoverImg.style.opacity = "0";
      }
    });

    container.addEventListener("touchstart", function(e) {
      const containerId = index;
      touchStartTime = Date.now();
      
      longPressTimers[containerId] = setTimeout(() => {
        const frontImg = this.querySelector(".img-front");
        const hoverImg = this.querySelector(".img-hover");
        if (frontImg && hoverImg) {
          frontImg.style.opacity = "0";
          hoverImg.style.opacity = "1";
        }
      }, longPressThreshold);
      
    }, { passive: true });

    container.addEventListener("touchend", function(e) {
      const containerId = index;
      const touchDuration = Date.now() - touchStartTime;
      
      clearTimeout(longPressTimers[containerId]);
      
      const frontImg = this.querySelector(".img-front");
      const hoverImg = this.querySelector(".img-hover");
      if (frontImg && hoverImg) {
        frontImg.style.opacity = "1";
        hoverImg.style.opacity = "0";
      }
      
      if (touchDuration < longPressThreshold) {
        const link = this.querySelector(".product-image-link");
        if (link) {
          window.location.href = link.getAttribute("href");
        }
      }
    });

    const productLink = container.querySelector(".product-image-link");
    if (productLink) {
      productLink.addEventListener("click", function(e) {
        if ('ontouchstart' in window) {
          e.preventDefault();
        }
      });
    }
  });
}

function addToCart(id) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = cart.find((i) => i.id === id);
  if (item) {
    item.quantity++;
  } else {
    cart.push({ id, quantity: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartCountElement = document.getElementById('cart-count');
  if (cartCountElement) {
    cartCountElement.textContent = cart.reduce((a, b) => a + b.quantity, 0);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  updateCartCount();
});