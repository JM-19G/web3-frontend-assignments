import { Route, Routes } from "react-router-dom";
import Eip1193WalletConnector from "./pages/eip1193-wallet-connector";
import Eip6963WalletConnectors from "./pages/eip-6963";
import Eip1193 from "./pages/eip-1193";
import Eip4361 from "./pages/eip-4361";
import MetamaskGlobalState from "./pages/metamask-global-state";
import MetamaskLocalState from "./pages/metamask-local-state";
import WalletConnectionProvider from "./context";

const App = () => {
  return (
    <WalletConnectionProvider>
      <Routes>
        <Route path="/" element={<Eip1193WalletConnector />} />
        <Route path="/eip-6963" element={<Eip6963WalletConnectors />} />
        <Route path="/eip-1193" element={<Eip1193 />} />
        <Route path="/eip-4361" element={<Eip4361 />} />
        <Route path="/metamask-global-state" element={<MetamaskGlobalState />} />
        <Route path="/metamask-local-state" element={<MetamaskLocalState />} />
      </Routes>
    </WalletConnectionProvider>
  );
};

export default App;