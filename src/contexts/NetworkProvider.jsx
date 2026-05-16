import { NetworkContext } from "./NetworkContext.js";
import { useNetworkStatus } from "../hooks/useNetworkStatus.js";

export default function NetworkProvider({ children }) {
  const network = useNetworkStatus();
  return (
    <NetworkContext.Provider value={network}>{children}</NetworkContext.Provider>
  );
}
