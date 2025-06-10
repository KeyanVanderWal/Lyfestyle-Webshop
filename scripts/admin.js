const productListElement = document.getElementById("product-list");
const orderListElement = document.getElementById("order-list");
const searchInput = document.getElementById("search-products");
const searchOrdersInput = document.getElementById("search-orders");
const addProductBtn = document.getElementById("add-product-btn");
const resetProductsBtn = document.getElementById("reset-products-btn");
const clearOrdersBtn = document.getElementById("clear-orders-btn");

let productModal;
let orderModal;
let deleteModal;
let resetModal;
let clearOrdersModal;

const productForm = document.getElementById("productForm");
const saveProductBtn = document.getElementById("save-product");
const addImageFieldBtn = document.getElementById("add-image-field");
const confirmDeleteBtn = document.getElementById("confirm-delete");
const confirmResetBtn = document.getElementById("confirm-reset");
const confirmClearOrdersBtn = document.getElementById("confirm-clear-orders");

let products = [];
let orders = [];
let currentProductId = null;
let originalProducts = [];

async function loadProducts() {
    try {
        const storedProducts = localStorage.getItem("admin_products");
        if (storedProducts) {
            products = JSON.parse(storedProducts);
        } else {
            await loadOriginalProducts();
        }
        displayProducts();
    } catch (error) {
        console.error("Error loading products:", error);
        productListElement.innerHTML =
            '<tr><td colspan="5" class="text-center">Error loading products. Please try again later.</td></tr>';
    }
}

async function loadOriginalProducts() {
    try {
        const response = await fetch("../json/products.json");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        products = data.products;
        originalProducts = JSON.parse(JSON.stringify(data.products));
        localStorage.setItem("admin_products", JSON.stringify(products));
    } catch (error) {
        console.error("Error loading original products:", error);
        throw error;
    }
}

function displayProducts(filteredProducts = null) {
    const productsToDisplay = filteredProducts || products;
    productListElement.innerHTML = "";

    if (productsToDisplay.length === 0) {
        productListElement.innerHTML =
            '<tr><td colspan="5" class="text-center">No products found</td></tr>';
        return;
    }

    productsToDisplay.forEach((product) => {
        const row = document.createElement("tr");
        let slash = "";
        const s1 = product.frontImage.substring(0, 5);
        if (s1 != "https") {
            slash = "/";
        } else {
            slash = "";
        }

        row.innerHTML = `
            <td>${product.id}</td>
            <td><img src="${slash}${product.frontImage}" alt="${product.name}"
                class="img-thumbnail" width="50"></td>
            <td>${product.name}</td>
            <td>${product.price}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary edit-product" data-id="${product.id}">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger delete-product" data-id="${product.id}"
                    data-name="${product.name}">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        `;
        productListElement.appendChild(row);
    });

    document.querySelectorAll(".edit-product").forEach((button) => {
        button.addEventListener("click", handleEditProduct);
    });

    document.querySelectorAll(".delete-product").forEach((button) => {
        button.addEventListener("click", handleDeleteProduct);
    });
}

function filterProducts(searchTerm) {
    if (!searchTerm.trim()) {
        displayProducts();
        return;
    }

    const lowerSearch = searchTerm.toLowerCase();

    const filteredProducts = products.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(lowerSearch);
        const idMatch = product.id.toString().includes(searchTerm);
        const priceMatch = product.price.toLowerCase().includes(lowerSearch);
        return nameMatch || idMatch || priceMatch;
    });
    displayProducts(filteredProducts);
}

function openAddProductModal() {
    productForm.reset();
    document.getElementById("productModalLabel").textContent = "Add New Product";
    document.getElementById("product-id").value = "";
    currentProductId = null;

    const imagesContainer = document.getElementById("product-images-container");
    imagesContainer.innerHTML = `
        <div class="input-group mb-2">
            <input type="text" class="form-control product-detail-image" required
                placeholder="../img/example.webp">
            <button class="btn btn-outline-danger remove-image" type="button">Remove</button>
        </div>
    `;
    imagesContainer.querySelector(".remove-image").addEventListener("click", removeImageField);
    productModal.show();
}

