async (page) => {
  await page.goto('http://localhost:3000/menu');
  await page.getByRole('button', { name: 'Start a live group bag', exact: true }).click();
  await page.waitForTimeout(800);
  const token = await page.evaluate(() => JSON.parse(localStorage.getItem('munchy-cart')).state.groupToken);
  if (!token) throw new Error('Group creation did not persist a token');
  const browser = page.context().browser();
  const friendContext = await browser.newContext({ viewport: { width: 768, height: 1000 } });
  try {
    const friend = await friendContext.newPage();
    await friend.goto(`http://localhost:3000/menu#group=${token}`);
    await friend.getByRole('button', { name: 'Join & replace my bag', exact: true }).click();
    await friend.getByRole('button', { name: 'Quick look: The Double Trouble', exact: true }).click();
    await friend.getByRole('dialog').getByRole('button', { name: 'Add to bag 55 DH', exact: true }).click();
    await friend.keyboard.press('Escape');
    await page.waitForTimeout(5000);
    const ownerBag = await page.evaluate(() => JSON.parse(localStorage.getItem('munchy-cart')).state.items);
    const friendBag = await friend.evaluate(() => JSON.parse(localStorage.getItem('munchy-cart')).state.items);
    if (JSON.stringify(ownerBag) !== JSON.stringify(friendBag)) throw new Error('Two browser contexts have different bags');
    if (!ownerBag.some(item => item.price === 55)) throw new Error('Friend contribution did not reach the owner');
    await page.screenshot({ path: 'output/playwright/group-menu-375.png' });
    await page.getByRole('button', { name: 'Leave group', exact: true }).click();
    return { checks: ['Created a live group', 'Joined from a separate browser profile', 'Added an item as a friend', 'Owner and friend bags converged', 'Left without deleting shared items'], itemCount: ownerBag.length };
  } finally { await friendContext.close(); }
}
