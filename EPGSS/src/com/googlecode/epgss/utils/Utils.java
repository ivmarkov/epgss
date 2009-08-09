package com.googlecode.epgss.utils;

import java.util.ArrayList;
import java.util.List;
import java.util.StringTokenizer;

public class Utils {
	private Utils() {} // Singleton

    public static String trim(String str) {
        return str != null? str.trim(): str;
    }
    
    public static String nullTrim(String str) {
        if(str != null) {
            str = str.trim();
            if(str.length() == 0)
                str = null;
        }

        return str;
    }
    
    public static List<String> asList(String csString, String delimiter) {
        List<String> elements = new ArrayList<String>();
        
        if(csString != null) {
            StringTokenizer st = new StringTokenizer(csString, delimiter);
            while(st.hasMoreTokens())
                elements.add(st.nextToken().trim());
        }
        
        return elements;
    }
}
