import ZeroConf from 'react-native-zeroconf';

export interface DeviceInfo {
  name: string;
  host?: string;
  port?: number;
}

export interface ScanResults {
  devices: DeviceInfo[];
}

export class GoogleCastDiscovery {
  private zeroconf: ZeroConf;

  constructor() {
    this.zeroconf = new ZeroConf();
  }

  public async scan(): Promise<ScanResults> {
    return new Promise((resolve) => {
      const devices: DeviceInfo[] = [];
      
      this.zeroconf.on('resolved', (service) => {
        devices.push({
          name: service.name,
          host: service.host,
          port: service.port,
        });
      });

      this.zeroconf.on('error', (error) => {
        console.error('Zeroconf error:', error);
      });

      this.setScanInfo('androidtvremote2', 'tcp', 'local.')
        .then(() => {
          setTimeout(() => {
            this.zeroconf.stop();
            resolve({ devices });
          }, 5000); // Scan for 5 seconds
        })
        .catch((error) => {
          console.error('Scan setup error:', error);
          resolve({ devices });
        });
    });
  }

  private async setScanInfo(service: string, protocol: string, domain: string): Promise<void> {
    return new Promise((resolve) => {
      this.zeroconf.scan(service, protocol, domain);
      resolve();
    });
  }

  public stop() {
    this.zeroconf.stop();
  }
}