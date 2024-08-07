#!/usr/bin/node

/*
* Software Name : abcdesktop.io
* Version: 0.2
* SPDX-FileCopyrightText: Copyright (c) 2020-2021 Orange
* SPDX-License-Identifier: GPL-2.0-only
*
* This software is distributed under the GNU General Public License v2.0 only
* see the "license.txt" file for more details.
*
* Author: abcdesktop.io team
* Software description: cloud native desktop service
*/
let DEFAULT_EXECMODE;
const method = 'ocrun';
var fs = require('fs');
var util = require('util');
const path = require('path');
const os = require('os');

function logme( data )
{
    console.log( data );	
    fs.appendFileSync("/var/log/desktop/ocrun.log", util.inspect(data));
}


const networkInterfaces = os.networkInterfaces();
let firstNotLoIface = '';

// This should always return eth0
// get Eth0 Or First inteface Not Loopback Inteface
function getEth0OrFirstNotLoIface(){
        if('eth0' in networkInterfaces) return 'eth0';

        Object.keys(networkInterfaces).forEach(i => {
                if( i !== 'lo'){
                        console.log(i);
                        return i;
                }
        });
}

function broadcastevent(data) {

    try {
    	let WebSocketClient = require('ws');
	let broadcast_tcp_port = process.env.BROADCAST_SERVICE_TCP_PORT || 29784;
	let target = process.env.CONTAINER_IP_ADDR || networkInterfaces[firstNotLoIface][0].address;
        let buri = "ws://" + target + ":" + broadcast_tcp_port;
	let headers = {};
        if (process.env.BROADCAST_COOKIE) {
                // console.log( 'add broadcast_cookie: ' + process.env.BROADCAST_COOKIE );
                headers = { 'broadcast_cookie': process.env.BROADCAST_COOKIE };
        }
	const protocols = [];
        // WebSocketClient { 'headers': headers } only in nodejs
        let ws = new WebSocketClient(buri, protocols, { 'headers': headers } );

    	ws.on('open', function open() {
        	try {
            		ws.send(JSON.stringify(data));
            		ws.close();
        	} catch (err) {
            		logme(err);
        	}
    	});
    }
    catch (err) {
            logme(err);
    }
}


if (process.argv.length < 2) {
	console.log('invalid params exit(1) ');
	process.exit(1);	
}

const image = path.basename(process.argv[1]);
var args;

for (var i=2; i<process.argv.length; ++i) {
	if (args)
		args += ' ';
	else
	    args = '';
	args += process.argv[i];
}

// Read env vars
const pod_name = process.env.POD_NAME;
const pod_namespace = process.env.POD_NAMESPACE;
const execmode = process.env.EXECMODE || DEFAULT_EXECMODE;
const launch = process.env.LAUNCH || image;



// get Eth0 Or First inteface Not Loopback Inteface
firstNotLoIface=getEth0OrFirstNotLoIface();

const data = { method: method, data:{ 'launch': launch, 'execmode': execmode, 'image': image, 'args':args, 'pod_name': pod_name, 'pod_namespace': pod_namespace }};

logme( data );
broadcastevent( data );

