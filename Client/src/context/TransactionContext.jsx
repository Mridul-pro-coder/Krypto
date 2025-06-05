/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState } from "react";
// Import ethers for modern v6 syntax
import { ethers } from "ethers";

// Assuming these are correctly defined in your utils/constants file
import { contractABI, contractAddress } from "../utils/constants";

// Create the React Context
export const TransactionContext = React.createContext();

// Helper function to create an Ethereum contract instance
// Now accepts the 'ethereum' object as an argument
const createEthereumContract = async (ethereumInstance) => {
    // Ensure ethereumInstance is available before creating provider
    if (!ethereumInstance) {
        console.error("Ethereum object is undefined when trying to create contract.");
        // Depending on your error handling, you might want to throw an error or return null
        return null;
    }
    try {
        // Use BrowserProvider for modern ethers.js (v6+) with window.ethereum
        const provider = new ethers.BrowserProvider(ethereumInstance);
        // Get the signer for the connected account
        const signer = await provider.getSigner();
        // Create the contract instance
        const transactionsContract = new ethers.Contract(contractAddress, contractABI, signer);
        return transactionsContract;
    } catch (error) {
        console.error("Error creating Ethereum contract:", error);
        return null;
    }
};

// The main TransactionsProvider component
export const TransactionsProvider = ({ children }) => {
    // State for form data
    const [formData, setformData] = useState({ addressTo: "", amount: "", keyword: "", message: "" });
    // State for the current connected Ethereum account
    const [currentAccount, setCurrentAccount] = useState("");
    // State for loading indicator during transactions
    const [isLoading, setIsLoading] = useState(false);
    // State for the total transaction count, initialized from local storage
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem("transactionCount"));
    // State to store the list of transactions
    const [transactions, setTransactions] = useState([]);

    // Handles changes in form input fields
    const handleChange = (e, name) => {
        setformData((prevState) => ({ ...prevState, [name]: e.target.value }));
    };

    // Fetches all transactions from the smart contract
    const getAllTransactions = async () => {
        // Access window.ethereum safely
        const ethereum = window.ethereum;
        try {
            if (ethereum) {
                // Pass the ethereum object to createEthereumContract
                const transactionsContract = await createEthereumContract(ethereum);
                if (!transactionsContract) { // Handle case where contract creation failed
                    console.error("Failed to create transactions contract.");
                    return;
                }

                const availableTransactions = await transactionsContract.getAllTransactions();

                // Map raw transaction data to a more readable structure
                const structuredTransactions = availableTransactions.map((transaction) => ({
                    addressTo: transaction.receiver,
                    addressFrom: transaction.sender,
                    // Convert BigInt timestamp to number and then to locale string
                    timestamp: new Date(Number(transaction.timestamp) * 1000).toLocaleString(),
                    message: transaction.message,
                    keyword: transaction.keyword,
                    // Convert BigInt amount to number (in Ether)
                    amount: ethers.formatEther(transaction.amount)
                }));

                console.log("Structured Transactions:", structuredTransactions);
                setTransactions(structuredTransactions);
            } else {
                console.log("Ethereum object not found, please install MetaMask.");
            }
        } catch (error) {
            console.error("Error in getAllTransactions:", error);
        }
    };

    // Checks if a wallet is already connected
    const checkIfWalletIsConnect = async () => {
        // Access window.ethereum safely
        const ethereum = window.ethereum;
        try {
            if (!ethereum) {
                // Using a custom message box instead of alert()
                console.warn("Please install MetaMask to use this application.");
                // You might want to implement a modal here instead of just console.warn
                return;
            }

            const accounts = await ethereum.request({ method: "eth_accounts" });

            if (accounts.length) {
                setCurrentAccount(accounts[0]);
                getAllTransactions(); // Fetch transactions if an account is connected
            } else {
                console.log("No accounts found. Please connect your wallet.");
            }
        } catch (error) {
            console.error("Error in checkIfWalletIsConnect:", error);
            // Don't throw a new Error("No ethereum object") if window.ethereum exists
            // because the error might be something else (e.g., user denying accounts)
        }
    };

    // Checks the total number of transactions on the blockchain
    const checkIfTransactionsExists = async () => {
        // Access window.ethereum safely
        const ethereum = window.ethereum;
        try {
            if (ethereum) {
                // Pass the ethereum object to createEthereumContract
                const transactionsContract = await createEthereumContract(ethereum);
                if (!transactionsContract) { // Handle case where contract creation failed
                    console.error("Failed to create transactions contract for existence check.");
                    return;
                }
                const currentTransactionCount = await transactionsContract.getTransactionCount();

                // Store the count in local storage
                window.localStorage.setItem("transactionCount", Number(currentTransactionCount));
            } else {
                console.log("Ethereum object not found for transaction existence check.");
            }
        } catch (error) {
            console.error("Error in checkIfTransactionsExists:", error);
            // Don't throw a new Error("No ethereum object") if window.ethereum exists
        }
    };

    // Connects the user's wallet (MetaMask)
    const connectWallet = async () => {
        // Access window.ethereum safely
        const ethereum = window.ethereum;
        try {
            if (!ethereum) {
                console.warn("Please install MetaMask to connect your wallet.");
                // You might want to implement a modal here instead of just console.warn
                return;
            }

            const accounts = await ethereum.request({ method: "eth_requestAccounts" });

            setCurrentAccount(accounts[0]);
            // Consider if you really need to reload the page here.
            // Often, updating state is sufficient for React apps.
            // window.location.reload();
        } catch (error) {
            console.error("Error in connectWallet:", error);
            // Don't throw a new Error("No ethereum object") if window.ethereum exists
        }
    };

    // Sends a transaction
    const sendTransaction = async () => {
        // Access window.ethereum safely
        const ethereum = window.ethereum;
        try {
            if (ethereum) {
                const { addressTo, amount, keyword, message } = formData;
                // Pass the ethereum object to createEthereumContract
                const transactionsContract = await createEthereumContract(ethereum);
                if (!transactionsContract) { // Handle case where contract creation failed
                    console.error("Failed to create transactions contract for sending transaction.");
                    return;
                }

                // Parse the amount to BigInt (for v6) or BigNumber (for v5)
                const parsedAmount = ethers.parseEther(amount); // Using ethers.parseEther for v6

                await ethereum.request({
                    method: "eth_sendTransaction",
                    params: [{
                        from: currentAccount,
                        to: addressTo,
                        gas: "0x5208", // 21000 GWEI, adjust as needed
                        value: parsedAmount.toString(), // Convert BigInt to string for value
                    }],
                });

                // Call the smart contract function
                const transactionHash = await transactionsContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

                setIsLoading(true);
                console.log(`Loading - ${transactionHash.hash}`);
                await transactionHash.wait(); // Wait for the transaction to be mined
                console.log(`Success - ${transactionHash.hash}`);
                setIsLoading(false);

                // Update transaction count after successful transaction
                const newTransactionCount = await transactionsContract.getTransactionCount();
                setTransactionCount(Number(newTransactionCount)); // Convert BigInt to number

                // Consider if you really need to reload the page here.
                // Often, updating state and fetching transactions is sufficient.
                // window.location.reload();
            } else {
                console.log("No ethereum object found to send transaction.");
            }
        } catch (error) {
            console.error("Error in sendTransaction:", error);
            // Don't throw a new Error("No ethereum object") if window.ethereum exists
        }
    };

    // useEffect hook to run on component mount and when transactionCount changes
    useEffect(() => {
        checkIfWalletIsConnect();
        checkIfTransactionsExists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [transactionCount]); // Rerun when transactionCount changes to update UI

    // Provide context values to children components
    return (
        <TransactionContext.Provider
            value={{
                transactionCount,
                connectWallet,
                transactions,
                currentAccount,
                isLoading,
                sendTransaction,
                handleChange,
                formData,
            }}
        >
            {children}
        </TransactionContext.Provider>
    );
};
