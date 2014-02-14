var sensorViz = function(){

	var $canvas = $('#canvas');

	var $chartContainer = $('#chart-container');
	function genOptions(title){
		return {yaxis:{min:-100,max:-40},xaxis:{min:-60,max:0},shadowSize:0,legend:{position:"nw",noColumns: 2}};
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

	function restoreFromStorage(){
		if(typeof window.sessionStorage !== 'undefined'){
			var col = window.sessionStorage.getItem('colors');
			if(typeof col !== 'undefined' && col != null){
				colors = JSON.parse(col);
			}
			var cI = window.sessionStorage.getItem('colorIndex');
			if(typeof cI !== 'undefined' && col != null){
				colorIndex = JSON.parse(cI);
			}
			var rxC = window.sessionStorage.getItem('rxColors');
			if(typeof rxC !== 'undefined' && rxC != null){
				rxColors = JSON.parse(rxC);
			}
			var st = window.sessionStorage.getItem('start');
			if(typeof st !== 'undefined' && st != null){
				start = JSON.parse(st);
			}
			var sD = window.sessionStorage.getItem('sensorData');
			if(typeof sD !== 'undefined' && sD != null){
				sensorData = JSON.parse(sD);
			}
			var lu = window.sessionStorage.getItem('lastUpdate');
			if(typeof lu !== 'undefined' && lu != null){
				lastUpdate = JSON.parse(lu);
			}

			/* Rebuild chartData */
			$.each(sensorData,function(txId,rxMap){
				chartData[txId] = [];
				$.each(rxMap,function(rxId,dataArr){
					chartData[txId].push({label: 'Rx ' + rxId,
						data: dataArr,
						color: rxColors[rxId]});
				});
			});
		}
	}

	function saveToStorage(){
		if(typeof window.sessionStorage !== 'undefined'){
			window.sessionStorage.setItem('start',JSON.stringify(start));
			window.sessionStorage.setItem('sensorData',JSON.stringify(sensorData));
			window.sessionStorage.setItem('lastUpdate',JSON.stringify(lastUpdate));
			window.sessionStorage.setItem('colors',JSON.stringify(colors));
			window.sessionStorage.setItem('colorIndex',JSON.stringify(colorIndex));
			window.sessionStorage.setItem('rxColors',JSON.stringify(rxColors));
		}
	}


//	window.sessionStorage.clear();
	/* txId -> flot chart */
	var plots = {};
	this.updateSensors = function(jsonData){
		var currentTime = jsonData[jsonData.length-1].timestamp; //Date.now();
		latest = currentTime;
		/* All data is now in sensorData[tx][rx].
		* Need to drop any transmitters where only 1 receiver heard it.
		* This should reduce number of corrupt txid devices
		*/
		updateDataTimestamps();
		// Go through each data that came back
		$.each(jsonData,function(idx,rssiDatum){
			// If we're showing only one transmitter, skip the others
/*			if(typeof detailTxId !== 'undefined' && rssiDatum.transmitter != detailTxId){
				return true;
			}
			*/
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
			var ts = (rssiDatum.timestamp - currentTime)/1000;

			console.log(currentTime + '-'+rssiDatum.timestamp + ' = ' + ts);
			/* Update "latest" timestamp for next AJAX call */
/*			if(rssiDatum.timestamp > latest){
				latest = rssiDatum.timestamp;
			}
*/
			sensorData[rssiDatum.transmitter][rssiDatum.receiver].push([ts,rssiDatum.rssi]);
		});

		$.each(sensorData,function(txId,rxMap){
			$.each(rxMap,function(rxId,data){
				data.sort(function(a,b){
					return a[0]-b[0];
				});
			});
		});


		
		/*
		* Now go through each transmitter and plot its data.
		* 1. Create a new div if never plotted before.
		* 2. Add that div to the container
		* 3. Use flot to plot in that container
		*/
		$.each(sensorData,function(txId,mapByRx){
			if(typeof detailTxId !== 'undefined' && detailTxId != txId){
				return true;
			}
			var numRx = Object.keys(mapByRx).length;
			if(!currentTxers[txId]){
				currentTxers[txId] = numRx;
				/* If showing only 1, then make its container big! */
				if(typeof detailTxId !== 'undefined'){
					$chartContainer.append($('<h2>Tx '+txId+'</h2><div id="t-'+txId+'" class="rssi-plot rssi-plot-detail"></div>'));
				}else {
					$chartContainer.append($('<div class="col-xs-6 col-sm-6 col-md-4 col-lg-3"><h2>Tx '+txId+'</h2><a href="details.php?t='+txId+'"><div id="t-'+txId+'" class="rssi-plot"></div></a></div>'));
				}
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

		saveToStorage();
	}
	function updateDataTimestamps(){
		var now = (Date.now()-start)/1000;
		var delta = now - lastUpdate;
		lastUpdate = now;
		$.each(sensorData,function(txId,mapByRx){
			$.each(mapByRx,function(rxId,data){
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

		$.each(plots,function(txId,plot){
			if(typeof chartData[txId] !== 'undefined'){
				plot.setData(chartData[txId]);
				plot.draw();
			}
		});
	}

	window.addEventListener('resize',function(){
		$.each(plots,function(idx,plot){
			plot.resize();
			plot.setupGrid();
		});
	});

	return {
		update: this.updateSensors,
			tick: updateDataTimestamps,
		latest: latest,
		restore: restoreFromStorage,
		save: saveToStorage
	}
	
}();
$(document).ready(function(){
	var baseURL = "https://localhost:8443/sensor-api-demo/p/rssi/";
	var updateCount = -1;
	var doUpdates = function(){
		var selectTxer = '';
		/*
	  if(typeof detailTxId !== 'undefined'){
			selectTxer = '&txid='+detailTxId;
		}
		*/
		if((updateCount = (updateCount+1)%3) == 0){


			var res = $.getJSON(baseURL+"since?since="+(sensorViz.latest+1)+selectTxer+"&callback=?");
			res.done(function(data){
				sensorViz.update(data);
			}).error(function(xhr,status){
				console.log(xhr);
			}).always(function(data){
				setTimeout(doUpdates,1000);
			});
		}	else {
			sensorViz.tick();
			setTimeout(doUpdates,1000);
		}
		console.log(updateCount);
		
	}
	sensorViz.restore();

	doUpdates();
});

