// import { freelanceContractAbi, freelanceContractAddress } from "./freelanceContract";

import { freelanceContractAbi, freelanceContractAddress } from "./call";

export const getAcceptTaskCall = (taskId: number) => [
  {
    to: freelanceContractAddress,
    abi: freelanceContractAbi,
    functionName: "acceptTask",
    args: [taskId],
  },
];
