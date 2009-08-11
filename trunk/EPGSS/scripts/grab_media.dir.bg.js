importPackage(Packages.java.lang);
importPackage(Packages.java.util);
importPackage(Packages.java.text);
importPackage(Packages.java.io);
importPackage(Packages.java.net);
importPackage(com.googlecode.epgss.utils);

function grab() {
	Log.log("Starting media.dir.bg grabber...");
	
	var categories = [
        {name: "automobile", param: urlEncode("АВТО")},
        {name: "children", param: urlEncode("ДЕТСК")},
        {name: "documentary", param: urlEncode("ДОКУМЕНТАЛН")},
        {name: "action", param: urlEncode("ЕКШЪН")},
        {name: "comedy", param: urlEncode("КОМЕДИ")},
        {name: "fashion", param: urlEncode("МОДА")},
        {name: "music", param: urlEncode("МУЗИК")},
        {name: "news", param: urlEncode("НОВИН")},
        {name: "serial", param: urlEncode("СЕРИАЛ")},
        {name: "sports", param: urlEncode("СПОРТ")},
        {name: "scifi", param: urlEncode("ФАНТАСТИК")},
        {name: "film", param: urlEncode("ФИЛМ")}
	];
	
	var step = 0;
	var steps = categories.length + 1;
	
	function logStep(str) {
		Log.log((++step) + " of " + steps + ": " + str);
	};

	function logStepDetails(str) {
		if(str != undefined)
			Log.log(">> Done: " + str + ".");
		else
			Log.log(">> Done.");
	};

	//
	// First retrieve the programs uncategorized
	//
	
	logStep("Retrieving uncategorized list of all programs");
	var channels = grabPrograms("http://media.dir.bg/tv.php?step=1&f_tv[]=all&f_week[]=0&f_sub=&f_search=", logStepDetails);
	
	var channelsMap = mapPrograms(channels);
	logStepDetails("Programs map created");
	
	//
	// Now, iterate over all categories and re-retrieve the content for the specific category
	//
	
	for each (var category in categories) {
		logStep("Retrieving all programs in category \"" + category.name + "\"");
		var categorizedChannels = grabPrograms("http://media.dir.bg/tv.php?step=1&f_tv[]=all&f_week[]=0&f_sub=&f_search=" + category.param, logStepDetails);
		var counter = 0;
		for each (var channel in categorizedChannels) {
			for each (var program in channel.programs) {
				var originalProgram = channelsMap(channel, program);
				if(originalProgram != undefined) {
					if(originalProgram.categories == undefined)
						originalProgram.categories = {};
					
					originalProgram.categories[category.name] = true;
					counter++;
				}
			}
		}
		logStepDetails(counter + " programs categorized");
	}

	return channels;
}

function grabPrograms(url, log) {
	var htmlString = HTML.getHTML(new URL(url), "WINDOWS-1251");
	log("Content grabbed (schedule for next 7 days)");

	var html = new XML(Utils.trim(htmlString.substring(39))); // Bug 336551 
	log("Content HTML parsed");
	
	var channels = [];
	var pcounter = 0;
	
	var year = 2009; // TODO
	var timeZone = TimeZone.getTimeZone("Europe/Sofia");
	var dateParser = new SimpleDateFormat("dd.MM.yyyy HH.mm", Locale.US);
	dateParser.setTimeZone(timeZone);

	var channel = null;
	var lastProgram = null;
	var channelDate, channelDateDDMM;

	for each (var tvChunk in html.body.table[2].tbody.tr[0].td[2].table[2].tbody.tr) {
		if(tvChunk.td[0].b != <></>) { 
			// Channel heading
			var channelName = Utils.trim(tvChunk.td[0].b.text().substring(1)).toUpperCase();
			if(channel == null || channel.name != channelName) {
				// New channel
				channel = {};
				channel.name = channelName;
				channel.programs = [];
				channels.push(channel);

				lastProgram = null;
			}
			
			channelDate = tvChunk.td[1].text();
			channelDateDDMM = extract("\\d\\d\\.\\d\\d", channelDate);
		}
			
		if(tvChunk.td.span.(@["class"] == "SiteDescription1") != <></>) { 
			// Channel programs		
			var programTimesChunk = tvChunk.td.span.b;
			var programNamesChunk = tvChunk.td.text();

			for(var j = 0; j < programTimesChunk.length(); j++) {
				var program = {};
				
				program.name = Utils.trim(programNamesChunk[j].toXMLString());
									
				var programTime = programTimesChunk[j].text();
				var dateStr = channelDateDDMM + "." + year + " " + programTime;
				
				var jprogramStart = dateParser.parse(dateStr);
				if(lastProgram != null) {
					if(lastProgram.start.after(jprogramStart)) {
						// We are in the next date already
						var cal = Calendar.getInstance();
						cal.setTime(jprogramStart);
						cal.add(Calendar.DAY_OF_YEAR, 1);
						
						jprogramStart = cal.getTime();
					}
				
					// Update the end time of the previous program
					lastProgram.end = new Date(jprogramStart.getTime());
				}
								
				program.start = jprogramStart;
				program.end = new java.util.Date(jprogramStart.getTime() + 60*60*1000); // By default: assume the program will end within an hour
				
				lastProgram = program;
				
				program.channel = channel;
				channel.programs.push(program);
				
				pcounter++;
			}
		} 
		
		if(tvChunk.td.(@["class"] == "BlockLight").img != <></>) {
			// Channel logo image
			if(channel != null) {
				var imgs = tvChunk.td.(@["class"] == "BlockLight").img;
				channel.imageUrl = imgs[0].@src;
			}
		}
	}

	log(channels.length + " channels / " + pcounter + " programs extracted");

	return channels;
}

function mapPrograms(channels) {
	function key(channel, program) {
		return channel.name + ":" + program.start.getTime();
	}
	
	var map = {};
	for each (var channel in channels) {
		for each (var program in channel.programs) {
			map[key(channel, program)] = program;
		}
	}
	
	return function(channel, program) {
		return map[key(channel, program)];
	};
}

function urlEncode(str) {
	return URLEncoder.encode(str, "WINDOWS-1251");
}

function extract(mask, value) {
	var regexp = new RegExp(mask);
	var result = regexp.exec(value);
	if(result == null)
		return null;
		
	var s = "";
	for(var i = 0; i < result.length; i++)
		s += result[i];	
	
	return s;	
}
