"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel,
} from "@coinbase/onchainkit/transaction";
import type { LifecycleStatus } from "@coinbase/onchainkit/transaction";
import {
  Wallet,
  ConnectWallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import {
  Address,
  Avatar,
  Identity,
  Name,
  EthBalance,
} from "@coinbase/onchainkit/identity";
import {
  freelanceContractAbi,
  freelanceContractAddress,
} from "@/app/freelanceABI";

interface Task {
  client: `0x${string}`;
  freelancer: `0x${string}`;
  description: string;
  amount: bigint;
  deadline: bigint;
  status: number;
}

export function TaskList() {
  const { address, chain } = useAccount();
  const [tasks, setTasks] = useState<Task[]>([]);

  // Get total number of tasks
  const { data: countData } = useReadContracts({
    contracts: [
      {
        address: freelanceContractAddress,
        abi: freelanceContractAbi,
        functionName: "taskCount",
      },
    ],
  });

  // Prepare contracts for batch reading
  const taskCount = countData?.[0]?.result ? Number(countData[0].result) : 0;
  const contracts = Array.from({ length: taskCount }, (_, i) => ({
    address: freelanceContractAddress,
    abi: freelanceContractAbi,
    functionName: "getTask",
    args: [BigInt(i)],
  }));

  // Fetch all tasks in one batch
  const { data: tasksData } = useReadContracts({
    contracts,
  });

  // Process tasks data
  useEffect(() => {
    if (tasksData) {
      const loadedTasks = tasksData
        .map((item) => item.result as Task | undefined)
        .filter(Boolean)
        .reverse() as Task[];
      setTasks(loadedTasks);
    }
  }, [tasksData]);

  const handleTransactionStatus = (status: LifecycleStatus) => {
    console.log("Transaction Status:", status);
  };

  function renderTaskActions(task: Task, index: number) {
    if (!address) return null;

    const isClient = address === task.client;
    const isFreelancer = address === task.freelancer;
    const isUnassigned =
      task.freelancer === "0x0000000000000000000000000000000000000000";

    switch (task.status) {
      case 0: // Created
        return isUnassigned ? (
          <Transaction
            chainId={chain?.id}
            calls={[
              {
                address: freelanceContractAddress,
                abi: freelanceContractAbi,
                functionName: "acceptTask",
                args: [BigInt(index)],
              },
            ]}
            onStatus={handleTransactionStatus}
          >
            <TransactionButton text="Accept Task" />
            <TransactionStatus className="mt-2">
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
          </Transaction>
        ) : null;
      case 1: // Accepted
        return (
          <div className="flex gap-2 mt-2">
            {isFreelancer && (
              <Transaction
                chainId={chain?.id}
                calls={[
                  {
                    address: freelanceContractAddress,
                    abi: freelanceContractAbi,
                    functionName: "markComplete",
                    args: [BigInt(index)],
                  },
                ]}
                onStatus={handleTransactionStatus}
              >
                <TransactionButton text="Mark Complete" />
                <TransactionStatus className="mt-2">
                  <TransactionStatusLabel />
                  <TransactionStatusAction />
                </TransactionStatus>
              </Transaction>
            )}
          </div>
        );
      case 2: // Completed
        return (
          <div className="flex gap-2 mt-2 ">
            {isClient && (
              <Transaction
                chainId={chain?.id}
                calls={[
                  {
                    address: freelanceContractAddress,
                    abi: freelanceContractAbi,
                    functionName: "releasePayment",
                    args: [BigInt(index)],
                  },
                ]}
                onStatus={handleTransactionStatus}
              >
                <TransactionButton text="Release Payment" />
                <TransactionStatus className="mt-2">
                  <TransactionStatusLabel />
                  <TransactionStatusAction />
                </TransactionStatus>
              </Transaction>
            )}
          </div>
        );
      default:
        return null;
    }
  }

  function renderTasks() {
    return tasks.map((task, index) => (
      <div key={index} className="border p-4 mb-4 rounded-lg bg-[#1E293B]">
        <h3 className="font-bold mb-2">Task #{index + 1}</h3>
        <p className="mb-1">Description: {task.description}</p>
        <p className="mb-1">Client: {shortenAddress(task.client)}</p>
        <p className="mb-1">
          Freelancer:{" "}
          {task.freelancer === "0x0000000000000000000000000000000000000000"
            ? "Not assigned"
            : shortenAddress(task.freelancer)}
        </p>
        <p className="mb-1">Amount: {formatEther(task.amount)} ETH</p>
        <p className="mb-1">Deadline: {formatDate(task.deadline)}</p>
        <p className="mb-1">Status: {getStatusText(task.status)}</p>
        {renderTaskActions(task, index)}
      </div>
    ));
  }

  // Helper functions
  function shortenAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function formatEther(wei: bigint) {
    return Number(wei) / 1e18;
  }

  function formatDate(timestamp: bigint) {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  }

  function getStatusText(status: number) {
    switch (status) {
      case 0:
        return "Created";
      case 1:
        return "Accepted";
      case 2:
        return "Completed";
      default:
        return "Funds Released";
    }
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Task List</h2>
        <Wallet>
          <ConnectWallet>
            <Avatar className="h-6 w-6" />
            <div className="flex items-center gap-2">
              <Name />
              <EthBalance />
            </div>
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
              <EthBalance />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>
      {tasks.length > 0 ? renderTasks() : <p>No tasks created yet.</p>}
    </div>
  );
}
