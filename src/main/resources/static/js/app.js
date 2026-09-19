/**
 * CANOPOLIS - Clínica & Hospital Veterinario
 * Integración de Frontend Institucional, Portal Clínico y Base de Datos MySQL (XAMPP)
 */

// Estado Global
const state = {
    currentUser: null,
    token: null,
    isBackendConnected: false,
    modalMode: 'login' // 'login' | 'register'
};

// =======================================================
// INICIALIZACIÓN
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    highlightCurrentPageNav();
    setupNavbarScroll();
    setupDateInputConstraint();
    setupStatsObserver();
    setupElementAnimations();
    setupTestimoniosDots();
    setupQuickAddUser();
    checkPersistedSession();
    checkBackendConnection();
    cargarServiciosEnSelect();
    if (document.getElementById('tiendaCatalogo')) {
        inicializarTienda();
    }
});

// =======================================================
// NAVBAR & NAVEGACIÓN
// =======================================================
const navbar = document.getElementById('navbar');
const backToTopBtn = document.getElementById('backToTop');

function setupNavbarScroll() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            if (navbar) navbar.classList.add('scrolled');
        } else {
            if (navbar) navbar.classList.remove('scrolled');
        }
        updateActiveLink();
        toggleBackToTop();
    });
}

function toggleMenu() {
    const links = document.getElementById('navLinks');
    if (links) links.classList.toggle('open');
}

document.addEventListener('click', (e) => {
    if (e.target.matches('.nav-link')) {
        const links = document.getElementById('navLinks');
        if (links) links.classList.remove('open');
    }
});

function highlightCurrentPageNav() {
    const fullPath = window.location.pathname;
    const pageName = fullPath.substring(fullPath.lastIndexOf('/') + 1) || 'index.html';
    
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        if (href === pageName || (pageName === 'index.html' && (href === 'index.html' || href === './'))) {
            link.classList.add('active');
        } else if (!href.startsWith('#')) {
            link.classList.remove('active');
        }
    });
}

function updateActiveLink() {
    const fullPath = window.location.pathname;
    const pageName = fullPath.substring(fullPath.lastIndexOf('/') + 1) || 'index.html';
    if (pageName !== 'index.html' && pageName !== '') {
        return; // Mantener resaltado de la página correspondiente
    }

    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.scrollY + 120;
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const id = section.getAttribute('id');
        const link = document.querySelector(`.nav-link[href="#${id}"]`);
        if (link) {
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        }
    });
}

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function toggleBackToTop() {
    if (!backToTopBtn) return;
    if (window.scrollY > 400) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// =======================================================
// MODAL CONTROLS & AUTHENTICATION FLOW
// =======================================================
function openModal(id = 'loginModal') {
    const modal = document.getElementById(id) || document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        clearAuthFeedback();
        setTimeout(() => {
            const emailInput = document.getElementById('loginEmail');
            if (emailInput && state.modalMode === 'login') emailInput.focus();
        }, 150);
    }
}

function closeModal(id = 'loginModal') {
    const modal = document.getElementById(id) || document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function closeModalOutside(event, id) {
    if (event.target === event.currentTarget) {
        closeModal(id);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(modal => {
            closeModal(modal.id);
        });
    }
});

function switchModalTab(mode) {
    state.modalMode = mode;
    const loginTab = document.getElementById('modalTabLogin');
    const regTab = document.getElementById('modalTabRegister');
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');
    const modalTitle = document.getElementById('modalTitle');
    const modalSub = document.getElementById('modalSubtitle');
    const modalFooterPrompt = document.getElementById('modalFooterPrompt');
    
    clearAuthFeedback();
    
    if (mode === 'login') {
        if (loginTab) loginTab.classList.add('active');
        if (regTab) regTab.classList.remove('active');
        if (loginForm) loginForm.style.display = 'block';
        if (regForm) regForm.style.display = 'none';
        if (modalTitle) modalTitle.textContent = 'Iniciar Sesión';
        if (modalSub) modalSub.textContent = 'Accede al portal médico, historial clínico y gestión MySQL';
        if (modalFooterPrompt) {
            modalFooterPrompt.innerHTML = '¿No tienes cuenta? <a href="javascript:void(0)" onclick="switchModalTab(\'register\')">Regístrate gratis</a>';
        }
    } else {
        if (regTab) regTab.classList.add('active');
        if (loginTab) loginTab.classList.remove('active');
        if (loginForm) loginForm.style.display = 'none';
        if (regForm) regForm.style.display = 'block';
        if (modalTitle) modalTitle.textContent = 'Crear Cuenta';
        if (modalSub) modalSub.textContent = 'Regístrate como propietario o personal médico en MySQL';
        if (modalFooterPrompt) {
            modalFooterPrompt.innerHTML = '¿Ya tienes cuenta? <a href="javascript:void(0)" onclick="switchModalTab(\'login\')">Inicia sesión</a>';
        }
    }
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
}

function fillDemoCredentials() {
    const emailInput = document.getElementById('loginEmail');
    const pwdInput = document.getElementById('loginPassword');
    if (emailInput) emailInput.value = 'admin@demo.com';
    if (pwdInput) pwdInput.value = 'admin123';
    showAuthFeedback('Credenciales demo asignadas (Dr. Admin)', 'success');
}

function showAuthFeedback(msg, type = 'error') {
    const fb = document.getElementById('authFeedback');
    if (!fb) return;
    fb.textContent = msg;
    fb.className = `form-feedback ${type}`;
    fb.style.display = 'flex';
}

function clearAuthFeedback() {
    const fb = document.getElementById('authFeedback');
    if (!fb) return;
    fb.textContent = '';
    fb.style.display = 'none';
}

