importPackage(Packages.java.lang);
importPackage(Packages.java.util);
importPackage(Packages.java.text);
importPackage(Packages.java.io);
importPackage(Packages.java.net);
importPackage(com.googlecode.epgss.utils);

function grab() {
	Log.log("Starting media.dir.bg grabber...");
	
	var categories = [
        {name: "automobile", param: "%C0%C2%D2%CE"},
        {name: "children", param: "%C4%C5%D2%D1%CA"},
        {name: "documentary", param: "%C4%CE%CA%D3%CC%C5%CD%D2%C0%CB%CD"},
        {name: "action", param: "%C5%CA%D8%DA%CD%C5%CA%D8%DA%CD"},
        {name: "comedy", param: "%CA%CE%CC%C5%C4%C8"},
        {name: "fashion", param: "%CC%CE%C4%C0"},
        {name: "music", param: "%CC%D3%C7%C8%CA"},
        {name: "news", param: "%CD%CE%C2%C8%CD"},
        {name: "serial", param: "%D1%C5%D0%C8%C0%CB"},
        {name: "sports", param: "%D1%CF%CE%D0%D2"},
        {name: "scifi", param: "%D4%C0%CD%D2%C0%D1%D2%C8%CA"},
        {name: "film", param: "%D4%C8%CB%CC"}
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
	
	// TODO XXX FIXME: COMPLETE BUMMER! 
	// Should be 0, but check this: http://www.linux-bg.org/cgi-bin/y/index.pl?page=article&id=advices&key=417556606&act=add_report&cmd=rate&plus=1
	// In the end, no one cares, pcounter is only used for status-reporting
	var pcounter = 1; 
	
	var year = new Date().getFullYear(); // XXX: Not perfect in the week around New Year
	var timeZone = TimeZone.getTimeZone("Europe/Sofia");
	var dateParser = new SimpleDateFormat("dd.MM.yyyy HH.mm", Locale.US);
	dateParser.setTimeZone(timeZone);

	var channel = null;
	var lastProgram = null;
	var channelDate, channelDateDDMM;

	//TODO: Why is this not finding anything???
	//log(html..tr.(td.span.@["class"] == "SiteDescription1").toXMLString());
	
	//log(html.body.table[2].tbody.tr[0].td[2].table[2].tbody.tr.toXMLString());
	//throw "debug-stop";
	
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

			if(programTimesChunk.length() != programNamesChunk.length()) {
				//log(tvChunk.td[0].toXMLString());
				//throw "debug-stop";
				log("SKIPPING channel \"" + channelName + "\": broken HTML");
				continue;
			}
			
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
