"""
PJUD Web Scraper - Sistema de Logging.

Configura logging tanto para consola como para archivo,
facilitando el debugging de la navegación.
"""

from __future__ import annotations

import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

from src.config import get_config, LoggingConfig


class ColoredFormatter(logging.Formatter):
    """Formatter con colores para la consola."""
    
    # Códigos ANSI para colores
    COLORS = {
        logging.DEBUG: "\033[36m",      # Cyan
        logging.INFO: "\033[32m",        # Green
        logging.WARNING: "\033[33m",     # Yellow
        logging.ERROR: "\033[31m",       # Red
        logging.CRITICAL: "\033[35m",    # Magenta
    }
    RESET = "\033[0m"
    
    def format(self, record: logging.LogRecord) -> str:
        """Aplica color según el nivel de log."""
        color = self.COLORS.get(record.levelno, self.RESET)
        record.levelname = f"{color}{record.levelname}{self.RESET}"
        return super().format(record)


def setup_logger(
    name: str = "pjud_scraper",
    config: Optional[LoggingConfig] = None
) -> logging.Logger:
    """
    Configura y retorna un logger para el scraper.
    
    Args:
        name: Nombre del logger
        config: Configuración de logging (usa config global si None)
    
    Returns:
        logging.Logger: Logger configurado
    
    Ejemplo:
        >>> logger = setup_logger()
        >>> logger.info("Iniciando scraper")
    """
    if config is None:
        config = get_config().logging
    
    logger = logging.getLogger(name)
    
    # Evitar configurar múltiples veces
    if logger.handlers:
        return logger
    
    logger.setLevel(config.get_log_level())
    
    # Formato detallado para debugging
    detailed_format = (
        "%(asctime)s | %(levelname)-8s | "
        "%(name)s:%(funcName)s:%(lineno)d | %(message)s"
    )
    simple_format = "%(asctime)s | %(levelname)-8s | %(message)s"
    
    # Handler para consola (con colores)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(config.get_log_level())
    console_handler.setFormatter(ColoredFormatter(simple_format))
    logger.addHandler(console_handler)
    
    # Handler para archivo
    if config.log_to_file:
        log_dir = config.log_dir
        log_dir.mkdir(parents=True, exist_ok=True)
        
        # Nombre del archivo con fecha
        log_filename = f"scraper_{datetime.now().strftime('%Y%m%d')}.log"
        log_path = log_dir / log_filename
        
        file_handler = logging.FileHandler(log_path, encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)  # Archivo siempre en DEBUG
        file_handler.setFormatter(logging.Formatter(detailed_format))
        logger.addHandler(file_handler)
        
        logger.debug(f"Log file: {log_path}")
    
    return logger


# Logger global del proyecto
logger = setup_logger()


if __name__ == "__main__":
    # Test del logger
    test_logger = setup_logger("test")
    
    test_logger.debug("Este es un mensaje DEBUG")
    test_logger.info("Este es un mensaje INFO")
    test_logger.warning("Este es un mensaje WARNING")
    test_logger.error("Este es un mensaje ERROR")
    test_logger.critical("Este es un mensaje CRITICAL")
