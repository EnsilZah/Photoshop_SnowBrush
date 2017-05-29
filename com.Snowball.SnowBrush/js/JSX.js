var csInterface = new CSInterface();

/**
 * Load JSX file into the scripting context of the product. All the jsx files in 
 * folder [ExtensionRoot]/jsx will be loaded.
 */
function loadJSX() 
{
    var csInterface = new CSInterface();
    var extensionRoot = csInterface.getSystemPath(SystemPath.EXTENSION) + "/jsx/";
    csInterface.evalScript('$._ext.evalFiles("' + extensionRoot + '")');
}


//fileName is a String (with the .jsx extension included)
function loadJSX(fileName) 
{
    var csInterface = new CSInterface();
    var extensionRoot = csInterface.getSystemPath(SystemPath.EXTENSION) + "/jsx/";
    csInterface.evalScript('$.evalFile("' + extensionRoot + fileName + '")');

}

//fileName is a String (with the .jsx extension included)
function runJSX(fileName) 
{
    var csInterface = new CSInterface();
    var extensionRoot = csInterface.getSystemPath(SystemPath.EXTENSION);
    csInterface.evalScript('$.evalFile("' + extensionRoot+ "/"+ fileName + '")');
}

// Handles JSON communication between JS and JSX
function JSONtoJSX (inCommand, inData, inCallback)
{
	var jsonCommand = "RunFromJSON('" + inCommand + "','"+ JSON.stringify(inData) +"');"  
	var e = csInterface.evalScript (jsonCommand, function(retVal) {inCallback(JSON.parse(retVal))});
}