var chart;
var chartData;
var result=[
	[]
];
var smth=[];
var skipStart=0, skipEnd=0;
var countStartDay=7;
var badNumberBelow=-20;
var excludeByDefault=-60;
var whiteList = [];
var lunchList = [];
var regexDate = /^([0-3]{0,1}[0-9]\.[0-1]{0,1}[0-9]\.([0-9]{2}){1,2})$/;

function readSingleFile(evt) {
	//Retrieve the first (and only!) File from the FileList object
	var filesCount = evt.target.files.length;
	for (var i = 0; i < filesCount; i++) {
		var f = evt.target.files[i]; 
	
		if (f) {
			var r = new FileReader();
			r.onload = function(e) {
				var contents = e.target.result;
				parseStrings(contents)
			}
			r.readAsText(f);
		} else {
    		alert("Failed to load file");
		}
	}
}

function parseStrings(file) {
	result = CSVToArray(file, ";");
	for (var i = 0; i < result.length; i++) {
		if (result[i][1]==20) {
			if (result[i][4] != "Credit repayment" && result[i][4] != "Krediidi tagasimakse" && result[i][4] != "Credit card repayment") { // desc[0] == "5470252600546433"
				var desc = result[i][4].split(" ");
				var date = parseDate(desc.length > 1 && regexDate.test(desc[1]) ? desc[1] : result[i][2]);
				if (date.getDate() < countStartDay) {
					date.setMonth(date.getMonth()-1);
				}
				var name = formatDateNumber(""+date.getMonth())+"."+date.getFullYear();
				var add = parseFloat((result[i][7] == "D" ? "-" : "") + result[i][5].replace(/,/g,'.'));
				if (smth[name] == null) {
					smth[name] = [];
					smth[name].transfers = [];
				}
				var old = smth[name].sum;
				smth[name].sum = ((old == null) ? 0 : old) + add;
				smth[name].transfers[smth[name].transfers.length] = {sum:add, user:result[i][3], excludeFromCount:(add<excludeByDefault ? !consistsListItem(result[i][3], whiteList) : false)};
			}
		}
	}
	drawTable();
}

function onCheckboxClicked(box, month, transferPos) {
	var transfer = smth[month].transfers[transferPos];
	transfer.excludeFromCount=!box.checked;
	drawTable();
}

function drawTable() {
	if (isEmpty(smth)) return;
	var arr = getChartData();
	drawChart(arr);
	
	var html="<table cellpadding='4' style='table-layout: fixed; white-space:pre-wrap; word-wrap: break-word; width:100%;'>";
	var even = false;
	var keys = getSortedMonthKeys(smth), len = keys.length;
	for (var pos = 0; pos < len; pos++) {
		var name = keys[pos];
		even = !even;
		html += "<tr id='" + name + "' style='background-color: #" + (even ? "CCC" : "EEE") + "; vertical-align: top;'><td style='width: 70px;'>" + name + "</td>";
		html += "<td style='width: 150px;'>: " + calcMonthSum(smth[name].transfers).sum.toFixed(2) + "<br />(" + calcMonthSum(smth[name].transfers).income.toFixed(2) + "/" + calcMonthSum(smth[name].transfers).outgo.toFixed(2) + ")</td>";
		html += "<td>";
		for (var i = 0; i < smth[name].transfers.length; i++) {
			var trans = smth[name].transfers[i].sum;
			var transUser = smth[name].transfers[i].user;
			html += "<input type='checkbox' " + (smth[name].transfers[i].excludeFromCount ? "" : "checked") + " onClick='onCheckboxClicked(this, \"" + name  + "\", " + i + ");'>";
			html += "<span style='color:" + (trans > 0 ? "green" : (trans < badNumberBelow ? "red" : "darkred")) + "'>" + trans + "</span>&nbsp;&nbsp;&#09";
			html += "<span style='color:" + (consistsListItem(transUser, lunchList) ? "darkgoldenrod" : "black") + "'>[" + transUser + "]</span><br />";
		}
		html += "</td>";
		html+="</tr>";
	}
	html+="</table>"
	document.getElementById('tere').innerHTML = html;
}

function getChartData() {
	var i = 0;
	var chartData = [];
	chartData.push(["Month", "Money", "In", "Out", "Lunch", "Avg"]);
	var avgMonthsInCount = [];
	var keys = getSortedMonthKeys(smth), len = keys.length;
	for (var pos = 0; pos < len; pos++) {
		var name = keys[pos];
		if (i < skipStart) {i++; continue;}
		var monthSum = calcMonthSum(smth[name].transfers);
		avgMonthsInCount.push(monthSum.sum);
		if (avgMonthsInCount.length > 6) {
			avgMonthsInCount.slice(0,1);
		}
		chartData.push([name, monthSum.sum, monthSum.income, monthSum.outgo, monthSum.lunch, calcAvarage(avgMonthsInCount)]);
		i++;
	}
	if (skipEnd > 0) chartData.splice(-skipEnd, skipEnd);
	return chartData;
}

