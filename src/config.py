"""
PJUD Web Scraper - Configuración Centralizada.

Este módulo carga y valida todas las variables de entorno
necesarias para el funcionamiento del scraper.
"""

from __future__ import annotations

import os
import logging
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional

from dotenv import load_dotenv


# Cargar variables de entorno desde .env
load_dotenv()


def _get_project_root() -> Path:
    """Obtiene la raíz del proyecto (donde está src/)."""
    return Path(__file__).parent.parent


@dataclass
class BrowserConfig:
    """Configuración del navegador Playwright."""
    
    headless: bool = True
    timeout_ms: int = 60_000
    slow_mo_ms: int = 100
    viewport_width: int = 1920
    viewport_height: int = 1080
    
    # User-Agent que simula un navegador real
    user_agent: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
    
    @classmethod
    def from_env(cls) -> "BrowserConfig":
        """Carga la configuración desde variables de entorno."""
        return cls(
            headless=os.getenv("HEADLESS_MODE", "true").lower() == "true",
            timeout_ms=int(os.getenv("TIMEOUT_SECONDS", "60")) * 1000,
            slow_mo_ms=int(os.getenv("SLOW_MO_MS", "100")),
            viewport_width=int(os.getenv("VIEWPORT_WIDTH", "1920")),
            viewport_height=int(os.getenv("VIEWPORT_HEIGHT", "1080")),
        )


@dataclass
class RetryConfig:
    """Configuración de reintentos para operaciones fallidas."""
    
    max_retries: int = 3
    retry_delay_seconds: int = 5
    
    @classmethod
    def from_env(cls) -> "RetryConfig":
        """Carga la configuración desde variables de entorno."""
        return cls(
            max_retries=int(os.getenv("MAX_RETRIES", "3")),
            retry_delay_seconds=int(os.getenv("RETRY_DELAY_SECONDS", "5")),
        )


@dataclass
class CaptchaConfig:
    """Configuración para servicios de resolución de captcha."""
    
    api_key: Optional[str] = None
    service: str = "2captcha"
    
    @classmethod
    def from_env(cls) -> "CaptchaConfig":
        """Carga la configuración desde variables de entorno."""
        api_key = os.getenv("CAPTCHA_API_KEY")
        if api_key == "your_captcha_api_key_here":
            api_key = None
            
        return cls(
            api_key=api_key,
            service=os.getenv("CAPTCHA_SERVICE", "2captcha"),
        )
    
    @property
    def is_configured(self) -> bool:
        """Verifica si el servicio de captcha está configurado."""
        return self.api_key is not None and len(self.api_key) > 0


@dataclass
class ProxyConfig:
    """Configuración de proxy (opcional)."""
    
    server: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    
    @classmethod
    def from_env(cls) -> "ProxyConfig":
        """Carga la configuración desde variables de entorno."""
        return cls(
            server=os.getenv("PROXY_SERVER"),
            username=os.getenv("PROXY_USERNAME"),
            password=os.getenv("PROXY_PASSWORD"),
        )
    
    @property
    def is_configured(self) -> bool:
        """Verifica si el proxy está configurado."""
        return self.server is not None


@dataclass
class PJUDUrls:
    """URLs del sitio PJUD."""
    
    base_url: str = "https://oficinajudicialvirtual.pjud.cl"
    civil_url: str = "https://oficinajudicialvirtual.pjud.cl/indexN.php"
    
    @classmethod
    def from_env(cls) -> "PJUDUrls":
        """Carga las URLs desde variables de entorno."""
        return cls(
            base_url=os.getenv(
                "PJUD_BASE_URL", 
                "https://oficinajudicialvirtual.pjud.cl"
            ),
            civil_url=os.getenv(
                "PJUD_CIVIL_URL",
                "https://oficinajudicialvirtual.pjud.cl/indexN.php"
            ),
        )


