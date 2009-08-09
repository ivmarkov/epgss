package com.googlecode.epgss;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.ImporterTopLevel;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.ScriptableObject;

class JSScript {
	private ScriptableObject scope;
	
	public JSScript() {
		this.scope = createScope();
	}

	public void load(File source) throws IOException {
		loadScript(source, scope);
	}
	
	@SuppressWarnings("unchecked")
	public <T> T call(String name, Class<T> resultClass, Object... args) {
		enterContext();
		
		try {
			Object result = call(name, args);
			if(result != null)
				return (T)Context.jsToJava(result, resultClass);
			else
				return null;
		} finally {
			Context.exit();
		}
	}
	
	public Object call(String name, Object... args) {
		Context context = enterContext();
		
		try {
			Object[] jsArgs = new Object[args.length];
			for(int i = 0; i < args.length; i++)
				jsArgs[i] = Context.javaToJS(args[i], scope);
			
			Function function = (Function)scope.get(name, scope);
			return function.call(context, scope, scope, jsArgs);
		} finally {
			Context.exit();
		}
	}
	
	private static ScriptableObject createScope() {
		Context context = enterContext();
		
		try {
			return new ImporterTopLevel(context); //context.initStandardObjects();
		} finally {
			Context.exit();
		}
	}

	private static Script loadScript(File source, ScriptableObject scope) throws IOException {
		Script script = compileScript(source.getName(), loadTextFile(source));
		initializeScript(script, scope);

		return script;
	}
	
	private static Script compileScript(String name, String source) {
		Context context = enterContext();
		
		try {
			return context.compileString(source, name, 1, null);
		} finally {
			Context.exit();
		}
	}
	
	private static void initializeScript(Script script, ScriptableObject scope) {
		Context context = enterContext();
		
		try {
			script.exec(context, scope);
		} finally {
			Context.exit();
		}
	}
	
	private static String loadTextFile(File file) throws IOException {
		Reader reader = new FileReader(file);
		
		try {
			StringBuilder code = new StringBuilder();
			
			char[] buf = new char[16384];
			for(int read = -1; (read = reader.read(buf)) >= 0;)
				code.append(buf, 0, read);
			
			return code.toString();
		} finally {
			reader.close();
		}
	}
	
	private static Context enterContext() {
		return ContextFactory.getGlobal().enterContext();
	}
}