function handleEditProduct(event) {
    const productId = Number.parseInt(event.currentTarget.getAttribute("data-id"));
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    currentProductId = productId;
    document.getElementById("productModalLabel").textContent = "Edit Product";
    document.getElementById("product-id").value = product.id;
    document.getElementById("product-name").value = product.name;
    document.getElementById("product-price").value = product.price;
    document.getElementById("front-image").value = product.frontImage;
    document.getElementById("hover-image").value = product.hoverImage;

    const imagesContainer = document.getElementById("product-images-container");
    imagesContainer.innerHTML = "";

    if (Array.isArray(product.productImage) && product.productImage.length > 0) {
        product.productImage.forEach((image) => {
            addImageField(image);
        });
    } else {
        addImageField();
    }
    productModal.show();
}

function addImageField(value = "") {
    const imagesContainer = document.getElementById("product-images-container");
    const imageGroup = document.createElement("div");
    imageGroup.className = "input-group mb-2";
    imageGroup.innerHTML = `
        <input type="text" class="form-control product-detail-image" value="${value}" required
            placeholder="../img/example.webp">
        <button class="btn btn-outline-danger remove-image" type="button">Remove</button>
    `;
    imageGroup.querySelector(".remove-image").addEventListener("click", removeImageField);
    imagesContainer.appendChild(imageGroup);
}

function removeImageField(event) {
    const imageFields = document.querySelectorAll(".product-detail-image");
    if (imageFields.length > 1) {
        event.target.closest(".input-group").remove();
    } else {
        event.target.closest(".input-group").querySelector("input").value = "";
    }
}

function handleDeleteProduct(event) {
    const productId = Number.parseInt(event.currentTarget.getAttribute("data-id"));
    const productName = event.currentTarget.getAttribute("data-name");
    document.querySelector(".product-to-delete").textContent = productName;
    currentProductId = productId;
    deleteModal.show();
}

function saveProduct() {
    if (!productForm.checkValidity()) {
        productForm.reportValidity();
        return;
    }

    const productId = document.getElementById("product-id").value;
    const productName = document.getElementById("product-name").value;
    const productPrice = document.getElementById("product-price").value;
    const frontImage = document.getElementById("front-image").value;
    const hoverImage = document.getElementById("hover-image").value;

    const detailImages = Array.from(document.querySelectorAll(".product-detail-image"))
        .map((input) => input.value)
        .filter((value) => value.trim() !== "");

    const productData = {
        id: productId,
        name: productName,
        price: productPrice,
        frontImage: frontImage,
        hoverImage: hoverImage,
        productImage: detailImages,
    };

    if (currentProductId) {
        productData.id = Number.parseInt(currentProductId);
        const index = products.findIndex((p) => p.id === productData.id);
        if (index !== -1) {
            productData.detailsLink = products[index].detailsLink ||
                `/pages/productDetail.html?id=${productData.id}`;
            products[index] = productData;
        }
    } else {
        const maxId = products.reduce((max, prod) => Math.max(max, prod.id), 0);
        productData.id = maxId + 1;
        productData.detailsLink = `/pages/productDetail.html?id=${productData.id}`;
        products.push(productData);
    }

    localStorage.setItem("admin_products", JSON.stringify(products));
    localStorage.setItem("products", JSON.stringify({ products: products }));
    updateProductsJSON();
    productModal.hide();
    displayProducts();
    showToast(currentProductId ? "Product updated successfully!" : "Product added successfully!");
}

function deleteProduct() {
    if (!currentProductId) return;
    const index = products.findIndex((p) => p.id === currentProductId);
    if (index !== -1) {
        products.splice(index, 1);
        localStorage.setItem("admin_products", JSON.stringify(products));
        localStorage.setItem("products", JSON.stringify({ products: products }));
        updateProductsJSON();
        deleteModal.hide();
        displayProducts();
        showToast("Product deleted successfully!");
    }
}

