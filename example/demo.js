let Orwell = window.Orwell;
let ethers = window.ethers;
let Buffer = window.Buffer;

let orwell;
let userBalance = 0;

const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;

localStorage.clear();

let connectButton = document.getElementById('connect');
let balanceItem = document.getElementById('balance');
let infoItem = document.getElementById('info');

let fundButton = document.getElementById('fund');
let fundAmount = document.getElementById('fund_amount');

let withdrawButton = document.getElementById('withdraw');
let withdrawAmount = document.getElementById('withdraw_amount');

let uploadButton = document.getElementById('upload');
let uploadAmount = document.getElementById('upload_amount');
let uploadinfo = document.getElementById('upload_info');

connectButton.onclick = async () => {
  connect().then(console.log('done'));
};

fundButton.onclick = async () => {
  let amount = +fundAmount.value;
  if (amount === NaN) {
    alert('needs to be a real number');
  }
  try {
    await orwell.fund(amount);
  } catch (e) {
    alert(e);
    console.log(e);
  }
};

withdraw.onclick = async () => {
  let amount = +fundAmount.value;
  if (amount === NaN) {
    alert('needs to be a real number');
  }
  try {
    await orwell.withdrawBalance(amount);
  } catch (e) {
    alert(e);
    console.log(e);
  }
};

uploadButton.onclick = async () => {
  let value = uploadAmount.value;

  if (value === '') {
    alert('need to add a word');
    return;
  }

  let data = {
    value: value,
    application: 'Orwell-Demo',
  };

  let res = await orwell.upload(
    window.Arweave.utils.stringToBuffer(JSON.stringify(data)),
    [
      {
        name: 'Content-Type',
        value: 'application/json',
      },
      {
        name: 'app',
        value: 'Orwell-Demo',
      },
    ],
  );

  uploadinfo.innerHTML = `Successfully uploaded to arweave, txId: ${res.data.id}`;
  console.log(res);
};

const connect = async () => {
  // Tell Web3modal what providers we have available.
  // Built-in web browser provider (only one can exist as a time)
  // like MetaMask, Brave or Opera is added automatically by Web3modal
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        // Mikko's test key - don't copy as your mileage may vary
        infuraId: '8043bb2cf99347b1bfadfb233c5325c0',
        bridge: 'https://bridge.walletconnect.org',
        rpc: {
          137: 'https://polygon-rpc.com',
        },
      },
    },
  };

  web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
  });

  let node = 'https://node2.bundlr.network/';

  try {
    let provider = await web3Modal.connect();
    let web3Provider = new ethers.providers.Web3Provider(provider);

    orwell = new window.Orwell(node, 'matic', web3Provider);

    await orwell.initialize();

    userBalance = await orwell.getBalance(orwell.address);
    let bal = `Your balance is ${userBalance} MATIC`;
    console.log(bal);

    let info = `Connected to node ${node} with address ${orwell.address}`;
    console.log(info);

    balanceItem.innerHTML = bal;
    infoItem.innerHTML = info;

    connectButton.hidden = true;
  } catch (e) {
    console.log(e);
  }
};
