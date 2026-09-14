from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://127.0.0.1:3000")
    page.wait_for_timeout(3000)

    # Click on Search and enter term
    page.get_by_placeholder("Buscar película, anime...").first.fill("Marvel")
    page.wait_for_timeout(500)
    page.get_by_placeholder("Buscar película, anime...").first.press("Enter")
    page.wait_for_timeout(3000)

    # Take screenshot of search results
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
