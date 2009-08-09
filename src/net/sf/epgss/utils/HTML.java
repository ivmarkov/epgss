package net.sf.epgss.utils;

import java.io.IOException;
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.net.URL;

import javax.xml.parsers.ParserConfigurationException;

import org.htmlcleaner.CleanerProperties;
import org.htmlcleaner.HtmlCleaner;
import org.htmlcleaner.PrettyXmlSerializer;

public class HTML {
	private HTML() {} // Singleton
	
	public static String getHTML(Reader reader) throws IOException, ParserConfigurationException {
// NEKO HTML
//        DOMParser parser = new DOMParser();
//        parser.setFeature("http://xml.org/sax/features/namespaces", true);
//        parser.parse(new XMLInputSource(null, null, null, reader, null));
//        return parser.getDocument();

		HtmlCleaner htmlCleaner = new HtmlCleaner();
		CleanerProperties props = htmlCleaner.getProperties();
		props.setAdvancedXmlEscape(true);

		return new PrettyXmlSerializer(props).getXmlAsString(htmlCleaner.clean(reader));
	}
	
	public static String getHTML(URL url) throws UnsupportedEncodingException, IOException, ParserConfigurationException {
		return getHTML(url, null/*charset*/);
	}

	public static String getHTML(URL url, String charset) throws UnsupportedEncodingException, IOException, ParserConfigurationException {
		Reader reader = Net.open(url, charset);
		
		try {
			return getHTML(reader);
		} finally {
			reader.close();
		}
	}
}
