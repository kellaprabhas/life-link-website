const medicines = [
    { id: 'paracetamol-500', name: 'Paracetamol 500 mg', category: 'Pain relief', price: 48, available: true, prescriptionRequired: false, icon: '💊', description: 'Mock pack for everyday catalog browsing and cart testing.' },
    { id: 'cetirizine-10', name: 'Cetirizine 10 mg', category: 'Allergy care', price: 72, available: true, prescriptionRequired: false, icon: '🌿', description: 'Mock allergy-care product. Follow professional advice in real use.' },
    { id: 'vitamin-c', name: 'Vitamin C 500 mg', category: 'Vitamins', price: 155, available: true, prescriptionRequired: false, icon: '🍊', description: 'Mock supplement listing with a simple, accessible package placeholder.' },
    { id: 'oral-rehydration', name: 'Oral Rehydration Salts', category: 'Wellness', price: 35, available: true, prescriptionRequired: false, icon: '💧', description: 'Mock hydration support product for demonstrating categories.' },
    { id: 'amoxicillin-500', name: 'Amoxicillin 500 mg', category: 'Prescription', price: 180, available: true, prescriptionRequired: true, icon: '🧴', description: 'Mock prescription listing. A valid prescription would require review.' },
    { id: 'salbutamol-inhaler', name: 'Salbutamol Inhaler', category: 'Prescription', price: 210, available: true, prescriptionRequired: true, icon: '🌬️', description: 'Mock inhaler listing. Do not use without qualified clinical guidance.' },
    { id: 'zinc-tablets', name: 'Zinc Tablets', category: 'Vitamins', price: 95, available: false, prescriptionRequired: false, icon: '✨', description: 'Mock product currently marked unavailable for testing.' },
    { id: 'antacid-gel', name: 'Antacid Gel', category: 'Digestive care', price: 120, available: true, prescriptionRequired: false, icon: '🫧', description: 'Mock digestive-care listing for the student prototype.' }
];

const cartKey = 'lifelinkMedicineCart';
const ordersKey = 'lifelinkMedicineOrders';
const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
let orders = JSON.parse(localStorage.getItem(ordersKey) || '[]');

const medicineGrid = document.querySelector('#medicineGrid');
const medicineSearch = document.querySelector('#medicineSearch');
const categoryFilter = document.querySelector('#categoryFilter');
const cartList = document.querySelector('#cartList');
const cartCount = document.querySelector('#cartCount');
const cartBadge = document.querySelector('#cartBadge');
const cartSummary = document.querySelector('#cartSummary');
const prescriptionPanel = document.querySelector('#prescriptionPanel');
const prescriptionFile = document.querySelector('#prescriptionFile');
const prescriptionStatus = document.querySelector('#prescriptionStatus');
const checkoutButton = document.querySelector('#checkoutButton');
const checkoutSection = document.querySelector('#checkoutSection');
const checkoutForm = document.querySelector('#checkoutForm');
const checkoutStatus = document.querySelector('#checkoutStatus');
const confirmationSection = document.querySelector('#confirmationSection');
const ordersList = document.querySelector('#ordersList');

function formatMoney(amount) {
    return `₹${amount.toLocaleString('en-IN')}`;
}

function saveCart() {
    localStorage.setItem(cartKey, JSON.stringify(cart));
}

function saveOrders() {
    localStorage.setItem(ordersKey, JSON.stringify(orders));
}

function getCartItem(medicineId) {
    return cart.find((item) => item.id === medicineId);
}

function getMedicine(medicineId) {
    return medicines.find((medicine) => medicine.id === medicineId);
}

function renderCategories() {
    [...new Set(medicines.map((medicine) => medicine.category))].sort().forEach((category) => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.append(option);
    });
}

