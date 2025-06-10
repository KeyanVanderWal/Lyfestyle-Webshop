document.addEventListener("DOMContentLoaded", () => {
    loadOrderSummary();
    updateCartCount();
    initializeForm();

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
        alert("Je winkelwagen is leeg. Je wordt doorgestuurd naar de shop.");
        window.location.href = "../index.html";
    }
});

function initializeForm() {
    const form = document.getElementById("checkout-form");
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const creditCardDetails = document.getElementById("credit-card-details");

    paymentMethods.forEach((method) => {
        method.addEventListener("change", function () {
            document.querySelectorAll(".payment-method").forEach((pm) => {
                pm.classList.remove("selected");
            });

            this.closest(".payment-method").classList.add("selected");

            if (this.value === "creditCard") {
                creditCardDetails.style.display = "block";
                document.getElementById("cardNumber").required = true;
                document.getElementById("expiryDate").required = true;
                document.getElementById("cvv").required = true;
            } else {
                creditCardDetails.style.display = "none";
                document.getElementById("cardNumber").required = false;
                document.getElementById("expiryDate").required = false;
                document.getElementById("cvv").required = false;
            }
        });
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        if (validateForm()) {
            processOrder();
        }
    });

    document.getElementById("cardNumber").addEventListener("input", (e) => {
        const value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
        const formattedValue = value.match(/.{1,4}/g)?.join(" ") || value;
        if (formattedValue !== e.target.value) {
            e.target.value = formattedValue;
        }
    });

    document.getElementById("expiryDate").addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length >= 2) {
            value = value.substring(0, 2) + "/" + value.substring(2, 4);
        }
        e.target.value = value;
    });

    document.getElementById("cvv").addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/\D/g, "").substring(0, 4);
    });
}

function validateForm() {
    let isValid = true;
    const requiredFields = ["email", "firstName", "lastName", "address", "city", "postalCode", "country"];

    document.querySelectorAll(".error-message").forEach((error) => {
        error.style.display = "none";
    });

    requiredFields.forEach((fieldName) => {
        const field = document.getElementById(fieldName);
        const errorElement = document.getElementById(fieldName + "-error");

        if (!field.value.trim()) {
            errorElement.style.display = "block";
            isValid = false;
        }
    });

    const email = document.getElementById("email");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.value && !emailRegex.test(email.value)) {
        document.getElementById("email-error").style.display = "block";
        isValid = false;
    }

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    if (!paymentMethod) {
        alert("Selecteer een betaalmethode.");
        isValid = false;
    }

    if (paymentMethod && paymentMethod.value === "creditCard") {
        const cardNumber = document.getElementById("cardNumber").value.replace(/\s/g, "");
        const expiryDate = document.getElementById("expiryDate").value;
        const cvv = document.getElementById("cvv").value;

        if (!cardNumber || cardNumber.length < 13) {
            alert("Voer een geldig kaartnummer in.");
            isValid = false;
        }

        if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
            alert("Voer een geldige vervaldatum in (MM/YY).");
            isValid = false;
        }

        if (!cvv || cvv.length < 3) {
            alert("Voer een geldige CVV code in.");
            isValid = false;
        }
    }

    return isValid;
}

async function processOrder() {
    const loadingOverlay = document.getElementById("loading-overlay");
    const placeOrderBtn = document.getElementById("place-order-btn");

    loadingOverlay.style.display = "flex";
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Verwerken...';

    try {
        const formData = new FormData(document.getElementById("checkout-form"));

        const orderData = {
            customer: {
                email: formData.get("email"),
                firstName: formData.get("firstName"),
                lastName: formData.get("lastName"),
                address: formData.get("address"),
                city: formData.get("city"),
                postalCode: formData.get("postalCode"),
                country: formData.get("country"),
            },
            paymentMethod: formData.get("paymentMethod"),
            items: JSON.parse(localStorage.getItem("cart")) || [],
            total: document.getElementById("order-total").textContent,
            orderDate: new Date().toISOString(),
            orderNumber: generateOrderNumber(),
        };

        const orders = JSON.parse(localStorage.getItem("orders")) || [];
        orders.push(orderData);
        localStorage.setItem("orders", JSON.stringify(orders));

        localStorage.removeItem("cart");

        showOrderConfirmation(orderData.orderNumber);
    } catch (error) {
        console.error("Order processing failed:", error);
        alert("Er is een fout opgetreden bij het verwerken van je bestelling. Probeer het opnieuw.");
    } finally {
        loadingOverlay.style.display = "none";
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = '<i class="bi bi-lock-fill"></i> Bestelling Plaatsen';
    }
} // ✅ Deze sluit de processOrder functie correct af

function generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `LYF-${new Date().getFullYear()}-${timestamp.toString().slice(-6)}${random.toString().padStart(3, "0")}`;
}

function showOrderConfirmation(orderNumber) {
    document.getElementById("checkout-form-container").style.display = "none";
    document.getElementById("order-confirmation").style.display = "block";
    document.getElementById("order-number-display").textContent = "#" + orderNumber;

    updateCartCount();
    window.scrollTo(0, 0);
}

async function loadOrderSummary() {
    const orderItemsContainer = document.getElementById("order-items");
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        orderItemsContainer.innerHTML = "<p>Geen producten in winkelwagen.</p>";
        return;
    }

    try {
        let productsData;

        try {
            if (localStorage.getItem("products")) {
                productsData = JSON.parse(localStorage.getItem("products"));
            } else {
                const response = await fetch("/json/products.json");
                productsData = await response.json();
                localStorage.setItem("products", JSON.stringify(productsData));
            }
        } catch (e) {
            try {
                const response = await fetch("../json/products.json");
                productsData = await response.json();
                localStorage.setItem("products", JSON.stringify(productsData));
            } catch (e2) {
                console.error("Failed to load products:", e2);
                orderItemsContainer.innerHTML = "<p>Kon producten niet laden.</p>";
                return;
            }
        }

        let orderHTML = "";
        let subtotal = 0;

        cart.forEach((cartItem) => {
            const product = productsData.find((p) => p.id === cartItem.id);
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
                    </div>`;
            }
        });

        orderItemsContainer.innerHTML = orderHTML;
        document.getElementById("order-subtotal").textContent = `€${subtotal.toFixed(2)}`;
        document.getElementById("order-total").textContent = `€${subtotal.toFixed(2)}`;
    } catch (error) {
        console.error("Error loading order summary:", error);
        orderItemsContainer.innerHTML = "<p>Fout bij laden van bestelling.</p>";
    }
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById("cart-count");

    if (cartCountElement) {
        cartCountElement.textContent = totalItems;

        if (totalItems === 0) {
            cartCountElement.style.display = "none";
        } else {
            cartCountElement.style.display = "inline";
        }
    }
}