<?php

	function clean($elem){
		if(!is_array($elem)){
			$elem = htmlentities($elem,ENT_QUOTES,"UTF-8");
		}else {
			foreach($elem as $key => $value){
				$elem[$key] = clean($value);
			}
		}
		return $elem;
	}

	$_CLEAN['GET'] = clean($_GET);

	$txId = $_CLEAN['GET']['t'];
	if(preg_match('/^([0-9a-fA-F]+)$/',$txId) !== 1){
		header('Location: index.html');
		exit;
	}
?>
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<link type="text/css" rel="stylesheet" href="css/bootstrap.css">
		<link type="text/css" rel="stylesheet" href="css/jquery-ui.css">
		<link type="text/css" rel="stylesheet" href="css/custom.css">
		<title>Transmitter RSSI</title>
	</head>
	<body>
		<div class="container">
			<div class="row">
				<div class="col-md-12">
				<h1 style="border-bottom: 1px solid black;"><a href="index.html">Transmitter RSSI
							<small>Updated every 3 seconds</small></a></h1>
				<div id="chart-container"></div>
				</div>
			</div><!-- row -->
			<div id="scripts">
				<script src="js/jquery.js"></script>
				<script src="js/jquery-ui.js"></script>
				<script src="js/rAF.js"></script>
				<script src="js/verge.js"></script>
				<script src="js/jquery.flot.js"></script>	
				<script src="js/jquery.inlineedit.js"></script>
				<!--		<script src="js/particles.js"></script> -->
	
				<script>
					var detailTxId = "<?php echo $txId; ?>";
				</script>
				<script src="js/visualize.js"></script>
			</div>
		</div><!-- container -->
	</body>
</html>