function updateProductsJSON() {
    console.log("Products data updated:", products);
    const productsData = { products: products };
    console.log("New products.json data:", JSON.stringify(productsData, null, 2));
}

async function resetProducts() {
    try {
        await loadOriginalProducts();

        localStorage.setItem("admin_products", JSON.stringify(products));
        localStorage.setItem("products", JSON.stringify({ products: products }));

        displayProducts();
        resetModal.hide();
        showToast("All products have been reset to their original state!");
    } catch (error) {
        console.error("Error resetting products:", error);
        showToast("Error resetting products. Please try again later.");
    }
}

function loadOrders() {
    try {
        const storedOrders = localStorage.getItem("bestellingen");
        if (storedOrders) {
            const parsedData = JSON.parse(storedOrders);
            if (Array.isArray(parsedData)) {
                orders = parsedData;
            } else if (parsedData && parsedData.orders && Array.isArray(parsedData.orders)) {
                orders = parsedData.orders;
            } else if (parsedData && typeof parsedData === "object") {
                orders = Object.values(parsedData).filter((item) => item && typeof item === "object");
            } else {
                orders = [];
            }
        } else {
            orders = [];
        }
        displayOrders();
        updateOrderStats();
    } catch (error) {
        console.error("Error loading orders:", error);
        orders = [];
        orderListElement.innerHTML =
            '<tr><td colspan="4" class="text-center">Error loading orders. Please try again later.</td></tr>';
    }
}

function getProductNameById(productId) {
    const adminProducts = JSON.parse(localStorage.getItem("admin_products") || "[]");
    const product = adminProducts.find((p) => p.id == productId);
    return product ? product.name : "Unknown Product";
}

function displayOrders(filteredOrders = null) {
    const ordersToDisplay = filteredOrders || orders;
    orderListElement.innerHTML = "";

    if (ordersToDisplay.length === 0) {
        orderListElement.innerHTML = '<tr><td colspan="4" class="text-center">No orders found</td></tr>';
        return;
    }

    const adminProducts = JSON.parse(localStorage.getItem("admin_products") || "[]");

    ordersToDisplay.forEach((order, index) => {
        const row = document.createElement("tr");
        const orderId = order.id || order.orderID || order.ID || index + 1;

        let orderProducts = [];
        if (order.products && Array.isArray(order.products)) {
            orderProducts = order.products;
        } else if (order.items && Array.isArray(order.items)) {
            orderProducts = order.items;
        } else if (order.cart && Array.isArray(order.cart)) {
            orderProducts = order.cart;
        }

        const totalProducts = orderProducts.length;

        const productNames = orderProducts
            .map((p) => {
                const productId = p.id || p.productId || p.ID;
                const fullProduct = adminProducts.find((ap) => ap.id == productId);
                return fullProduct ? fullProduct.name : "Unknown Product";
            })
            .join(", ");

        row.innerHTML = `
            <td>#${orderId}</td>
            <td>${totalProducts}</td>
            <td>${productNames || "No products"}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-info view-order" data-id="${orderId}" data-index="${index}">
                    <i class="bi bi-eye"></i> View
                </button>
                <button class="btn btn-sm btn-danger delete-order" data-id="${orderId}" data-index="${index}">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        `;
        orderListElement.appendChild(row);
    });

    document.querySelectorAll(".view-order").forEach((button) => {
        button.addEventListener("click", handleViewOrder);
    });

    document.querySelectorAll(".delete-order").forEach((button) => {
        button.addEventListener("click", handleDeleteOrder);
    });
}

function filterOrders(searchTerm) {
    if (!searchTerm.trim()) {
        displayOrders();
        return;
    }

    const filteredOrders = orders.filter((order) => {
        const orderIdMatch = order.id.toString().includes(searchTerm);
        const productMatch =
            order.products &&
            order.products.some((orderProduct) => {
                const productId = orderProduct.id || orderProduct.productId || orderProduct.ID;
                const productName = getProductNameById(productId);
                return productName.toLowerCase().includes(searchTerm.toLowerCase());
            });
        return orderIdMatch || productMatch;
    });
    displayOrders(filteredOrders);
}

