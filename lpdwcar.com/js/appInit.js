import { initHome } from './home.js';
import { showError } from './uiComponents.js';

async function bootstrapApplication() {
    try {
        if (document.readyState === 'loading') {
            console.log('document readyState is loading');
            document.addEventListener("DOMContentLoaded", async () => await initHome());
        } else {
            console.log('The DOMContentLoaded event has already fired, calling init immediately');
            await initHome();
        }
    } catch (error) {
        console.error('Error loading translations:', error);
        showError('An error occurred while loading the application. Please try again later.');
    }
}

export { bootstrapApplication };
