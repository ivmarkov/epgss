function strStartsWith(str, ending) {
	return str.length >= ending.length && str.substring(0, ending.length) == ending;
}

function strEndsWith(str, ending) {
	return str.length >= ending.length && str.substring(str.length - ending.length) == ending;
}

function pathConcat(path1, path2) {
	if(path1.length > 0 && path1.charAt(path.length - 1) == '/')
		path1 = path1.substring(0, path1.length - 1);
		
	if(path2.length == 0 || path2.charAt(0) != '/')
		path2 = "/" + path2;

	return path1 + path2;
}

function pathParent(path) {
	if(path == "" || path == "/")
		return null;
	
	if(path.lastIndexOf('/') == -1)
		return "";
	else
		return path.substring(0, path.lastIndexOf('/'));
}

function serveXML(xml, response) {
	response.setCharacterEncoding("UTF-8");
	response.setContentType("text/plain");
	//response.setContentType("text/xml");
	
	var writer = response.getWriter();
	
	try {
		//writer.println(((typeof xml) == "string")? xml: xml.toXMLString());	
		writer.println(xml);	
	} finally {
		writer.flush();
	}
}
