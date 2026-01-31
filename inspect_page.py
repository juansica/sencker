
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

def inspect():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating...")
            page.goto("https://oficinajudicialvirtual.pjud.cl/indexN.php", timeout=60000)
            page.wait_for_load_state("networkidle")
            
            print(f"Title: {page.title()}")
            print(f"URL: {page.url}")
            
            # Check frames
            print(f"Frames: {len(page.frames)}")
            for i, frame in enumerate(page.frames):
                print(f"Frame {i}: {frame.name} - {frame.url}")
                try:
                    if "competencia" in frame.content():
                        print(f"  -> FOUND 'competencia' in Frame {i}!")
                except:
                    pass

            # Dump body
            with open("page_dump.html", "w") as f:
                f.write(page.content())
                
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    inspect()
