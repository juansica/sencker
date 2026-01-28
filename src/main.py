#!/usr/bin/env python3
"""
PJUD Web Scraper - Punto de Entrada Principal.

Este script demuestra el uso del scraper base,
navegando a la página de Consulta de Causas Civil
y tomando un screenshot de verificación.

Uso:
    python -m src.main
    # o
    python src/main.py
"""

from __future__ import annotations

import sys
from pathlib import Path

# Agregar el directorio raíz al path para imports
ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

from src.config import get_config
from src.scrapers.base_scraper import BaseScraper, ScraperException, PageLoadError
from src.utils.logger import setup_logger


class PJUDTestScraper(BaseScraper):
    """
    Scraper de prueba para verificar que el setup funciona.
    
    Navega a la página principal del PJUD y toma un screenshot.
    """
    
    def run(self) -> dict[str, any]:
        """
        Ejecuta prueba de conexión al sitio PJUD.
        
        Returns:
            dict: Información del resultado de la prueba
        """
        self.logger.info("=" * 60)
        self.logger.info("PJUD Web Scraper - Test de Conexión")
        self.logger.info("=" * 60)
        
        result = {
            "success": False,
            "url": "",
            "title": "",
            "screenshot": "",
            "error": None,
        }
        
        try:
            # Navegar a la página de Consulta Civil
            target_url = self.config.urls.civil_url
            self.logger.info(f"Navegando a: {target_url}")
            
            self.goto(target_url)
            
            # Esperar a que la página cargue completamente
            self.page.wait_for_load_state("networkidle", timeout=30000)
            
            # Obtener información de la página
            result["url"] = self.page.url
            result["title"] = self.page.title()
            
            self.logger.info(f"📄 Título de la página: {result['title']}")
            self.logger.info(f"🔗 URL actual: {result['url']}")
            
            # Tomar screenshot de prueba
            screenshot_path = self.take_screenshot("pjud_test_connection", full_page=True)
            result["screenshot"] = str(screenshot_path)
            
            # Verificar que estamos en el sitio correcto
            if "pjud" in result["url"].lower() or "judicial" in result["url"].lower():
                self.logger.info("✅ Conexión exitosa al sitio PJUD")
                result["success"] = True
            else:
                self.logger.warning("⚠️ La URL no parece ser del PJUD")
            
        except PageLoadError as e:
            self.logger.error(f"❌ Error cargando la página: {e}")
            result["error"] = str(e)
            self.take_screenshot("error_page_load")
            
        except ScraperException as e:
            self.logger.error(f"❌ Error del scraper: {e}")
            result["error"] = str(e)
            
        except Exception as e:
            self.logger.error(f"❌ Error inesperado: {e}")
            result["error"] = str(e)
            self.take_screenshot("error_unexpected")
        
        return result


def main() -> int:
    """
    Función principal del script.
    
    Returns:
        int: Código de salida (0 = éxito, 1 = error)
    """
    logger = setup_logger("main")
    
    # Cargar y mostrar configuración
    config = get_config()
    
    logger.info("Configuración cargada:")
    logger.info(f"  - Headless: {config.browser.headless}")
    logger.info(f"  - Timeout: {config.browser.timeout_ms}ms")
    logger.info(f"  - URL objetivo: {config.urls.civil_url}")
    
    # Mostrar advertencias de configuración
    warnings = config.validate()
    for w in warnings:
        logger.warning(w)
    
    # Ejecutar scraper de prueba
    try:
        with PJUDTestScraper() as scraper:
            result = scraper.run()
        
        # Mostrar resultados
        logger.info("=" * 60)
        logger.info("RESULTADOS")
        logger.info("=" * 60)
        
        if result["success"]:
            logger.info(f"✅ Test exitoso")
            logger.info(f"   Título: {result['title']}")
            logger.info(f"   Screenshot: {result['screenshot']}")
            return 0
        else:
            logger.error(f"❌ Test fallido: {result.get('error', 'Unknown error')}")
            return 1
            
    except Exception as e:
        logger.critical(f"Error fatal: {e}")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
