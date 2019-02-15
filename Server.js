const kadence = require('@kadenceproject/kadence');
const levelup = require('levelup');
const leveldown = require('leveldown');
const encode = require('encoding-down');
var iotaCore = require('@iota/core')
var converter = require('@iota/converter')


//Creating first node object//

const node = new kadence.KademliaNode({
  identity: kadence.utils.getRandomKeyBuffer(),
  transport: new kadence.UDPTransport(),
  storage: levelup(encode(leveldown('database'))),
  contact: { hostname: 'localhost', port: 1337 }
});

//Creating second node object//

const nodeTwo = new kadence.KademliaNode({
  identity: kadence.utils.getRandomKeyBuffer(),
  transport: new kadence.UDPTransport(),
  storage: levelup(encode(leveldown('secondDB'))),
  contact: { hostname: 'localhost', port: 8080 }
});

//Listening on ports of each node//
node.listen(1337);
nodeTwo.listen(8080);
    
//Node joins network through nodeTwo//

node.join([ nodeTwo.identity, {
  hostname: 'localhost',
  port: 8080
}], async () => {
  // Add 'join' callback which indicates peers were discovered and
  // our node is now connected to the overlay network
await node.logger.info(`Connected to ${node.router.size} peers!`)

//Iota Seed//
const mySeed = 'InsertYourSeed';
    
//Details for key and Value we want to store//
const key = kadence.utils.getRandomKeyBuffer();
const Value = 'Rope'

console.log('The key is: ');
console.log(key);
    
node.iterativeStore(key, Value, function (err, data) {
   if (err) {
       return console.error(err);
   }
    else{
       console.log(data); 
    }
});
    
    
node.iterativeFindValue(key, function (error, value, contact){
    if (error) {
       return console.error(err);
   }
    else{ 
        const resp = value;
        //const publisher = value.publisher;
        const len = resp.length;
        
        for(var i = 0; i < len; i++){
            
        node.send('IOTA', ['Iota Address'], resp[i], function (err, result){
            if (error) {
               return console.error(err);
            }  
            else{
                console.log(result);
                
                sendIota(result, mySeed);
            }
        });
            
        }
    }
});  
    
    
 
    
});


  node.use('IOTA', (req, res) => {
    const iota = 'QVFEHDRITCVU9LTPSNQGGQRELGSSBOMQG9XFWSLBRTUYDZMUFLSOWGYNS9ZW9UOAYWSBBJKHFZESDGWMZOQKDQOUSY';
    res.send(iota);
  });


  nodeTwo.use('IOTA', (req, res) => {
      const iota = 'CEEMLNFZSOOXVCTDNXZXWZBVVYZTJW9XKBWPHXKABB9FCSJMNLXZJ9UZTODXBSFSGRCYOILEFSQSTREPY9EGVFZTHZ';
    res.send(iota);
  });


function sendIota(Address, Seed){
    const iota = iotaCore.composeAPI({ provider: 'https://testnet140.tangle.works'})
    
    const msg = converter.asciiToTrytes('Thanks for the storage');

    // Array of transfers which defines transfer recipients and value transferred in IOTAs.
    const transfers = [{
        address: Address,
        value: 0, // 1Ki
        tag: '', // optional tag of `0-27` trytes
        message: msg // optional message in trytes
    }]
    
    iota.prepareTransfers(Seed, transfers)
    .then(trytes => iota.sendTrytes(trytes, 3, 14))
    .then(bundle => {
        console.log(`Published transaction with tail hash: ${bundle[0].hash}`)
        console.log(`Bundle: ${bundle}`)
        
        res.send(bundle[0].hash)
    })
    .catch(err => {
        // catch any errors
    })
    
    
}


