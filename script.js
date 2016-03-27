var languagesAdded=0;
var result=[];
var lastEditableString;

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

function parseStrings(file, locale) {
	var parser=new DOMParser();
	var xmlDoc=parser.parseFromString(file,"text/xml");
	var strings=xmlDoc.getElementsByTagName("string");
	for (var i = 0, arrayLength = strings.length; i < arrayLength; i++) {
		var node=strings[i].childNodes[0];
		var obj={value:node.nodeValue};
		if (result[strings[i].getAttribute('name')] == null) {
			result[strings[i].getAttribute('name')]=[];
		}
		result[strings[i].getAttribute('name')][languagesAdded]=obj;
	}
	languagesAdded++;
	drawTable(result);
}

function onItemClicked(item, locale) {
	//alert(locale + ": " + item.innerHTML);
	//item.style.color = "red";
	lastEditableString = item.innerHTML;
	item.innerHTML="<input style='background: none; border: none; width: 100%;' type='text' value='" + item.innerHTML + "' onblur='onItemBlur(this, " + locale + ")'/>";
	item.children[0].onkeypress = function(e){
		if (!e) e = window.event;
		var keyCode = e.keyCode || e.which;
		if (keyCode == '13'){
			// Enter pressed
			//onItemBlur(this, locale);
			this.blur();
			return false;
		}
	}
	item.children[0].focus();
	item.onclick="";
}

function onItemBlur(item, locale) {
	var cell = item.parentElement;
	if (lastEditableString != item.value) {
		cell.style.background="#9C9";
	}
	cell.innerHTML=item.value;
	cell.onclick=function(){ onItemClicked(this, locale); };
}

function drawTable(strings) {
	var html="<table cellpadding='4' style='table-layout: fixed; white-space:pre-wrap; word-wrap: break-word; width:100%;'>"
	var i = 0;
	for (var name in strings) {
		html+="<tr style='background-color: #" + (i%2==0 ? "CCC" : "EEE") + "'><td style='width: 300px;'>" + name + "</td>";
		for (j = 0; j < languagesAdded; j++) {
			var str = "";
			var style = "background-color: #C66";
			if (strings[name][j] != null) {
				str = strings[name][j].value;
				style = "";
			}
			html+="<td style='" + style + "' onclick='onItemClicked(this, " + j + ")'>" + str + "</td>";
		}
		html+="</tr>";
		i++;
	}
	html+="</table>"
	document.getElementById('tere').innerHTML = html;
}



  document.getElementById('fileinput').addEventListener('change', readSingleFile, false);