function isEmpty(obj) {
    if (obj == null) return true;
    if (obj.length > 0)    return false;
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }
    return true;
}

function calcAvarage(numbersList) {
	var sum = 0;
	for (var i = 0; i < numbersList.length; i++) {
		sum += numbersList[i];
	}
	return sum/numbersList.length;
}

function calcMonthSum(transfers) {
	var sum = 0;
	var income = 0, outgo = 0, lunch = 0;
	for (var i = 0; i<transfers.length; i++) {
		if (!transfers[i].excludeFromCount) {
			var trans = transfers[i].sum;
			sum += trans;
			if (trans >= 0) {
				income += trans;
			} else {
				outgo += trans;
			}
			if (consistsListItem(transfers[i].user, lunchList)) {
				lunch += trans;
			}
		}
	}
	return {sum:sum, income:income, outgo:outgo, lunch:lunch};
}

function parseDate(input) {
	var parts = input.split('.');
	var year = formatDateNumber(parts[2]);
//	return /* formatDateNumber(parts[0]) + "." + */ formatDateNumber(parts[1]) + "." + (year.length == 2 ? "20"+year : year);
	return new Date(year.length == 2 ? "20"+year : year, formatDateNumber(parts[1]), formatDateNumber(parts[0]));
}

function formatDateNumber(nr) {
	return (nr.length == 1 ? "0" : "") + nr;
}

function consists(str, substr) {
	return str != null && str.indexOf(substr) > -1;
}

function consistsListItem(str, substrList) {
	for (var i = 0; i < substrList.length; i++) {
		if (consists(str, substrList[i])) {
			return true;
		}
	}
	return false;
}

function getSortedMonthKeys(list) {
	var keys = Object.keys(list);
	keys.sort(function(a, b){
		var splitA = a.split('.'), splitB = b.split('.');
		if (splitA[1] != splitB[1]) {
			return splitA[1] - splitB[1];
		}
		return splitA[0] - splitB[0];
	})
	return keys;
}

function CSVToArray(strData, strDelimiter) {
	strDelimiter = (strDelimiter || ",");
	var objPattern = new RegExp(
		(
			"(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
			"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
			"([^\"\\" + strDelimiter + "\\r\\n]*))"
		),
		"gi"
	);
	var arrData = [
		[]
	];
	var arrMatches = null;
	while (arrMatches = objPattern.exec(strData)) {
		var strMatchedDelimiter = arrMatches[1];
		if (
			strMatchedDelimiter.length &&
			strMatchedDelimiter !== strDelimiter
		) {
			arrData.push([]);
		}
		var strMatchedValue;
		if (arrMatches[2]) {
			strMatchedValue = arrMatches[2].replace(
				new RegExp("\"\"", "g"),
				"\""
			);
		} else {
			strMatchedValue = arrMatches[3];
		}
		arrData[arrData.length - 1].push(strMatchedValue);
	}
	return (arrData);
}

function drawChart(dataArray) {
	chartData = google.visualization.arrayToDataTable(dataArray);

	var options = {
		title: 'Money',
		smoothLine: true,
		curveType: 'none', // 'function',
		legend: {
			position: 'bottom'
		}
	};

	chart = new google.visualization.LineChart(document.getElementById('curve_chart'));
	google.visualization.events.addListener(chart, 'select', onChartClickHandler);

	chart.draw(chartData, options);
}

function onChartClickHandler() {
	var selection = chart.getSelection();
	var item = selection[0];
	if (item != null && item.row != null) {
		var value = chartData.getValue(item.row, 0);

		var bodyRect = document.body.getBoundingClientRect(),
			elemRect = document.getElementById(value).getBoundingClientRect(),
			offset = elemRect.top - bodyRect.top;

		window.scrollTo(0, offset);
		//alert(value);
	}
}


function onLoaded() {
	google.charts.load('current', {
		'packages': ['corechart']
	});
	document.getElementById('skipStart').oninput = onParametersChanged;
	document.getElementById('skipEnd').oninput = onParametersChanged;
	document.getElementById('countStartDay').oninput = onParametersChanged;
	document.getElementById('badNumberBelow').oninput = onParametersChanged;
	document.getElementById('excludeByDefault').oninput = onParametersChanged;
	document.getElementById('whiteList').oninput = onParametersChanged;
	document.getElementById('lunchList').oninput = onParametersChanged;
	initValues();
}

function onParametersChanged() {
	initValues();
	drawTable();
}

function initValues() {
	skipStart = document.getElementById('skipStart').value;
	skipEnd = document.getElementById('skipEnd').value;
	countStartDay = document.getElementById('countStartDay').value;
	badNumberBelow = document.getElementById('badNumberBelow').value;
	excludeByDefault = document.getElementById('excludeByDefault').value;
	whiteList = document.getElementById('whiteList').value.split("|");
	lunchList = document.getElementById('lunchList').value.split("|");
}


window.onload = onLoaded;
document.getElementById('fileinput').addEventListener('change', readSingleFile, false);
