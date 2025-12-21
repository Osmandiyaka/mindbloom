export type DrawerMode = 'overlay' | 'push' | 'permanent';

export interface MetronicConfig {
  sidebarSticky: boolean;
  sidebarMinimized: boolean;
  drawerMode: DrawerMode;
  headerFixed: boolean;
  containerWidth: 'fixed' | 'fluid';
}

export const DEFAULT_METRONIC_CONFIG: MetronicConfig = {
  sidebarSticky: true,
  sidebarMinimized: false,
  drawerMode: 'overlay',
  headerFixed: true,
  containerWidth: 'fluid',
};
