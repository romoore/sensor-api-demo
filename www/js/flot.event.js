	/* Event drawing plugin for flot */
	
	(function ($) {

		var options = {
			transmitter: null,
			binaryEvents : null,
			rssiMin: -100,
			rssiMax: -40
		};


		/* flot will call this when a plot is created */
		function init(plot){
			var bEvents = null;
			var txId = null;
			var rssiMin = -100;
			var rssiMax = 0;

			function mapOptions(plot, options){
				if(options.binaryEvents){
					bEvents = binaryEvents;
				}
				if(options.transmitter){
					txId = options.transmitter;
				}
				if(options.rssimin){
					rssiMin = options.rssiMin;
				}
				if(options.rssiMax){
					rssiMax = options.rssiMax;
				}

				plot.hooks.draw.push(drawEvents);
			}

			/* Hook (draw) function to render events */
			function drawEvents(plot, ctx){
				var events = bEvents[txId];
				if(typeof events === 'undefined' || events == null){
					return ;
				}
				ctx.save();
					$.each(events,function(idx,pts){
						var tl = plot.pointOffset({x:pts[0],y:rssiMax});
						var br = plot.pointOffset({x:(pts.length > 1 ? pts[1] : 0),y:rssiMin});
						var height = plot.height();
						var width = plot.width();
						
						ctx.fillStyle = "rgba(70,70,255,0.1)";
						ctx.fillRect(tl.left,tl.top,br.left-tl.left,height);
					});
				ctx.restore();
			}
			
			plot.hooks.processOptions.push(mapOptions);
		}
		$.plot.plugins.push({
			init: init,
			options: options,
			name: "opDrawEvents",
			version: "0.1"
		});
	})(jQuery);

