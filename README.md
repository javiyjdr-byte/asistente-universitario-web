# Asistente Universitario — Sitio público piloto 1.0

Sitio estático independiente para presentar el Asistente Universitario y conducir a los participantes habilitados hacia el portal privado.

## Alcance

- No modifica el backend ni el Calendar Connector.
- No contiene secretos, tokens personales ni datos de estudiantes.
- Funciona sin Canva, Tailwind, Lucide, Node ni proceso de compilación.
- Centraliza los enlaces en `config.js`.
- Incluye un aviso de privacidad local.
- Usa el correo electrónico como canal provisional de comentarios.

## Archivos

```text
├── index.html
├── privacidad.html
├── styles.css
├── config.js
├── app.js
├── README.md
└── tests/
    └── test_site.py
```

## Configuración

Editar solamente `config.js` para cambiar enlaces o datos públicos:

```javascript
window.SITE_CONFIG = Object.freeze({
  version: "1.0.0-piloto",
  portalUrl: "https://script.google.com/macros/s/IMPLEMENTACION/exec",
  privacyUrl: "./privacidad.html",
  feedbackUrl: "mailto:correo@ejemplo.com?subject=Comentarios",
  contactEmail: "correo@ejemplo.com",
  pilotAccess: "Acceso limitado a participantes habilitados"
});
```

La URL del portal debe:

- utilizar `https`;
- terminar en `/exec`;
- no contener `?token=`;
- apuntar al Calendar Connector, no al backend.

Cuando exista un Google Form para comentarios, reemplazar solamente `feedbackUrl`.

## Prueba local

Desde la raíz del repositorio:

```bash
python3 -m http.server 8080 \
  --directory .
```

Abrir:

```text
http://localhost:8080/
```

Finalizar el servidor con `Ctrl+C`.

## Pruebas automáticas

```bash
python3 tests/test_site.py
```

Las pruebas comprueban:

- archivos obligatorios;
- ausencia de dependencias internas de Canva;
- ausencia de marcadores sin resolver;
- URL segura del portal sin token;
- identificadores HTML únicos;
- destinos existentes para enlaces internos;
- carga local de CSS y JavaScript.


## Publicación

Este repositorio contiene únicamente los archivos públicos del sitio web. El backend, los datos académicos, las credenciales y los secretos permanecen en el repositorio privado y en Apps Script.

El sitio puede publicarse mediante GitHub Pages usando:

- rama: `main`;
- carpeta: `/ (root)`.

Antes de cada publicación se deben ejecutar las pruebas automáticas:

```bash
python3 tests/test_site.py
```

También deben verificarse la navegación, los accesos al portal, el aviso de privacidad, el canal de comentarios, el menú móvil y las preguntas frecuentes.

## Derechos

Copyright © 2026 Javier Domingo Rodríguez. Todos los derechos reservados.

La publicación del código fuente en este repositorio no concede autorización para copiar, redistribuir, sublicenciar ni explotar comercialmente el proyecto.
