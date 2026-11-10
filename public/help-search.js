document.getElementById('help-search-open')?.addEventListener('click', () => {
	const candidates = [
		'button[aria-label="Search"]',
		'button[data-open-modal]',
		'site-search button',
		'header button[aria-label*="Search" i]',
	];
	for (const sel of candidates) {
		const el = document.querySelector(sel);
		if (el instanceof HTMLElement) {
			el.click();
			return;
		}
	}
	window.dispatchEvent(
		new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
	);
});
