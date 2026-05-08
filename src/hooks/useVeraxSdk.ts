import { useMemo } from 'react';
import { VeraxSdk } from '@verax-attestation-registry/verax-sdk';
import { type Address } from 'viem';
import {
  isSupportedLineaChainId,
  LINEA_MAINNET_CHAIN_ID,
} from '../utils/constants.ts';

export const useVeraxSdk = (chainId?: number, address?: Address) => {
  return useMemo(() => {
    if (!chainId || !address) {
      return undefined;
    }

    if (!isSupportedLineaChainId(chainId)) {
      return undefined;
    }

    const sdkConf =
      chainId === LINEA_MAINNET_CHAIN_ID
        ? VeraxSdk.DEFAULT_LINEA_MAINNET_FRONTEND
        : VeraxSdk.DEFAULT_LINEA_SEPOLIA_FRONTEND;

    return new VeraxSdk(sdkConf, address);
  }, [chainId, address]);
};
