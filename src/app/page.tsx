"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { sdk } from "@farcaster/frame-sdk";
import { useAccount, useCapabilities, useWriteContract } from "wagmi";
import { Address, Avatar, Identity, Name } from "@coinbase/onchainkit/identity";
import {
  Transaction,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel,
} from "@coinbase/onchainkit/transaction";
import { Wallet, ConnectWallet } from "@coinbase/onchainkit/wallet";
import { parseEther } from "viem";
import { TaskList } from "@/components/TaskList";
import { freelanceContractAbi, freelanceContractAddress } from "./freelanceABI";

const BASE_SEPOLIA_CHAIN_ID = 84532;

export default function Home() {
  const { address, chain } = useAccount();
  const [description, setDescription] = useState("");
  const [amountEth, setAmountEth] = useState("");
  const [daysFromNow, setDaysFromNow] = useState<any>(1);
  const [transactionHash, setTransactionHash] = useState<string | undefined>(
    undefined
  );

  const { writeContract } = useWriteContract({
    mutation: {
      onSuccess: (hash) => setTransactionHash(hash),
      onError: (error) => console.error("Transaction failed:", error),
    },
  });

  const { data: availableCapabilities } = useCapabilities({
    account: address,
  });

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  const isValidAmount =
    amountEth && !isNaN(Number(amountEth)) && Number(amountEth) > 0;

  const isCorrectNetwork = chain?.id === BASE_SEPOLIA_CHAIN_ID;

  const capabilities = useMemo(() => {
    if (!availableCapabilities || !chain?.id) return {};
    const capabilitiesForChain = availableCapabilities[chain.id];

    if (
      capabilitiesForChain["PaymasterService"] &&
      capabilitiesForChain["PaymasterService"].supported
    ) {
      return {
        PaymasterService: {
          url: process.env.NEXT_PUBLIC_PAYMASTER_PROXY_SERVER_URL as string,
        },
      };
    }
    return {};
  }, [availableCapabilities, chain?.id]);

  const deadline = BigInt(
    Math.floor(Date.now() / 1000) + daysFromNow * 24 * 60 * 60
  );

  const handleCreateTask = useCallback(() => {
    if (
      !isCorrectNetwork ||
      !description ||
      !daysFromNow ||
      !isValidAmount ||
      !address
    )
      return;

    writeContract({
      address: freelanceContractAddress,
      abi: freelanceContractAbi,
      functionName: "createTask",
      args: [description, deadline],
      value: parseEther(amountEth),
      ...(Object.keys(capabilities).length > 0 ? { capabilities } : {}),
    });
  }, [
    address,
    amountEth,
    capabilities,
    deadline,
    description,
    daysFromNow,
    isValidAmount,
    isCorrectNetwork,
    writeContract,
  ]);

  return (
    <div className="p-4 max-w-[70%] mx-auto">
      {/* Wallet Connection */}
      <Wallet>
        <ConnectWallet>
          <Avatar className="h-6 w-6" />
          <Name />
        </ConnectWallet>
      </Wallet>

      {address ? (
        <>
          {!isCorrectNetwork && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Please switch to Base Sepolia network (Chain ID: 84532)
            </div>
          )}

          <h3 className="text-lg font-bold mb-4">Create a New Task</h3>

          {/* Task Description */}
          <label className="block mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded mb-4 bg-[#1E293B]"
            placeholder="What needs to be done?"
            required
          />

          {/* Deadline Input */}
          <label className="block mb-1">Deadline (in days)</label>
          <input
            type="number"
            value={daysFromNow}
            onChange={(e) => setDaysFromNow(Number(e.target.value))}
            className="w-full p-2 border rounded mb-4 bg-[#1E293B]"
            placeholder="e.g. 3"
            required
          />

          {/* Funding Amount */}
          <label className="block mb-1">Amount to fund (ETH)</label>
          <input
            type="number"
            value={amountEth}
            onChange={(e) => setAmountEth(e.target.value)}
            className="w-full p-2 border rounded mb-4 bg-[#1E293B]"
            placeholder="e.g. 0.01"
            step="0.001"
            min="0.001"
            required
          />

          {/* Transaction Section */}
          {isCorrectNetwork && description && daysFromNow && isValidAmount && (
            <div className=" bg-blue-500 hover:bg-blue-700">
              <button
                onClick={handleCreateTask}
                className="w-full bg-[#1E293B] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                disabled={!address}
              >
                Create Task{" "}
                {Object.keys(capabilities).length > 0 ? "(Gasless)" : ""}
              </button>

              {isCorrectNetwork && description && isValidAmount && (
                <Transaction
                  chainId={BASE_SEPOLIA_CHAIN_ID}
                  isSponsored={Object.keys(capabilities).length > 0}
                  calls={[
                    {
                      address: freelanceContractAddress,
                      abi: freelanceContractAbi,
                      functionName: "createTask",
                      args: [description, deadline],
                      value: parseEther(amountEth),
                    },
                  ]}
                  onStatus={(status) => console.log("Status:", status)}
                >
                  <TransactionStatus>
                    <TransactionStatusLabel />
                    <TransactionStatusAction />
                  </TransactionStatus>
                </Transaction>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="mt-4 text-center font-bold">
          Please connect your wallet to create a task.
        </p>
      )}
      <div className="]">
        <TaskList />
      </div>
    </div>
  );
}
