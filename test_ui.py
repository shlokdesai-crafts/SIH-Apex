from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:5173/")
        time.sleep(2)
        
        # Click Maize
        page.click("text=Maize")
        time.sleep(1)
        
        # Click Analyse
        page.click("text=Analyse with AI")
        
        # Wait for result
        time.sleep(5)
        
        # Print all text on page to see if there is an error
        print(page.inner_text("body"))
        
        browser.close()

if __name__ == "__main__":
    run()
