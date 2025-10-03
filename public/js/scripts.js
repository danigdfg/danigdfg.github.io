function showToast(message, type = 'success') {
  const toastContainer = document.querySelector('.toast-container');
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  toastContainer.appendChild(toast);
  new bootstrap.Toast(toast).show();
}

async function loadProducts() {
  AOS.refresh();
  const response = await fetch('/api/products');
  const products = await response.json();
  displayProducts(products);
}

function displayProducts(products) {
  const productList = document.getElementById('productList');
  productList.innerHTML = '';
  products.forEach(product => {
    const card = `
      <div class="col-md-4 mb-3" data-aos="zoom-in">
        <div class="card shadow-sm">
          <img src="${product.image}" class="card-img-top zoom-img" alt="${product.name}">
          <div class="card-body">
            <h5 class="card-title">${product.name}</h5>
            <p class="card-text">Categoría: ${product.category}<br>Precio: $${product.price}<br>Marca: ${product.brand}</p>
            <button class="btn btn-primary" onclick="addToCart(${product.id})"><i class="fas fa-cart-plus"></i> Agregar al Carrito</button>
            <button class="btn btn-outline-secondary ms-2" onclick="addToWishlist(${product.id})"><i class="fas fa-heart"></i> Añadir a Wishlist</button>
            <div class="reviews mt-2">
              <h6>Reseñas (${product.reviews ? product.reviews.length : 0})</h6>
              ${product.reviews ? product.reviews.map(r => `<p>${r.user}: ${r.rating} ⭐ - ${r.comment}</p>`).join('') : '<p>No hay reseñas aún.</p>'}
            </div>
            <form class="review-form mt-2">
              <input type="text" placeholder="Tu reseña" required id="reviewComment${product.id}">
              <select required id="reviewRating${product.id}">
                <option value="">Estrellas</option>
                <option value="5">5 ⭐</option>
                <option value="4">4 ⭐</option>
                <option value="3">3 ⭐</option>
                <option value="2">2 ⭐</option>
                <option value="1">1 ⭐</option>
              </select>
              <button type="button" class="btn btn-secondary" onclick="submitReview(${product.id})"><i class="fas fa-star"></i> Enviar</button>
            </form>
          </div>
        </div>
      </div>
    `;
    productList.innerHTML += card;
  });
  AOS.refresh();
}

async function filterProducts() {
  const response = await fetch('/api/products');
  let products = await response.json();

  const search = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;
  const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
  const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
  const brand = document.getElementById('brandFilter').value;

  products = products.filter(p => {
    return (!search || p.name.toLowerCase().includes(search)) &&
           (!category || p.category === category) &&
           (p.price >= minPrice && p.price <= maxPrice) &&
           (!brand || p.brand === brand);
  });

  displayProducts(products);
}

function addToCart(id) {
  fetch('/api/products')
    .then(res => res.json())
    .then(products => {
      const product = products.find(p => p.id === id);
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      const existing = cart.find(item => item.id === id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      localStorage.setItem('cart', JSON.stringify(cart));
      showToast('Producto agregado al carrito!');
    });
}

function displayCart() {
  AOS.refresh();
  const cartItems = document.getElementById('cartItems');
  const subtotalEl = document.getElementById('subtotal');
  const taxEl = document.getElementById('tax');
  const totalPrice = document.getElementById('totalPrice');
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cartItems.innerHTML = '';
  let subtotal = 0;

  cart.forEach((item, index) => {
    const row = `
      <tr>
        <td>${item.name}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="updateQuantity(${index}, -1)"><i class="fas fa-minus"></i></button>
          ${item.quantity}
          <button class="btn btn-sm btn-secondary" onclick="updateQuantity(${index}, 1)"><i class="fas fa-plus"></i></button>
        </td>
        <td>$${item.price * item.quantity}</td>
        <td><button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})"><i class="fas fa-trash"></i> Eliminar</button></td>
      </tr>
    `;
    cartItems.innerHTML += row;
    subtotal += item.price * item.quantity;
  });

  const tax = subtotal * 0.10;
  const total = subtotal + tax;

  subtotalEl.textContent = `Subtotal: $${subtotal.toFixed(2)}`;
  taxEl.textContent = `Impuestos (10%): $${tax.toFixed(2)}`;
  totalPrice.textContent = `Total: $${total.toFixed(2)}`;
  AOS.refresh();
}

function removeFromCart(index) {
  let cart = JSON.parse(localStorage.getItem('cart'));
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  displayCart();
  showToast('Producto eliminado del carrito', 'danger');
}

function updateQuantity(index, change) {
  let cart = JSON.parse(localStorage.getItem('cart'));
  cart[index].quantity += change;
  if (cart[index].quantity < 1) cart[index].quantity = 1;
  localStorage.setItem('cart', JSON.stringify(cart));
  displayCart();
  showToast('Cantidad actualizada');
}

function clearCart() {
  localStorage.removeItem('cart');
  displayCart();
  showToast('Carrito vaciado', 'warning');
}

function checkout() {
  showToast('Pago simulado exitoso! Carrito vaciado.', 'success');
  localStorage.removeItem('cart');
  displayCart();
}

function addToWishlist(id) {
  fetch('/api/products')
    .then(res => res.json())
    .then(products => {
      const product = products.find(p => p.id === id);
      let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
      if (!wishlist.find(item => item.id === id)) {
        wishlist.push(product);
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        showToast('Añadido a Wishlist!');
      } else {
        showToast('Ya está en Wishlist', 'info');
      }
    });
}

async function loadFeaturedProducts() {
  AOS.refresh();
  const response = await fetch('/api/products');
  const products = await response.json();
  const featured = products.slice(0, 4);
  const featuredList = document.getElementById('featuredProducts');
  featuredList.innerHTML = '';
  featured.forEach(product => {
    const card = `
      <div class="col-md-3 mb-3" data-aos="zoom-in">
        <div class="card shadow-sm">
          <img src="${product.image}" class="card-img-top zoom-img" alt="${product.name}">
          <div class="card-body text-center">
            <h5>${product.name}</h5>
            <p>$${product.price}</p>
            <a href="/catalog.html" class="btn btn-outline-primary">Ver Más</a>
          </div>
        </div>
      </div>
    `;
    featuredList.innerHTML += card;
  });

  const userGreeting = document.getElementById('userGreeting');
  if (userGreeting) {
    const user = localStorage.getItem('user');
    if (user) {
      userGreeting.textContent = `Bienvenido de nuevo, ${user}!`;
    }
  }
  AOS.refresh();
}

function sendContact(event) {
  event.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const message = document.getElementById('message').value;

  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, message })
  })
  .then(res => res.json())
  .then(data => {
    showToast(data.message, 'success');
  });
}

function loginUser(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      localStorage.setItem('user', email);
      showToast(data.message, 'success');
      setTimeout(() => window.location.href = '/', 2000);
    } else {
      showToast(data.message, 'danger');
    }
  });
}

function registerUser(event) {
  event.preventDefault();
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;

  fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      localStorage.setItem('user', email);
      showToast(data.message, 'success');
      setTimeout(() => window.location.href = '/', 2000);
    } else {
      showToast(data.message, 'danger');
    }
  });
}

function submitReview(id) {
  const comment = document.getElementById(`reviewComment${id}`).value;
  const rating = document.getElementById(`reviewRating${id}`).value;
  if (comment && rating) {
    showToast('Reseña enviada! Gracias.', 'success');
  } else {
    showToast('Completa los campos.', 'danger');
  }
}