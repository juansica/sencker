"""
PJUD Web Scraper - Utilidades y Helpers.

Funciones comunes para procesamiento de datos,
limpieza de texto y exportación.
"""

from __future__ import annotations

import json
import re
import csv
from pathlib import Path
from datetime import datetime
from typing import Any, Sequence


def sanitize_text(text: str | None) -> str:
    """
    Limpia y normaliza texto extraído del HTML.
    
    - Remueve espacios extras
    - Normaliza saltos de línea
    - Elimina caracteres no imprimibles
    
    Args:
        text: Texto a limpiar (puede ser None)
    
    Returns:
        str: Texto limpio y normalizado
    
    Ejemplo:
        >>> sanitize_text("  Hola   Mundo  \\n\\n  ")
        'Hola Mundo'
    """
    if text is None:
        return ""
    
    # Remover caracteres no imprimibles
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    
    # Normalizar espacios en blanco
    text = re.sub(r'\s+', ' ', text)
    
    # Remover espacios al inicio y final
    return text.strip()


def format_rut(rut: str) -> str:
    """
    Formatea un RUT chileno al formato estándar XX.XXX.XXX-X.
    
    Args:
        rut: RUT en cualquier formato (con o sin puntos/guión)
    
    Returns:
        str: RUT formateado o string vacío si es inválido
    
    Ejemplo:
        >>> format_rut("12345678-9")
        '12.345.678-9'
        >>> format_rut("123456789")
        '12.345.678-9'
    """
    # Limpiar todo excepto números y K
    rut_clean = re.sub(r'[^0-9kK]', '', rut.upper())
    
    if len(rut_clean) < 2:
        return ""
    
    # Separar cuerpo y dígito verificador
    body = rut_clean[:-1]
    dv = rut_clean[-1]
    
    # Formatear con puntos
    formatted_body = ""
    for i, digit in enumerate(reversed(body)):
        if i > 0 and i % 3 == 0:
            formatted_body = "." + formatted_body
        formatted_body = digit + formatted_body
    
    return f"{formatted_body}-{dv}"


def validate_rut(rut: str) -> bool:
    """
    Valida si un RUT chileno tiene el dígito verificador correcto.
    
    Args:
        rut: RUT a validar
    
    Returns:
        bool: True si el RUT es válido
    
    Ejemplo:
        >>> validate_rut("12.345.678-5")
        True
    """
    rut_clean = re.sub(r'[^0-9kK]', '', rut.upper())
    
    if len(rut_clean) < 2:
        return False
    
    body = rut_clean[:-1]
    dv = rut_clean[-1]
    
    # Algoritmo módulo 11
    total = 0
    multiplier = 2
    
    for digit in reversed(body):
        total += int(digit) * multiplier
        multiplier = multiplier + 1 if multiplier < 7 else 2
    
    remainder = 11 - (total % 11)
    
    if remainder == 11:
        expected_dv = "0"
    elif remainder == 10:
        expected_dv = "K"
    else:
        expected_dv = str(remainder)
    
    return dv == expected_dv


