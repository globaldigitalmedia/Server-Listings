const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/scrape", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto("https://www.compass.com/agents/paige-corbett/", {
      waitUntil: "networkidle2",
      timeout: 0
    });

    await page.waitForSelector('.profile-active-listings', { timeout: 10000 });

    const data = await page.evaluate(() => {
      const listings = [];
      const activeContainer = document.querySelector('.profile-active-listings');
      if (!activeContainer) return [];

      const cards = activeContainer.querySelectorAll('[data-testid="cx-react-listingCard"]');

      cards.forEach(card => {
        const img = card.querySelector('.flickity-slider img');
        const image = img ? img.src || img.getAttribute('data-src') : null;
        const priceEl = card.querySelector('[data-testid="cx-react-listingCard-title"]');
        const price = priceEl ? priceEl.innerText.trim() : null;
        const addressEl = card.querySelector('[data-testid="cx-react-listingCard-subtitlesAnchor"]');
        const address = addressEl ? addressEl.innerText.trim() : null;
        listings.push({ image, price, address });
      });
      return listings;
    });

    await browser.close();
    res.json(data);

  } catch (error) {
    console.error(error);
    res.status(500).send(error.toString());
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});