function handleViewOrder(event) {
    const orderId = event.currentTarget.getAttribute("data-id");
    const orderIndex = Number.parseInt(event.currentTarget.getAttribute("data-index"));
    const order = orders[orderIndex];
    if (!order) return;

    const orderDetailsContent = document.getElementById("order-details-content");

    let orderProducts = [];
    if (order.products && Array.isArray(order.products)) {
        orderProducts = order.products;
    } else if (order.items && Array.isArray(order.items)) {
        orderProducts = order.items;
    } else if (order.cart && Array.isArray(order.cart)) {
        orderProducts = order.cart;
    }

    let productsHtml = "";
    if (orderProducts && orderProducts.length > 0) {
        const adminProducts = JSON.parse(localStorage.getItem("admin_products") || "[]");
        productsHtml = orderProducts
            .map((orderProduct) => {
                const productId = orderProduct.id || orderProduct.productId || orderProduct.ID;
                const fullProduct = adminProducts.find((p) => p.id == productId);
                const productName = fullProduct?.name || orderProduct.name ||
                    orderProduct.title || orderProduct.productName || "Unknown Product";
                const productPrice = fullProduct?.price || orderProduct.price ||
                    orderProduct.cost || "N/A";
                const productImage = fullProduct?.frontImage || orderProduct.frontImage ||
                    orderProduct.image || orderProduct.img;
                const quantity = orderProduct.quantity || orderProduct.qty || 1;

                let imageSrc = "";
                if (productImage) {
                    const s1 = productImage.substring(0, 5);
                    const slash = s1 !== "https" ? "/" : "";
                    imageSrc = slash + productImage;
                }

                const imageHtml = imageSrc ?
                    `<img src="${imageSrc}" alt="${productName}" class="img-fluid rounded"
                        style="max-height: 150px; object-fit: cover;">` :
                    `<div class="bg-light rounded d-flex align-items-center justify-content-center"
                        style="height: 150px;"><span class="text-muted">No Image</span></div>`;

                const statusHtml = fullProduct ?
                    `<p class="card-text"><small class="text-success">
                        ✓ Product details loaded from admin_products</small></p>` :
                    `<p class="card-text"><small class="text-warning">
                        ⚠ Using order data (product not found in admin_products)</small></p>`;

                return `
                    <div class="card mb-2">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-3">
                                    ${imageHtml}
                                </div>
                                <div class="col-md-9">
                                    <h6 class="card-title">${productName}</h6>
                                    <p class="card-text"><strong>Price:</strong> ${productPrice}</p>
                                    <p class="card-text"><strong>Quantity:</strong> ${quantity}</p>
                                    ${statusHtml}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            })
            .join("");
    } else {
        productsHtml = "<p>No products in this order</p>";
    }

    orderDetailsContent.innerHTML = `
        <div class="order-info">
            <h4>Order #${orderId}</h4>
            <p><strong>Total Items:</strong> ${orderProducts.length}</p>
            <hr>
            <h5>Products:</h5>
            ${productsHtml}
        </div>
    `;
    orderModal.show();
}

function showDeleteConfirmation(message, callback) {
    const userConfirmed = window.confirm(message);
    if (userConfirmed) {
        callback();
    }
}

function handleDeleteOrder(event) {
    const orderId = Number.parseInt(event.currentTarget.getAttribute("data-id"));
    showDeleteConfirmation(`Are you sure you want to delete order #${orderId}?`, () => {
        deleteOrder(orderId);
    });
}

function deleteOrder(orderId) {
    const index = orders.findIndex((o) => o.id === orderId);
    if (index !== -1) {
        orders.splice(index, 1);
        localStorage.setItem("bestellingen", JSON.stringify(orders));
        displayOrders();
        updateOrderStats();
        showToast("Order deleted successfully!");
    }
}

function updateOrderStats() {
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, order) => {
        let orderItems = 0;
        if (order.products && Array.isArray(order.products)) {
            orderItems = order.products.length;
        } else if (order.items && Array.isArray(order.items)) {
            orderItems = order.items.length;
        } else if (order.cart && Array.isArray(order.cart)) {
            orderItems = order.cart.length;
        }
        return sum + orderItems;
    }, 0);

    const avgItems = totalOrders > 0 ? (totalItems / totalOrders).toFixed(1) : "0.0";
    let latestOrder = "-";
    if (orders.length > 0) {
        const lastOrder = orders[orders.length - 1];
        const orderId = lastOrder.id || lastOrder.orderID || lastOrder.ID || orders.length;
        latestOrder = `#${orderId}`;
    }

    document.getElementById("total-orders").textContent = totalOrders;
    document.getElementById("total-items").textContent = totalItems;
    document.getElementById("avg-items").textContent = avgItems;
    document.getElementById("latest-order").textContent = latestOrder;
}

