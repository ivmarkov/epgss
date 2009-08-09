package net.sf.epgss;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Properties;

import net.sf.epgss.utils.Utils;

public class EPGSS {
	private File exeDirectory;
	private Properties properties;
	
	private EPGSS() {} // Singleton
	
	public static void main(String[] args) throws Exception {
		new EPGSS().run(args);
	}
	
	private void run(String[] args) throws Exception {
		if(args.length != 1)
			throw new IllegalArgumentException("Usage: epgss <output-file-name>");
		
		loadProperties();
		
		List<String> utilities = getPropertyList("utilities", false/*mandatory*/);
		String grabber = getProperty("grabber", true/*mandatory*/);
		String formatter = getProperty("formatter", true/*mandatory*/);
		
		JSScript input = new JSScript();
		JSScript output = new JSScript();

		load(input, utilities);
		load(input, grabber);
		
		load(output, utilities);
		load(output, formatter);

		work(input, output, args[0]);
	}

	private void work(JSScript input, JSScript output, String result) throws FileNotFoundException {
		output.call("format", input.call("grab", (Object)null), result);
	}
	
	private void loadProperties() throws IOException {
		exeDirectory = new File(System.getProperty("epgss.exedir") != null? System.getProperty("epgss.exedir"): "."); 
		properties = new Properties();
		
		InputStream in = new FileInputStream(new File(exeDirectory, "epgss.ini"));
		
		try {
			properties.load(in);
		} finally {
			in.close();
		}
	}
	
	private List<String> getPropertyList(String key, boolean mandatory) {
		return Utils.asList(getProperty(key, mandatory), ",");
	}
	
	private String getProperty(String key, boolean mandatory) {
		String property = Utils.nullTrim(properties.getProperty(key));
		if(mandatory && property == null)
			throw new IllegalArgumentException("Missing required property \"" + key + "\"");

		return property;
	}
	
	private void load(JSScript script, List<String> files) throws IOException {
		for(String file: files)
			load(script, file);
	}

	private void load(JSScript script, String file) throws IOException {
		script.load(new File(new File(exeDirectory, "js"), file));
	}
}
