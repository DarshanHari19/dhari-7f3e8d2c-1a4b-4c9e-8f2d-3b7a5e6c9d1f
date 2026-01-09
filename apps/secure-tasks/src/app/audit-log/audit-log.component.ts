import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string | null;
  timestamp: string;
  user?: {
    username: string;
    email: string;
    role: string;
  };
}

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Logs</h1>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                View all system activity and access logs
              </p>
            </div>
            <div class="flex gap-2">
              <button
                (click)="goBack()"
                class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                ← Back to Dashboard
              </button>
              <button
                (click)="themeService.toggleTheme()"
                class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                {{ themeService.isDarkMode() ? '☀️' : '🌙' }}
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if (loading) {
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
            <p class="mt-4 text-gray-600 dark:text-gray-400">Loading audit logs...</p>
          </div>
        } @else if (error) {
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p class="text-red-800 dark:text-red-200">{{ error }}</p>
          </div>
        } @else {
          <!-- Stats -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Logs</h3>
              <p class="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{{ logs.length }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Users</h3>
              <p class="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{{ uniqueUsers }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">Resources Accessed</h3>
              <p class="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">{{ uniqueResources }}</p>
            </div>
          </div>

          <!-- Logs Table -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Resource
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Resource ID
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  @for (log of logs; track log.id) {
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {{ formatTimestamp(log.timestamp) }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex flex-col">
                          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {{ log.user?.username || 'Unknown' }}
                          </span>
                          <span class="text-xs text-gray-500 dark:text-gray-400">
                            {{ log.user?.role || 'N/A' }}
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span [class]="getActionBadgeClass(log.action)">
                          {{ log.action }}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {{ log.resource }}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono text-xs">
                        {{ log.resourceId || '-' }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No audit logs found
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </main>
    </div>
  `
})
export class AuditLogComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);
  public themeService = inject(ThemeService);

  logs: AuditLog[] = [];
  loading = true;
  error: string | null = null;

  get uniqueUsers(): number {
    return new Set(this.logs.map(log => log.userId)).size;
  }

  get uniqueResources(): number {
    return new Set(this.logs.map(log => log.resource)).size;
  }

  ngOnInit() {
    // Check if user has permission
    const currentUser = this.authService.currentUser;
    const role = currentUser?.role?.toUpperCase();
    if (!currentUser || (role !== 'OWNER' && role !== 'ADMIN')) {
      console.log('Access denied. User role:', currentUser?.role);
      this.router.navigate(['/dashboard']);
      return;
    }

    console.log('Loading audit logs for user:', currentUser.username);
    this.loadLogs();
  }

  loadLogs() {
    this.loading = true;
    this.error = null;

    const token = this.authService.token;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<AuditLog[]>('http://localhost:3000/api/audit-log', { headers })
      .subscribe({
        next: (logs) => {
          this.logs = logs.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to load audit logs';
          this.loading = false;
        }
      });
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getActionBadgeClass(action: string): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (action.toUpperCase()) {
      case 'CREATE':
        return `${baseClasses} bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200`;
      case 'UPDATE':
        return `${baseClasses} bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200`;
      case 'DELETE':
        return `${baseClasses} bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200`;
      case 'READ':
      case 'VIEW':
        return `${baseClasses} bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200`;
      default:
        return `${baseClasses} bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200`;
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