function placeOrder(shoppingCartData = null) {
    const shoppingCart = shoppingCartData || JSON.parse(localStorage.getItem("shoppingCart")) || [];
    if (shoppingCart.length === 0) {
        showToast("No items in shopping cart!");
        return undefined;
    }

    const newOrderID = orders.length > 0 ? Math.max(...orders.map((o) => o.id)) + 1 : 1;
    const newOrder = {
        id: newOrderID,
        products: shoppingCart,
    };

    orders.push(newOrder);
    localStorage.setItem("bestellingen", JSON.stringify(orders));
    if (!shoppingCartData) {
        localStorage.removeItem("shoppingCart");
    }

    displayOrders();
    updateOrderStats();
    showToast("Order placed successfully!");
    return newOrder;
}

function clearAllOrders() {
    orders = [];
    localStorage.removeItem("bestellingen");
    displayOrders();
    updateOrderStats();
    clearOrdersModal.hide();
    showToast("All orders cleared successfully!");
}

function showToast(message) {
    const toastElement = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");
    toastMessage.textContent = message;
    const toast = new window.bootstrap.Toast(toastElement);
    toast.show();
}

document.addEventListener("DOMContentLoaded", () => {
    productModal = new window.bootstrap.Modal(document.getElementById("productModal"));
    orderModal = new window.bootstrap.Modal(document.getElementById("orderModal"));
    deleteModal = new window.bootstrap.Modal(document.getElementById("deleteModal"));
    resetModal = new window.bootstrap.Modal(document.getElementById("resetModal"));
    clearOrdersModal = new window.bootstrap.Modal(document.getElementById("clearOrdersModal"));

    loadProducts();
    loadOrders();

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            filterProducts(searchInput.value);
        });
    }

    if (searchOrdersInput) {
        searchOrdersInput.addEventListener("input", () => {
            filterOrders(searchOrdersInput.value);
        });
    }

    if (addProductBtn) {
        addProductBtn.addEventListener("click", openAddProductModal);
    }

    if (resetProductsBtn) {
        resetProductsBtn.addEventListener("click", () => resetModal.show());
    }

    if (addImageFieldBtn) {
        addImageFieldBtn.addEventListener("click", () => addImageField());
    }

    if (saveProductBtn) {
        saveProductBtn.addEventListener("click", saveProduct);
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", deleteProduct);
    }

    if (confirmResetBtn) {
        confirmResetBtn.addEventListener("click", resetProducts);
    }

    if (clearOrdersBtn) {
        clearOrdersBtn.addEventListener("click", () => clearOrdersModal.show());
    }

    if (confirmClearOrdersBtn) {
        confirmClearOrdersBtn.addEventListener("click", clearAllOrders);
    }

    const orderTab = document.getElementById("orders-tab");
    if (orderTab) {
        orderTab.addEventListener("shown.bs.tab", () => {
            loadOrders();
        });
    }
});