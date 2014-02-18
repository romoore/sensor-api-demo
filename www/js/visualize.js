var sensorViz = function(){


	var $canvas = $('#canvas');
	var maxCanvHeight = 240;
	if(maxChartHeight){
		maxCanvHeight = maxChartHeight;

	}
	var millisPerPixel = 100; // Single chart
	var millisPerLine = 15000;
	if(typeof multiChart !== 'undefined'){
		millisPerPixel = 400;
		millisPerLine = 30000;
	}

	var $chartContainer = $('#chart-container');
	var colors = ['#00f','#3f0','#f6c','#f00','#90c','#c60','#6fc','#090','#993','#ff0','#906','#f60'];
	var colorIndex = 0;
	var rxColors = {};

	var chartOptions = {
		rssiMin : -100,
		rssiMax : -40,
		maxAgeSec : 120
	};

	var start = Date.now();
	var latest = 0;
	var lastUpdate = 0;

	/* txId -> [[start,end],...] for binary events */
	var binaryEvents = {};
	/* Limit to 30 transmitters on-screen at a time */
	var maxTx = 30;
	/* Current number of plots on the screen */
	var numTx = 0;
	/* txid -> true */
	var currentTxers = {};
	/* txid -> {rxId -> [[ts,rssi],[ts,rssi],...]} */
	var sensorDataRaw = {};
	/* txid -> {rxId -> TimeSeries} */
	var timeSeries = {};

	/* txId -> flot chart */
	var plots = {};
	/* flot chart -> txId */
	var plotsR = {};

	var txNames = {};
	
	function restoreFromStorage(){
		if(typeof window.localStorage !== 'undefined'){
			var tn = window.localStorage.getItem('txNames');
			if(typeof tn !== 'undefined' && tn != null){
				txNames = JSON.parse(tn);
			}
		}
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
			var sD = window.sessionStorage.getItem('sensorDataRaw');
			if(typeof sD !== 'undefined' && sD != null){
				sensorDataRaw = JSON.parse(sD);
				var count = 0;
				$.each(sensorDataRaw,function(txId,rxMap){
					timeSeries[txId] = {};
					$.each(rxMap,function(rxId,data){
						timeSeries[txId][rxId]=new TimeSeries();
						$.each(data,function(idx,arr){
							timeSeries[txId][rxId].append(arr[0],arr[1]);
						});
					});
				});
			}
			var nt = window.sessionStorage.getItem('numTx');
			if(typeof nt !== 'undefined' && nt != null){
				numTx = JSON.parse(nt);
			}
			var lu = window.sessionStorage.getItem('lastUpdate');
			if(typeof lu !== 'undefined' && lu != null){
				lastUpdate = JSON.parse(lu);
			}
			var be = window.sessionStorage.getItem('binaryEvents');
			if(typeof be !== 'undefined' && be != null){
				binaryEvents = JSON.parse(be);
			}

		}
	}

	function saveToStorage(){
		if(typeof window.sessionStorage !== 'undefined'){
			window.sessionStorage.setItem('start',JSON.stringify(start));
			window.sessionStorage.setItem('sensorDataRaw',JSON.stringify(sensorDataRaw));
			window.sessionStorage.setItem('lastUpdate',JSON.stringify(lastUpdate));
			window.sessionStorage.setItem('colors',JSON.stringify(colors));
			window.sessionStorage.setItem('colorIndex',JSON.stringify(colorIndex));
			window.sessionStorage.setItem('rxColors',JSON.stringify(rxColors));
			window.sessionStorage.setItem('numTx',JSON.stringify(numTx));
			window.sessionStorage.setItem('binaryEvents',JSON.stringify(binaryEvents));
		}
		if(typeof window.localStorage !== 'undefined'){
			window.localStorage.setItem('txNames',JSON.stringify(txNames));
		}
	}


