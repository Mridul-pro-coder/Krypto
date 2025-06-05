//https://eth-mainnet.g.alchemy.com/v2/egXVqbcwoab_frcewKo0yyvODg8R5D3A
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.INFURA_API_KEY}`,
      accounts: [
        process.env.PRIVATE_KEY,
      ],
    },
  },
};