// INICIAR SESIÓN (LOGIN)
async function handleLogin(event) {
    if (event) event.preventDefault();
    const emailInput = document.getElementById('loginEmail');
    const pwdInput = document.getElementById('loginPassword');
    const submitBtn = document.getElementById('loginSubmitBtn');
    
    const email = emailInput ? emailInput.value.trim() : '';
    const password = pwdInput ? pwdInput.value : '';
    
    if (!email || !password) {
        showAuthFeedback('Ingresa tu correo y contraseña.', 'error');
        return;
    }
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Verificando en MySQL...</span>';
    }
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        }).catch(() => null);
        
        if (response && response.ok) {
            const data = await response.json();
            completeLogin(data.usuario, data.token || 'sess_' + Math.random().toString(36).substring(2));
            return;
        } else if (response && response.status === 401) {
            const err = await response.json();
            showAuthFeedback(err.mensaje || 'Contraseña incorrecta. Inténtalo de nuevo.', 'error');
            resetSubmitButton(submitBtn, 'Ingresar al Sistema');
            return;
        } else if (response && response.status === 404) {
            const err = await response.json();
            showAuthFeedback(err.mensaje || 'Usuario no encontrado. Crea una cuenta primero.', 'error');
            resetSubmitButton(submitBtn, 'Ingresar al Sistema');
            return;
        }
        
        // Fallback de demostración offline
        await new Promise(r => setTimeout(r, 500));
        const fallbackUser = {
            id: 1,
            nombre: email.includes('@') ? email.split('@')[0].replace('.', ' ').toUpperCase() : 'Dr. Especialista',
            email: email,
            rol: 'Médico Veterinario'
        };
        const fallbackToken = 'sess_local_' + Math.random().toString(36).substring(2, 10);
        completeLogin(fallbackUser, fallbackToken);
        
    } catch (error) {
        console.error('Error login:', error);
        showAuthFeedback('Error de comunicación. Inténtalo de nuevo.', 'error');
        resetSubmitButton(submitBtn, 'Ingresar al Sistema');
    }
}

// CREAR CUENTA (REGISTRO)
async function handleRegister(event) {
    if (event) event.preventDefault();
    const nameInput = document.getElementById('regName');
    const emailInput = document.getElementById('regEmail');
    const pwdInput = document.getElementById('regPassword');
    const submitBtn = document.getElementById('registerSubmitBtn');
    
    const nombre = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = pwdInput ? pwdInput.value : '';
    
    if (!nombre || !email || !password) {
        showAuthFeedback('Por favor completa todos los campos requeridos.', 'error');
        return;
    }
    
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Guardando en MySQL...</span>';
    }
    
    try {
        const response = await fetch('/api/auth/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        }).catch(() => null);
        
        if (response && (response.status === 201 || response.ok)) {
            const data = await response.json();
            completeLogin(data.usuario, data.token);
            showToast('¡Cuenta creada!', `Bienvenido a Canopolis, ${nombre}`);
            return;
        } else if (response && response.status === 409) {
            const err = await response.json();
            showAuthFeedback(err.mensaje || 'El correo electrónico ya está registrado.', 'error');
            resetSubmitButton(submitBtn, 'Crear Cuenta y Entrar');
            return;
        }
        
        // Fallback offline
        await new Promise(r => setTimeout(r, 500));
        const newUser = { id: Date.now(), nombre, email, rol: 'Propietario / Cliente' };
        completeLogin(newUser, 'sess_local_' + Math.random().toString(36).substring(2));
        showToast('¡Registro exitoso!', 'Usuario registrado y sesión iniciada.');
        
    } catch (err) {
        console.error('Error registro:', err);
        showAuthFeedback('Error al registrar usuario.', 'error');
        resetSubmitButton(submitBtn, 'Crear Cuenta y Entrar');
    }
}

function resetSubmitButton(btn, text) {
    if (!btn) return;
    btn.disabled = false;
    btn.innerHTML = `<span>${text}</span>`;
}

// LOGUEO COMPLETADO
function completeLogin(user, token) {
    state.currentUser = user;
    state.token = token;
    localStorage.setItem('canopolis_user', JSON.stringify(user));
    localStorage.setItem('canopolis_token', token);
    localStorage.setItem('canopolis_time', new Date().toLocaleTimeString());
    
    closeModal('loginModal');
    updateAuthUI();
    loadRegisteredUsers();
    if (document.getElementById('tiendaCatalogo')) {
        inicializarTienda();
    }
    showToast('¡Bienvenido!', `Sesión iniciada como ${user.nombre}.`);
    
    const loginSubmit = document.getElementById('loginSubmitBtn');
    const regSubmit = document.getElementById('registerSubmitBtn');
    resetSubmitButton(loginSubmit, 'Ingresar al Sistema');
    resetSubmitButton(regSubmit, 'Crear Cuenta y Entrar');
}

function updateAuthUI() {
    const user = state.currentUser;
    const guestNav = document.getElementById('guestNavActions');
    const userBadge = document.getElementById('userProfileBadge');
    const panelVetNav = document.getElementById('panelVetNav');
    
    if (user) {
        // Usuario logueado
        if (guestNav) guestNav.style.display = 'none';
        if (userBadge) userBadge.style.display = 'flex';
        
        // Actualizar información del usuario
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName) userName.textContent = user.nombre || 'Usuario';
        if (userRole) userRole.textContent = user.rol || 'CLIENTE';
        if (userAvatar) userAvatar.textContent = (user.nombre || 'U').charAt(0).toUpperCase();
        
        // Mostrar botones según el rol
        if (user.rol === 'VETERINARIO' || user.rol === 'ADMIN') {
            // Veterinario: Mostrar Panel Médico
            if (panelVetNav) panelVetNav.style.display = 'block';
            
            // Ocultar Mis Citas y Historial Clínico para veterinarios
            const misCitasBtn = document.getElementById('btnMisCitas');
            const historialBtn = document.getElementById('btnHistorialClinico');
            if (misCitasBtn) misCitasBtn.style.display = 'none';
            if (historialBtn) historialBtn.style.display = 'none';
        } else {
            // Cliente: Mostrar Mis Citas y Historial Clínico
            if (panelVetNav) panelVetNav.style.display = 'none';
            
            const misCitasBtn = document.getElementById('btnMisCitas');
            const historialBtn = document.getElementById('btnHistorialClinico');
            if (misCitasBtn) misCitasBtn.style.display = 'inline-flex';
            if (historialBtn) historialBtn.style.display = 'inline-flex';
        }
    } else {
        // Usuario no logueado
        if (guestNav) guestNav.style.display = 'flex';
        if (userBadge) userBadge.style.display = 'none';
        if (panelVetNav) panelVetNav.style.display = 'none';
        
        const misCitasBtn = document.getElementById('btnMisCitas');
        const historialBtn = document.getElementById('btnHistorialClinico');
        if (misCitasBtn) misCitasBtn.style.display = 'none';
        if (historialBtn) historialBtn.style.display = 'none';
    }
}


function accederPanelMedico() {
    const user = state.currentUser;
    
    if (!user) {
        showToast('Acceso Veterinarios', 'Inicia sesión con tu cuenta de veterinario para acceder al panel médico.', 'info');
        setTimeout(() => {
            openModal('loginModal');
        }, 1500);
        return;
    }
    
    if (user.rol === 'VETERINARIO' || user.rol === 'ADMIN') {
        window.location.href = 'veterinario.html';
    } else {
        showToast('Acceso Restringido', 'El Panel Médico es solo para personal veterinario.', 'error');
    }
}


