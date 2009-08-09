package net.sf.epgss.utils;

public class Log {
	private Log() {} // Singleton

	public static void log(String str) {
		System.err.println(str);
	}
}
