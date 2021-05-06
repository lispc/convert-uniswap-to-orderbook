import Dotenv from "dotenv";
Dotenv.config();
import Web3 from "web3";
import { uniswapABI } from "./uniswap_v2_abi.mjs";
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.WEB3_URL));
const USDC_ETH_CONTRACT = "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc";
const USDT_ETH_CONTRACT = "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852";

function printOrderbookFromSwap(base, quote, priceInterval = 1, num = 20) {
  const currentPrice = quote / base;
  console.log("Sell Orders:");
  let data = [[currentPrice, base, quote]];
  for (let delta = 1; delta <= num; delta += 1) {
    const newPrice = currentPrice + delta * priceInterval;
    const newQuote = Math.sqrt(base * quote * newPrice);
    const newBase = (base * quote) / newQuote;
    data.push([newPrice, newBase, newQuote]);
  }
  printOrderbookFromAMMPoints(data, "sell");
  console.log("Buy Orders:");
  data = [[currentPrice, base, quote]];
  for (let delta = 1; delta <= num; delta += 1) {
    const newPrice = currentPrice - delta * priceInterval;
    const newQuote = Math.sqrt(base * quote * newPrice);
    const newBase = (base * quote) / newQuote;
    data.push([newPrice, newBase, newQuote]);
  }
  printOrderbookFromAMMPoints(data, "buy");
  console.log("\n");
  function printOrderbookFromAMMPoints(data, side) {
    let orders = [];
    for (let i = 1; i < data.length; i++) {
      const quoteDelta = data[i][2] - data[i - 1][2];
      const baseDelta = data[i][1] - data[i - 1][1];
      const avgPrice = -quoteDelta / baseDelta;
      orders.push({
        price: avgPrice,
        amount: (side == "sell" ? -1 : 1) * baseDelta
      });
    }
    for (const { price, amount } of side == "sell" ? orders.reverse() : orders) {
      console.log(`price ${price} amount ${amount}`);
    }
  }
}

function fetchReserveFromUniswap(pair, ethIsFirst, cb) {
  var contract = new web3.eth.Contract(uniswapABI, pair);
  contract.methods.getReserves().call(function(err, reserves) {
    if (err) {
      console.log({ err });
      return;
    }
    const usd = (ethIsFirst ? reserves["_reserve1"] : reserves["_reserve0"]) / Math.pow(10, 6);
    const eth = (ethIsFirst ? reserves["_reserve0"] : reserves["_reserve1"]) / Math.pow(10, 18);
    const price = usd / eth;
    console.log("AMM info:");
    console.log("USD reserve:", usd);
    console.log("ETH reserve:", eth);
    console.log("Price: ", price);
    console.log("\n");
    cb(eth, usd);
  });
}

function main() {
  //console.log("USDC-ETH pair:");
  //fetchReserveFromUniswap(USDC_ETH_CONTRACT, false, printOrderbookFromSwap);
  console.log("ETH-USDT pair:");
  fetchReserveFromUniswap(USDT_ETH_CONTRACT, true, printOrderbookFromSwap);
}
main();
