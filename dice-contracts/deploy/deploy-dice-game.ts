import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying EncryptedDiceGame contract...");

  const deployedEncryptedDiceGame = await deploy("EncryptedDiceGame", {
    from: deployer,
    log: true,
  });

  console.log(`EncryptedDiceGame contract: `, deployedEncryptedDiceGame.address);
  console.log("Contract deployed successfully!");
  console.log("Game settings:");
  console.log("- Payout multiplier: 1.95x");
  console.log("- Min stake: 1 ROLL token");
  console.log("- Max stake: 1000 ROLL tokens");
  console.log("- Exchange rate: 1 ETH = 1000 ROLL");
};

export default func;
func.id = "deploy_encryptedDiceGame";
func.tags = ["EncryptedDiceGame"];
