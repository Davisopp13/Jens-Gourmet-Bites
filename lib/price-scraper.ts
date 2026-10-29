import * as cheerio from "cheerio";

export interface ScrapedPrice {
  price_cents: number;
  supplier_name: string;
  product_name: string;
  package_info?: string;
}

/**
 * Generic price scraper for Walmart
 * Note: Web scraping can be unreliable and may break if sites change their HTML structure
 * This is a basic implementation - you may need to adjust selectors
 */
export async function scrapeWalmartPrice(
  productUrl: string
): Promise<ScrapedPrice | null> {
  try {
    const response = await fetch(productUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch Walmart page:", response.status);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try to find price - Walmart uses various selectors
    let priceText = "";

    // Common Walmart price selectors
    const priceSelectors = [
      '[itemprop="price"]',
      ".price-characteristic",
      '[data-testid="price-wrap"]',
      ".price",
    ];

    for (const selector of priceSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        priceText = element.text().trim();
        if (priceText) break;
      }
    }

    if (!priceText) {
      console.error("Could not find price on Walmart page");
      return null;
    }

    // Extract numeric price
    const priceMatch = priceText.match(/[\d,]+\.?\d*/);
    if (!priceMatch) {
      console.error("Could not parse price:", priceText);
      return null;
    }

    const price = parseFloat(priceMatch[0].replace(/,/g, ""));
    const price_cents = Math.round(price * 100);

    // Try to get product name
    const productName =
      $('h1[itemprop="name"]').text().trim() ||
      $('[data-testid="product-title"]').text().trim() ||
      $("h1").first().text().trim() ||
      "Unknown Product";

    return {
      price_cents,
      supplier_name: "Walmart",
      product_name: productName,
    };
  } catch (error) {
    console.error("Error scraping Walmart price:", error);
    return null;
  }
}

/**
 * Generic price scraper for Target
 */
export async function scrapeTargetPrice(
  productUrl: string
): Promise<ScrapedPrice | null> {
  try {
    const response = await fetch(productUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch Target page:", response.status);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Target price selectors
    let priceText = "";
    const priceSelectors = [
      '[data-test="product-price"]',
      '[data-test="current-price"]',
      ".Price",
    ];

    for (const selector of priceSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        priceText = element.text().trim();
        if (priceText) break;
      }
    }

    if (!priceText) {
      console.error("Could not find price on Target page");
      return null;
    }

    // Extract numeric price
    const priceMatch = priceText.match(/[\d,]+\.?\d*/);
    if (!priceMatch) {
      console.error("Could not parse price:", priceText);
      return null;
    }

    const price = parseFloat(priceMatch[0].replace(/,/g, ""));
    const price_cents = Math.round(price * 100);

    // Try to get product name
    const productName =
      $('[data-test="product-title"]').text().trim() ||
      $("h1").first().text().trim() ||
      "Unknown Product";

    return {
      price_cents,
      supplier_name: "Target",
      product_name: productName,
    };
  } catch (error) {
    console.error("Error scraping Target price:", error);
    return null;
  }
}

/**
 * Generic price scraper for Amazon
 * Note: Amazon actively blocks scrapers - this may not work reliably
 */
export async function scrapeAmazonPrice(
  productUrl: string
): Promise<ScrapedPrice | null> {
  try {
    const response = await fetch(productUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch Amazon page:", response.status);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Amazon price selectors
    let priceText = "";
    const priceSelectors = [
      ".a-price .a-offscreen",
      "#priceblock_ourprice",
      "#priceblock_dealprice",
      ".a-price-whole",
    ];

    for (const selector of priceSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        priceText = element.text().trim();
        if (priceText) break;
      }
    }

    if (!priceText) {
      console.error("Could not find price on Amazon page");
      return null;
    }

    // Extract numeric price
    const priceMatch = priceText.match(/[\d,]+\.?\d*/);
    if (!priceMatch) {
      console.error("Could not parse price:", priceText);
      return null;
    }

    const price = parseFloat(priceMatch[0].replace(/,/g, ""));
    const price_cents = Math.round(price * 100);

    // Try to get product name
    const productName =
      $("#productTitle").text().trim() ||
      $("h1").first().text().trim() ||
      "Unknown Product";

    return {
      price_cents,
      supplier_name: "Amazon",
      product_name: productName,
    };
  } catch (error) {
    console.error("Error scraping Amazon price:", error);
    return null;
  }
}

/**
 * Main scraper function that determines which scraper to use based on URL
 */
export async function scrapePrice(url: string): Promise<ScrapedPrice | null> {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes("walmart.com")) {
    return scrapeWalmartPrice(url);
  } else if (lowerUrl.includes("target.com")) {
    return scrapeTargetPrice(url);
  } else if (lowerUrl.includes("amazon.com")) {
    return scrapeAmazonPrice(url);
  } else {
    console.error("Unsupported supplier URL:", url);
    return null;
  }
}
