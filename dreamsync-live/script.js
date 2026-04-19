const starContainer = document.getElementById('starfield');
const numberOfStars = 32; // Exactamente los 32 diseños de Figma

for (let i = 0; i < numberOfStars; i++) {
    const star = document.createElement('div');
    star.className = 'star-dot';
    
    // Tamaño aleatorio entre 1px y 3.5px
    const size = Math.random() * 2.5 + 1;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    
    // Posición aleatoria en la pantalla
    star.style.top = `${Math.random() * 100}vh`;
    star.style.left = `${Math.random() * 100}vw`;
    
    // Retraso aleatorio en la animación para que no todas parpadeen al mismo tiempo
    star.style.animationDelay = `${Math.random() * 4}s`;
    
    starContainer.appendChild(star);
}

document.addEventListener('DOMContentLoaded', () => {
    // Generar estrellas aleatorias
    const starsContainer = document.getElementById('stars-js');
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.width = Math.random() * 3 + 'px';
        star.style.height = star.style.width;
        star.style.setProperty('--d', (Math.random() * 3 + 2) + 's');
        starsContainer.appendChild(star);
    }

    // Intersection Observer para disparar animación
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                entry.target.classList.add('animate-active');
            }
        });
    }, { threshold: 0.3 });

    observer.observe(document.getElementById('stats-trigger'));

    function animateCounters() {
        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const duration = 2000;
            const increment = target / (duration / 16);

            let current = 0;
            const update = () => {
                current += increment;
                if (current < target) {
                    counter.innerText = Math.ceil(current);
                    requestAnimationFrame(update);
                } else {
                    counter.innerText = target;
                }
            };
            update();
        });
        
        // Activar barras de progreso
        document.querySelectorAll('.progress-fill').forEach(fill => {
            fill.style.width = '100%';
        });
    }
});


let testimonialActual = 1;
const totalTestimonios = 2; // Asegúrate de que este número sea igual a tus tarjetas e IDs

function cambiarTestimonio(direction) {
    const cardActual = document.getElementById(`testimonio-${testimonialActual}`);
    const dotActual = document.getElementById(`dot-${testimonialActual}`);

    // 1. Quitar activo actual (solo si existen)
    if (cardActual) cardActual.classList.remove('active');
    if (dotActual) dotActual.classList.remove('active');

    // 2. Calcular nuevo índice
    testimonialActual += direction;
    if (testimonialActual > totalTestimonios) testimonialActual = 1;
    if (testimonialActual < 1) testimonialActual = totalTestimonios;

    // 3. Obtener nuevos elementos
    const nuevaTarjeta = document.getElementById(`testimonio-${testimonialActual}`);
    const nuevoPunto = document.getElementById(`dot-${testimonialActual}`);
    
    if (nuevaTarjeta && nuevoPunto) {
        // Extraemos el gradiente del CSS del testimonio
        const estiloTarjeta = getComputedStyle(nuevaTarjeta);
        const colorGradiente = estiloTarjeta.getPropertyValue('--gradiente-indicador');
        
        // Aplicamos el color al punto activo
        nuevoPunto.style.setProperty('--active-dot-color', colorGradiente.trim());

        // 4. Activar
        nuevaTarjeta.classList.add('active');
        nuevoPunto.classList.add('active');
    }
}

