const productListElement = document.getElementById('product-list');
const searchInput = document.getElementById('search-products');
const addProductBtn = document.getElementById('add-product-btn');
const productModal = new bootstrap.Modal(document.getElementById('productModal'));
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
const productForm = document.getElementById('productForm');
const saveProductBtn = document.getElementById('save-product');
const addImageFieldBtn = document.getElementById('add-image-field');
const confirmDeleteBtn = document.getElementById('confirm-delete');

let products = [];
let currentProductId = null;

async function loadProducts() {
  try {
    const storedProducts = localStorage.getItem('admin_products');
    
    if (storedProducts) {
      products = JSON.parse(storedProducts);
    } else {
      const response = await fetch('./json/products.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      products = data.products;
      
      localStorage.setItem('admin_products', JSON.stringify(products));
    }
    
    displayProducts();
  } catch (error) {
    console.error('Error loading products:', error);
    productListElement.innerHTML = '<tr><td colspan="5" class="text-center">Error loading products. Please try again later.</td></tr>';
  }
}

function displayProducts(filteredProducts = null) {
  const productsToDisplay = filteredProducts || products;
  
  productListElement.innerHTML = '';
  
  if (productsToDisplay.length === 0) {
    productListElement.innerHTML = '<tr><td colspan="5" class="text-center">No products found</td></tr>';
    return;
  }
  
  productsToDisplay.forEach(product => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${product.id}</td>
      <td><img src="${product.frontImage}" alt="${product.name}" class="img-thumbnail" width="50"></td>
      <td>${product.name}</td>
      <td>${product.price}</td>
      <td class="action-buttons">
        <button class="btn btn-sm btn-primary edit-product" data-id="${product.id}">
          <i class="bi bi-pencil"></i> Edit
        </button>
        <button class="btn btn-sm btn-danger delete-product" data-id="${product.id}" data-name="${product.name}">
          <i class="bi bi-trash"></i> Delete
        </button>
      </td>
    `;
    
    productListElement.appendChild(row);
  });
  
  document.querySelectorAll('.edit-product').forEach(button => {
    button.addEventListener('click', handleEditProduct);
  });
  
  document.querySelectorAll('.delete-product').forEach(button => {
    button.addEventListener('click', handleDeleteProduct);
  });
}

function filterProducts(searchTerm) {
  if (!searchTerm.trim()) {
    displayProducts();
    return;
  }
  
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toString().includes(searchTerm) ||
    product.price.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  displayProducts(filteredProducts);
}

function openAddProductModal() {
  productForm.reset();
  document.getElementById('productModalLabel').textContent = 'Add New Product';
  
  document.getElementById('product-id').value = '';
  currentProductId = null;
  
  const imagesContainer = document.getElementById('product-images-container');
  imagesContainer.innerHTML = `
    <div class="input-group mb-2">
      <input type="text" class="form-control product-detail-image" required placeholder="../img/example.webp">
      <button class="btn btn-outline-danger remove-image" type="button">Remove</button>
    </div>
  `;
  
  imagesContainer.querySelector('.remove-image').addEventListener('click', removeImageField);
  
  productModal.show();
}

function handleEditProduct(event) {
  const productId = parseInt(event.currentTarget.getAttribute('data-id'));
  const product = products.find(p => p.id === productId);
  
  if (!product) return;
  
  currentProductId = productId;
  
  document.getElementById('productModalLabel').textContent = 'Edit Product';
  
  document.getElementById('product-id').value = product.id;
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-price').value = product.price;
  document.getElementById('front-image').value = product.frontImage;
  document.getElementById('hover-image').value = product.hoverImage;
  
  const imagesContainer = document.getElementById('product-images-container');
  imagesContainer.innerHTML = '';
  
  if (Array.isArray(product.productImage) && product.productImage.length > 0) {
    product.productImage.forEach((image, index) => {
      addImageField(image);
    });
  } else {
    addImageField();
  }
  
  productModal.show();
}

function addImageField(value = '') {
  const imagesContainer = document.getElementById('product-images-container');
  
  const imageGroup = document.createElement('div');
  imageGroup.className = 'input-group mb-2';
  
  imageGroup.innerHTML = `
    <input type="text" class="form-control product-detail-image" value="${value}" required placeholder="../img/example.webp">
    <button class="btn btn-outline-danger remove-image" type="button">Remove</button>
  `;
  
  imageGroup.querySelector('.remove-image').addEventListener('click', removeImageField);
  
  imagesContainer.appendChild(imageGroup);
}

function removeImageField(event) {
  const imageFields = document.querySelectorAll('.product-detail-image');
  
  if (imageFields.length > 1) {
    event.target.closest('.input-group').remove();
  } else {
    event.target.closest('.input-group').querySelector('input').value = '';
  }
}

function handleDeleteProduct(event) {
  const productId = parseInt(event.currentTarget.getAttribute('data-id'));
  const productName = event.currentTarget.getAttribute('data-name');
  
  document.querySelector('.product-to-delete').textContent = productName;
  
  currentProductId = productId;
  
  deleteModal.show();
}

function saveProduct() {
  if (!productForm.checkValidity()) {
    productForm.reportValidity();
    return;
  }
  
  const productId = document.getElementById('product-id').value;
  const productName = document.getElementById('product-name').value;
  const productPrice = document.getElementById('product-price').value;
  const frontImage = document.getElementById('front-image').value;
  const hoverImage = document.getElementById('hover-image').value;
  
  const detailImages = Array.from(document.querySelectorAll('.product-detail-image'))
    .map(input => input.value)
    .filter(value => value.trim() !== '');
  
  const product = {
    id: productId,
    name: productName,
    price: productPrice,
    frontImage: frontImage,
    hoverImage: hoverImage,
    productImage: detailImages
  };
  
  if (currentProductId) {
    product.id = parseInt(currentProductId);
    const index = products.findIndex(p => p.id === product.id);
    
    if (index !== -1) {
      product.detailsLink = products[index].detailsLink || `./pages/productDetail.html?id=${product.id}`;
      
      products[index] = product;
    }
  } else {
    const maxId = products.reduce((max, product) => Math.max(max, product.id), 0);
    product.id = maxId + 1;
    product.detailsLink = `./pages/productDetail.html?id=${product.id}`;
    
    products.push(product);
  }
  
  localStorage.setItem('admin_products', JSON.stringify(products));
  
  localStorage.setItem('products', JSON.stringify({ products: products }));
  
  updateProductsJSON();
  
  productModal.hide();
  displayProducts();
  
  showToast(currentProductId ? 'Product updated successfully!' : 'Product added successfully!');
}

function deleteProduct() {
  if (!currentProductId) return;
  
  const index = products.findIndex(p => p.id === currentProductId);
  
  if (index !== -1) {
    products.splice(index, 1);
    
    localStorage.setItem('admin_products', JSON.stringify(products));
    
    localStorage.setItem('products', JSON.stringify({ products: products }));
    
    updateProductsJSON();
    
    deleteModal.hide();
    displayProducts();
    
    showToast('Product deleted successfully!');
  }
}

function updateProductsJSON() {
  console.log('Products data updated:', products);
  
  const productsData = { products: products };
  
  console.log('New products.json data:', JSON.stringify(productsData, null, 2));
}

function showToast(message) {
  alert(message);
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  
  searchInput.addEventListener('input', () => {
    filterProducts(searchInput.value);
  });
  
  addProductBtn.addEventListener('click', openAddProductModal);
  
  addImageFieldBtn.addEventListener('click', () => addImageField());
  
  saveProductBtn.addEventListener('click', saveProduct);
  
  confirmDeleteBtn.addEventListener('click', deleteProduct);
});