@dataclass
class LoggingConfig:
    """Configuración del sistema de logging."""
    
    level: str = "INFO"
    log_to_file: bool = True
    log_dir: Path = field(default_factory=lambda: _get_project_root() / "logs")
    
    @classmethod
    def from_env(cls) -> "LoggingConfig":
        """Carga la configuración desde variables de entorno."""
        return cls(
            level=os.getenv("LOG_LEVEL", "INFO").upper(),
            log_to_file=os.getenv("LOG_TO_FILE", "true").lower() == "true",
        )
    
    def get_log_level(self) -> int:
        """Convierte el nivel de log a constante de logging."""
        levels = {
            "DEBUG": logging.DEBUG,
            "INFO": logging.INFO,
            "WARNING": logging.WARNING,
            "ERROR": logging.ERROR,
            "CRITICAL": logging.CRITICAL,
        }
        return levels.get(self.level, logging.INFO)


@dataclass
class OutputConfig:
    """Configuración de salida de datos."""
    
    format: str = "json"  # json, csv, both
    output_dir: Path = field(default_factory=lambda: _get_project_root() / "output")
    
    @classmethod
    def from_env(cls) -> "OutputConfig":
        """Carga la configuración desde variables de entorno."""
        return cls(
            format=os.getenv("OUTPUT_FORMAT", "json").lower(),
        )


@dataclass
class Config:
    """
    Configuración principal del scraper.
    
    Agrupa todas las configuraciones en un solo objeto.
    
    Ejemplo de uso:
        >>> config = Config.load()
        >>> print(config.browser.headless)
        True
    """
    
    browser: BrowserConfig
    retry: RetryConfig
    captcha: CaptchaConfig
    proxy: ProxyConfig
    urls: PJUDUrls
    logging: LoggingConfig
    output: OutputConfig
    project_root: Path = field(default_factory=_get_project_root)
    
    @classmethod
    def load(cls) -> "Config":
        """
        Carga toda la configuración desde variables de entorno.
        
        Returns:
            Config: Objeto con toda la configuración cargada.
        """
        return cls(
            browser=BrowserConfig.from_env(),
            retry=RetryConfig.from_env(),
            captcha=CaptchaConfig.from_env(),
            proxy=ProxyConfig.from_env(),
            urls=PJUDUrls.from_env(),
            logging=LoggingConfig.from_env(),
            output=OutputConfig.from_env(),
        )
    
    def validate(self) -> list[str]:
        """
        Valida la configuración y retorna una lista de warnings.
        
        Returns:
            list[str]: Lista de mensajes de advertencia.
        """
        warnings: list[str] = []
        
        if not self.captcha.is_configured:
            warnings.append(
                "CAPTCHA_API_KEY no configurado. "
                "Los captchas deberán resolverse manualmente."
            )
        
        if self.browser.timeout_ms < 30_000:
            warnings.append(
                f"Timeout de {self.browser.timeout_ms}ms puede ser muy bajo "
                "para el sitio PJUD que es conocido por ser lento."
            )
        
        return warnings


# Instancia global de configuración (lazy loading)
_config: Optional[Config] = None


def get_config() -> Config:
    """
    Obtiene la configuración global del scraper.
    
    Returns:
        Config: Configuración cargada desde variables de entorno.
    
    Ejemplo:
        >>> from src.config import get_config
        >>> config = get_config()
        >>> print(config.browser.headless)
    """
    global _config
    if _config is None:
        _config = Config.load()
    return _config


if __name__ == "__main__":
    # Test de configuración
    config = get_config()
    print("=== Configuración Cargada ===")
    print(f"Headless: {config.browser.headless}")
    print(f"Timeout: {config.browser.timeout_ms}ms")
    print(f"URL Civil: {config.urls.civil_url}")
    print(f"Log Level: {config.logging.level}")
    print(f"Captcha configurado: {config.captcha.is_configured}")
    
    warnings = config.validate()
    if warnings:
        print("\n=== Advertencias ===")
        for w in warnings:
            print(f"⚠️  {w}")
