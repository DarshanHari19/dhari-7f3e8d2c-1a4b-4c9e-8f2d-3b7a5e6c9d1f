import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 transition-colors duration-200">
      <div class="max-w-md w-full space-y-8">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div class="text-center mb-8">
            <div class="flex justify-center items-center gap-4 mb-4">
              <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Secure Tasks</h2>
              <button
                (click)="themeService.toggleTheme()"
                class="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-lg"
                title="Toggle dark mode"
              >
                {{ themeService.isDarkMode() ? '☀️' : '🌙' }}
              </button>
            </div>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Sign in to your account</p>
          </div>

          @if (errorMessage) {
            <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-4">
              {{ errorMessage }}
            </div>
          }

          <form (ngSubmit)="onLogin()" class="space-y-6">
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                [(ngModel)]="username"
                name="username"
                required
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                [(ngModel)]="password"
                name="password"
                required
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              [disabled]="loading"
              class="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </button>
          </form>

          <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p class="text-sm text-gray-700 dark:text-gray-300 font-semibold mb-2">Demo Accounts:</p>
            <ul class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li><strong>Owner:</strong> owner / owner123</li>
              <li><strong>Admin:</strong> admin / admin123</li>
              <li><strong>Viewer:</strong> viewer / viewer123</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  private authService = inject(AuthService);
  protected themeService = inject(ThemeService);

  username = '';
  password = '';
  loading = false;
  errorMessage = '';

  onLogin(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter username and password';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }
}
