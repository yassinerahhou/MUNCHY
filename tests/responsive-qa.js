async (page) => {
  const results = [], failures = [];
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 });
    for (const route of ['/menu', '/story', '/catering', '/checkout', '/reserve', '/gift', '/review', '/build', '/admin']) {
      const response = await page.goto(`http://localhost:3000${route}`);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, broken: [...document.images].filter(image => image.complete && !image.naturalWidth).map(image => image.getAttribute('src')) }));
      const pass = response.status() === 200 && dimensions.scroll <= dimensions.width + 1 && dimensions.broken.length === 0;
      results.push({ route, viewport: width, status: response.status(), ...dimensions, pass });
      if (!pass) failures.push({ route, width, ...dimensions });
      if ((width === 375 && ['/reserve', '/gift', '/catering'].includes(route)) || (width === 1440 && route === '/menu')) await page.screenshot({ path: `output/playwright/${route.slice(1)}-${width}.png` });
    }
  }
  await page.goto('http://localhost:3000/');
  if (failures.length) throw new Error(JSON.stringify({ failures, results }));
  return { checks: results.length, failures, results };
}
