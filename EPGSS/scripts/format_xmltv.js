importPackage(Packages.java.util);
importPackage(Packages.java.text);
importPackage(Packages.java.io);
importPackage(com.googlecode.epgss.utils);

function format(channels, result) {
	Log.log("Starting XMLTV formatter...");

	var writer = new PrintWriter(new File(result), "UTF-8");

	try {
		writer.println("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
		printDocType(writer);
		Log.log("1 of 3: Generated DTD.");

		writer.println("<tv generator-info-name=\"EPGSS\">");
		
		// Generate channel info first
		for each (var channel in channels) {
			var xml = 
				<channel id={channel.name}>
					<display-name lang="en">{channel.name}</display-name>
				</channel>;
				
			writer.println(xml.toXMLString());
		}
		Log.log("2 of 3: Generated channels info.");
		
		var timeZone = TimeZone.getTimeZone("Europe/Sofia");
		var dateFormatter = new SimpleDateFormat("yyyyMMddHHmmss Z", Locale.US);
		dateFormatter.setTimeZone(timeZone);

		// Generate programs info next
		for each (var channel in channels) {
			for each (var program in channel.programs) {
				var xml = 
					<programme start={dateFormatter.format(program.start)} end={dateFormatter.format(program.end)} channel={channel.name}>
						<title lang="en">{program.name}</title>
					</programme>;

				writer.println(xml.toXMLString());
			}
		}

		writer.println("</tv>");
		Log.log("3 of 3: Generated programmes info.");
	} finally {
		writer.close();
	}
}

function printDocType(writer) {
	// http://xml.coverpages.org/XMLTV-DTD-20021210.html	
	writer.println("<!DOCTYPE tv [");
	writer.println("<!ELEMENT tv (channel*, programme*)>");
	writer.println("<!ATTLIST tv date   CDATA #IMPLIED");
	writer.println("             source-info-url     CDATA #IMPLIED");
	writer.println("             source-info-name    CDATA #IMPLIED");
	writer.println("             source-data-url     CDATA #IMPLIED");
	writer.println("             generator-info-name CDATA #IMPLIED");
	writer.println("             generator-info-url  CDATA #IMPLIED >");
	writer.println("<!ELEMENT channel (display-name+, icon*, url*) >");
	writer.println("<!ATTLIST channel id CDATA #REQUIRED >");
	writer.println("<!ELEMENT display-name (#PCDATA)>");
	writer.println("<!ATTLIST display-name lang CDATA #IMPLIED>");
	writer.println("<!ELEMENT url (#PCDATA)>");
	writer.println("<!ELEMENT programme (title+, sub-title*, desc*, credits?, date?,");
	writer.println("                     category*, language?, orig-language?, length?,");
	writer.println("                     icon*, url*, country*, episode-num?, video?, audio?,");
	writer.println("                     previously-shown?, premiere?, last-chance?, new?,");
	writer.println("                     subtitles*, rating*, star-rating? )>");
	writer.println("<!ATTLIST programme start     CDATA #REQUIRED");
	writer.println("                    stop      CDATA #IMPLIED");
	writer.println("                    pdc-start CDATA #IMPLIED");
	writer.println("                    vps-start CDATA #IMPLIED");
	writer.println("                    showview  CDATA #IMPLIED");
	writer.println("                    videoplus CDATA #IMPLIED");
	writer.println("                    channel   CDATA #REQUIRED");
	writer.println("                    clumpidx  CDATA \"0/1\" >");
	writer.println("<!ELEMENT title (#PCDATA)>");
	writer.println("<!ATTLIST title lang CDATA #IMPLIED>");
	writer.println("<!ELEMENT sub-title (#PCDATA)>");
	writer.println("<!ATTLIST sub-title lang CDATA #IMPLIED>");
	writer.println("<!ELEMENT desc (#PCDATA)>");
	writer.println("<!ATTLIST desc lang CDATA #IMPLIED>");
	writer.println("<!ELEMENT credits (director*, actor*, writer*, adapter*, producer*,");
	writer.println("                   presenter*, commentator*, guest* )>");
	writer.println("<!ELEMENT director    (#PCDATA)>");
	writer.println("<!ELEMENT actor       (#PCDATA)>");
	writer.println("<!ELEMENT writer      (#PCDATA)>");
	writer.println("<!ELEMENT adapter     (#PCDATA)>");
	writer.println("<!ELEMENT producer    (#PCDATA)>");
	writer.println("<!ELEMENT presenter   (#PCDATA)>");
	writer.println("<!ELEMENT commentator (#PCDATA)>");
	writer.println("<!ELEMENT guest       (#PCDATA)>");
	writer.println("<!ELEMENT date (#PCDATA)>");
	writer.println("<!ELEMENT category (#PCDATA)>");
	writer.println("<!ATTLIST category lang CDATA #IMPLIED>");
	writer.println("<!ELEMENT language (#PCDATA)>");
	writer.println("<!ATTLIST language lang CDATA #IMPLIED>");
	writer.println("<!ELEMENT orig-language (#PCDATA)>");
	writer.println("<!ATTLIST orig-language lang CDATA #IMPLIED>");
	writer.println("<!ELEMENT length (#PCDATA)>");
	writer.println("<!ATTLIST length units (seconds | minutes | hours) #REQUIRED>");
	writer.println("<!ELEMENT icon EMPTY>");
	writer.println("<!ATTLIST icon src         CDATA #REQUIRED");
	writer.println("               width       CDATA #IMPLIED");
	writer.println("               height      CDATA #IMPLIED>"); 
	writer.println("<!ELEMENT value (#PCDATA)>");
	writer.println("<!ELEMENT country (#PCDATA)>");
	writer.println("<!ATTLIST country lang CDATA #IMPLIED>");
	writer.println("<!ELEMENT episode-num (#PCDATA)>");
	writer.println("<!ATTLIST episode-num system CDATA \"onscreen\">");
	writer.println("<!ELEMENT video (present?, colour?, aspect?)>");
	writer.println("<!ELEMENT present (#PCDATA)>");
	writer.println("<!ELEMENT colour (#PCDATA)>");
	writer.println("<!ELEMENT aspect (#PCDATA)>");
	writer.println("<!ELEMENT audio (present?, stereo?)>");
	writer.println("<!ELEMENT stereo (#PCDATA)>");
	writer.println("<!ELEMENT previously-shown EMPTY>");
	writer.println("<!ATTLIST previously-shown start   CDATA #IMPLIED");
	writer.println("                           channel CDATA #IMPLIED >");
	writer.println("<!ELEMENT premiere (#PCDATA)>");
	writer.println("<!ATTLIST premiere lang CDATA #IMPLIED>");
	writer.println("<!ELEMENT last-chance (#PCDATA)>");
	writer.println("<!ATTLIST last-chance lang CDATA #IMPLIED>");
	writer.println("<!ELEMENT new EMPTY>");
	writer.println("<!ELEMENT subtitles (language?)>");
	writer.println("<!ATTLIST subtitles type (teletext | onscreen) #IMPLIED>");
	writer.println("<!ELEMENT rating (value, icon*)>");
	writer.println("<!ATTLIST rating system CDATA #IMPLIED>");
	writer.println("<!ELEMENT star-rating (value, icon*)>");
	writer.println("]>");
}
