import "./App.css";
import {Input,Container} from "semantic-ui-react";
import { providers, utils } from "ethers";
import { useCallback, useEffect, useState } from "react";
import ErrorModal from "./components/ErrorModal";
import AllTransactions, { Transaction } from "./components/Transactions";
import Header from "./components/Header";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface TransactionData {
  amount: string;
  receiverAdd: string;
}

function App() {
  const [currentAcct, setCurrentAcct] = useState<string>();
  const [provider, setProvider] = useState<providers.Web3Provider>();
  const [isConnected, setIsConnected] = useState(false);
  const [showError, setShowError] = useState(false);
  const [accountBal, setAccountBal] = useState("0.00");
  const [loading, setLoading] = useState(false);
  const [trxData, setTrxdata] = useState<TransactionData>({
    amount: "",
    receiverAdd: "",
  });
  const [allTrxs, setAlltrxs] = useState<Transaction[]>([]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: any) => {
        setCurrentAcct(accounts[0]);
      });
      window.ethereum.on("chainChanged", (chainId: string) => {
        checkNetwork();
      });

      autoConnect();
    }
  }, []);

  const getTransactions = useCallback(async () => {
    try {
      let trxState: Transaction[] = [];
      if (isConnected) {
        const existingTrx = localStorage.getItem("trxs");
        if (!existingTrx) return;
        const trxs: string[] = JSON.parse(existingTrx);
        for (let t of trxs) {
          const res = await provider!.getTransaction(t);
          const trx: Transaction = {
            hash: res.hash,
            from: res.from,
            timestamp: res.timestamp ? res.timestamp.toString() : "",
            to: res.to ? res.to : "",
            value: res.value ? utils.formatEther(res.value) : "0.00",
          };
          trxState.push(trx);
        }
        setAlltrxs(trxState);
      }
    } catch (error) {}
  }, [isConnected, provider]);

  const setAcctBal = useCallback(async () => {
    try {
      if (isConnected && currentAcct) {
        const balance = await provider!.getBalance(currentAcct);
        const accountBal = utils.formatEther(balance);
        setAccountBal(accountBal.slice(0, 4));
      }
    } catch (error: any) {
      setProvider(undefined);
      setCurrentAcct(undefined);
      setIsConnected(false);
      alert(error.message);
    }
  }, [isConnected, provider, currentAcct]);

  useEffect(() => {
    getTransactions();
  }, [isConnected, getTransactions]);

  useEffect(() => {
    setAcctBal();
  }, [isConnected, setAcctBal]);

  async function checkNetwork() {
    const polygonProvider = new providers.Web3Provider(window.ethereum!);
    const network = await polygonProvider.detectNetwork();
    if (network.name !== "maticmum") {
      setCurrentAcct(undefined);
      setProvider(undefined);
      setShowError(true);
      setIsConnected(false);
    } else {
      const accounts = await polygonProvider.listAccounts();
      setProvider(polygonProvider);
      setCurrentAcct(accounts[0]);
      setIsConnected(true);
      setShowError(false);
    }
  }

  async function autoConnect() {
    try {
      const polygonProvider = new providers.Web3Provider(window.ethereum!);
      const network = await polygonProvider.detectNetwork();
      if (network.name !== "maticmum") {
        setShowError(true);
        return;
      }
      setProvider(polygonProvider);
      const accounts = await window.ethereum!.request({
        method: "eth_accounts",
      });
      if (accounts && accounts.length > 0) {
        setCurrentAcct(accounts[0]);
        setIsConnected(true);
        return;
      }
      setIsConnected(false);
    } catch (error: any) {
      alert(error.message);
    }
  }
  function connectOrDisconnect() {
    if (isConnected) {
      setCurrentAcct(undefined);
      setProvider(undefined);
      setIsConnected(false);
      return;
    }
    connectWallet();
  }
  async function connectWallet() {
    try {
      if (!window.ethereum) alert("Please Install Metamask");
      await window.ethereum!.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x13881", // '0x3830303031'
            blockExplorerUrls: ["https://mumbai.polygonscan.com"], // ['https://mumbai.polygonscan.com']
            chainName: "Mumbai Testnet", // 'Mumbai Testnet'
            nativeCurrency: {
              decimals: 18,
              name: "Polygon",
              symbol: "MATIC",
            },
            rpcUrls: ["https://matic-mumbai.chainstacklabs.com"], // ['https://matic-mumbai.chainstacklabs.com']
          },
        ],
      });
      const polygonProvider = new providers.Web3Provider(window.ethereum!);

      await polygonProvider.send("eth_requestAccounts", []);
      const accounts = await polygonProvider.listAccounts();

      setProvider(polygonProvider);
      setCurrentAcct(accounts[0]);
      setIsConnected(true);
      setShowError(false);
    } catch (error: any) {
      alert(`Something went wrong: ${error.message}`);
    }
  }

  async function makeTransaction() {
    try {
      setLoading(true);
      const signer = provider!.getSigner(currentAcct);
      const res = await signer.sendTransaction({
        to: trxData.receiverAdd,
        value: utils.parseEther(trxData.amount),
      });
      let trans: string[] = [];
      const existingTrx = localStorage.getItem("trxs");
      if (existingTrx) {
        trans = JSON.parse(existingTrx);
      }
      trans.push(res.hash);
      localStorage.setItem("trxs", JSON.stringify(trans));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setAcctBal();
      setLoading(false);
    }
  }
  if (showError) {
    return <ErrorModal retry={connectWallet} />;
  }
  return (
    <div className="App">
      <Header
        isConnected={isConnected}
        accountBal={accountBal}
        currentAcct={currentAcct}
        connectDisconnectWallet={connectOrDisconnect}
      />
      <Container>
        {!isConnected ? (
          <h1 style={{ margin: "50px 0" }}>
            Connect Wallet to start making Transactions
          </h1>
        ) : (
          <div>
            <div
              style={{
                marginTop: "30px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h3 style={{ textAlign: "left" }}>Make A Transaction</h3>
              <Input
                label={{ basic: false, content: "Address" }}
                labelPosition="right"
                placeholder="Enter Address..."
                style={{ width: "35%", margin: "15px 0" }}
                value={trxData.receiverAdd}
                onChange={(e) =>
                  setTrxdata({ ...trxData, receiverAdd: e.target.value })
                }
              />
              <Input
                action={{
                  color: "purple",
                  labelPosition: "right",
                  icon: "send",
                  content: "Send",
                  onClick: () => makeTransaction(),
                }}
                actionPosition="left"
                placeholder="Enter Amount in ether"
                style={{ width: "35%", margin: "15px 0" }}
                value={trxData.amount}
                onChange={(e) =>
                  setTrxdata({ ...trxData, amount: e.target.value })
                }
                loading={loading}
                disabled={loading}
              />
            </div>
            <AllTransactions allTrxs={allTrxs} />
          </div>
        )}
      </Container>
    </div>
  );
}

export default App;
