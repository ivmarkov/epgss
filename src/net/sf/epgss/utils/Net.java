package net.sf.epgss.utils;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;

public class Net {
	private Net() {} // Singleton
	
	public static java.io.Reader open(URL url) throws UnsupportedEncodingException, IOException {
		return open(url, null);
	}
	
	public static java.io.Reader open(URL url, String charset) throws UnsupportedEncodingException, IOException {
		URLConnection con = url.openConnection();
		con.setAllowUserInteraction(false);
		con.setReadTimeout(60*1000/*ms*/);
		
		con.connect();
		
		if(charset == null && con instanceof HttpURLConnection) {
			HttpURLConnection httpCon = (HttpURLConnection)con;
			charset = httpCon.getContentEncoding();
		}
		
		if(charset == null)
			charset = "UTF-8";
		
		return new InputStreamReader(con.getInputStream(), charset);
	}
	
}
