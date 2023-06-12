import * as dotenv from 'dotenv';
dotenv.config();
const gRPC_ENDPOINT = 'https://localhost:8000';
const DOMAIN = 'localhost.com';
const NODE_ENDPOINT = 'http://localhost:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// 1. Authenticate with Valorem Trade
import { createPromiseClient } from '@bufbuild/connect';
import { createGrpcTransport } from '@bufbuild/connect-node';
import { SiweMessage } from 'siwe';
import * as ethers from 'ethers';  // v5.5.0
import { Auth } from '../../../gen/trade/auth_connect';  // generated from auth.proto

// replace with account to use for signing
// const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
// const NODE_ENDPOINT = 'https://goerli-rollup.arbitrum.io/rpc';

const provider = new ethers.providers.JsonRpcProvider(NODE_ENDPOINT);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// const gRPC_ENDPOINT = 'https://exchange.valorem.xyz';
// const DOMAIN = 'exchange.valorem.xyz';

var cookie: string;  // to be used for all server interactions
// custom Connect interceptor for retrieving cookie
const trackCookie= (next: any) => async (req: any) => {
  const res = await next(req);
  cookie = res.header?.get('set-cookie')?.split(';')[0] ?? cookie;
  return res
};

// transport for connection to Valorem Trade gRPC server
const transport = createGrpcTransport({
  baseUrl: gRPC_ENDPOINT,
  httpVersion: '2',
  interceptors: [trackCookie]
});

async function authenticateWithTrade() {
  const authClient = createPromiseClient(Auth, transport);
  const { nonce } = await authClient.nonce({});
  const { chainId } = await provider.getNetwork();
  // create SIWE message
  const message = new SiweMessage({
    domain: DOMAIN,
    address: signer.address,
    uri: gRPC_ENDPOINT,
    version: '1',
    chainId: chainId,
    nonce,
    issuedAt: new Date().toISOString(),
  }).toMessage();

  // sign SIWE message
  const signature = await signer.signMessage(message);

  // verify with Valorem Trade
  await authClient.verify(
    {
      body: JSON.stringify({
        message: message,
        signature: signature,
      })
    },
    {headers: [['cookie', cookie]]},
  );

  // authenticate with Valorem Trade
  await authClient.authenticate({}, {headers: [['cookie', cookie]]});

  console.log('Client has authenticated with Valorem Trade!');
}


// 2. Create an option on Valorem Clearinghouse
import IValoremOptionsClearinghouse from '../abi/IValoremOptionsClearinghouse.json';
import { OptionType, getOptionId } from './lib/getOptionId';

const VALOREM_CLEAR_ADDRESS = '0x7513F78472606625A9B505912e3C80762f6C9Efb';  // Valorem Clearinghouse on Arb Goerli
const underlyingAsset = '0x618b9a2Db0CF23Bb20A849dAa2963c72770C1372';  // Wrapped ETH on Arb Goerli
const exerciseAsset = '0x8AE0EeedD35DbEFe460Df12A20823eFDe9e03458';  // USDC on Arb Goerli

async function createOption() {
  const clearinghouseContract = new ethers.Contract(VALOREM_CLEAR_ADDRESS, IValoremOptionsClearinghouse, provider);

  const underlyingAmount = ethers.utils.parseUnits('1', 18); // 1 WETH, 18 decimals
  const exerciseAmount = ethers.utils.parseUnits('2000', 6); // 2k USDC, 6 decimals

  const blockNumber = await provider.getBlockNumber();
  const SECONDS_IN_A_WEEK = 60 * 60 * 24 * 7;

  const exerciseTimestamp = (await provider.getBlock(blockNumber))?.timestamp || Math.floor(Date.now()/1000);
  const expiryTimestamp = exerciseTimestamp + SECONDS_IN_A_WEEK;

  const option: OptionType = {
    underlyingAsset,
    underlyingAmount,
    exerciseAsset,
    exerciseAmount,
    exerciseTimestamp,
    expiryTimestamp,
  };
  
  // check if option already exists
  const optionId = getOptionId(option);
  const typeOfToken = await clearinghouseContract.tokenType(optionId);
  // if it does not exist, create it
  if (typeOfToken == 0) { 
    console.log('Creating option type with clearing house.');
    const newOptionTxReceipt = await (await clearinghouseContract.connect(signer).newOptionType(
      underlyingAsset,
      underlyingAmount,
      exerciseAsset,
      exerciseAmount,
      exerciseTimestamp,
      expiryTimestamp,
    )).wait();
    if (newOptionTxReceipt.status == 0) { throw new Error('Option creation failed.') };
  } else {
    console.log('Nice! Option type already exists with clearing house.');
  };

  console.log('Sending RFQs for option with ID:', optionId.toString());
  return optionId;
}


// 3. Send RFQ requests
import { RFQ } from '../../../gen/trade/rfq_connect';  // generated from rfq.proto
import { Action, QuoteRequest } from '../../../gen/trade/rfq_pb';  // generated from rfq.proto
import { ItemType } from '../../../gen/trade/seaport_pb';  // generated from seaport.proto
import { toH160, toH256 } from './lib/fromBNToH';
import ISeaport from '../abi/ISeaport.json';
import { Order, SignedOrder, ConsiderationItem, OfferItem, OrderType  } from '../../../gen/trade/seaport_pb';
const SEAPORT_ADDRESS = '0x00000000006c3852cbEf3e08E8dF289169EdE581';


async function sendRfqRequests(optionId: ethers.BigNumber) {
  
  const seaportContract = new ethers.Contract(SEAPORT_ADDRESS, ISeaport, signer);

  const rfqClient = createPromiseClient(RFQ, transport);

  // create a quote request to buy 5 options
  const quoteRequest = new QuoteRequest({
    ulid: undefined,
    takerAddress: toH160(signer.address),
    itemType: ItemType.ERC1155,  // seaport offer ItemType
    tokenAddress: toH160(VALOREM_CLEAR_ADDRESS),  // clearing house is options token contract
    identifierOrCriteria: toH256(optionId),  // token id of the option
    amount: toH256(5),  // 5 options
    action: Action.BUY  
  });

  // continuously send requests and handle responses
  console.log('Sending RFQ requests...');
  while (true) {
    // create your own quote request and response stream handling logic here
    const quoteRequestStream = async function* () {
      yield quoteRequest;
    };

    const quoteResponseStream = rfqClient.taker(
      quoteRequestStream(), 
      {headers: [['cookie', cookie]]}
    );

    for await (const quoteResponse of quoteResponseStream) {
      console.log('Received QuoteResponse:'); 
      console.log(quoteResponse);
      // Handle the response here

      // seaportContract.connect(signer).fullfillOrder(signedOrder, ethers.constants.HashZero);

    }

    // sends request out every 2 seconds
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    
  };

};


async function main(){

  await authenticateWithTrade();
  const optionId = await createOption();
  await sendRfqRequests(optionId);

}

main();