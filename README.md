node-openvpn
============
[![Build Status](https://travis-ci.org/amilajack/node-openvpn.svg?branch=master)](https://travis-ci.org/amilajack/node-openvpn)
[![NPM version](https://badge.fury.io/js/@amilajack/node-openvpn.svg)](http://badge.fury.io/js/@amilajack/node-openvpn)
[![Dependency Status](https://img.shields.io/david/amilajack/node-openvpn.svg)](https://david-dm.org/amilajack/node-openvpn)
[![npm](https://img.shields.io/npm/dm/@amilajack/node-openvpn.svg?maxAge=2592000)]()

Communicate to an OpenVpn client instance via telenet, for [node](http://nodejs.org).

## Installation
```bash
npm install @amilajack/node-openvpn
```

## Example
```js
import openvpnmanager from '@amilajack/node-openvpn';

const opts = {
  host: '127.0.0.1', // normally '127.0.0.1', will default to if undefined
  port: 1337, //port openvpn management console
  timeout: 1500, //timeout for connection - optional, will default to 1500ms if undefined
  logpath: 'log.txt' //optional write openvpn console output to file, can be relative path or absolute
};
const auth = {
  user: 'vpnUserName',
  pass: 'vpnPassword'
};

const openvpn = openvpnmanager.connect(opts);

openvpn.on('connected', () => {
  //will be emited on successful interfacing with openvpn instance
  openvpnmanager.authorize(auth);
});

openvpn.on('console-output', output => {
  //emits console output of openvpn instance as a string
  console.log(output);
});

openvpn.on('state-change', state => {
  //emits console output of openvpn state as a array
  console.log(state);
});

openvpn.on('error', error => {
  //emits console output of openvpn state as a string
  console.log(error);
});

openvpnmanager.getLog(console.log); //get all console logs up to this point

// and finally when/if you want to
openvpnmanager.disconnect();

openvpn.on('disconnected', () => {
  //emits on disconnect
  openvpnmanager.destroy(); //finally destroy the disconnected manager
});
```
