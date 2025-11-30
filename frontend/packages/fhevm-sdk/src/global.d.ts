/**
 * Global type declarations for FHEVM SDK
 */

interface Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    isMetaMask?: boolean;
    [key: string]: any;
  };
  RelayerSDK?: any;
  relayerSDK?: any;
}







