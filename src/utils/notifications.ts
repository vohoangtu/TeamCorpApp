/**
 * Windows 11 Native Toast Notifications Integration
 * Uses the Web Notifications API which maps directly to the Windows 11 Action Center
 */

export class NotificationService {
  private static permissionRequested = false;

  static async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const res = await Notification.requestPermission();
      return res === 'granted';
    }

    return false;
  }

  static notify(title: string, options?: { body?: string; tag?: string }) {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: options?.body,
          tag: options?.tag || 'windev-hub',
          icon: '/favicon.ico',
          silent: false,
        });
      } catch (err) {
        console.warn('Toast notification failed:', err);
      }
    } else if (!this.permissionRequested && Notification.permission !== 'denied') {
      this.permissionRequested = true;
      this.requestPermission().then((granted) => {
        if (granted) {
          this.notify(title, options);
        }
      });
    }
  }

  static notifySyncSuccess(projectName: string, durationMs: number = 64) {
    this.notify(`⚡ Hot-Sync Thành Công`, {
      body: `Ứng dụng "${projectName}" đã đồng bộ & triển khai lại trong ~${durationMs}ms (Không xung đột port).`,
      tag: `sync-${projectName}`,
    });
  }

  static notifyProcessError(projectName: string, errorText: string) {
    this.notify(`❌ Lỗi Tiến Trình: ${projectName}`, {
      body: errorText.slice(0, 120),
      tag: `error-${projectName}`,
    });
  }
}

export function sendFluentToast(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  NotificationService.notify(title, { body: message });
}

