function toggleChat() {
    const chat = document.getElementById('chatWindow');
    chat.style.display = (chat.style.display === 'flex') ? 'none' : 'flex';
}

// Lógica básica de envío (Mañana la conectamos a tu Render)
function sendMessage() {
    const input = document.getElementById('userInput');
    const messages = document.getElementById('chatMessages');
    
    if (input.value.trim() !== "") {
        const userDiv = document.createElement('div');
        userDiv.className = 'message user';
        userDiv.textContent = input.value;
        messages.appendChild(userDiv);
        
        input.value = "";
        messages.scrollTop = messages.scrollHeight;
        
        // Aquí mañana haremos el fetch() a tu URL de Render
    }
}

// Efecto scroll en Navbar
window.onscroll = function() {
    const nav = document.querySelector('.navbar');
    if (window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
};

// VALIDACIÓN DEL FORMULARIO DE CONTACTO
const contactForm = document.getElementById('contactForm');
const feedback = document.getElementById('formFeedback');

if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Evita que la página se recargue

        // Obtenemos los campos
        const campos = [
            document.getElementById('nombre'),
            document.getElementById('email'),
            document.getElementById('empresa'),
            document.getElementById('prioridad'),
            document.getElementById('mensaje')
        ];

        let valid = true;

        // Limpiamos estilos previos
        campos.forEach(campo => {
            campo.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        });

        // Comprobamos cada campo
        campos.forEach(campo => {
            if (!campo.value || campo.value === "") {
                campo.style.borderColor = '#ff4b4b'; // Rojo si está vacío
                valid = false;
            }
        });

        if (!valid) {
            feedback.style.color = '#ff4b4b';
            feedback.textContent = '⚠️ Por favor, rellena todos los campos para poder ayudarte.';
        } else {
            feedback.style.color = '#8b5cf6';
            feedback.textContent = '🚀 ¡Enviando propuesta...! Conectando con los servidores de Chilie...';
            
            // Aquí es donde mañana conectaremos con Render
            console.log("Datos listos para enviar:", {
                nombre: campos[0].value,
                email: campos[1].value,
                empresa: campos[2].value,
                prioridad: campos[3].value,
                mensaje: campos[4].value
            });

            // Simulación de éxito
            setTimeout(() => {
                feedback.textContent = '✅ ¡Recibido! Te contactaremos en menos de 24h.';
                contactForm.reset();
            }, 2000);
        }
    });
}