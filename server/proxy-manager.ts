import http from 'node:http';

export interface ProxyRoute {
  id: string;
  domain: string;
  targetPort: number;
  enabled: boolean;
  createdAt: string;
}

export class ProxyManager {
  private routes: ProxyRoute[] = [
    {
      id: 'route-sample',
      domain: 'sample.local',
      targetPort: 3030,
      enabled: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'route-api',
      domain: 'api.local',
      targetPort: 4100,
      enabled: true,
      createdAt: new Date().toISOString(),
    },
  ];

  getRoutes(): ProxyRoute[] {
    return this.routes;
  }

  addRoute(domain: string, targetPort: number): ProxyRoute {
    const newRoute: ProxyRoute = {
      id: `route-${Date.now()}`,
      domain: domain.toLowerCase().trim(),
      targetPort,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    this.routes.push(newRoute);
    return newRoute;
  }

  deleteRoute(id: string): boolean {
    const prev = this.routes.length;
    this.routes = this.routes.filter((r) => r.id !== id);
    return this.routes.length < prev;
  }

  toggleRoute(id: string): ProxyRoute | null {
    const r = this.routes.find((x) => x.id === id);
    if (r) {
      r.enabled = !r.enabled;
      return r;
    }
    return null;
  }

  getWindowsHostsCommand(domain: string): string {
    return `Add-Content -Path "$env:windir\\System32\\drivers\\etc\\hosts" -Value "127.0.0.1  ${domain}"`;
  }
}

export const proxyManager = new ProxyManager();
