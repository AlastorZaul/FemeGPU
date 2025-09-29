import {expect, test} from '@playwright/test';

test.describe('GPU Farm Dashboard - User Journey', () => {

  test.beforeEach(async ({page}) => {
    // Navigue vers la page de l'application avant chaque test
    await page.goto('/');
  });

  test('should display the login page initially', async ({page}) => {
    // Vérifie que la page de connexion est bien la première page vue
    await expect(page.locator('app-login')).toBeVisible();
    await expect(page.locator('h1')).toHaveText('GPU Farm Login');
  });

  test('should allow a user to log in and see the dashboard', async ({page}) => {
    // --- Étape 1: Connexion ---
    await page.locator('input[formControlName="email"]').fill('test@example.com');
    await page.locator('input[formControlName="password"]').fill('password');
    await page.locator('button[type="submit"]').click();

    // --- Étape 2: Vérification du Dashboard ---
    // Attend que la redirection soit faite et que le dashboard s'affiche
    await expect(page.locator('app-dashboard')).toBeVisible();
    await expect(page.locator('mat-expansion-panel-header').first()).toBeVisible();

    // Vérifie qu'au moins une carte GPU est présente
    const gpuCard = page.locator('app-gpu-card').first();
    await expect(gpuCard).toBeVisible();
  });

  test('should open and close the history dialog', async ({page}) => {
    // --- On se connecte d'abord ---
    await page.locator('input[formControlName="email"]').fill('test@example.com');
    await page.locator('input[formControlName="password"]').fill('password');
    await page.locator('button[type="submit"]').click();

    // Attend que le dashboard soit visible
    await expect(page.locator('app-dashboard')).toBeVisible();

    // --- Étape 3: Interagir avec une carte ---
    const firstGpuCard = page.locator('app-gpu-card').first();

    // Trouve et clique sur le bouton "Voir l'historique"
    await firstGpuCard.locator('button:has-text("Voir l\'historique")').click();

    // Vérifie que la modale (dialog) est apparue
    const dialog = page.locator('app-gpu-history-chart');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('h2')).toContainText('Détails de');

    // Ferme la modale
    await dialog.locator('button[aria-label="Fermer la boîte de dialogue"]').click();

    // Vérifie que la modale a bien disparu
    await expect(dialog).not.toBeVisible();
  });
});
