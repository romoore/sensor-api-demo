var sensorViz = function(){

	var $canvas = $('#canvas');

	var $chartContainer = $('#chart-container');
	function genOptions(title){
		return {yaxis:{min:-100,max:0},xaxis:{min:-60,max:0},shadowSize:0};
	}
	var colors = ['#00f','#3f0','#f6c','#f00','#90c','#c60','#6fc','#090','#993','#ff0','#906','#f60'];
	var colorIndex = 0;
	var rxColors = {};

	var start = Date.now();
	var latest = 0;
	var lastUpdate = 0;
	var maxAge = 60;
	/* Limit to 30 transmitters on-screen at a time */
	var maxTx = 30;
	/* Current number of plots on the screen */
	var numTx = 0;
	/* txid -> true */
	var currentTxers = {};
	/* txid -> [{label:xxx,data:xxx},{...}] */
	var chartData = {};
	/* txid -> {rxId -> [[ts,rssi],[ts,rssi],...]} */
	var sensorData = {};

	/* txId -> flot chart */
	var plots = {};
	this.updateSensors = function(jsonData){
		var currentTime = Date.now();
		// Go through each data that came back
		$.each(jsonData,function(idx,rssiDatum){
			// For each one, dump the data into a per-receiver array of points
	
			/* No previous RSSI data for this txer, create a new dictionary */
			if(sensorData[rssiDatum.transmitter] == null){
				if(numTx >= maxTx){
					return true;
				}
				++numTx;
				sensorData[rssiDatum.transmitter] = {};
				chartData[rssiDatum.transmitter] = [];
			}
			/* No previous RSSI data from this receiver, create a new array */
			if(!sensorData[rssiDatum.transmitter][rssiDatum.receiver]){
				sensorData[rssiDatum.transmitter][rssiDatum.receiver] = [];
				if(!rxColors[rssiDatum.receiver]){
					rxColors[rssiDatum.receiver] = colors[colorIndex++];
				}
				chartData[rssiDatum.transmitter].push({label: 'Rx ' + rssiDatum.receiver,
					data: sensorData[rssiDatum.transmitter][rssiDatum.receiver],
					color: rxColors[rssiDatum.receiver]});
			}
			/* Push the timestamp (relative) and RSSI into the array */
			var ts = (currentTime - rssiDatum.timestamp)/1000;
			/* Update "latest" timestamp for next AJAX call */
			if(rssiDatum.timestamp > latest){
				latest = rssiDatum.timestamp;
			}
			sensorData[rssiDatum.transmitter][rssiDatum.receiver].push([ts,rssiDatum.rssi]);
		});

		/* All data is now in sensorData[tx][rx].
		* Need to drop any transmitters where only 1 receiver heard it.
		* This should reduce number of corrupt txid devices
		*/
		var now = (Date.now()-start)/1000;
		var delta = now - lastUpdate;
		$.each(sensorData,function(txId,mapByRx){
			$.each(mapByRx,function(rxId,data){
				data.sort(function(a,b){
					return a[0]-b[0];
				});
				var spliceUntil = -1;
				for(var i = 0; i < data.length; i++){
						data[i][0] -= delta;
						if(data[i][0] < -maxAge){
							spliceUntil = i;
						}
				}
				if(spliceUntil >=0){
					data.splice(0,spliceUntil+1);
				}
			});
			if(Object.keys(mapByRx).length < 2){
				delete sensorData[txId];
				delete chartData[txId];
			}
		});

		
		/*
		* Now go through each transmitter and plot its data.
		* 1. Create a new div if never plotted before.
		* 2. Add that div to the container
		* 3. Use flot to plot in that container
		*/
		$.each(sensorData,function(txId,mapByRx){
			var numRx = Object.keys(mapByRx).length;
			if(!currentTxers[txId]){
				currentTxers[txId] = numRx;
				$chartContainer.append($('<div class="col-xs-6 col-sm-6 col-md-4 col-lg-3"><h2>Tx '+txId+'</h2><div id="t-'+txId+'" class="rssi-plot"></div></div>'));
				plots[txId] = $.plot($('#t-'+txId),chartData[txId],genOptions(txId));
			}else {
				plots[txId].setData(chartData[txId]);
				if(numRx != currentTxers[txId]){
					currentTxers[txId] = numRx;
					plots[txId].setupGrid();
				}
				plots[txId].draw();
			}
		});

		lastUpdate = now;
	}

	window.addEventListener('resize',function(){
		$.each(plots,function(idx,plot){
			plot.resize();
			plot.setupGrid();
		});
	});

	return {
		update: this.updateSensors,
		latest: latest
	}
	
}();
$(document).ready(function(){
	var baseURL = "https://localhost:8443/sensor-api-demo/p/rssi/";
	var doUpdates = function(){
			var res = $.getJSON(baseURL+"since?since="+(sensorViz.latest+1)+"&callback=?");
			res.done(function(data){
				sensorViz.update(data);
			}).error(function(xhr,status){
				console.log(xhr);
			}).always(function(data){
				setTimeout(doUpdates,3000);
			});
		
	}

	doUpdates();
	});

