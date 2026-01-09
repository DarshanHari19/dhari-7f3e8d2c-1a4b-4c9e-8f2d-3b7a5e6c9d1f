import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from './services/auth.service';
import { TaskService, Task, CreateTaskDto } from './services/task.service';
import { ThemeService } from './services/theme.service';
import { KeyboardShortcutService } from './services/keyboard-shortcut.service';
import { TaskChartComponent } from './task-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TaskChartComponent],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Secure Tasks Dashboard</h1>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Welcome, <strong>{{ currentUser?.username }}</strong> 
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 ml-2">
                  {{ currentUser?.role }}
                </span>
              </p>
            </div>
            <div class="flex gap-2">
              <button
                (click)="showKeyboardShortcuts = !showKeyboardShortcuts"
                class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                title="Keyboard shortcuts (press ?)"
              >
                ⌨️
              </button>
              <button
                (click)="themeService.toggleTheme()"
                class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                title="Toggle dark mode (press t)"
              >
                {{ themeService.isDarkMode() ? '☀️' : '🌙' }}
              </button>
              <button
                (click)="logout()"
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Controls -->
        @if (canCreateTasks()) {
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div class="flex flex-wrap gap-4 items-end">
              <div class="flex-1 min-w-[200px]">
                <label for="newTaskTitle" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add New Task</label>
                <input
                  id="newTaskTitle"
                  type="text"
                  [(ngModel)]="newTaskTitle"
                  (keyup.enter)="addTask()"
                  placeholder="Task title"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div class="flex-1 min-w-[200px]">
                <input
                  type="text"
                  [(ngModel)]="newTaskDescription"
                  placeholder="Description"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div class="min-w-[150px]">
                <select
                  [(ngModel)]="newTaskCategory"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Bug">Bug</option>
                  <option value="Feature">Feature</option>
                </select>
              </div>
              <button
                (click)="addTask()"
                class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                Add Task
              </button>
            </div>

            <!-- Filters -->
            <div class="flex gap-4 mt-4">
              <input
                type="text"
                [(ngModel)]="searchTerm"
                (input)="filterTasks()"
                placeholder="Search tasks..."
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <select
                [(ngModel)]="filterCategory"
                (change)="filterTasks()"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Documentation">Documentation</option>
                <option value="Bug">Bug</option>
                <option value="Feature">Feature</option>
              </select>
            </div>
          </div>
        } @else {
          <div class="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
            <p class="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>View-Only Mode:</strong> You have read-only access. Contact an Admin or Owner to create or modify tasks.
            </p>
          </div>
        }

        <!-- Task Columns -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- TODO Column -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
              <span class="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
              To Do ({{ todoTasks.length }})
            </h3>
            <div 
              cdkDropList
              id="todo"
              #todoList="cdkDropList"
              [cdkDropListData]="todoTasks"
              [cdkDropListConnectedTo]="[inProgressList, doneList]"
              (cdkDropListDropped)="onDrop($event)"
              class="space-y-3 min-h-[400px]">
              @for (task of todoTasks; track task.id) {
                <div 
                  cdkDrag
                  [cdkDragData]="task"
                  [cdkDragDisabled]="!canEditTasks()"
                  class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition"
                  [class.cursor-move]="canEditTasks()"
                  [class.cursor-not-allowed]="!canEditTasks()">
                  <div class="flex justify-between items-start mb-2">
                    <h4 class="font-medium text-gray-900 dark:text-gray-100">{{ task.title }}</h4>
                    <div class="flex gap-2">
                      @if (canEditTasks()) {
                        <select
                          [value]="task.status"
                          (change)="changeTaskStatus(task, $event)"
                          class="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 rounded focus:ring-2 focus:ring-indigo-500"
                          title="Change status"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                        <select
                          [value]="task.priority"
                          (change)="changeTaskPriority(task, $event)"
                          class="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 rounded focus:ring-2 focus:ring-indigo-500"
                          title="Change priority"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      }
                      @if (canDeleteTasks()) {
                        <button
                          (click)="deleteTask(task.id)"
                          class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xl leading-none"
                        >
                          ×
                        </button>
                      }
                    </div>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ task.description }}</p>
                  <div class="flex gap-2 flex-wrap">
                    <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {{ task.category }}
                    </span>
                    <span
                      class="text-xs px-2 py-1 rounded"
                      [class]="getPriorityClass(task.priority)"
                    >
                      {{ task.priority }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- IN PROGRESS Column -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
              <span class="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              In Progress ({{ inProgressTasks.length }})
            </h3>
            <div 
              cdkDropList
              id="in_progress"
              #inProgressList="cdkDropList"
              [cdkDropListData]="inProgressTasks"
              [cdkDropListConnectedTo]="[todoList, doneList]"
              (cdkDropListDropped)="onDrop($event)"
              class="space-y-3 min-h-[400px]">
              @for (task of inProgressTasks; track task.id) {
                <div 
                  cdkDrag
                  [cdkDragData]="task"
                  [cdkDragDisabled]="!canEditTasks()"
                  class="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg border border-blue-200 dark:border-blue-700 hover:shadow-md transition"
                  [class.cursor-move]="canEditTasks()"
                  [class.cursor-not-allowed]="!canEditTasks()">
                  <div class="flex justify-between items-start mb-2">
                    <h4 class="font-medium text-gray-900 dark:text-gray-100">{{ task.title }}</h4>
                    <div class="flex gap-2">
                      @if (canEditTasks()) {
                        <select
                          [value]="task.status"
                          (change)="changeTaskStatus(task, $event)"
                          class="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 rounded focus:ring-2 focus:ring-indigo-500"
                          title="Change status"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                        <select
                          [value]="task.priority"
                          (change)="changeTaskPriority(task, $event)"
                          class="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 rounded focus:ring-2 focus:ring-indigo-500"
                          title="Change priority"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      }
                      @if (canDeleteTasks()) {
                        <button
                          (click)="deleteTask(task.id)"
                          class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xl leading-none"
                        >
                          ×
                        </button>
                      }
                    </div>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ task.description }}</p>
                  <div class="flex gap-2 flex-wrap">
                    <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {{ task.category }}
                    </span>
                    <span
                      class="text-xs px-2 py-1 rounded"
                      [class]="getPriorityClass(task.priority)"
                    >
                      {{ task.priority }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- DONE Column -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center">
              <span class="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              Done ({{ doneTasks.length }})
            </h3>
            <div 
              cdkDropList
              id="done"
              #doneList="cdkDropList"
              [cdkDropListData]="doneTasks"
              [cdkDropListConnectedTo]="[todoList, inProgressList]"
              (cdkDropListDropped)="onDrop($event)"
              class="space-y-3 min-h-[400px]">
              @for (task of doneTasks; track task.id) {
                <div 
                  cdkDrag
                  [cdkDragData]="task"
                  [cdkDragDisabled]="!canEditTasks()"
                  class="bg-green-50 dark:bg-green-900 p-4 rounded-lg border border-green-200 dark:border-green-700 hover:shadow-md transition"
                  [class.cursor-move]="canEditTasks()"
                  [class.cursor-not-allowed]="!canEditTasks()">
                  <div class="flex justify-between items-start mb-2">
                    <h4 class="font-medium text-gray-900 dark:text-gray-100">{{ task.title }}</h4>
                    <div class="flex gap-2">
                      @if (canEditTasks()) {
                        <select
                          [value]="task.status"
                          (change)="changeTaskStatus(task, $event)"
                          class="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 rounded focus:ring-2 focus:ring-indigo-500"
                          title="Change status"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                        <select
                          [value]="task.priority"
                          (change)="changeTaskPriority(task, $event)"
                          class="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100 rounded focus:ring-2 focus:ring-indigo-500"
                          title="Change priority"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      }
                      @if (canDeleteTasks()) {
                        <button
                          (click)="deleteTask(task.id)"
                          class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xl leading-none"
                        >
                          ×
                        </button>
                      }
                    </div>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ task.description }}</p>
                  <div class="flex gap-2 flex-wrap">
                    <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {{ task.category }}
                    </span>
                    <span
                      class="text-xs px-2 py-1 rounded"
                      [class]="getPriorityClass(task.priority)"
                    >
                      {{ task.priority }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div class="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
            <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ tasks.length }}</div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div class="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ doneTasks.length }}
            </div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div class="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ inProgressTasks.length }}
            </div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div class="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
            <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {{ getCompletionRate() }}%
            </div>
          </div>
        </div>

        <!-- Visualization Chart -->
        <div class="mt-6">
          <app-task-chart [tasks]="tasks"></app-task-chart>
        </div>
      </main>

      <!-- Keyboard Shortcuts Modal -->
      @if (showKeyboardShortcuts) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" (click)="showKeyboardShortcuts = false">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full p-6" (click)="$event.stopPropagation()">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100">⌨️ Keyboard Shortcuts</h3>
              <button
                (click)="showKeyboardShortcuts = false"
                class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-3">
                <h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Navigation</h4>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Show this help</span>
                  <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">?</kbd>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Focus search</span>
                  <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">/</kbd>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Refresh tasks</span>
                  <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">r</kbd>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Toggle theme</span>
                  <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">t</kbd>
                </div>
              </div>
              <div class="space-y-3">
                <h4 class="font-semibold text-gray-700 dark:text-gray-300 mb-2">Actions</h4>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">New task</span>
                  <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">n</kbd>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Clear filters</span>
                  <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">c</kbd>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Escape/Close</span>
                  <kbd class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">Esc</kbd>
                </div>
              </div>
            </div>
            <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded text-sm text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> Shortcuts work anywhere except when typing in text fields.
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    
    .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class Dashboard implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private taskService = inject(TaskService);
  protected themeService = inject(ThemeService);
  private keyboardService = inject(KeyboardShortcutService);

  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  currentUser = this.authService.currentUser;
  showKeyboardShortcuts = false;

  // Stable arrays for drag-drop
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];

  newTaskTitle = '';
  newTaskDescription = '';
  newTaskCategory = 'Development';

  searchTerm = '';
  filterCategory = '';

  ngOnInit() {
    this.loadTasks();
    this.setupKeyboardShortcuts();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
      return;
    }

    switch(event.key) {
      case '?':
        event.preventDefault();
        this.showKeyboardShortcuts = !this.showKeyboardShortcuts;
        break;
      case '/':
        event.preventDefault();
        this.focusSearch();
        break;
      case 'n':
        event.preventDefault();
        this.focusNewTask();
        break;
      case 'r':
        event.preventDefault();
        this.loadTasks();
        break;
      case 't':
        event.preventDefault();
        this.themeService.toggleTheme();
        break;
      case 'c':
        event.preventDefault();
        this.clearFilters();
        break;
      case 'Escape':
        this.showKeyboardShortcuts = false;
        break;
    }
  }

  private setupKeyboardShortcuts() {
    // Keyboard shortcuts are now handled by @HostListener
  }

  private focusSearch() {
    const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
    searchInput?.focus();
  }

  private focusNewTask() {
    if (!this.canCreateTasks()) return;
    const newTaskInput = document.querySelector('#newTaskTitle') as HTMLInputElement;
    newTaskInput?.focus();
  }

  private clearFilters() {
    this.searchTerm = '';
    this.filterCategory = '';
    this.filterTasks();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        // Guard against duplicates from backend
        const map = new Map<string, Task>();
        for (const t of tasks) map.set(t.id, t);
        this.tasks = Array.from(map.values());
        this.filterTasks();
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
      }
    });
  }

  addTask() {
    if (!this.newTaskTitle.trim()) return;

    const newTask: CreateTaskDto = {
      title: this.newTaskTitle,
      description: this.newTaskDescription || '',
      category: this.newTaskCategory,
      status: 'todo',
      priority: 'medium',
    };

    this.taskService.createTask(newTask).subscribe({
      next: () => {
        this.newTaskTitle = '';
        this.newTaskDescription = '';
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error creating task:', error);
        alert('Failed to create task: ' + (error.error?.message || 'Unknown error'));
      }
    });
  }

  deleteTask(id: string) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    this.taskService.deleteTask(id).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error deleting task:', error);
        alert('Failed to delete task: ' + (error.error?.message || 'Unknown error'));
      }
    });
  }

  onDrop(event: CdkDragDrop<Task[]>) {
    if (!this.canEditTasks()) {
      alert('You do not have permission to modify tasks');
      return;
    }

    const task = event.item.data as Task;
    
    if (!task || !task.id) {
      console.error('Invalid task data in drag event:', task);
      return;
    }

    // Reorder within same column (pure UI)
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    // Determine new status from explicit drop list id
    const targetStatus = event.container.id as 'todo' | 'in_progress' | 'done';
    
    console.log(`[DRAG] Moving "${task.title}" (${task.id}) from ${task.status} to ${targetStatus}`);

    // Let CDK handle the visual move first
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    // Update the task object's status
    const movedTask = event.container.data[event.currentIndex];
    movedTask.status = targetStatus;

    // Update in canonical tasks array
    this.tasks = this.tasks.map(t =>
      t.id === task.id ? { ...t, status: targetStatus } : t
    );

    // Persist to backend
    this.taskService.updateTask(task.id, { status: targetStatus }).subscribe({
      next: (updatedTask) => {
        console.log(`[DRAG] Backend confirmed: "${task.title}" is now ${targetStatus}`, updatedTask);
      },
      error: (error) => {
        console.error('[DRAG] Backend error:', error);
        alert('Failed to update task: ' + (error.error?.message || 'Unknown error'));
        this.loadTasks(); // revert to server truth
      }
    });
  }

  changeTaskStatus(task: Task, event: Event) {
    const newStatus = (event.target as HTMLSelectElement).value as 'todo' | 'in_progress' | 'done';
    
    if (task.status === newStatus) {
      return; // No change
    }

    console.log(`Changing task "${task.title}" from ${task.status} to ${newStatus}`);

    this.taskService.updateTask(task.id, { status: newStatus }).subscribe({
      next: (updatedTask) => {
        console.log('Task updated successfully:', updatedTask);
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error updating task:', error);
        alert('Failed to update task: ' + (error.error?.message || 'Unknown error'));
        this.loadTasks(); // Reload to reset dropdown
      }
    });
  }

  changeTaskPriority(task: Task, event: Event) {
    const newPriority = (event.target as HTMLSelectElement).value as 'low' | 'medium' | 'high';
    
    if (task.priority === newPriority) {
      return; // No change
    }

    console.log(`Changing task "${task.title}" priority from ${task.priority} to ${newPriority}`);

    this.taskService.updateTask(task.id, { priority: newPriority }).subscribe({
      next: (updatedTask) => {
        console.log('Task priority updated successfully:', updatedTask);
        this.loadTasks();
      },
      error: (error) => {
        console.error('Error updating task priority:', error);
        alert('Failed to update task priority: ' + (error.error?.message || 'Unknown error'));
        this.loadTasks(); // Reload to reset dropdown
      }
    });
  }

  filterTasks() {
    this.filteredTasks = this.tasks.filter(task => {
      const matchesSearch = !this.searchTerm ||
        task.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = !this.filterCategory || task.category === this.filterCategory;

      return matchesSearch && matchesCategory;
    });

    // Update stable arrays for drag-drop
    this.todoTasks = this.filteredTasks.filter(task => task.status === 'todo');
    this.inProgressTasks = this.filteredTasks.filter(task => task.status === 'in_progress');
    this.doneTasks = this.filteredTasks.filter(task => task.status === 'done');
  }

  getPriorityClass(priority: string): string {
    const classes = {
      low: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      medium: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      high: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
    };
    return classes[priority as keyof typeof classes] || '';
  }

  getCompletionRate(): number {
    if (this.tasks.length === 0) return 0;
    const completed = this.doneTasks.length;
    return Math.round((completed / this.tasks.length) * 100);
  }

  logout() {
    this.authService.logout();
  }

  // Role-based access control methods
  canCreateTasks(): boolean {
    const role = this.currentUser?.role;
    return role === 'owner' || role === 'admin';
  }

  canEditTasks(): boolean {
    const role = this.currentUser?.role;
    return role === 'owner' || role === 'admin';
  }

  canDeleteTasks(): boolean {
    const role = this.currentUser?.role;
    return role === 'owner' || role === 'admin';
  }

  isViewer(): boolean {
    return this.currentUser?.role === 'viewer';
  }
}
