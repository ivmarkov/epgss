importPackage(Packages.java.util);
importPackage(Packages.java.text);
importPackage(Packages.java.io);
importPackage(net.sf.epgss.utils);

function format(channels, result) {
	Log.log("Starting MXF formatter...");

	var writer = new PrintWriter(new File(result), "UTF-8");

	try {
		writer.println("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
		writer.println("<MXF xmlns:sql=\"urn:schemas-microsoft-com:XML-sql\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">");
		printPreamble(writer);
		Log.log("1 of 4: Generated preamble.");

		writer.println("<With provider=\"EPGSS\">");
		writer.println(<Keywords/>.toXMLString());
		writer.println(<KeywordGroups/>.toXMLString());
		writer.println(<GuideImages/>.toXMLString());
		writer.println(<People/>.toXMLString());
		writer.println(<SeriesInfos/>.toXMLString());
		writer.println(<Seasons/>.toXMLString());
		
		//
		// Generate programs info first
		//
		
		writer.println("<Programs>");
		var pid = 1;
		for each (var channel in channels) {
			for each (var program in channel.programs) {
				var xml = 
					<Program id={pid} uid={"!Program!" + pid} title={program.name}/>;

				writer.println(xml.toXMLString());
				pid++;
			}
		}
		writer.println("</Programs>");
		Log.log("2 of 4: Generated programmes info.");

		//
		// Generate schedule next
		//
		
		writer.println(<Affiliates/>.toXMLString());
		
		writer.println("<Services>");
		var sid = 1;
		for each (var channel in channels) {
			var xml = 
				<Service id={"s" + sid} uid={"!Service!" + channel.name} name={channel.name} callSign={channel.name}/>;
				
			writer.println(xml.toXMLString());
			sid++;
		}
		writer.println("</Services>");

		var dateFormatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US);
		dateFormatter.setTimeZone(TimeZone.getTimeZone("UTC"));

		sid = 1;
		pid = 1;
		for each (var channel in channels) {
			var previousProgramEndTime = 0;
			var scheduleEntriesGroupOpened = false;
			
			for each (var program in channel.programs) {
				if(previousProgramEndTime != program.start.getTime()) {
					// New group of schedules
					
					if(scheduleEntriesGroupOpened)
						// Close the previous group of schedule entries
						writer.println("</ScheduleEntries>");
					
					// Open the new group
					writer.println("<ScheduleEntries service=\"s" + sid + "\">");
					scheduleEntriesGroupOpened = true;

					// Write the first entry in the group
					writer.println(<ScheduleEntry program={pid} startTime={dateFormatter.format(program.start)} duration={(program.end.getTime() - program.start.getTime())/1000}/>.toXMLString());
				} else {
					// Add to the existing group of schedules
					writer.println(<ScheduleEntry program={pid} duration={(program.end.getTime() - program.start.getTime())/1000}/>.toXMLString());
				}

				previousProgramEndTime = program.end.getTime();
				pid++;
			}
			
			if(scheduleEntriesGroupOpened)
				// Close the last group of schedule entries
				writer.println("</ScheduleEntries>");
				
			sid++;
		}
		Log.log("3 of 4: Generated schedule.");

		//
		// Finally, generate the lineups
		//

		writer.println("<Lineups>");
		writer.println("<Lineup id=\"l1\" uid=\"!Lineup!EPGSS\" name=\"EPGSS\" primaryProvider=\"!MCLineup!MainLineup\">");
		writer.println("<channels>");
		var sid = 1;
		for each (var channel in channels) {
			var xml = 
				<Channel service={"s" + sid} lineup="l1" number={sid} uid={"!Channel!EPGSS!" + sid}/>;
				
			writer.println(xml.toXMLString());
			sid++;
		}
		writer.println("</channels>");
		writer.println("</Lineup>");
		writer.println("</Lineups>");

		writer.println("</With>");
		writer.println("</MXF>");
		Log.log("4 of 4: Generated lineups.");
	} finally {
		writer.close();
	}
}

function printPreamble(writer) {
	// http://msdn.microsoft.com/en-us/library/dd776338.aspx#mxf_elements_and_attributes__amui
	var mcepgAssembly = 
		<Assembly name="mcepg" version="6.0.6000.0" cultureInfo="" publicKey="0024000004800000940000000602000000240000525341310004000001000100B5FC90E7027F67871E773A8FDE8938C81DD402BA65B9201D60593E96C492651E889CC13F1415EBB53FAC1131AE0BD333C5EE6021672D9718EA31A8AEBD0DA0072F25D87DBA6FC90FFD598ED4DA35E44C398C454307E8E33B8426143DAEC9F596836F97C8F74750E5975C64E2189F45DEF46B2A2B1247ADC3652BF5C308055DA9">
			<NameSpace name="Microsoft.MediaCenter.Guide">
			    <Type name="Lineup" />
			    <Type name="Channel" parentFieldName="lineup" />
			    <Type name="Service" />
			    <Type name="ScheduleEntry" groupName="ScheduleEntries" />
			    <Type name="Program" />
			    <Type name="Keyword" />
			    <Type name="KeywordGroup" />
			    <Type name="Person" groupName="People" />
			    <Type name="ActorRole" parentFieldName="program" />
			    <Type name="DirectorRole" parentFieldName="program" />
			    <Type name="WriterRole" parentFieldName="program" />
			    <Type name="HostRole" parentFieldName="program" />
			    <Type name="GuestActorRole" parentFieldName="program" />
			    <Type name="ProducerRole" parentFieldName="program" />
			    <Type name="GuideImage" />
			    <Type name="Affiliate" />
			    <Type name="SeriesInfo" />
			    <Type name="Season" />
			</NameSpace>
		</Assembly>;
		
	var mcstoreAssembly = 
		<Assembly name="mcstore" version="6.0.6000.0" cultureInfo="" publicKey="0024000004800000940000000602000000240000525341310004000001000100B5FC90E7027F67871E773A8FDE8938C81DD402BA65B9201D60593E96C492651E889CC13F1415EBB53FAC1131AE0BD333C5EE6021672D9718EA31A8AEBD0DA0072F25D87DBA6FC90FFD598ED4DA35E44C398C454307E8E33B8426143DAEC9F596836F97C8F74750E5975C64E2189F45DEF46B2A2B1247ADC3652BF5C308055DA9">
			<NameSpace name="Microsoft.MediaCenter.Store">
		    	<Type name="Provider" />
		    	<Type name="UId" parentFieldName="target" />
		    </NameSpace>
		</Assembly>;
		
	var providers = 
		<Providers>
			<Provider id="EPGSS" name="EPGSS" displayName="EPG Screen Scraper" copyright="© 2008-2009 Ivan Markov. All Rights Reserved."/>
		</Providers>;
	
	writer.println(mcepgAssembly.toXMLString());
	writer.println(mcstoreAssembly.toXMLString());
	writer.println(providers.toXMLString());
}
