import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue(), UnoCSS()],
	base: './',
	build: {
		outDir: 'dist/38G-vehicle-equipment-status',
		rollupOptions: {
			output: {
				entryFileNames: '[name].js',
				chunkFileNames: '[name].js',
				assetFileNames: '[name].[ext]',
			},
		}, 
		// minify: 'terser',
		// terserOptions: {
		// 	compress: {
		// 		drop_: true,
		// 		drop_debugger: true,
		// 	},
		// },

	},
})
