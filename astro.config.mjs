// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.lumintheme.com',
	integrations: [
		starlight({
			title: 'LuminOS Docs',
			description: 'Tutorials and reference for the LuminOS Shopify theme by Lumintheme',
			favicon: '/favicon.svg',
			logo: {
				light: './src/assets/logo-light.svg',
				dark: './src/assets/logo-dark.svg',
				alt: 'LuminTheme',
				replacesTitle: true,
			},
			social: [
				{ icon: 'external', label: 'Website', href: 'https://lumintheme.com' },
				{ icon: 'discord', label: 'Community', href: 'https://community.lumintheme.com' },
			],
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: 'Getting started',
					items: [
						{ label: 'Introduction', slug: 'introduction' },
						{ label: 'Install', slug: 'getting-started/install' },
						{ label: 'Theme editor', slug: 'getting-started/theme-editor' },
						{ label: 'Theme settings', slug: 'getting-started/theme-settings' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Mix and match bundles', slug: 'guides/mix-and-match-bundles' },
						{ label: 'Lumin Discount App', slug: 'guides/lumin-discount-app' },
						{ label: 'Meta Reviews', slug: 'guides/meta-reviews' },
						{ label: 'Lumin Kit reviews', slug: 'guides/lumin-kit-reviews' },
						{ label: 'Quantity breaks', slug: 'guides/quantity-breaks' },
						{ label: 'Frequently bought together', slug: 'guides/frequently-bought-together' },
						{ label: 'Mega menu', slug: 'guides/mega-menu' },
						{ label: 'Cart drawer', slug: 'guides/cart-drawer' },
						{ label: 'Sibling products', slug: 'guides/sibling-products' },
					],
				},
				{
					label: 'Sections',
					items: [{ autogenerate: { directory: 'sections' } }],
				},
				{
					label: 'Troubleshooting',
					items: [{ label: 'Common issues', slug: 'troubleshooting/common-issues' }],
				},
				{
					label: 'Changelog',
					items: [{ label: 'Changelog', slug: 'changelog' }],
				},
			],
		}),
	],
});