function renderCatalog() {
    const query = medicineSearch.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const filtered = medicines.filter((medicine) => {
        const matchesText = `${medicine.name} ${medicine.category} ${medicine.description}`.toLowerCase().includes(query);
        return matchesText && (category === 'all' || medicine.category === category);
    });

    document.querySelector('#resultCount').textContent = `${filtered.length} product${filtered.length === 1 ? '' : 's'}`;
    medicineGrid.innerHTML = filtered.length ? filtered.map((medicine) => {
        const item = getCartItem(medicine.id);
        const buttonLabel = item ? `In cart (${item.quantity})` : 'Add to Cart';
        return `<article class="medicine-card">
            <div class="medicine-image" aria-label="Image placeholder for ${medicine.name}" role="img">${medicine.icon}</div>
            <div><span class="category-badge">${medicine.category}</span> ${medicine.prescriptionRequired ? '<span class="prescription-badge">Prescription Required</span>' : ''}</div>
            <h3>${medicine.name}</h3>
            <p class="medicine-meta">${medicine.prescriptionRequired ? 'Prescription item' : 'Over-the-counter mock item'}</p>
            <p class="medicine-description">${medicine.description}</p>
            <span class="availability ${medicine.available ? '' : 'unavailable'}">${medicine.available ? '● Available' : '● Currently unavailable'}</span>
            <div class="medicine-card-footer"><strong class="medicine-price">${formatMoney(medicine.price)}</strong><button class="primary-btn" type="button" data-add="${medicine.id}" ${medicine.available ? '' : 'disabled'}>${buttonLabel}</button></div>
        </article>`;
    }).join('') : '<p class="empty-state">No medicines match that search. Try another category or name.</p>';
}

function cartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { subtotal, delivery: subtotal ? (subtotal >= 500 ? 0 : 40) : 0, total: subtotal + (subtotal >= 500 ? 0 : 40) };
}

function hasPrescriptionItem() {
    return cart.some((item) => item.prescriptionRequired);
}

function renderCart() {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = `${itemCount} item${itemCount === 1 ? '' : 's'}`;
    cartBadge.textContent = itemCount ? `${itemCount} item${itemCount === 1 ? '' : 's'}` : 'Empty';
    cartList.innerHTML = cart.length ? cart.map((item) => `<div class="cart-item">
        <div><h3>${item.name}</h3><p>${formatMoney(item.price)} each${item.prescriptionRequired ? ' · Prescription required' : ''}</p><div class="quantity-controls"><button type="button" aria-label="Decrease ${item.name} quantity" data-decrease="${item.id}">−</button><strong>${item.quantity}</strong><button type="button" aria-label="Increase ${item.name} quantity" data-increase="${item.id}">+</button></div></div>
        <div><strong>${formatMoney(item.price * item.quantity)}</strong><button type="button" class="forgot-link" data-remove="${item.id}">Remove</button></div>
    </div>`).join('') : '<div class="empty-state">Your cart is empty.<br>Add a mock medicine to begin.</div>';

    const totals = cartTotals();
    cartSummary.hidden = !cart.length;
    document.querySelector('#subtotal').textContent = formatMoney(totals.subtotal);
    document.querySelector('#deliveryCharge').textContent = totals.delivery ? formatMoney(totals.delivery) : 'Free';
    document.querySelector('#grandTotal').textContent = formatMoney(totals.total);
    prescriptionPanel.hidden = !hasPrescriptionItem();
    checkoutButton.disabled = !cart.length;
    renderCatalog();
}

function addToCart(medicineId) {
    const medicine = getMedicine(medicineId);
    if (!medicine || !medicine.available) return;
    const existing = getCartItem(medicineId);
    if (existing) existing.quantity += 1;
    else cart.push({ id: medicine.id, name: medicine.name, price: medicine.price, quantity: 1, prescriptionRequired: medicine.prescriptionRequired });
    saveCart();
    renderCart();
}

function changeQuantity(medicineId, amount) {
    const item = getCartItem(medicineId);
    if (!item) return;
    item.quantity += amount;
    if (item.quantity <= 0) cart.splice(cart.indexOf(item), 1);
    saveCart();
    renderCart();
}

function getNextStatus(order) {
    const steps = order.prescriptionRequired ? ['Order placed', 'Prescription review', 'Confirmed', 'Packed', 'Out for delivery', 'Delivered'] : ['Order placed', 'Confirmed', 'Packed', 'Out for delivery', 'Delivered'];
    return steps[Math.min(order.statusIndex, steps.length - 1)];
}

