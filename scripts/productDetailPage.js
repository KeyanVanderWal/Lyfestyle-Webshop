document.addEventListener("DOMContentLoaded", async () => {
    console.log("✅ DOMContentLoaded triggered");

    try {
        // ✅ 1. Haal product ID op uit URL
        const urlParams = new URLSearchParams(window.location.search);
        const productIdParam = urlParams.get("id");

        if (!productIdParam) {
            throw new Error("❌ Geen product ID gevonden in de URL.");
        }

        const productId = parseInt(productIdParam);
        console.log("ℹ️ Geselecteerd product ID:", productId);

        // ✅ 2. Productdata ophalen uit localStorage of via fetch
        let data;

        const storedProducts = localStorage.getItem("products");

        if (storedProducts) {
            console.log("✅ Producten gevonden in localStorage");
            data = JSON.parse(storedProducts);
        } else {
            console.log("⚠️ Geen producten in localStorage. Ophalen via fetch...");
            const response = await fetch("../json/products.json");

            if (!response.ok) {
                throw new Error(`❌ Fout bij ophalen van JSON: ${response.status}`);
            }

            data = await response.json();
            console.log("✅ Producten succesvol opgehaald via fetch");

            // Sla op in localStorage voor volgende keer
            localStorage.setItem("products", JSON.stringify(data));
            console.log("✅ Producten opgeslagen in localStorage");
        }

        if (!data || !Array.isArray(data.products)) {
            throw new Error("❌ Ongeldige of ontbrekende products-array in data.");
        }

        // ✅ 3. Zoek het specifieke product op
        const product = data.products.find((p) => p.id === productId);

        if (!product) {
            throw new Error("❌ Product niet gevonden met ID: " + productId);
        }

        console.log("✅ Product gevonden:", product);

        // ✅ 4. Toon ofdafbeelding
        const mainImage = document.getElementById("product-image");
        mainImage.src = product.productImage[0];
        mainImage.alt = product.name;

        // ✅ 5. Toon thumbnails
        const thumbnailsContainer = document.querySelector(".thumbnails");
        thumbnailsContainer.innerHTML = "";

        if (Array.isArray(product.productImage)) {
            product.productImage.forEach((image, index) => {
                const colDiv = document.createElement("div");
                colDiv.className = "col-3";

                const img = document.createElement("img");
                img.id = `thumbnail-${index + 1}`;
                img.src = image;
                img.alt = `${product.name} View ${index + 1}`;
                img.className = "thumbnail";

                img.addEventListener("click", function () {
                    mainImage.src = this.src;
                });

                colDiv.appendChild(img);
                thumbnailsContainer.appendChild(colDiv);
            });

            console.log("✅ Thumbnails toegevoegd:", product.productImage.length);
        }

        // ✅ 6. Vul productgegevens
        document.getElementById("product-title").textContent = product.name;
        document.getElementById("product-price").textContent =
      product.price.replace(",", ".");
        document
            .getElementById("add-to-cart")
            .setAttribute("data-product-id", product.id);

        document.title = `${product.name} - Lyfestyle Shop`;

        const detailsContainer = document.getElementById("product-details");
        detailsContainer.innerHTML = `
      <p>ITEM IS IN STOCK AND SHIPS IN 3-5 BUSINESS DAYS</p>
      <p>${product.name.includes("HAT")
        ? "EMBROIDERED FRONT GRAPHICS<br>ADJUSTABLE 5 PANEL HAT<br>COLOR BLACK"
        : "PREMIUM QUALITY MATERIAL"
}</p>
    `;

        // ✅ 7. Toon andere producten
        const otherProducts = data.products.filter((p) => p.id !== productId);
        const selectedProducts = otherProducts
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);

        const alsoAvailableContainer = document.getElementById(
            "also-available-container",
        );
        alsoAvailableContainer.innerHTML = "";

        selectedProducts.forEach((p) => {
            let productImage;
            if (Array.isArray(p.productImage)) {
                productImage = p.productImage[0];
            } else if (p.frontImage) {
                productImage = `../img/${p.frontImage.split("/").pop()}`;
            } else {
                productImage = "../img/placeholder.webp";
            }

            const merchItem = `
        <div class="col-md-3 col-6 merch-item">
          <a href="?id=${p.id}">
            <img src="${productImage}" class="merch-image" alt="${p.name}">
            <div class="merch-title">${p.name}</div>
            <div class="merch-price">${p.price.replace(",", ".")}</div>
          </a>
        </div>
      `;

            alsoAvailableContainer.innerHTML += merchItem;
        });

        console.log("✅ Ook beschikbaar sectie bijgewerkt");

        // ✅ 8. Setup 'add to cart'
        const addToCartBtn = document.getElementById("add-to-cart");
        if (addToCartBtn) {
            addToCartBtn.addEventListener("click", function () {
                const id = parseInt(this.getAttribute("data-product-id"));
                console.log("🛒 Product toevoegen aan winkelwagen:", id);
                addToCart(id);
            });
        } else {
            console.error("❌ Kan 'Add to Cart'-knop niet vinden");
        }

        updateCartCount();
    } catch (error) {
        console.error("❌ Fout bij het laden van het product:", error);
        document.querySelector(".product-container").innerHTML =
      '<div class="col-12 text-center text-white">Fout bij laden van product. Probeer het later opnieuw.</div>';
    }
});

// 🛒 Voeg toe aan winkelwagen
function addToCart(id) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find((item) => item.id === id);

    if (existing) {
        existing.quantity++;
        console.log(`✅ Verhoogd aantal van product ${id} in winkelwagen`);
    } else {
        cart.push({ id, quantity: 1 });
        console.log(`✅ Nieuw product toegevoegd aan winkelwagen: ${id}`);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

// 🧮 Toon aantal items in winkelwagen
function updateCartCount() {
    const cartCountElement = document.getElementById("cart-count");
    if (!cartCountElement) return;

    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);

    cartCountElement.textContent = total;
    cartCountElement.style.display = total > 0 ? "inline-block" : "none";

    console.log("🧾 Winkelwagen bijgewerkt. Totaal items:", total);
}