function handleLogout() {
    state.currentUser = null;
    state.token = null;
    localStorage.removeItem('canopolis_user');
    localStorage.removeItem('canopolis_token');
    localStorage.removeItem('canopolis_time');
    
    updateAuthUI();
    if (document.getElementById('tiendaCatalogo')) {
        inicializarTienda();
    }
    showToast('Sesión cerrada', 'Has cerrado tu sesión de forma segura.');
}

function checkPersistedSession() {
    const savedUser = localStorage.getItem('canopolis_user') || localStorage.getItem('nexus_user');
    const savedToken = localStorage.getItem('canopolis_token') || localStorage.getItem('nexus_token');
    
    if (savedUser && savedToken) {
        try {
            state.currentUser = JSON.parse(savedUser);
            state.token = savedToken;
            updateAuthUI();
        } catch (e) {
            localStorage.clear();
        }
    }
}

// =======================================================
// CONEXIÓN A MYSQL (XAMPP localhost:3306)
// =======================================================
async function checkBackendConnection() {
    const dbStatusDot = document.getElementById('dbStatusDot');
    const dbStatusText = document.getElementById('dbStatusText');
    
    if (dbStatusDot) dbStatusDot.className = 'status-dot';
    if (dbStatusText) dbStatusText.textContent = 'Verificando...';
    
    try {
        const res = await fetch('/api/conexion', { cache: 'no-cache' });
        if (res.ok) {
            const data = await res.json();
            state.isBackendConnected = true;
            if (dbStatusDot) dbStatusDot.className = 'status-dot online';
           if (dbStatusText) dbStatusText.textContent = 'Conectado';
            showToast('MySQL Activo', 'Conexión con la base de datos verificada (XAMPP).');
            loadRegisteredUsers();
            // Ocultar banner si el backend está online
            const banner = document.getElementById('backendBanner');
            if (banner) banner.style.display = 'none';
            return;
        }
    } catch (err) {
        // Backend offline
    }
    
    state.isBackendConnected = false;
    if (dbStatusDot) dbStatusDot.className = 'status-dot offline';
    if (dbStatusText) dbStatusText.textContent = 'Modo Demo';
    loadRegisteredUsers();
    // Mostrar banner si el backend está offline
    const banner = document.getElementById('backendBanner');
    if (banner) banner.style.display = 'block';
}

