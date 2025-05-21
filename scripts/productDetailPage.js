document.addEventListener("DOMContentLoaded", async () => {
  console.log("Product detail page script loaded")

  try {
    const urlParams = new URLSearchParams(window.location.search)
    const productId = urlParams.get("id")

    if (!productId) {
      throw new Error("No product ID provided in URL")
    }

    console.log("Product ID from URL:", productId)

    if (typeof window.addToCart !== "function") {
      console.log("Loading shopping cart script")
      const script = document.createElement("script")
      script.src = "../scripts/shopping-cart.js"
      document.head.appendChild(script)
    }

    let data

    if (localStorage.getItem("products")) {
      console.log("Loading products from localStorage")
      data = JSON.parse(localStorage.getItem("products"))
    } else {
      console.log("Fetching products from JSON file")
      const response = await fetch("../json/products.json")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      data = await response.json()

      // Save products to localStorage for future use
      saveProductsToLocalStorage(data)
    }

    const product = data.products.find((p) => String(p.id) === String(productId))
    if (!product) {
      throw new Error("Product not found")
    }

    document.getElementById("product-image").src = product.productImage[0]
    document.getElementById("product-image").alt = product.name

    const thumbnailsContainer = document.querySelector(".thumbnails")
    thumbnailsContainer.innerHTML = ""

    if (Array.isArray(product.productImage)) {
      product.productImage.forEach((image, index) => {
        const colDiv = document.createElement("div")
        colDiv.className = "col-3"

        const img = document.createElement("img")
        img.id = `thumbnail-${index + 1}`
        img.src = image
        img.alt = `${product.name} View ${index + 1}`
        img.className = "thumbnail"

        img.addEventListener("click", function () {
          document.getElementById("product-image").src = this.src
        })

        colDiv.appendChild(img)
        thumbnailsContainer.appendChild(colDiv)
      })
    }

    document.getElementById("product-title").textContent = product.name
    document.getElementById("product-price").textContent = product.price
    document.getElementById("add-to-cart").setAttribute("data-product-id", product.id)

    document.title = `${product.name} - Lyfestyle Shop`

    const detailsContainer = document.getElementById("product-details")
    detailsContainer.innerHTML = `
            <p>ITEM IS IN STOCK AND SHIPS IN 3-5 BUSINESS DAYS</p>
            <p>${product.name.includes("HAT") ? "EMBROIDERED FRONT GRAPHICS<br>ADJUSTABLE 5 PANEL HAT<br>COLOR BLACK" : "PREMIUM QUALITY MATERIAL"}</p>
        `

    const otherProducts = data.products.filter((p) => p.id !== productId)
    const selectedProducts = otherProducts.sort(() => Math.random() - 0.5).slice(0, 4)
    const alsoAvailableContainer = document.getElementById("also-available-container")
    alsoAvailableContainer.innerHTML = ""

    selectedProducts.forEach((p) => {
      const productImage = Array.isArray(p.productImage)
        ? p.productImage[0]
        : p.frontImage
          ? `../img/${p.frontImage.split("/").pop()}`
          : "../img/placeholder.webp"

      const merchItem = `
                <div class="col-md-3 col-6 merch-item">
                    <a href="?id=${p.id}">
                        <img src="${productImage}" class="merch-image" alt="${p.name}">
                        <div class="merch-title">${p.name}</div>
                        <div class="merch-price">${p.price}</div>
                    </a>
                </div>
            `

      alsoAvailableContainer.innerHTML += merchItem
    })

    const addToCartBtn = document.getElementById("add-to-cart")
    if (addToCartBtn) {
      console.log("Add to cart button found")

      addToCartBtn.addEventListener("click", function () {
        const productId = this.getAttribute("data-product-id")
        console.log(`Adding product ${productId} to cart`)

        addToCart(productId)
      })
    } else {
      console.error("Add to cart button not found")
    }
  } catch (error) {
    console.error("Error loading product:", error)
    document.querySelector(".product-container").innerHTML =
      '<div class="col-12 text-center text-white">Error loading product. Please try again later.</div>'
  }
})

function addToCart(id) {
  const cart = JSON.parse(localStorage.getItem("cart")) || []
  console.log(cart)
  const item = cart.find((i) => i.id === id)
  if (item) {
    item.quantity++
  } else {
    cart.push({ id, quantity: 1 })
  }

  localStorage.setItem("cart", JSON.stringify(cart))
  console.log("cart", cart)

  updateCartCount()
}

function updateCartCount() {
  const cartCountElement = document.getElementById("cart-count")
  if (!cartCountElement) return

  const cart = JSON.parse(localStorage.getItem("cart")) || []

  const isOldFormat = Array.isArray(cart) && cart.length > 0 && typeof cart[0] !== "object"

  let itemCount
  if (isOldFormat) {
    itemCount = cart.length
  } else {
    itemCount = cart.reduce((total, item) => total + item.quantity, 0)
  }

  cartCountElement.textContent = itemCount
  cartCountElement.style.display = itemCount > 0 ? "inline-block" : "none"
}

function saveProductsToLocalStorage(products) {
  localStorage.setItem("products", JSON.stringify(products))
  console.log("Products saved to localStorage")
}