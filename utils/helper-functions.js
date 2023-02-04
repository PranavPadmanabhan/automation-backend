const { ethers } = require("ethers");
const AutoTask = require("../models/AutoTask");
const dotenv = require("dotenv");
const { abi } = require("../constants/constants");
dotenv.config();

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL_ENCRYPTED;
const PRIVATE_KEY = process.env.PRIVATE_KEY_ENCRYPTED;
const ALCHEMY = process.env.ALCHEMY;

const batchProvider = new ethers.providers.JsonRpcBatchProvider(ALCHEMY);
const provider = new ethers.providers.WebSocketProvider(ALCHEMY);
const owner = new ethers.Wallet(
  process.env.PRIVATE_KEY_ENCRYPTED,
  batchProvider
);

const checkAutomationState = async () => {
  const automation = new ethers.Contract(
    process.env.CONTRACT_ADDRESS_ENCRYPTED,
    abi,
    owner
  );
  const tasks = await automation.getAllTasks();
  const activeTasks = tasks.filter((item) => item.state.toString() === "0");

  for (let i = 0; i < activeTasks.length; i++) {
    const task = await AutoTask.findOne({
      address: activeTasks[i].taskAddress,
    });
    // console.log(task.executorKey);
    const executor = new ethers.Wallet(task.executorKey, batchProvider);
    const automateContract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS_ENCRYPTED,
      abi,
      executor
    );
    const targetContract = new ethers.Contract(
      activeTasks[i].taskAddress,
      new ethers.utils.Interface(task.abi),
      executor
    );

    const callback = async () => {
      const automationStatus = await automateContract.checkAutomationStatus(
        activeTasks[i].id.toString()
      );
      console.log(`${i + 1}:  ${automationStatus}`);
      if (automationStatus) {
        try {
          clearInterval(timer);

          const tx = await targetContract.functions[`${task.functionName}`]({
            gasLimit: 2500000,
          });
          const receipt = await tx.wait(1);
          const { gasUsed, effectiveGasPrice } = receipt;
          const expectedGas = 160000;
          const gasPrice = parseFloat(
            ethers.utils
              .formatEther((await batchProvider.getGasPrice()).toString())
              .toString()
          );
          const fee = gasPrice * expectedGas;
          const gasCost = parseFloat(
            ethers.utils
              .formatEther(gasUsed.mul(effectiveGasPrice).toString())
              .toString()
          );
          const totalCost = gasCost + fee + 0.0002;
          if (receipt && receipt.status == 1) {
            const tx1 = await automateContract.updateTaskExecDetails(
              activeTasks[i].taskAddress,
              ethers.utils.parseEther(`${totalCost}`),
              {
                gasLimit: expectedGas,
              }
            );
            const { gasUsed: gas } = await tx1.wait(1);
            console.log(
              `Task ${i + 1} automated successfully - gas:${gas.toString()}`
            );
          }
        } catch (error) {
          console.log(error);
          timer = setInterval(callback, 10000);
        }
      }
    };

    let timer = setInterval(callback, 10000);
    automation.on("TaskDetailsUpdated", (time, address, amount) => {
      console.log("done");
      if (
        address.toString().toLowerCase() ==
        activeTasks[i].taskAddress.toString().toLowerCase()
      ) {
        timer = setInterval(callback, 10000);
      }
    });
  }
  // const execList = await automation.getExecListOf(tasks[0].taskAddress);
};

const listenToNewTasks = async () => {
  const automation = new ethers.Contract(
    process.env.CONTRACT_ADDRESS_ENCRYPTED,
    abi,
    owner
  );
  automation.on("NewAutoTask", () => {
    checkAutomationState();
  });

  automation.on("AutoTaskCancelled", () => {
    checkAutomationState();
  });
};

module.exports = {
  checkAutomationState,
  listenToNewTasks,
};
