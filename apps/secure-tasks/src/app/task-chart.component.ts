import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from './services/task.service';

interface ChartData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

@Component({
  selector: 'app-task-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-6">Task Analytics</h3>
      
      <!-- Productivity Health Score - Circular Gauge -->
      <div class="mb-8 flex items-center justify-center">
        <div class="relative w-48 h-48">
          <!-- Outer circle -->
          <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <!-- Background circle -->
            <circle cx="50" cy="50" r="40" fill="none" 
              class="stroke-gray-200 dark:stroke-gray-700" stroke-width="8"/>
            <!-- Progress circle -->
            <circle cx="50" cy="50" r="40" fill="none" 
              [attr.stroke]="getScoreColor()" stroke-width="8"
              stroke-linecap="round"
              [attr.stroke-dasharray]="251.2"
              [attr.stroke-dashoffset]="251.2 * (1 - completionRate / 100)"
              class="transition-all duration-1000 ease-out"/>
          </svg>
          <!-- Center content -->
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="text-4xl font-bold" [style.color]="getScoreColor()">
              {{ completionRate }}%
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400 font-medium">Completion Rate</div>
          </div>
        </div>
      </div>

      <!-- Score Breakdown -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-300">{{ totalTasks }}</div>
          <div class="text-xs text-blue-800 dark:text-blue-200 mt-1">Total Tasks</div>
        </div>
        <div class="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg">
          <div class="text-2xl font-bold text-purple-600 dark:text-purple-300">{{ inProgressCount }}</div>
          <div class="text-xs text-purple-800 dark:text-purple-200 mt-1">In Progress</div>
        </div>
        <div class="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg">
          <div class="text-2xl font-bold text-green-600 dark:text-green-300">{{ completedCount }}</div>
          <div class="text-xs text-green-800 dark:text-green-200 mt-1">Completed</div>
        </div>
      </div>
      
      <!-- Bar Chart -->
      <div class="space-y-4 mb-6">
        @for (item of chartData; track item.label) {
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ item.label }}</span>
              <span class="text-sm text-gray-600 dark:text-gray-400">{{ item.value }} ({{ item.percentage }}%)</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-500 ease-out"
                [style.width.%]="item.percentage"
                [style.background-color]="item.color"
              ></div>
            </div>
          </div>
        }
      </div>

      <!-- Category Breakdown -->
      <div class="border-t dark:border-gray-700 pt-4">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">By Category</h4>
        <div class="grid grid-cols-2 gap-3">
          @for (cat of categoryData; track cat.label) {
            <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <span class="text-sm text-gray-600 dark:text-gray-400">{{ cat.label }}</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">{{ cat.value }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Priority Breakdown -->
      <div class="border-t dark:border-gray-700 pt-4 mt-4">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">By Priority</h4>
        <div class="flex gap-3 justify-between">
          @for (pri of priorityData; track pri.label) {
            <div class="flex-1 text-center p-3 rounded" [class]="pri.bgClass">
              <div class="text-2xl font-bold" [class]="pri.textClass">{{ pri.value }}</div>
              <div class="text-xs mt-1" [class]="pri.textClass">{{ pri.label }}</div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TaskChartComponent {
  @Input() set tasks(value: Task[]) {
    this._tasks = value;
    this.calculateChartData();
  }

  private _tasks: Task[] = [];
  chartData: ChartData[] = [];
  categoryData: { label: string; value: number }[] = [];
  priorityData: { label: string; value: number; bgClass: string; textClass: string }[] = [];
  
  // Objective metrics
  completionRate = 0;
  totalTasks = 0;
  completedCount = 0;
  inProgressCount = 0;

  private calculateChartData() {
    const total = this._tasks.length || 1; // Avoid division by zero

    // Status distribution
    const todoCount = this._tasks.filter(t => t.status === 'todo').length;
    const inProgressCount = this._tasks.filter(t => t.status === 'in_progress').length;
    const doneCount = this._tasks.filter(t => t.status === 'done').length;

    this.chartData = [
      { 
        label: 'To Do', 
        value: todoCount, 
        color: '#9CA3AF',
        percentage: Math.round((todoCount / total) * 100) 
      },
      { 
        label: 'In Progress', 
        value: inProgressCount, 
        color: '#3B82F6',
        percentage: Math.round((inProgressCount / total) * 100) 
      },
      { 
        label: 'Done', 
        value: doneCount, 
        color: '#10B981',
        percentage: Math.round((doneCount / total) * 100) 
      }
    ];

    // Category breakdown
    const categories = new Map<string, number>();
    this._tasks.forEach(task => {
      categories.set(task.category, (categories.get(task.category) || 0) + 1);
    });
    this.categoryData = Array.from(categories.entries()).map(([label, value]) => ({ label, value }));

    // Priority breakdown
    const priorities = {
      high: this._tasks.filter(t => t.priority === 'high').length,
      medium: this._tasks.filter(t => t.priority === 'medium').length,
      low: this._tasks.filter(t => t.priority === 'low').length
    };

    this.priorityData = [
      { 
        label: 'High', 
        value: priorities.high, 
        bgClass: 'bg-red-100 dark:bg-red-900',
        textClass: 'text-red-800 dark:text-red-200'
      },
      { 
        label: 'Medium', 
        value: priorities.medium, 
        bgClass: 'bg-yellow-100 dark:bg-yellow-900',
        textClass: 'text-yellow-800 dark:text-yellow-200'
      },
      { 
        label: 'Low', 
        value: priorities.low, 
        bgClass: 'bg-green-100 dark:bg-green-900',
        textClass: 'text-green-800 dark:text-green-200'
      }
    ];

    // Calculate objective metrics
    this.totalTasks = this._tasks.length;
    this.completedCount = this._tasks.filter(t => t.status === 'done').length;
    this.inProgressCount = this._tasks.filter(t => t.status === 'in_progress').length;
    this.completionRate = this.totalTasks > 0 
      ? Math.round((this.completedCount / this.totalTasks) * 100)
      : 0;
  }

  getScoreColor(): string {
    if (this.completionRate >= 75) return '#10b981'; // green
    if (this.completionRate >= 50) return '#3b82f6'; // blue
    if (this.completionRate >= 25) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  }
}
