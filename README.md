# PJUD Web Scraper

Proyecto de web scraping para el sitio del Poder Judicial de Chile (PJUD).

## 🚀 Inicio Rápido

### 1. Crear entorno virtual

```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows
```

### 2. Instalar dependencias

```bash
pip install -r requirements.txt

# Instalar browsers de Playwright
playwright install chromium
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env según necesidades
```

### 4. Ejecutar test de conexión

```bash
python -m src.main
```

## 📁 Estructura del Proyecto

```
sencker/
├── src/
│   ├── __init__.py
│   ├── config.py           # Configuración centralizada
│   ├── main.py             # Punto de entrada
│   ├── scrapers/
│   │   ├── __init__.py
│   │   ├── base_scraper.py # Clase base con Playwright
│   │   └── civil_scraper.py # Scraper de causas civiles
│   └── utils/
│       ├── __init__.py
│       ├── helpers.py      # Utilidades (RUT, fechas, export)
│       └── logger.py       # Sistema de logging
├── logs/                   # Archivos de log
├── output/                 # Resultados (JSON/CSV)
├── screenshots/            # Screenshots de debugging
├── requirements.txt
├── .env.example
└── .gitignore
```

## 🔧 Configuración

Edita el archivo `.env`:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `HEADLESS_MODE` | Ejecutar sin ventana visible | `true` |
| `TIMEOUT_SECONDS` | Timeout de operaciones | `60` |
| `SLOW_MO_MS` | Delay entre acciones | `100` |
| `LOG_LEVEL` | Nivel de logging | `INFO` |

## 🧪 Uso

### Ejemplo básico

```python
from src.scrapers.civil_scraper import CivilScraper

with CivilScraper() as scraper:
    # Navegar y extraer datos
    resultado = scraper.run()
    print(resultado)
```

### Crear un scraper personalizado

```python
from src.scrapers.base_scraper import BaseScraper

class MiScraper(BaseScraper):
    def run(self):
        self.goto("https://mi-url.com")
        # Lógica de scraping
        return {"data": "..."}
```

## 📋 Notas sobre el PJUD

- El sitio es legacy y puede ser lento
- Usa iframes y popups frecuentemente
- Puede requerir captchas en algunos casos
- Se recomienda usar delays entre acciones

## 📝 Licencia

MIT