//	window.sessionStorage.clear();
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
			if(sensorDataRaw[rssiDatum.transmitter] == null){
				if(numTx >= maxTx){
					return true;
				}
				++numTx;
				sensorDataRaw[rssiDatum.transmitter] = {};
				timeSeries[rssiDatum.transmitter] = {};
			}
			/* No previous RSSI data from this receiver, create a new array */
			if(!sensorDataRaw[rssiDatum.transmitter][rssiDatum.receiver]){
				sensorDataRaw[rssiDatum.transmitter][rssiDatum.receiver] = [];
				timeSeries[rssiDatum.transmitter][rssiDatum.receiver] = new TimeSeries();
				if(!rxColors[rssiDatum.receiver]){
					rxColors[rssiDatum.receiver] = colors[colorIndex++];
				}
			}
			sensorDataRaw[rssiDatum.transmitter][rssiDatum.receiver].push([rssiDatum.timestamp,rssiDatum.rssi]);
			timeSeries[rssiDatum.transmitter][rssiDatum.receiver].append(rssiDatum.timestamp,rssiDatum.rssi);
		});

		
		/*
		* Now go through each transmitter and plot its data.
		* 1. Create a new div if never plotted before.
		* 2. Add that div to the container
		* 3. Use flot to plot in that container
		*/
		$.each(sensorDataRaw,function(txId,mapByRx){
			if(typeof detailTxId !== 'undefined' && detailTxId != txId){
				return true;
			}
			var numRx = Object.keys(mapByRx).length;
			if(!currentTxers[txId]){
				currentTxers[txId] = numRx;
				/* If showing only 1, then make its container big! */
				var txName = 'Tx ' + txId;
				var showName = false;
				if(typeof txNames[txId] !== 'undefined' && txNames[txId] != null){
					txName = txNames[txId];
					showName = true;
				}
				if(typeof detailTxId !== 'undefined'){
					$chartContainer.append($('<h2><span class="editable" id="edit-t-'+txId+'">'+txName+'</span>'+(showName?' <small>('+txId+')</small>':'')+'</h2><canvas id="t-'+txId+'" class="rssi-plot rssi-plot-detail" width="720"></canvas>'));
				}else {
					$chartContainer.append($('<div class="col-xs-6 col-sm-6 col-md-4 col-lg-3"><h2><span class="editable" id="edit-t-'+txId+'">'+txName+'</span> '+(showName?' <small>('+txId+')</small>':'')+'</h2><a href="details.php?t='+txId+'"><canvas id="t-'+txId+'" class="rssi-plot"></canvas></a></div>'));
				}
				$('#edit-t-'+txId).inlineEdit({
					save: function(event,hash,widget){
						txNames[txId] = hash.value;
						saveToStorage();
					},
					buttons:'<a href="#" class="save"><span class="glyphicon glyphicon-ok"></span></a>'
						+'<a href="#" class="cancel"><span class="glyphicon glyphicon-remove"></span></a>'
				});
				plots[txId] = new SmoothieChart(
						{
							millisPerPixel: millisPerPixel,
							grid: {
								verticalSections: 7,
								millisPerLine: millisPerLine
							},
							maxValue: -40,
							minValue: -100,
							timestampFormatter: SmoothieChart.timeFormatter,
							maxDataSetLength: 10000
						});
				plots[txId].streamTo(document.getElementById('t-'+txId),1000);
				resize(null,txId);
				plotsR[plots[txId]] = txId;
				$.each(timeSeries[txId],function(rxId,series){
					plots[txId].addTimeSeries(series, {lineWidth: 1, strokeStyle: rxColors[rxId]});
				});
			}
		});

		saveToStorage();
	} /* updateSensors(jsonData) */

	this.updateBinEvents = function(jsonData){
		var currentTime = jsonData[jsonData.length-1].ts; //Date.now();
		latest = currentTime;
		updateDataTimestamps();
		if(jsonData){
			$.each(jsonData,function(idx,binEvt){
				var txId = binEvt.tx;
				var isOn  = binEvt.ev;
				var evtArr = binaryEvents[txId];
				if(typeof evtArr == 'undefined' || evtArr == null){
					binaryEvents[txId] = [];
					evtArr = binaryEvents[txId];
				}

				// STarting a new event: empty array OR last array element "finished"
				if(isOn && (evtArr.length == 0 || evtArr[evtArr.length-1].length == 2)){
					var time = (binEvt.ts - currentTime)/1000;
					evtArr.push([time]);
				}else if(!isOn && evtArr.length != 0 && evtArr[evtArr.length-1].length == 1){
					var time = (binEvt.ts - currentTime)/1000;
					evtArr[evtArr.length-1].push(time);
				}
			});
		}

	}; /* updateBinEvents(jsonData) */

	function updateDataTimestamps(){
		var now = Date.now()-start;
		var oldest = Date.now() - (chartOptions.maxAgeSec*1000);
		var delta = now - lastUpdate;
		lastUpdate = now;
		$.each(sensorDataRaw,function(txId,mapByRx){
			$.each(mapByRx,function(rxId,data){
				var spliceUntil = -1;
				for(var i = 0; i < data.length; i++){
						if(data[i][0] < oldest){
							spliceUntil = i;
						}
				}
				if(spliceUntil >=0){
					data.splice(0,spliceUntil+1);
				}
			});
		});

		$.each(binaryEvents,function(txId,evtArr){
			var spliceUntil = -1;
			$.each(evtArr,function(idx,pts){
				pts[0] -= delta;
				if(pts[0] < -chartOptions.maxAgeSec){
					pts[0] = -chartOptions.maxAgeSec;
				}
				if(pts.length > 1){
					pts[1] -= delta;
					if(pts[1] < -chartOptions.maxAgeSec){
						spliceUntil = idx;
					}
				}
			});
			if(spliceUntil >= 0){
				evtArr.splice(0,spliceUntil+1);
			}
		});

	}


	function resize(evt,txId){
		if(typeof txId !== 'undefined'){
				var $can = $('#t-'+txId);
				var $par = $can.parent();
				$can.attr('width',$par.innerWidth());
				$can.attr('height',maxCanvHeight);
		}else {
			$('.rssi-plot').each(function(idx,canvas){
				var $can = $(canvas);
				var $par = $can.parent();
				$can.attr('width',$par.innerWidth());
				$can.attr('height',maxCanvHeight);
			});
		}
	}

	window.addEventListener('resize',resize,false);

	return {
		update: this.updateSensors,
		updateBinEvt: this.updateBinEvents,
			tick: updateDataTimestamps,
		latest: latest,
		restore: restoreFromStorage,
		save: saveToStorage,
		options: chartOptions
	}
	
}();
$(document).ready(function(){
	var baseURL = "https://localhost:8443/sensor-api-demo/p/";
	var updateCount = -1;

	/* Configure inline-edits */
	$.inlineEdit.defaults['hover'] = '';

	var doUpdates = function(){
		var selectTxer = '';
		/*
	  if(typeof detailTxId !== 'undefined'){
			selectTxer = '&txid='+detailTxId;
		}
		*/
		if((updateCount = (updateCount+1)%3) == 0){


			var res = $.getJSON(baseURL+"rssi/since?since="+(sensorViz.latest+1)+selectTxer+"&callback=?");
			res.done(function(data){
				sensorViz.update(data);
			}).error(function(xhr,status){
				console.log(xhr);
			}).always(function(data){
				setTimeout(doUpdates,500);
			});
		}	else {
			var res = $.getJSON(baseURL+"evt/since?since="+(sensorViz.latest+1)+"&callback=?");
			res.done(function(data){
				sensorViz.updateBinEvt(data);
			}).error(function(xhr,status){
				console.log(xhr);
			}).always(function(data){
				setTimeout(doUpdates,500);
			});
		}
	}
	sensorViz.restore();

	doUpdates();
});

