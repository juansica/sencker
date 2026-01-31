
import sys
from pathlib import Path
import json

# Add root dir to path
ROOT_DIR = Path(__file__).parent
sys.path.insert(0, str(ROOT_DIR))

from src.scrapers.civil_scraper import CivilScraper
from src.utils.logger import setup_logger

def reproduce_issue():
    logger = setup_logger("repro_script")
    logger.info("Starting reproduction for ROL C-2365-2025")

    with CivilScraper() as scraper:
        # Run scraping for the specific ROL
        result = scraper.run("C-2365-2025")
        
        # Save output to examine
        with open("repro_output.json", "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
            
        logger.info(f"Scraping finished. Result saved to repro_output.json")
        
        if result["status"] == "success":
            data = result["data"]
            if data:
                case = data[0]
                print(f"ROL: {case.get('rol')}")
                print(f"Cuadernos found: {len(case.get('cuadernos', []))}")
                for c in case.get('cuadernos', []):
                    print(f" - Cuaderno: {c.get('nombre')} (ID: {c.get('id')})")
                    print(f"   - History items: {len(c.get('historia', []))}")
                    print(f"   - Litigantes: {len(c.get('litigantes', []))}")
            else:
                print("No data found in results.")
        else:
            print(f"Error: {result.get('error')}")

if __name__ == "__main__":
    reproduce_issue()