// CARGA DE USUARIOS Y PROPIETARIOS
async function loadRegisteredUsers() {
    const tbody = document.getElementById('usersTableBody');
    const metricUserCount = document.getElementById('metricUserCount');
    if (!tbody) return;
    
    try {
        const res = await fetch('/api/usuarios');
        if (res.ok) {
            const users = await res.json();
            renderUsersTable(users);
            if (metricUserCount) metricUserCount.textContent = users.length;
            return;
        }
    } catch (e) {}
    
    // Datos demo predeterminados si MySQL no está levantado
    const sampleClients = [
        { id: 1, nombre: 'Dr. Jesus Admin', email: 'admin@demo.com', rol: 'Administrador / Cirujano' },
        { id: 2, nombre: 'Ana García (Dueña de Max)', email: 'ana.garcia@correo.com', rol: 'Propietario' },
        { id: 3, nombre: 'Carlos Rivera (Dueño de Luna)', email: 'carlos.rivera@correo.com', rol: 'Propietario' },
        { id: 4, nombre: 'Sandra Morales (Dueña de Toby)', email: 'sandra.morales@correo.com', rol: 'Propietario' }
    ];
    renderUsersTable(sampleClients);
    if (metricUserCount) metricUserCount.textContent = sampleClients.length;
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: var(--clr-gray);">No hay registros aún en la base de datos MySQL.</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(u => `<tr>
        <td><strong>#${u.id}</strong></td>
        <td>
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:30px; height:30px; border-radius:50%; background:var(--clr-primary-light); color:var(--clr-primary); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem;">
                    ${u.nombre ? u.nombre.charAt(0).toUpperCase() : 'U'}
                </div>
                <span><strong>${escapeHtml(u.nombre)}</strong></span>
            </div>
        </td>
        <td><code>${escapeHtml(u.email)}</code></td>
        <td>
            <span style="font-size:0.75rem; padding:3px 10px; border-radius:999px; background:var(--clr-primary-light); color:var(--clr-primary-dark); font-weight:700;">
                ${u.rol || 'Registrado'}
            </span>
        </td>
    </tr>`).join('');
}

// FORMULARIO RÁPIDO PARA INSERTAR EN MYSQL
function setupQuickAddUser() {
    const form = document.getElementById('quickAddUserForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('newUserName');
        const emailInput = document.getElementById('newUserEmail');
        const nombre = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        
        if (!nombre || !email) return;
        
        try {
            const res = await fetch('/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email })
            });
            if (res.ok) {
                showToast('Guardado en MySQL', `Propietario "${nombre}" registrado con éxito.`);
                nameInput.value = '';
                emailInput.value = '';
                loadRegisteredUsers();
                return;
            }
        } catch (err) {}
        
        showToast('Registrado', `Propietario "${nombre}" añadido.`);
        nameInput.value = '';
        emailInput.value = '';
        loadRegisteredUsers();
    });
}

// =======================================================
// ⭐ FORMULARIO DE AGENDAMIENTO DE CITAS (CONECTADO AL BACKEND)
// =======================================================
async function submitForm(event) {
    event.preventDefault();
    
    // 1. Validar que el usuario esté logueado
    if (!state.currentUser) {
        showToast('⚠️ Inicia sesión primero', 'Debes iniciar sesión para agendar una cita.');
        openModal('loginModal');
        return;
    }
    
    // 2. Obtener valores del formulario
    const form = document.getElementById('appointmentForm');
    const formData = form ? new FormData(form) : null;
    const getValue = (name, fallbackName) => String(
        formData?.get(name) || formData?.get(fallbackName) || ''
    ).trim();

    const petName = getValue('petName');
    const species = document.getElementById('petSpecies')?.value || 'Perro';
    const service = getValue('appointmentType', 'serviceSelect');
    const date = getValue('appointmentDate', 'preferredDate');
    const time = getValue('appointmentTime', 'preferredTime');
    const reason = getValue('notes', 'reason');
    const btn = document.getElementById('appointmentSubmitBtn');
    
    // 3. Validar campos obligatorios
    const missingFields = [
        !petName && 'nombre de la mascota',
        !service && 'tipo de consulta',
        !date && 'fecha',
        !time && 'hora'
    ].filter(Boolean);

    if (missingFields.length > 0) {
        showToast('⚠️ Campos incompletos', `Completa: ${missingFields.join(', ')}.`);
        return;
    }
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>Registrando Cita Médica...</span>';
    }
    
    try {
        // 4. Primero registrar u obtener la mascota del usuario logueado
        const mascotaResponse = await fetch('/api/mascotas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: petName,
                especie: species,
                raza: 'No especificada',
                sexo: 'MACHO',
                fechaNacimiento: '2020-01-01',
                peso: 5.0,
                propietario: { id: state.currentUser.id }
            })
        });
        
        if (!mascotaResponse.ok) {
            const errData = await mascotaResponse.json().catch(() => ({}));
            throw new Error(errData.mensaje || 'Error al procesar la mascota');
        }
        
        const mascotaData = await mascotaResponse.json();
        const mascotaId = mascotaData.mascota ? mascotaData.mascota.id : mascotaData.id;
        
        if (!mascotaId) {
            throw new Error('No se pudo identificar la mascota registrada.');
        }

        // 5. Ahora registrar la cita con el ID de mascota
        const citaResponse = await fetch('/api/citas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mascota: { id: mascotaId },
                servicio: service,
                fecha: date,
                hora: time,
                motivo: reason || 'Consulta general',
                estado: 'PENDIENTE'
            })
        });
        
        const citaData = await citaResponse.json().catch(() => ({}));
        
        if (citaResponse.ok) {
            showToast('✅ ¡Cita agendada!', `Cita para ${petName} el ${date} a las ${time}. Estado: PENDIENTE.`);
            event.target.reset();
        } else if (citaResponse.status === 409) {
            showToast('⚠️ Horario ocupado', citaData.mensaje || 'El horario seleccionado ya está ocupado. Por favor elige otra hora.');
        } else {
            showToast('❌ Error', citaData.mensaje || 'No se pudo agendar la cita.');
        }
        
    } catch (error) {
        console.error('Error al agendar cita:', error);
        showToast('❌ Error', error.message || 'No se pudo conectar con el servidor.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '📅 Confirmar Solicitud de Cita';
        }
    }
}

// =======================================================
// FORMULARIO DE CONTACTO (CONFIRMACIÓN VISUAL)
// =======================================================
function handleContactForm(event) {
    if (event) event.preventDefault();
    const form = event ? event.target : document.getElementById('contactForm');
    if (!form) return;

    const name = form.querySelector('[name="name"]')?.value?.trim();
    const email = form.querySelector('[name="email"]')?.value?.trim();
    const message = form.querySelector('[name="message"]')?.value?.trim();

    if (!name || !email || !message) {
        showToast('⚠️ Campos requeridos', 'Por favor completa tu nombre, correo y mensaje.');
        return;
    }

    showToast('✅ ¡Mensaje Enviado!', `Gracias ${name}, hemos recibido tu mensaje. Nos comunicaremos contigo prontamente.`);
    form.reset();
}

// =======================================================
// TOAST NOTIFICATIONS
// =======================================================
function showToast(title, message) {
    const toast = document.getElementById('toast');
    const titleEl = document.getElementById('toastTitle');
    const msgEl = document.getElementById('toastMessage');
    
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    
    if (toast) {
        toast.classList.add('show');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 4500);
    }
}

// Exponer funciones globales para interacción en todas las páginas
window.showToast = showToast;
window.handleContactForm = handleContactForm;
window.submitForm = submitForm;

// =======================================================
// INTERSECCIÓN & ANIMACIONES
// =======================================================
function setupStatsObserver() {
    function animateCounter(el, target, duration = 1800) {
        const start = 0;
        const startTime = performance.now();
        const isDecimal = target.toString().includes('.');
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = start + (target - start) * eased;
            
            el.textContent = isDecimal
                ? current.toFixed(1) + '%'
                : '+' + Math.floor(current).toLocaleString('es-CO');
            
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
    
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const nums = entry.target.querySelectorAll('.stat-num');
                const targets = [12000, 24, 99.8];
                nums.forEach((num, i) => {
                    if (i === 1) { num.textContent = '24/7'; return; }
                    animateCounter(num, targets[i]);
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    const statsBlock = document.querySelector('.hero-stats');
    if (statsBlock) statsObserver.observe(statsBlock);
}

function setupElementAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    const animatedEls = document.querySelectorAll(
        '.service-card, .team-card, .testimonio-card, .why-feature, .gallery-item, .contact-item, .stat'
    );
    
    animatedEls.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = `opacity 0.55s ease ${i * 0.05}s, transform 0.55s ease ${i * 0.05}s`;
        observer.observe(el);
    });
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `.visible { opacity: 1 !important; transform: translateY(0) !important; }`;
    document.head.appendChild(styleSheet);
}

function setupTestimoniosDots() {
    const dots = document.querySelectorAll('.nav-dot');
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            dots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
        });
    });
}

function setupDateInputConstraint() {
    const dateInput = document.getElementById('preferredDate')
        || document.getElementById('appointmentDate');
    const timeInput = document.getElementById('preferredTime')
        || document.getElementById('appointmentTime');
    
    if (dateInput) {
        // Establecer fecha mínima (mañana)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];
        
        // Establecer fecha máxima (6 meses adelante)
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 6);
        dateInput.max = maxDate.toISOString().split('T')[0];
        
        // Validar día seleccionado
        dateInput.addEventListener('change', (e) => {
            const selectedDate = new Date(e.target.value + 'T00:00:00');
            const dayOfWeek = selectedDate.getDay(); // 0 = Domingo
            
            if (dayOfWeek === 0) {
                showToast('️ Horario especial', 'Los domingos atendemos de 8:00 am a 6:00 pm.');
                if (timeInput) {
                    timeInput.min = '08:00';
                    timeInput.max = '18:00';
                }
            } else {
                // Lunes a Sábado: 7am - 8pm
                if (timeInput) {
                    timeInput.min = '07:00';
                    timeInput.max = '20:00';
                }
            }
        });
    }
    
    if (timeInput) {
        // Horario por defecto (Lunes a Sábado)
        timeInput.min = '07:00';
        timeInput.max = '20:00';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =======================================================
// FASE 2: MÓDULO DE CITAS Y CATÁLOGO DINÁMICO
// =======================================================

/**
 * Carga dinámicamente los servicios activos desde la API al select del formulario
 */
async function cargarServiciosEnSelect() {
    const serviceSelect = document.getElementById('serviceSelect');
    if (!serviceSelect) return;

    try {
        const res = await fetch('/api/servicios');
        if (res.ok) {
            const servicios = await res.json();
            if (Array.isArray(servicios) && servicios.length > 0) {
                serviceSelect.innerHTML = '<option value="">Seleccionar...</option>';
                servicios.forEach(s => {
                    const option = document.createElement('option');
                    option.value = s.nombre;
                    option.textContent = `${s.icono || '🩺'} ${s.nombre} - $${Number(s.precio).toLocaleString('es-CO')}`;
                    serviceSelect.appendChild(option);
                });
            }
        }
    } catch (e) {
        console.warn('No se pudo cargar el catálogo dinámico de servicios, usando opciones predeterminadas.');
    }
}

/**
 * Abre el modal de "Mis Citas" y consulta las citas del cliente en la BD
 */
async function abrirModalMisCitas() {
    if (!state.currentUser) {
        showToast('Inicia sesión', 'Debes iniciar sesión para consultar tus citas.');
        openModal('loginModal');
        return;
    }

    openModal('misCitasModal');
    const container = document.getElementById('misCitasContenido');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; color: var(--clr-gray); padding: 20px;">Cargando tus citas médicas...</p>';

    try {
        const res = await fetch(`/api/citas/cliente/${state.currentUser.id}`);
        if (!res.ok) {
            throw new Error('No se pudieron obtener las citas.');
        }

        const citas = await res.json();
        renderizarMisCitas(citas);
    } catch (err) {
        container.innerHTML = `<p style="color: #ef4444; text-align:center; padding: 20px;">Error al cargar citas: ${escapeHtml(err.message)}</p>`;
    }
}

/**
 * Renderiza la lista de citas del cliente con opción de cancelación
 */
function renderizarMisCitas(citas) {
    const container = document.getElementById('misCitasContenido');
    if (!container) return;

    if (!citas || citas.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px 10px;">
                <p style="font-size: 1.1rem; color: var(--clr-gray); margin-bottom: 12px;">No tienes citas programadas actualmente.</p>
                <a href="#contacto" onclick="closeModal('misCitasModal')" class="btn-primary" style="padding: 8px 18px;">Agendar mi primera cita</a>
            </div>
        `;
        return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 14px;">';

    citas.forEach(c => {
        let badgeBg = '#fef3c7';
        let badgeColor = '#b45309';

        if (c.estado === 'CONFIRMADA') {
            badgeBg = '#d1fae5';
            badgeColor = '#065f46';
        } else if (c.estado === 'CANCELADA') {
            badgeBg = '#fee2e2';
            badgeColor = '#991b1b';
        } else if (c.estado === 'REPROGRAMADA') {
            badgeBg = '#e0e7ff';
            badgeColor = '#3730a3';
        }

        const petName = c.mascota ? c.mascota.nombre : 'Mascota';
        const petSpec = c.mascota ? c.mascota.especie : '';

        html += `
            <div style="background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 10px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <strong style="font-size: 1.05rem; color: var(--clr-dark);">${escapeHtml(c.servicio)}</strong>
                        <span style="background: ${badgeBg}; color: ${badgeColor}; font-weight: 700; font-size: 0.72rem; padding: 3px 8px; border-radius: 12px; text-transform: uppercase;">
                            ${escapeHtml(c.estado)}
                        </span>
                    </div>
                    <p style="margin: 0; font-size: 0.9rem; color: var(--clr-gray);">
                        🐾 Paciente: <strong>${escapeHtml(petName)}</strong> (${escapeHtml(petSpec)})
                    </p>
                    <p style="margin: 3px 0 0; font-size: 0.88rem; color: var(--clr-gray);">
                        📅 Fecha: <strong>${c.fecha}</strong> | ⏰ Hora: <strong>${c.hora}</strong>
                    </p>
                    ${c.motivo ? `<p style="margin: 4px 0 0; font-size: 0.82rem; color: #64748b; font-style: italic;">Motivo: "${escapeHtml(c.motivo)}"</p>` : ''}
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    ${c.mascota && c.mascota.id ? `
                        <a href="historia-clinica.html?mascotaId=${c.mascota.id}" class="btn-secondary" style="padding: 6px 12px; font-size: 0.82rem; color: var(--clr-primary); border-color: var(--clr-primary);">
                            📋 Historia Clínica
                        </a>
                    ` : ''}
                    ${c.estado !== 'CANCELADA' ? `
                        <button onclick="cancelarCitaCliente(${c.id})" class="btn-secondary" style="padding: 6px 14px; font-size: 0.82rem; color: #dc2626; border-color: #fca5a5;">
                            Cancelar Cita
                        </button>
                    ` : `
                        <span style="font-size: 0.8rem; color: #94a3b8;">Horario liberado</span>
                    `}
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Cancela la cita médica del cliente liberando el horario en BD
 */
async function cancelarCitaCliente(citaId) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita? El horario quedará liberado.')) {
        return;
    }

    try {
        const res = await fetch(`/api/citas/${citaId}/cancelar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        if (res.ok) {
            showToast('✅ Cita cancelada', 'Tu cita ha sido cancelada y el horario ha sido liberado.');
            abrirModalMisCitas(); // Refrescar listado
        } else {
            showToast('❌ Error', data.mensaje || 'No se pudo cancelar la cita.');
        }
    } catch (e) {
        showToast('❌ Error de red', 'No se pudo conectar con el servidor.');
    }
}

window.abrirModalMisCitas = abrirModalMisCitas;
window.cancelarCitaCliente = cancelarCitaCliente;
window.cargarServiciosEnSelect = cargarServiciosEnSelect;

// =======================================================
// FASE 5: TIENDA VIRTUAL, CARRITO Y PEDIDOS
// =======================================================
const tiendaState = {
    categoria: 'TODOS',
    productos: [],
    inventario: [],
    carrito: { items: [], total: 0, totalArticulos: 0, tieneProductosConReceta: false }
};

function formatCOP(valor) {
    return '$' + Number(valor || 0).toLocaleString('es-CO');
}

async function inicializarTienda() {
    await cargarProductosTienda();
    await cargarCarritoTienda();
    await cargarPedidosTienda();
    precargarDatosCheckout();
    actualizarVisibilidadInventario();
    if (esRolInventario()) {
        await cargarTablaInventario();
        if (window.location.hash === '#inventario') {
            const panel = document.getElementById('inventario');
            if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

async function cargarProductosTienda() {
    const catalogo = document.getElementById('tiendaCatalogo');
    if (!catalogo) return;

    const categoria = tiendaState.categoria;
    const url = categoria && categoria !== 'TODOS'
        ? `/api/productos?categoria=${encodeURIComponent(categoria)}`
        : '/api/productos';

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('No se pudo cargar el catálogo.');
        tiendaState.productos = await res.json();
        renderizarProductosTienda();
    } catch (err) {
        catalogo.innerHTML = `<p style="color:#dc2626;">Error al cargar productos: ${escapeHtml(err.message)}</p>`;
    }
}

function filtrarProductosTienda(categoria) {
    tiendaState.categoria = categoria || 'TODOS';
    document.querySelectorAll('#tiendaFiltros [data-categoria]').forEach(btn => {
        const activa = btn.getAttribute('data-categoria') === tiendaState.categoria;
        btn.className = activa ? 'btn-primary' : 'btn-secondary';
    });
    cargarProductosTienda();
}

function renderizarProductosTienda() {
    const catalogo = document.getElementById('tiendaCatalogo');
    if (!catalogo) return;

    const productos = tiendaState.productos || [];
    if (productos.length === 0) {
        catalogo.innerHTML = '<p style="color: var(--clr-gray);">No hay productos en esta categoría.</p>';
        return;
    }

    catalogo.innerHTML = productos.map(p => {
        const receta = Boolean(p.requierePrescripcion);
        const sinStock = !p.stock || p.stock <= 0;
        return `
            <article class="service-card">
                <div class="tienda-card-img">
                    <img src="${escapeHtml(p.imagenUrl || 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=500&fit=crop')}" alt="${escapeHtml(p.nombre)}">
                </div>
                <p style="font-size: 0.75rem; font-weight: 800; letter-spacing: 0.06em; color: var(--clr-primary); text-transform: uppercase;">${escapeHtml(p.categoria || '')}</p>
                <h3 style="font-size: 1.05rem;">${escapeHtml(p.nombre)}</h3>
                <p>${escapeHtml(p.descripcion || '')}</p>
                ${receta ? '<span class="tienda-badge-receta">Requiere receta médica</span>' : ''}
                ${receta ? '<p class="tienda-aviso-receta">Solo se podrá pagar si declaras una fórmula médica vigente.</p>' : ''}
                <p style="margin: 10px 0 4px; font-weight: 800; color: var(--clr-primary-dark); font-size: 1.15rem;">${formatCOP(p.precio)}</p>
                <p style="font-size: 0.82rem; color: var(--clr-gray);">Stock: ${p.stock}</p>
                <button type="button" class="btn-primary" style="margin-top: 12px; width: 100%;"
                    ${sinStock ? 'disabled' : ''}
                    onclick="agregarProductoAlCarrito(${p.id}, ${receta})">
                    ${sinStock ? 'Agotado' : 'Añadir al carrito'}
                </button>
            </article>
        `;
    }).join('');
}

async function agregarProductoAlCarrito(productoId, requiereReceta) {
    if (!state.currentUser || !state.currentUser.id) {
        showToast('Inicia sesión', 'Debes iniciar sesión para agregar productos al carrito.');
        openModal('loginModal');
        return;
    }

    try {
        const res = await fetch('/api/carrito', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clienteId: state.currentUser.id,
                productoId,
                cantidad: 1
            })
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('No se pudo agregar', data.mensaje || 'Error al agregar al carrito.');
            return;
        }
        if (requiereReceta || data.requierePrescripcion) {
            showToast('Aviso de receta', data.avisoReceta || 'Este producto requiere receta. Deberás declarar fórmula vigente al pagar.');
        } else {
            showToast('Carrito actualizado', data.mensaje || 'Producto añadido.');
        }
        await cargarCarritoTienda();
    } catch (err) {
        showToast('Error de red', 'No se pudo conectar con el servidor.');
    }
}

async function cargarCarritoTienda() {
    const contenedor = document.getElementById('carritoContenido');
    const form = document.getElementById('checkoutForm');
    const badge = document.getElementById('carritoContadorBadge');
    if (!contenedor) return;

    if (!state.currentUser || !state.currentUser.id) {
        contenedor.innerHTML = '<p style="color: var(--clr-gray); font-size: 0.92rem;">Inicia sesión para guardar tu carrito en MySQL.</p>';
        if (form) form.style.display = 'none';
        if (badge) badge.textContent = '';
        return;
    }

    try {
        const res = await fetch(`/api/carrito/${state.currentUser.id}`);
        if (!res.ok) throw new Error('No se pudo consultar el carrito.');
        tiendaState.carrito = await res.json();
        renderizarCarritoTienda();
    } catch (err) {
        contenedor.innerHTML = `<p style="color:#dc2626;">${escapeHtml(err.message)}</p>`;
    }
}

function renderizarCarritoTienda() {
    const contenedor = document.getElementById('carritoContenido');
    const form = document.getElementById('checkoutForm');
    const badge = document.getElementById('carritoContadorBadge');
    const bloqueReceta = document.getElementById('bloqueDeclaracionFormula');
    const textoReceta = document.getElementById('textoProductosReceta');
    const checkReceta = document.getElementById('checkDeclaracionFormula');
    if (!contenedor) return;

    const carrito = tiendaState.carrito || {};
    const items = carrito.items || [];
    if (badge) badge.textContent = items.length ? `(${carrito.totalArticulos || 0})` : '';

    if (items.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--clr-gray); font-size: 0.92rem;">Tu carrito está vacío.</p>';
        if (form) form.style.display = 'none';
        if (bloqueReceta) bloqueReceta.style.display = 'none';
        if (checkReceta) checkReceta.checked = false;
        return;
    }

    const recetaItems = items.filter(i => i.producto && i.producto.requierePrescripcion);
    contenedor.innerHTML = items.map(item => {
        const prod = item.producto || {};
        const receta = Boolean(prod.requierePrescripcion);
        return `
            <div style="border-bottom: 1px solid var(--clr-border); padding: 10px 0;">
                <strong>${escapeHtml(prod.nombre || 'Producto')}</strong>
                ${receta ? '<div class="tienda-badge-receta" style="margin-top:6px;">Requiere receta</div>' : ''}
                <p style="margin: 4px 0; font-size: 0.85rem; color: var(--clr-gray);">${formatCOP(prod.precio)} · Subtotal ${formatCOP(item.subtotal)}</p>
                <div style="display:flex; gap:8px; align-items:center;">
                    <input type="number" min="1" value="${item.cantidad}" style="width:72px; padding:6px; border:1px solid var(--clr-border); border-radius:8px;"
                        onchange="actualizarCantidadCarrito(${item.id}, this.value)">
                    <button type="button" class="btn-secondary" style="padding:6px 10px; font-size:0.8rem;" onclick="eliminarItemCarrito(${item.id})">Quitar</button>
                </div>
            </div>
        `;
    }).join('') + `
        <p style="margin-top:12px; font-weight:800; color: var(--clr-primary-dark);">Total: ${formatCOP(carrito.total)}</p>
        <button type="button" class="btn-secondary" style="width:100%; margin-top:8px;" onclick="vaciarCarritoTienda()">Vaciar carrito</button>
    `;

    if (form) form.style.display = 'block';
    if (bloqueReceta) {
        bloqueReceta.style.display = recetaItems.length ? 'block' : 'none';
    }
    if (textoReceta && recetaItems.length) {
        const nombres = recetaItems.map(i => i.producto.nombre).join(', ');
        textoReceta.textContent = `Productos controlados en tu carrito: ${nombres}. No se procesará el pago si no marcas la declaración.`;
    }
    if (checkReceta && !recetaItems.length) {
        checkReceta.checked = false;
    }
}