function renderOrders() {
    if (!orders.length) {
        ordersList.innerHTML = '<div class="empty-state">No mock orders yet. Your completed checkouts will appear here.</div>';
        return;
    }
    ordersList.innerHTML = orders.map((order) => {
        const steps = order.prescriptionRequired ? ['Order placed', 'Prescription review', 'Confirmed', 'Packed', 'Out for delivery', 'Delivered'] : ['Order placed', 'Confirmed', 'Packed', 'Out for delivery', 'Delivered'];
        return `<article class="order-card"><div class="order-card-header"><div><h3>${order.id}</h3><p>${order.customerName} · ${order.createdAt} · ${formatMoney(order.total)}</p></div><span class="category-badge">${getNextStatus(order)}</span></div><div class="order-statuses">${steps.map((step, index) => `<span class="status-badge ${index < order.statusIndex ? 'done' : ''} ${index === order.statusIndex ? 'current' : ''}">${step}</span>`).join('')}</div></article>`;
    }).join('');
}

function showCheckout() {
    if (hasPrescriptionItem() && !prescriptionFile.files.length) {
        prescriptionStatus.textContent = 'Please select an image or PDF prescription before checkout.';
        prescriptionFile.focus();
        return;
    }
    checkoutSection.hidden = false;
    confirmationSection.hidden = true;
    checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

medicineGrid.addEventListener('click', (event) => {
    const addButton = event.target.closest('[data-add]');
    if (addButton) addToCart(addButton.dataset.add);
});

cartList.addEventListener('click', (event) => {
    const actionButton = event.target.closest('button');
    if (!actionButton) return;
    if (actionButton.dataset.increase) changeQuantity(actionButton.dataset.increase, 1);
    if (actionButton.dataset.decrease) changeQuantity(actionButton.dataset.decrease, -1);
    if (actionButton.dataset.remove) {
        const item = getCartItem(actionButton.dataset.remove);
        if (item) changeQuantity(item.id, -item.quantity);
    }
});

[medicineSearch, categoryFilter].forEach((control) => control.addEventListener('input', renderCatalog));
prescriptionFile.addEventListener('change', () => {
    const file = prescriptionFile.files[0];
    prescriptionStatus.textContent = file ? `${file.name} selected. It must be reviewed before fulfillment.` : 'Upload an image or PDF before checkout.';
});
checkoutButton.addEventListener('click', showCheckout);
document.querySelector('#backToCart').addEventListener('click', () => { checkoutSection.hidden = true; });
checkoutForm.addEventListener('submit', (event) => {
    event.preventDefault();
    checkoutStatus.textContent = '';
    if (!checkoutForm.checkValidity()) {
        checkoutStatus.textContent = 'Please complete each delivery field with a valid value.';
        checkoutForm.reportValidity();
        return;
    }
    if (hasPrescriptionItem() && !prescriptionFile.files.length) {
        checkoutStatus.textContent = 'Prescription review is required before this order can be placed.';
        prescriptionFile.focus();
        return;
    }
    const data = new FormData(checkoutForm);
    const totals = cartTotals();
    const order = { id: `LL-${Date.now().toString(36).toUpperCase()}`, customerName: data.get('customerName'), total: totals.total, prescriptionRequired: hasPrescriptionItem(), statusIndex: hasPrescriptionItem() ? 1 : 1, createdAt: new Date().toLocaleDateString('en-IN'), items: cart.map((item) => ({ name: item.name, quantity: item.quantity })) };
    orders = [order, ...orders];
    saveOrders();
    confirmationSection.innerHTML = `<h2>Order received for review</h2><p>Your mock order <strong>${order.id}</strong> has been saved locally.</p><p>${order.prescriptionRequired ? 'Prescription review is the next step. The file must be reviewed before fulfillment.' : 'The prototype has marked this order as confirmed.'} Payment: ${data.get('payment')}.</p><p><strong>Order total: ${formatMoney(order.total)}</strong> · ${order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ')}</p>`;
    cart.length = 0;
    prescriptionFile.value = '';
    checkoutForm.reset();
    checkoutSection.hidden = true;
    confirmationSection.hidden = false;
    saveCart();
    renderCart();
    renderOrders();
    confirmationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function logout() {
    window.location.href = 'index.html';
}

renderCategories();
renderCart();
renderOrders();
