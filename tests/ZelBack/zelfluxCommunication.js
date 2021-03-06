const communication = require('../../ZelBack/src/services/zelfluxCommunication');
const zelnodeList = require('./data/listzelnodes.json')
const chai = require('chai');
const expect = chai.expect;
const qs = require('qs');
const WebSocket = require('ws');

describe('getFluxMessageSignature', () => {
  it('correctly signs zelflux message', async () => {
    const message = 'abc';
    const privKey = '5JTeg79dTLzzHXoJPALMWuoGDM8QmLj4n5f6MeFjx8dzsirvjAh';
    const signature = await communication.getFluxMessageSignature(message, privKey);
    expect(signature).to.be.a('string');
    const signature2 = await communication.getFluxMessageSignature(message, 'abc');
    expect(signature2).to.be.an('error');
  });

  it('correctly verifies zelflux broadcast', async () => {
    const timeStamp = Date.now();
    const type = 'message';
    const privKey = '5JTeg79dTLzzHXoJPALMWuoGDM8QmLj4n5f6MeFjx8dzsirvjAh';
    const pubKey = '0474eb4690689bb408139249eda7f361b7881c4254ccbe303d3b4d58c2b48897d0f070b44944941998551f9ea0e1befd96f13adf171c07c885e62d0c2af56d3dab';
    const badPubKey = '074eb4690689bb408139249eda7f361b7881c4254ccbe303d3b4d58c2b48897d0f070b44944941998551f9ea0e1befd96f13adf171c07c885e62d0c2af56d3dab';
    const data = {
      zelapp: 'testapp',
      data: 'test'
    }
    const message = JSON.stringify(data);
    const signature = await communication.getFluxMessageSignature(message, privKey);
    console.log(signature);
    const dataToSend = {
      type,
      pubKey,
      timestamp: timeStamp,
      data,
      signature
    }
    const validRequest = await communication.verifyOriginalFluxBroadcast(dataToSend, zelnodeList);
    expect(validRequest).to.equal(true);
    const dataToSend2 = {
      type,
      pubKey,
      timestamp: timeStamp - 500000,
      data,
      signature
    }
    const invalidRequest = await communication.verifyOriginalFluxBroadcast(dataToSend2, zelnodeList);
    expect(invalidRequest).to.equal(false);
    const dataToSend3 = {
      type,
      pubKey: badPubKey,
      timestamp: timeStamp,
      data,
      signature
    }
    const invalidRequest2 = await communication.verifyOriginalFluxBroadcast(dataToSend3, zelnodeList);
    expect(invalidRequest2).to.equal(false);
    const dataToSend4 = {
      type,
      pubKey,
      timestamp: timeStamp,
      data,
      signature: 'abc'
    }
    const invalidRequest3 = await communication.verifyOriginalFluxBroadcast(dataToSend4, zelnodeList);
    expect(invalidRequest3).to.equal(false);
  }).timeout(5000);

  it('establishes websocket connection and sends correct data', async () => {
    const data = 'Hello ZelFlux testsuite!';
    const privKey = '5JTeg79dTLzzHXoJPALMWuoGDM8QmLj4n5f6MeFjx8dzsirvjAh';
    const messageToSend = await communication.serialiseAndSignZelFluxBroadcast(data, privKey);
    console.log(messageToSend);
    const wsuri = `ws://157.230.249.150:16127/ws/zelflux/`; // locally running 127.0.0.1
    const websocket = new WebSocket(wsuri);

    websocket.on('open', (msg) => {
      websocket.send(messageToSend);
    });
    websocket.on('message', (msg) => {
      console.log(msg);
      const msgZelFlux = msg.split(' ')[0];
      expect(msgZelFlux).to.equal('ZelFlux');
      websocket.close(1000);
    });
  });
});