def parse_chilean_date(date_str: str) -> datetime | None:
    """
    Parsea fechas en formato chileno común.
    
    Soporta formatos:
    - DD/MM/YYYY
    - DD-MM-YYYY
    - DD/MM/YYYY HH:MM
    - DD-MM-YYYY HH:MM:SS
    
    Args:
        date_str: Fecha en string
    
    Returns:
        datetime | None: Objeto datetime o None si no se puede parsear
    
    Ejemplo:
        >>> parse_chilean_date("25/12/2024")
        datetime(2024, 12, 25, 0, 0)
    """
    date_str = sanitize_text(date_str)
    
    if not date_str:
        return None
    
    formats = [
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%d/%m/%Y %H:%M",
        "%d-%m-%Y %H:%M",
        "%d/%m/%Y %H:%M:%S",
        "%d-%m-%Y %H:%M:%S",
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    return None


def generate_output_filename(
    prefix: str,
    extension: str = "json",
    include_timestamp: bool = True
) -> str:
    """
    Genera un nombre de archivo único para output.
    
    Args:
        prefix: Prefijo del archivo (ej: "causas_civil")
        extension: Extensión del archivo (sin punto)
        include_timestamp: Si incluir timestamp en el nombre
    
    Returns:
        str: Nombre del archivo generado
    
    Ejemplo:
        >>> generate_output_filename("causas_civil")
        'causas_civil_20240125_143052.json'
    """
    if include_timestamp:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{prefix}_{timestamp}.{extension}"
    return f"{prefix}.{extension}"


def export_to_json(
    data: Any,
    output_path: Path | str,
    indent: int = 2,
    ensure_ascii: bool = False
) -> Path:
    """
    Exporta datos a un archivo JSON.
    
    Args:
        data: Datos a exportar (debe ser serializable a JSON)
        output_path: Ruta del archivo de salida
        indent: Indentación del JSON
        ensure_ascii: Si escapar caracteres no-ASCII
    
    Returns:
        Path: Ruta del archivo creado
    
    Ejemplo:
        >>> data = [{"causa": "C-1234-2024", "tribunal": "1° Juzgado"}]
        >>> export_to_json(data, "output/causas.json")
        PosixPath('output/causas.json')
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=indent, ensure_ascii=ensure_ascii, default=str)
    
    return output_path


def export_to_csv(
    data: Sequence[dict[str, Any]],
    output_path: Path | str,
    fieldnames: list[str] | None = None
) -> Path:
    """
    Exporta una lista de diccionarios a CSV.
    
    Args:
        data: Lista de diccionarios a exportar
        output_path: Ruta del archivo de salida
        fieldnames: Nombres de columnas (si None, usa keys del primer registro)
    
    Returns:
        Path: Ruta del archivo creado
    
    Ejemplo:
        >>> data = [{"causa": "C-1234", "estado": "Activa"}]
        >>> export_to_csv(data, "output/causas.csv")
        PosixPath('output/causas.csv')
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    if not data:
        # Crear archivo vacío con header si se proporcionan fieldnames
        with open(output_path, 'w', encoding='utf-8', newline='') as f:
            if fieldnames:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
        return output_path
    
    # Usar keys del primer registro si no se especifican fieldnames
    if fieldnames is None:
        fieldnames = list(data[0].keys())
    
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(data)
    
    return output_path


def extract_causa_info(causa_text: str) -> dict[str, str]:
    """
    Extrae información estructurada de un texto de causa.
    
    Args:
        causa_text: Texto que contiene información de la causa
    
    Returns:
        dict: Diccionario con rol, año, tipo extraídos
    
    Ejemplo:
        >>> extract_causa_info("C-1234-2024")
        {'rol': 'C-1234-2024', 'tipo': 'C', 'numero': '1234', 'anio': '2024'}
    """
    result: dict[str, str] = {
        "rol": "",
        "tipo": "",
        "numero": "",
        "anio": "",
    }
    
    # Patrón común: TIPO-NUMERO-AÑO (ej: C-1234-2024)
    pattern = r'([A-Z]+)-(\d+)-(\d{4})'
    match = re.search(pattern, causa_text.upper())
    
    if match:
        result["tipo"] = match.group(1)
        result["numero"] = match.group(2)
        result["anio"] = match.group(3)
        result["rol"] = f"{match.group(1)}-{match.group(2)}-{match.group(3)}"
    
    return result


if __name__ == "__main__":
    # Tests básicos
    print("=== Tests de Helpers ===")
    
    # sanitize_text
    assert sanitize_text("  Hola   Mundo  \n\n  ") == "Hola Mundo"
    print("✓ sanitize_text")
    
    # format_rut
    assert format_rut("123456789") == "12.345.678-9"
    assert format_rut("12.345.678-9") == "12.345.678-9"
    print("✓ format_rut")
    
    # parse_chilean_date
    date = parse_chilean_date("25/12/2024")
    assert date is not None
    assert date.day == 25
    assert date.month == 12
    assert date.year == 2024
    print("✓ parse_chilean_date")
    
    # extract_causa_info
    info = extract_causa_info("C-1234-2024")
    assert info["tipo"] == "C"
    assert info["numero"] == "1234"
    assert info["anio"] == "2024"
    print("✓ extract_causa_info")
    
    print("\n✅ Todos los tests pasaron!")
