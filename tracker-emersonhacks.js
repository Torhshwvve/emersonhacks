// ============================================================
// 🔒 TRACKER MODSLJAK v3.0 - Licencia + Clicks por Día
// ⚠️ NO REMOVER - Sistema de protección y analíticas activo
// ============================================================
(function() {
    'use strict';

    // ============================================================
    // 🔥 FIREBASE CONFIG (misma DB del Panel Admin)
    // ============================================================
    const FIREBASE_URL = 'https://alexis-fba4d-default-rtdb.firebaseio.com';

    // El ID del proyecto se define en cada página antes de este script:
    // <script> var MODSLJAK_PROYECTO_ID = 'modsljak_android'; </script>
    const PROYECTO_ID = (typeof window.MODSLJAK_PROYECTO_ID !== 'undefined')
        ? window.MODSLJAK_PROYECTO_ID
        : 'modsljak_sitio';

    const DB_PROYECTO = FIREBASE_URL + '/proyectos/' + PROYECTO_ID;

    // ============================================================
    // 📊 REGISTRAR CLICK DE COMPRA EN FIREBASE
    // ============================================================
    window.registrarClickCompra = function(producto, duracion, precio) {
        const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const urlDia = DB_PROYECTO + '/clics_por_dia/' + hoy + '.json';

        // Leer el valor actual del día y sumarle 1
        fetch(urlDia + '?t=' + Date.now())
            .then(function(r) { return r.json(); })
            .then(function(valorActual) {
                const nuevo = (typeof valorActual === 'number' ? valorActual : 0) + 1;
                return fetch(urlDia, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevo)
                });
            })
            .catch(function() {
                // Silencioso — no bloquear el flujo de compra
            });

        // También actualizar clics_compra total (retrocompatible)
        const urlTotal = DB_PROYECTO + '/clics_compra.json';
        fetch(urlTotal + '?t=' + Date.now())
            .then(function(r) { return r.json(); })
            .then(function(v) {
                return fetch(urlTotal, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify((typeof v === 'number' ? v : 0) + 1)
                });
            })
            .catch(function() {});
    };

    // ============================================================
    // 🔒 VERIFICACIÓN DE LICENCIA
    // ============================================================
    var CONFIG = {
        verificarCadaMinutos: 5,
        cacheLocalMinutos: 30
    };

    function verificarLicencia() {
        fetch(DB_PROYECTO + '.json?t=' + Date.now())
            .then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function(proyecto) {
                if (!proyecto) throw new Error('Proyecto no encontrado');
                try {
                    localStorage.setItem('lic_' + PROYECTO_ID,
                        JSON.stringify({ data: proyecto, ts: Date.now() }));
                } catch(e) {}
                procesarLicencia(proyecto, true);
            })
            .catch(function(err) {
                console.warn('⚠️ Firebase no disponible:', err.message);
                usarCacheLocal();
            });
    }

    function usarCacheLocal() {
        try {
            var cached = localStorage.getItem('lic_' + PROYECTO_ID);
            if (cached) {
                var obj = JSON.parse(cached);
                var mins = (Date.now() - obj.ts) / 60000;
                if (mins < CONFIG.cacheLocalMinutos) {
                    procesarLicencia(obj.data, false);
                    return;
                }
            }
        } catch(e) {}
        // Sin caché válida: dejar funcionar pero reintentar
        setTimeout(verificarLicencia, 30000);
    }

    function procesarLicencia(proyecto, enLinea) {
        if (!proyecto.activo) {
            mostrarPantallaBloqueo('Sitio Desactivado',
                'Este sitio ha sido temporalmente desactivado. Contacta al propietario.');
            return;
        }

        var expira = new Date(proyecto.expira + 'T00:00:00');
        var hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (hoy > expira) {
            mostrarPantallaBloqueo('Licencia Expirada',
                'La licencia de este sitio expiró el ' +
                expira.toLocaleDateString('es-ES') + '.');
            return;
        }

        if (!proyecto.pagado) {
            var dias = Math.ceil((expira - hoy) / 86400000);
            mostrarBannerPago(dias);
        }

        mostrarCardLicencia(proyecto, enLinea);

        // Re-verificar periódicamente
        setTimeout(verificarLicencia, CONFIG.verificarCadaMinutos * 60000);
    }

    // ============================================================
    // 🎴 CARD DE LICENCIA (esquina inferior)
    // ============================================================
    function mostrarCardLicencia(proyecto, enLinea) {
        var existente = document.getElementById('lic-card-mj');
        if (existente) existente.remove();

        var expiraDate = new Date(proyecto.expira + 'T00:00:00');
        var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        var dias = Math.ceil((expiraDate - hoy) / 86400000);

        var card = document.createElement('div');
        card.id = 'lic-card-mj';
        card.style.cssText = [
            'position:fixed', 'bottom:15px', 'right:15px',
            'background:linear-gradient(135deg,rgba(0,20,10,0.97),rgba(0,30,20,0.99))',
            'border:1px solid rgba(0,255,65,0.35)', 'border-radius:10px',
            'padding:12px 16px', 'font-family:Segoe UI,system-ui,sans-serif',
            'font-size:0.82rem', 'z-index:999998',
            'box-shadow:0 4px 15px rgba(0,255,65,0.15)',
            'max-width:260px', 'opacity:0.92'
        ].join(';');

        card.innerHTML =
            '<div style="color:#00ff41;font-weight:700;margin-bottom:6px;">🔒 MODSLJAK Protegido</div>' +
            '<div style="color:#ccc;">📅 Expira: <span style="color:#fff;">' + proyecto.expira +
            ' (' + dias + ' d)</span></div>' +
            '<div style="color:#ccc;">💳 Pago: <span style="color:' +
            (proyecto.pagado ? '#00ff41' : '#ff006e') + ';">' +
            (proyecto.pagado ? 'Al día ✓' : 'Pendiente ✗') + '</span></div>' +
            '<div style="color:#555;font-size:0.75rem;margin-top:5px;">' +
            (enLinea ? '🟢 Verificado online' : '🟡 Verificado (caché)') + '</div>';

        document.body.appendChild(card);
    }

    // ============================================================
    // 🚨 PANTALLA DE BLOQUEO
    // ============================================================
    function mostrarPantallaBloqueo(titulo, mensaje) {
        document.body.innerHTML =
            '<style>*{margin:0;padding:0;box-sizing:border-box}' +
            'body{font-family:Segoe UI,system-ui,sans-serif;' +
            'background:linear-gradient(135deg,#0a0a0a,#1a1a2e);' +
            'display:flex;justify-content:center;align-items:center;min-height:100vh}' +
            '.b{text-align:center;padding:60px 40px;background:rgba(26,26,46,.95);' +
            'border-radius:20px;border:1px solid rgba(189,0,255,.3);max-width:480px;margin:20px}' +
            '.i{font-size:70px;margin-bottom:20px}' +
            '.t{font-size:1.9rem;color:#bd00ff;margin-bottom:15px;font-weight:800}' +
            '.m{color:#ccc;margin-bottom:20px;line-height:1.6;font-size:1.05rem}' +
            '.n{font-size:.85rem;color:#888;padding:12px;background:rgba(0,0,0,.3);' +
            'border-radius:8px;border:1px solid rgba(255,255,255,.05)}' +
            '.f{margin-top:20px;font-size:.75rem;color:#555}</style>' +
            '<div class="b"><div class="i">🔒</div>' +
            '<h1 class="t">' + titulo + '</h1>' +
            '<p class="m">' + mensaje + '</p>' +
            '<div class="n">Sitio protegido por MODSLJAK.<br>Contacta al administrador para renovar.</div>' +
            '<div class="f">MODSLJAK © ' + new Date().getFullYear() + ' · Licencia requerida</div>' +
            '</div>';
    }

    // ============================================================
    // ⚠️ BANNER PAGO PENDIENTE
    // ============================================================
    function mostrarBannerPago(dias) {
        if (document.getElementById('banner-pago-mj')) return;
        var b = document.createElement('div');
        b.id = 'banner-pago-mj';
        b.style.cssText = 'position:fixed;top:0;left:0;right:0;' +
            'background:linear-gradient(135deg,#bd00ff,#ff006e);' +
            'color:#fff;padding:10px;text-align:center;z-index:999999;' +
            'font-family:Segoe UI,sans-serif;font-size:13px;' +
            'box-shadow:0 3px 10px rgba(0,0,0,.4);';
        b.innerHTML = '⚠️ <strong>Pago pendiente.</strong> Este sitio expira en ' +
            dias + ' días. Contacta al desarrollador para renovar.';
        document.body.insertBefore(b, document.body.firstChild);
    }

    // ============================================================
    // INICIO AUTOMÁTICO
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', verificarLicencia);
    } else {
        verificarLicencia();
    }

    console.log('%c🔒 MODSLJAK Tracker v3.0 · Proyecto: ' + PROYECTO_ID,
        'color:#00ff41;font-size:13px;font-weight:bold;');
})();
