import logging
import sys
import os

# Add src to path
sys.path.append(os.getcwd())

from src.scrapers.civil_scraper import CivilScraper

# Configure logging
logging.basicConfig(level=logging.INFO)

def test_scraper():
    print("Testing CivilScraper...")
    with CivilScraper() as scraper:
        # Test with the specific causa
        result = scraper.run(search_query="C-2449-2022")
        
        print("\n" + "="*50)
        print("SCRAPER RESULT:")
        print("="*50)
        
        if result['status'] == 'success':
            data = result['data']
            if data:
                item = data[0]
                print(f"ROL: {item.get('rol')}")
                print(f"Tribunal: {item.get('tribunal')}")
                print(f"Carátula: {item.get('caratula')}")
                print(f"Est. Adm: {item.get('estado_administrativo')}")
                print(f"Litigantes: {len(item.get('litigantes', []))} found")
                for lit in item.get('litigantes', []):
                    print(f"  - {lit}")
                print(f"Historia: {len(item.get('historia', []))} items")
            else:
                print("No data found in result")
        else:
            print(f"Error: {result.get('error')}")

if __name__ == "__main__":
    test_scraper()
