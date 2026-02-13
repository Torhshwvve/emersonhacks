// 🔒 SISTEMA DE PROTECCIÓN - MODSLJAK v2.0 (Firebase Tiempo Real)
// ⚠️ NO REMOVER ESTE CÓDIGO - LICENCIA REQUERIDA
(function() {
    'use strict';

    // ============================================
    // 🔥 CONFIGURACIÓN FIREBASE (DEBE COINCIDIR CON EL ADMIN)
    // ============================================
    const CONFIG = {
        proyectoId: 'emerson_hacks',
        firebaseURL: 'https://alexis-fba4d-default-rtdb.firebaseio.com',
        // ✅ Firebase configurado correctamente
        verificarCadaMinutos: 5,
        cacheLocalMinutos: 30
    };

    const DB_URL = CONFIG.firebaseURL + '/proyectos/' + CONFIG.proyectoId + '.json';

    // ============================================
    // VERIFICACIÓN PRINCIPAL
    // ============================================
    function verificarLicencia() {
        fetch(DB_URL + '?t=' + Date.now())
            .then(function(response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .then(function(proyecto) {
                if (!proyecto) throw new Error('Proyecto no encontrado');
                try {
                    localStorage.setItem('lic_' + CONFIG.proyectoId, JSON.stringify({ data: proyecto, ts: Date.now() }));
                } catch(e) {}
                procesarLicencia(proyecto, true);
            })
            .catch(function(error) {
                console.warn('⚠️ Firebase no disponible:', error.message);
                usarCacheLocal();
            });
    }

    function usarCacheLocal() {
        try {
            var cached = localStorage.getItem('lic_' + CONFIG.proyectoId);
            if (cached) {
                var obj = JSON.parse(cached);
                var mins = (Date.now() - obj.ts) / 60000;
                if (mins < CONFIG.cacheLocalMinutos) {
                    procesarLicencia(obj.data, false);
                    return;
                }
            }
        } catch(e) {}
        mostrarLicenciaCard({ activo: true, pagado: true, expira: null }, false, 'Sin conexión');
        setTimeout(verificarLicencia, 30000);
    }

    function procesarLicencia(proyecto, enLinea) {
        if (!proyecto.activo) {
            ocultarLicenciaCard();
            mostrarPantallaBloqueo('Sitio Desactivado', 'Este sitio ha sido desactivado. Contacta al propietario.');
            return;
        }

        var expira = new Date(proyecto.expira + 'T00:00:00');
        var hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (hoy > expira) {
            ocultarLicenciaCard();
            mostrarPantallaBloqueo('Licencia Expirada', 'La licencia expiró el ' + expira.toLocaleDateString('es-ES') + '.');
            return;
        }

        if (!proyecto.pagado) {
            var dias = Math.ceil((expira - hoy) / 86400000);
            mostrarAdvertenciaPago(dias);
        }

        mostrarLicenciaCard(proyecto, enLinea, null);
        setTimeout(verificarLicencia, CONFIG.verificarCadaMinutos * 60000);
    }

    // ============================================
    // TARJETA DE LICENCIA
    // ============================================
    function mostrarLicenciaCard(proyecto, enLinea, errorMsg) {
        var existente = document.getElementById('licencia-card-modsljak');
        if (existente) existente.remove();

        var expiraTexto = 'Error al cargar';
        if (proyecto.expira) {
            var expiraDate = new Date(proyecto.expira + 'T00:00:00');
            var hoy = new Date(); hoy.setHours(0,0,0,0);
            var dias = Math.ceil((expiraDate - hoy) / 86400000);
            if (!isNaN(expiraDate)) {
                expiraTexto = proyecto.expira + (dias > 0 ? ' (' + dias + ' días)' : ' (Expirado)');
            }
        } else if (errorMsg) {
            expiraTexto = errorMsg === 'Sin conexión' ? 'Sin conexión' : 'Error al cargar';
        }

        var card = document.createElement('div');
        card.id = 'licencia-card-modsljak';
        card.style.cssText = 'background:linear-gradient(135deg,rgba(0,30,20,0.95),rgba(0,20,10,0.98));border:1px solid rgba(0,255,65,0.4);border-radius:12px;padding:16px 20px;margin:20px auto;max-width:400px;font-family:Segoe UI,system-ui,sans-serif;font-size:0.9rem;box-shadow:0 4px 20px rgba(0,255,65,0.1);';
        card.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">'
            + '<div><span style="color:#00ff41;font-weight:700;">✅ Estado:</span> <span style="color:#fff;">' + (proyecto.activo ? 'ACTIVO' : 'INACTIVO') + '</span></div>'
            + '<div><span style="color:#ffaa00;font-weight:700;">💳 Pago:</span> <span style="color:#fff;">' + (proyecto.pagado ? 'PAGADO' : 'PENDIENTE') + '</span></div>'
            + '</div>'
            + '<div style="margin-bottom:8px;"><span style="color:#ff6b00;font-weight:700;">📅 Expira:</span> <span style="color:#fff;">' + expiraTexto + '</span></div>'
            + '<div style="border-top:1px solid rgba(0,255,65,0.2);padding-top:8px;">'
            + '<span style="color:#ffaa00;font-weight:700;">🔒 Licencia:</span> <span style="color:#00ff41;font-weight:700;">' + (enLinea ? '100% VERIFICADA ✓' : 'VERIFICADA (cache) ✓') + '</span>'
            + '</div>';

        var footer = document.querySelector('footer');
        if (footer && footer.parentNode) {
            footer.parentNode.insertBefore(card, footer.nextSibling);
        } else {
            document.body.appendChild(card);
        }
    }

    function ocultarLicenciaCard() {
        var card = document.getElementById('licencia-card-modsljak');
        if (card) card.remove();
    }

    // ============================================
    // PANTALLA DE BLOQUEO
    // ============================================
    function mostrarPantallaBloqueo(titulo, mensaje) {
        document.body.innerHTML = '<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Segoe UI,system-ui,sans-serif;background:linear-gradient(135deg,#0a0a0a,#1a1a2e);display:flex;justify-content:center;align-items:center;min-height:100vh}.b{text-align:center;padding:60px 40px;background:rgba(26,26,46,.95);border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.5);border:1px solid rgba(189,0,255,.3);max-width:500px;margin:20px;animation:f .5s ease}@keyframes f{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}.i{font-size:80px;margin-bottom:20px}.t{font-size:2rem;color:#bd00ff;margin-bottom:15px;font-weight:700}.m{font-size:1.1rem;color:#ccc;margin-bottom:25px;line-height:1.6}.n{font-size:.9rem;color:#888;padding:15px;background:rgba(0,0,0,.3);border-radius:10px;border:1px solid rgba(255,255,255,.05)}.f{margin-top:25px;font-size:.8rem;color:#555}</style><div class="b"><div class="i">🔒</div><h1 class="t">' + titulo + '</h1><p class="m">' + mensaje + '</p><div class="n">Sitio protegido con licencia MODSLJAK.<br>Contacta al administrador.</div><div class="f">MODSLJAK © ' + new Date().getFullYear() + ' · Sistema de protección activo</div></div>';
    }

    // ============================================
    // BANNER PAGO PENDIENTE
    // ============================================
    function mostrarAdvertenciaPago(dias) {
        if (document.getElementById('aviso-pago-modsljak')) return;
        var b = document.createElement('div');
        b.id = 'aviso-pago-modsljak';
        b.style.cssText = 'position:fixed;top:0;left:0;right:0;background:linear-gradient(135deg,#bd00ff,#ff006e);color:#fff;padding:12px;text-align:center;z-index:999999;font-family:Segoe UI,sans-serif;font-size:14px;box-shadow:0 4px 10px rgba(0,0,0,.3);';
        b.innerHTML = '⚠️ <strong>Pago pendiente.</strong> El sitio expira en ' + dias + ' días. Contacta al desarrollador.';
        document.body.insertBefore(b, document.body.firstChild);
    }

    // INICIO
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', verificarLicencia);
    } else {
        verificarLicencia();
    }

    console.log('%c🔒 MODSLJAK - Sistema Protegido v2.0 🔥 Firebase', 'color:#bd00ff;font-size:14px;font-weight:bold;');
})();
