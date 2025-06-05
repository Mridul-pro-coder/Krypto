const main = async () => {
    const Transactions = await hre.ethers.getContractFactory("Transactions");
    const transaction = await Transactions.deploy();

    await transaction.waitForDeployment();

    console.log("Transaction deployed to:", transaction.target);
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