async function actualizarCantidadCarrito(itemId, cantidad) {
    try {
        const res = await fetch(`/api/carrito/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cantidad: Number(cantidad) })
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('Stock', data.mensaje || 'No se pudo actualizar la cantidad.');
        }
        await cargarCarritoTienda();
    } catch (err) {
        showToast('Error de red', 'No se pudo actualizar el carrito.');
    }
}

async function eliminarItemCarrito(itemId) {
    try {
        const res = await fetch(`/api/carrito/${itemId}`, { method: 'DELETE' });
        if (res.ok) showToast('Carrito', 'Producto eliminado.');
        await cargarCarritoTienda();
    } catch (err) {
        showToast('Error de red', 'No se pudo eliminar el ítem.');
    }
}

async function vaciarCarritoTienda() {
    if (!state.currentUser) return;
    try {
        const res = await fetch(`/api/carrito/cliente/${state.currentUser.id}`, { method: 'DELETE' });
        if (res.ok) showToast('Carrito vacío', 'Se eliminaron todos los productos.');
        await cargarCarritoTienda();
    } catch (err) {
        showToast('Error de red', 'No se pudo vaciar el carrito.');
    }
}

function precargarDatosCheckout() {
    const user = state.currentUser;
    if (!user) return;
    const dir = document.getElementById('checkoutDireccion');
    const tel = document.getElementById('checkoutTelefono');
    if (dir && !dir.value) dir.value = user.direccion || '';
    if (tel && !tel.value) tel.value = user.telefono || '';
}

async function procesarCheckoutTienda(event) {
    if (event) event.preventDefault();
    if (!state.currentUser || !state.currentUser.id) {
        openModal('loginModal');
        return;
    }

    const requiereReceta = Boolean(tiendaState.carrito && tiendaState.carrito.tieneProductosConReceta);
    const check = document.getElementById('checkDeclaracionFormula');
    if (requiereReceta && !(check && check.checked)) {
        showToast('Fórmula médica requerida', 'Marca la Declaración de fórmula médica vigente para continuar.');
        return;
    }

    const btn = document.getElementById('checkoutSubmitBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Procesando pedido...';
    }

    try {
        const res = await fetch('/api/pedidos/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clienteId: state.currentUser.id,
                direccion: document.getElementById('checkoutDireccion').value,
                telefono: document.getElementById('checkoutTelefono').value,
                metodoPago: document.getElementById('checkoutMetodoPago').value,
                declaracionFormulaVigente: !!(check && check.checked)
            })
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('Pedido no procesado', data.mensaje || 'No se pudo completar la compra.');
            return;
        }
        showToast('Pedido confirmado', data.mensaje || 'Compra realizada.');
        if (check) check.checked = false;
        await cargarProductosTienda();
        await cargarCarritoTienda();
        await cargarPedidosTienda();
    } catch (err) {
        showToast('Error de red', 'No se pudo procesar el pedido.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Confirmar pedido';
        }
    }
}

async function cargarPedidosTienda() {
    const contenedor = document.getElementById('misPedidosContenido');
    if (!contenedor) return;

    if (!state.currentUser || !state.currentUser.id) {
        contenedor.innerHTML = '<p style="color: var(--clr-gray);">Inicia sesión para ver el historial de compras.</p>';
        return;
    }

    try {
        const res = await fetch(`/api/pedidos/cliente/${state.currentUser.id}`);
        if (!res.ok) throw new Error('No se pudieron cargar los pedidos.');
        const pedidos = await res.json();
        if (!pedidos.length) {
            contenedor.innerHTML = '<p style="color: var(--clr-gray);">Aún no tienes pedidos registrados.</p>';
            return;
        }

        contenedor.innerHTML = pedidos.map(p => `
            <div style="border: 1px solid var(--clr-border); border-radius: 12px; padding: 14px; margin-bottom: 10px;">
                <strong>Pedido #${p.id}</strong>
                <span style="margin-left:8px; font-size:0.75rem; font-weight:800; color: var(--clr-primary);">${escapeHtml(p.estado || '')}</span>
                <p style="margin: 6px 0 0; font-size: 0.9rem; color: var(--clr-gray);">
                    ${escapeHtml(String(p.fechaPedido || '').replace('T', ' ').substring(0, 16))} · Total ${formatCOP(p.total)}
                </p>
                <p style="margin: 4px 0 0; font-size: 0.85rem; color: var(--clr-gray);">${escapeHtml(p.direccionEntrega || '')} · ${escapeHtml(p.metodoPago || '')}</p>
                ${p.declaracionFormulaVigente ? '<p class="tienda-aviso-receta" style="margin-top:8px;">Declaración de fórmula médica vigente registrada.</p>' : ''}
                <button type="button" class="btn-secondary" style="margin-top:8px; padding:6px 12px; font-size:0.82rem;" onclick="verDetallePedido(${p.id}, this)">Ver detalle</button>
                <div id="detallePedido-${p.id}" style="margin-top:8px;"></div>
            </div>
        `).join('');
    } catch (err) {
        contenedor.innerHTML = `<p style="color:#dc2626;">${escapeHtml(err.message)}</p>`;
    }
}

async function verDetallePedido(pedidoId, boton) {
    const caja = document.getElementById(`detallePedido-${pedidoId}`);
    if (!caja) return;
    if (caja.dataset.loaded === 'true') {
        caja.style.display = caja.style.display === 'none' ? 'block' : 'none';
        return;
    }
    try {
        const res = await fetch(`/api/pedidos/${pedidoId}/detalles`);
        if (!res.ok) throw new Error('No se pudo cargar el detalle.');
        const detalles = await res.json();
        caja.innerHTML = detalles.map(d => {
            const nombre = d.producto ? d.producto.nombre : 'Producto';
            return `<p style="font-size:0.88rem; margin:4px 0;">${escapeHtml(nombre)} × ${d.cantidad} — ${formatCOP(d.subtotal)}</p>`;
        }).join('');
        caja.dataset.loaded = 'true';
        if (boton) boton.textContent = 'Ocultar detalle';
    } catch (err) {
        caja.innerHTML = `<p style="color:#dc2626;">${escapeHtml(err.message)}</p>`;
    }
}

window.filtrarProductosTienda = filtrarProductosTienda;
window.agregarProductoAlCarrito = agregarProductoAlCarrito;
window.actualizarCantidadCarrito = actualizarCantidadCarrito;
window.eliminarItemCarrito = eliminarItemCarrito;
window.vaciarCarritoTienda = vaciarCarritoTienda;
window.procesarCheckoutTienda = procesarCheckoutTienda;
window.verDetallePedido = verDetallePedido;

// =======================================================
// FASE 5: ADMINISTRACIÓN DE INVENTARIO
// =======================================================
function esRolInventario() {
    const rol = ((state.currentUser && state.currentUser.rol) || '').toUpperCase();
    return rol === 'ADMINISTRADOR' || rol === 'ADMIN' || rol === 'VETERINARIO';
}

function actualizarVisibilidadInventario() {
    const panel = document.getElementById('panelInventario');
    if (!panel) return;
    const visible = esRolInventario();
    panel.style.display = visible ? 'block' : 'none';
}

async function cargarTablaInventario() {
    const caja = document.getElementById('inventarioTablaContenido');
    if (!caja || !esRolInventario()) return;

    try {
        const res = await fetch('/api/productos/inventario');
        if (!res.ok) throw new Error('No se pudo cargar el inventario.');
        const productos = await res.json();
        tiendaState.inventario = productos;
        if (!productos.length) {
            caja.innerHTML = '<p style="color: var(--clr-gray);">Aún no hay productos registrados.</p>';
            return;
        }

        caja.innerHTML = `
            <table class="inventario-tabla">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${productos.map(p => `
                        <tr>
                            <td>
                                <strong>${escapeHtml(p.nombre)}</strong>
                                ${p.requierePrescripcion ? '<br><span class="tienda-badge-receta">Receta</span>' : ''}
                            </td>
                            <td>${escapeHtml(p.categoria || '')}</td>
                            <td>${formatCOP(p.precio)}</td>
                            <td>${p.stock}</td>
                            <td>
                                <button type="button" class="btn-secondary" style="padding:5px 10px; font-size:0.78rem;"
                                    onclick="editarProductoInventario(${p.id})">
                                    Editar
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        caja.innerHTML = `<p style="color:#dc2626;">${escapeHtml(err.message)}</p>`;
    }
}

function editarProductoInventario(productoId) {
    const producto = (tiendaState.inventario || []).find(p => Number(p.id) === Number(productoId));
    if (!producto) return;
    document.getElementById('invProductoId').value = producto.id || '';
    document.getElementById('invNombre').value = producto.nombre || '';
    document.getElementById('invDescripcion').value = producto.descripcion || '';
    document.getElementById('invPrecio').value = producto.precio != null ? producto.precio : '';
    document.getElementById('invStock').value = producto.stock != null ? producto.stock : 0;
    document.getElementById('invCategoria').value = producto.categoria || 'Alimentos';
    document.getElementById('invImagenUrl').value = producto.imagenUrl || '';
    document.getElementById('invRequiereReceta').checked = Boolean(producto.requierePrescripcion || producto.requiereReceta);
    const btn = document.getElementById('invSubmitBtn');
    if (btn) btn.textContent = 'Actualizar producto';
    const panel = document.getElementById('panelInventario');
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function limpiarFormularioInventario() {
    const form = document.getElementById('formInventarioProducto');
    if (form) form.reset();
    const id = document.getElementById('invProductoId');
    if (id) id.value = '';
    const btn = document.getElementById('invSubmitBtn');
    if (btn) btn.textContent = 'Guardar producto';
}

async function guardarProductoInventario(event) {
    if (event) event.preventDefault();
    if (!esRolInventario()) {
        showToast('Acceso restringido', 'Solo Administrador o Veterinario pueden gestionar el inventario.');
        return;
    }

    const id = document.getElementById('invProductoId').value;
    const payload = {
        nombre: document.getElementById('invNombre').value.trim(),
        descripcion: document.getElementById('invDescripcion').value.trim(),
        precio: Number(document.getElementById('invPrecio').value),
        stock: Number(document.getElementById('invStock').value),
        categoria: document.getElementById('invCategoria').value,
        imagenUrl: document.getElementById('invImagenUrl').value.trim(),
        requiereReceta: document.getElementById('invRequiereReceta').checked,
        requierePrescripcion: document.getElementById('invRequiereReceta').checked
    };
    if (id) payload.id = Number(id);

    const btn = document.getElementById('invSubmitBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Guardando...';
    }

    try {
        const res = await fetch('/api/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
            showToast('No se pudo guardar', data.mensaje || 'Error al guardar el producto.');
            return;
        }
        showToast('Inventario actualizado', data.mensaje || 'Producto guardado.');
        limpiarFormularioInventario();
        await cargarProductosTienda();
        await cargarTablaInventario();
    } catch (err) {
        showToast('Error de red', 'No se pudo conectar con el servidor.');
    } finally {
        if (btn) {
            btn.disabled = false;
            if (!document.getElementById('invProductoId').value) {
                btn.textContent = 'Guardar producto';
            } else {
                btn.textContent = 'Actualizar producto';
            }
        }
    }
}

window.guardarProductoInventario = guardarProductoInventario;
window.limpiarFormularioInventario = limpiarFormularioInventario;
window.editarProductoInventario = editarProductoInventario;