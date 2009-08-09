importPackage(Packages.java.lang);
importPackage(Packages.java.util);
importPackage(Packages.java.text);
importPackage(Packages.java.io);
importPackage(Packages.java.net);
importPackage(net.sf.epgss.utils);

function grab(channels) {
	Log.log("Starting media.dir.bg grabber...");
	
	var htmlString = HTML.getHTML(new URL("http://media.dir.bg/tv.php?step=1&f_tv[]=all&f_week[]=0&f_sub=&f_search="), "WINDOWS-1251");
	Log.log("1 of 3: Content grabbed (schedule for next 7 days).");

	var html = new XML(Utils.trim(htmlString.substring(39))); // Bug 336551 
	Log.log("2 of 3: Content HTML parsed.");
	
	if(channels == undefined || channels == null)
		channels = [];
	
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
			}
		}
	}

	Log.log("3 of 3: Channels extracted (" + channels.length + ").");

	return channels;
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
