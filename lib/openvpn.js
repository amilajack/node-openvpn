import Promise from 'bluebird';
import telnet from 'telnet-client';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import util from 'util';
import moment from 'moment';
import { EventEmitter } from 'events';

let openvpnEmitter = false;
let connection = false;
const logpath = null;

export const destroy = () => {
  if (connection) {
    connection.removeAllListeners();
    connection.end();
    connection.destroy();
    connection = false;
  }
};

export const connect = (params) => {
  establishConnection(params)
    .then(OpenVPNLog)
    .then(() => OpenVPNManagement('pid'))
    .then(() => OpenVPNManagement('bytecount 1'))
    .then(() => OpenVPNManagement('hold release'))
    .then(() => {
      openvpnEmitter.emit('connected');
    });

  return openvpnEmitter;
};

export const connectAndKill = (params) => {
  establishConnection(params)
    .then(OpenVPNLog)
    .then(disconnectOpenVPN);

  return openvpnEmitter;
};

export const authorize = auth => OpenVPNManagement(util.format('username "Auth" "%s"', auth.user))
  .then(() => {
    OpenVPNManagement(util.format('password "Auth" "%s"', auth.pass));
  });

export const disconnect = () => disconnectOpenVPN();

export const cmd = cmd => OpenVPNManagement(cmd);

function establishConnection(params) {
  connection = new telnet();
  openvpnEmitter = new EventEmitter();

  connection.on('end', () => {
    openvpnEmitter.emit('end');
  });
  connection.on('close', () => {
    openvpnEmitter.emit('close');
  });
  connection.on('error', (error) => {
    console.log(error);
    openvpnEmitter.emit('error', error);
  });

  return new Promise((resolve) => {
    params = _.defaults(params, {
      host: '127.0.0.1',
      port: 1337,
      shellPrompt: '',
      timeout: 2
    });
    resolve(connection.connect(params));
  });
}

function disconnectOpenVPN() {
  return OpenVPNManagement('signal SIGTERM');
}

function OpenVPNManagement(cmd) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (connection) {
        resolve(connection.exec(cmd));
      }
    }, 1000);
  });
}

function OpenVPNLog() {
  connection.exec('log on all', (logsResponse) => {
    connection.exec('state on', (logsResponse) => {
      connection.on('console-output', (response) => {
        _.each(response.split('\n'), (res) => {
          if (res && res.substr(1, 5) == 'STATE') {
            openvpnEmitter.emit('state-change', res.substr(7).split(','));
          } else if (res && res.substr(1, 4) == 'HOLD') {
            openvpnEmitter.emit('hold-waiting');
          } else if ((res && res.substr(1, 5) == 'FATAL') || (res && res.substr(1, 5) == 'ERROR')) {
            openvpnEmitter.emit('error', res.substr(7));
          } else if (res && res.substr(1, 9) == 'BYTECOUNT') {
            openvpnEmitter.emit('bytecount', res.substr(11).split(','));
          } else if (res && res.substr(0, 7) == 'SUCCESS') {
            if (res.substr(9, 3) == 'pid') {
              openvpnEmitter.emit('pid', res.substr(13));
            }
          } else if (res.length > 0) {
            openvpnEmitter.emit('console-output', res);
          }
        });
      });
    });
  });
}
