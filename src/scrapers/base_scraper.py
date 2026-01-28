"""
PJUD Web Scraper - BaseScraper.

Clase base que encapsula la lógica común de Playwright
para interactuar con el sitio PJUD.
"""

from __future__ import annotations

import time
from abc import ABC, abstractmethod
from contextlib import contextmanager
from pathlib import Path
from typing import Generator, Optional, Any

from playwright.sync_api import (
    sync_playwright,
    Browser,
    BrowserContext,
    Page,
    Playwright,
    TimeoutError as PlaywrightTimeout,
    Error as PlaywrightError,
)

from src.config import get_config, Config
from src.utils.logger import setup_logger


class ScraperException(Exception):
    """Excepción base para errores del scraper."""
    pass


class PageLoadError(ScraperException):
    """Error cuando una página no carga correctamente."""
    pass


class NavigationError(ScraperException):
    """Error durante la navegación."""
    pass


class ElementNotFoundError(ScraperException):
    """Error cuando un elemento no se encuentra en la página."""
    pass


class BaseScraper(ABC):
    """
    Clase base para todos los scrapers del PJUD.
    
    Provee funcionalidad común:
    - Inicialización de Playwright con configuración anti-detección
    - Manejo robusto de errores y reintentos
    - Logging integrado
    - Screenshots para debugging
    
    Ejemplo de uso:
        >>> class CivilScraper(BaseScraper):
        ...     def run(self) -> dict:
        ...         self.goto("https://example.com")
        ...         return {"status": "ok"}
        
        >>> with CivilScraper() as scraper:
        ...     result = scraper.run()
    """
    
    def __init__(
        self,
        config: Optional[Config] = None,
        logger_name: Optional[str] = None
    ) -> None:
        """
        Inicializa el scraper.
        
        Args:
            config: Configuración a usar (usa global si None)
            logger_name: Nombre del logger (usa nombre de clase si None)
        """
        self.config = config or get_config()
        self._logger = setup_logger(logger_name or self.__class__.__name__)
        
        # Estado interno
        self._playwright: Optional[Playwright] = None
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None
        self._page: Optional[Page] = None
        self._is_initialized = False
        
        # Directorio para screenshots
        self._screenshots_dir = self.config.project_root / "screenshots"
        self._screenshots_dir.mkdir(parents=True, exist_ok=True)
    
    @property
    def page(self) -> Page:
        """Retorna la página actual (lanza error si no está inicializada)."""
        if self._page is None:
            raise ScraperException("Scraper no inicializado. Usa 'with' statement.")
        return self._page
    
    @property
    def logger(self):
        """Retorna el logger del scraper."""
        return self._logger
    
    def _get_browser_args(self) -> list[str]:
        """
        Retorna argumentos del navegador para evadir detección básica.
        
        Returns:
            list[str]: Lista de argumentos para Chromium
        """
        return [
            "--disable-blink-features=AutomationControlled",
            "--disable-dev-shm-usage",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
        ]
    
    def _get_context_options(self) -> dict[str, Any]:
        """
        Retorna opciones del contexto para parecer un usuario real.
        
        Returns:
            dict: Opciones para el BrowserContext
        """
        options: dict[str, Any] = {
            "viewport": {
                "width": self.config.browser.viewport_width,
                "height": self.config.browser.viewport_height,
            },
            "user_agent": self.config.browser.user_agent,
            "locale": "es-CL",
            "timezone_id": "America/Santiago",
            "permissions": ["geolocation"],
            "java_script_enabled": True,
            "accept_downloads": True,
            "ignore_https_errors": True,
        }
        
        # Configurar proxy si está disponible
        if self.config.proxy.is_configured:
            proxy_config: dict[str, str] = {
                "server": self.config.proxy.server or "",
            }
            if self.config.proxy.username:
                proxy_config["username"] = self.config.proxy.username
                proxy_config["password"] = self.config.proxy.password or ""
            options["proxy"] = proxy_config
        
        return options
    
    def initialize(self) -> None:
        """
        Inicializa Playwright, navegador y página.
        
        Raises:
            ScraperException: Si hay error en la inicialización
        """
        if self._is_initialized:
            self.logger.warning("Scraper ya inicializado")
            return
        
        try:
            self.logger.info("Inicializando Playwright...")
            
            self._playwright = sync_playwright().start()
            
            self._browser = self._playwright.chromium.launch(
                headless=self.config.browser.headless,
                slow_mo=self.config.browser.slow_mo_ms,
                args=self._get_browser_args(),
            )
            
            self._context = self._browser.new_context(**self._get_context_options())
            self._context.set_default_timeout(self.config.browser.timeout_ms)
            
            self._page = self._context.new_page()
            
            # Inyectar script para ocultar webdriver
            self._page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
            """)
            
            self._is_initialized = True
            self.logger.info("✓ Playwright inicializado correctamente")
            
        except Exception as e:
            self.logger.error(f"Error inicializando Playwright: {e}")
            self.cleanup()
            raise ScraperException(f"Error de inicialización: {e}") from e
    
    def cleanup(self) -> None:
        """Libera recursos de Playwright de forma segura."""
        self.logger.debug("Limpiando recursos...")
        
        try:
            if self._page:
                self._page.close()
        except Exception:
            pass
        
        try:
            if self._context:
                self._context.close()
        except Exception:
            pass
        
        try:
            if self._browser:
                self._browser.close()
        except Exception:
            pass
        
        try:
            if self._playwright:
                self._playwright.stop()
        except Exception:
            pass
        
        self._page = None
        self._context = None
        self._browser = None
        self._playwright = None
        self._is_initialized = False
        
        self.logger.debug("✓ Recursos liberados")
    
    def __enter__(self) -> "BaseScraper":
        """Context manager: inicializa el scraper."""
        self.initialize()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Context manager: limpia recursos."""
        self.cleanup()
    
    def goto(
        self,
        url: str,
        wait_until: str = "domcontentloaded",
        retry: bool = True
    ) -> bool:
        """
        Navega a una URL con manejo de errores y reintentos.
        
        Args:
            url: URL destino
            wait_until: Evento de carga ("load", "domcontentloaded", "networkidle")
            retry: Si reintentar en caso de fallo
        
        Returns:
            bool: True si la navegación fue exitosa
        
        Raises:
            PageLoadError: Si la página no carga después de reintentos
        """
        max_attempts = self.config.retry.max_retries if retry else 1
        
        for attempt in range(1, max_attempts + 1):
            try:
                self.logger.info(f"Navegando a: {url} (intento {attempt}/{max_attempts})")
                
                response = self.page.goto(url, wait_until=wait_until)
                
                if response and response.ok:
                    self.logger.info(f"✓ Página cargada: {response.status}")
                    return True
                elif response:
                    self.logger.warning(f"Respuesta con status: {response.status}")
                    # Continuar si es un código de redirección o similar
                    if response.status < 400:
                        return True
                else:
                    self.logger.warning("Respuesta nula (posible timeout)")
                
            except PlaywrightTimeout as e:
                self.logger.error(f"Timeout en intento {attempt}: {e}")
                if attempt < max_attempts:
                    self._wait_before_retry(attempt)
                    
            except PlaywrightError as e:
                self.logger.error(f"Error de Playwright en intento {attempt}: {e}")
                if attempt < max_attempts:
                    self._wait_before_retry(attempt)
        
        # Tomar screenshot de error
        self.take_screenshot("error_page_load")
        raise PageLoadError(f"No se pudo cargar: {url} después de {max_attempts} intentos")
    
    def _wait_before_retry(self, attempt: int) -> None:
        """Espera antes de reintentar con backoff exponencial."""
        delay = self.config.retry.retry_delay_seconds * (2 ** (attempt - 1))
        self.logger.info(f"Esperando {delay}s antes de reintentar...")
        time.sleep(delay)
    
    def wait_for_selector(
        self,
        selector: str,
        timeout: Optional[int] = None,
        state: str = "visible"
    ) -> bool:
        """
        Espera a que un selector esté disponible.
        
        Args:
            selector: Selector CSS o XPath
            timeout: Timeout en ms (usa default si None)
            state: Estado esperado ("attached", "visible", "hidden")
        
        Returns:
            bool: True si el elemento fue encontrado
        """
        try:
            self.page.wait_for_selector(
                selector,
                timeout=timeout or self.config.browser.timeout_ms,
                state=state
            )
            self.logger.debug(f"✓ Selector encontrado: {selector}")
            return True
        except PlaywrightTimeout:
            self.logger.warning(f"Timeout esperando selector: {selector}")
            return False
    
    def safe_click(
        self,
        selector: str,
        timeout: Optional[int] = None
    ) -> bool:
        """
        Click seguro en un elemento con manejo de errores.
        
        Args:
            selector: Selector del elemento
            timeout: Timeout en ms
        
        Returns:
            bool: True si el click fue exitoso
        """
        try:
            self.page.click(selector, timeout=timeout or self.config.browser.timeout_ms)
            self.logger.debug(f"✓ Click en: {selector}")
            return True
        except PlaywrightTimeout:
            self.logger.warning(f"Timeout haciendo click en: {selector}")
            return False
        except PlaywrightError as e:
            self.logger.error(f"Error haciendo click en {selector}: {e}")
            return False
    
    def safe_fill(
        self,
        selector: str,
        value: str,
        timeout: Optional[int] = None
    ) -> bool:
        """
        Rellena un campo de forma segura.
        
        Args:
            selector: Selector del campo
            value: Valor a ingresar
            timeout: Timeout en ms
        
        Returns:
            bool: True si fue exitoso
        """
        try:
            self.page.fill(selector, value, timeout=timeout or self.config.browser.timeout_ms)
            self.logger.debug(f"✓ Campo rellenado: {selector}")
            return True
        except PlaywrightTimeout:
            self.logger.warning(f"Timeout rellenando campo: {selector}")
            return False
        except PlaywrightError as e:
            self.logger.error(f"Error rellenando {selector}: {e}")
            return False
    
    def take_screenshot(
        self,
        name: str,
        full_page: bool = False
    ) -> Path:
        """
        Toma un screenshot para debugging.
        
        Args:
            name: Nombre base del archivo
            full_page: Si capturar página completa
        
        Returns:
            Path: Ruta del screenshot guardado
        """
        from datetime import datetime
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{name}_{timestamp}.png"
        filepath = self._screenshots_dir / filename
        
        try:
            self.page.screenshot(path=str(filepath), full_page=full_page)
            self.logger.info(f"📸 Screenshot guardado: {filepath}")
            return filepath
        except Exception as e:
            self.logger.error(f"Error guardando screenshot: {e}")
            return filepath
    
    def get_page_content(self) -> str:
        """
        Obtiene el HTML de la página actual.
        
        Returns:
            str: Contenido HTML de la página
        """
        return self.page.content()
    
    def wait_for_navigation(self, timeout: Optional[int] = None) -> bool:
        """
        Espera a que se complete una navegación.
        
        Args:
            timeout: Timeout en ms
        
        Returns:
            bool: True si la navegación se completó
        """
        try:
            self.page.wait_for_load_state(
                "domcontentloaded",
                timeout=timeout or self.config.browser.timeout_ms
            )
            return True
        except PlaywrightTimeout:
            self.logger.warning("Timeout esperando navegación")
            return False
    
    @contextmanager
    def handle_popup(self) -> Generator[Page, None, None]:
        """
        Context manager para manejar popups del sitio.
        
        Yields:
            Page: La página del popup
        
        Ejemplo:
            >>> with scraper.handle_popup() as popup:
            ...     popup.fill("#campo", "valor")
        """
        with self.page.expect_popup() as popup_info:
            yield popup_info.value
    
    @abstractmethod
    def run(self) -> dict[str, Any]:
        """
        Método principal que debe implementar cada scraper.
        
        Returns:
            dict: Resultados del scraping
        """
        pass


if __name__ == "__main__":
    # Test básico del BaseScraper
    class TestScraper(BaseScraper):
        def run(self) -> dict[str, Any]:
            self.goto("https://example.com")
            return {"title": self.page.title()}
    
    print("=== Test BaseScraper ===")
    with TestScraper() as scraper:
        result = scraper.run()
        print(f"Resultado: {result}")
