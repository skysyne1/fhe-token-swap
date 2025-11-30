import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying FHETokenSwap contract...");

  // Deploy using the contract name from the .sol file
  // The contract name is FHETokenSwap in EncryptedDiceGame.sol file
  const deployedContract = await deploy("FHETokenSwap", {
    from: deployer,
    log: true,
    args: [], // No constructor arguments
  });

  console.log(`FHETokenSwap contract deployed at: ${deployedContract.address}`);
  console.log("Contract deployed successfully!");
  console.log("Token Swap settings:");
  console.log("- Exchange rate: 1 ETH = 1000 ROLL");
  console.log("- Max mint: 10000 ROLL tokens");
};

export default func;
func.id = "deploy_fheTokenSwap";
func.tags = ["FHETokenSwap", "EncryptedDiceGame"]; // Keep both tags for backward compatibility
