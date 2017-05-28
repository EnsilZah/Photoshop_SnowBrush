#include "json2.js"
//#include "PresetsManager.jsx"
function cID (inVal) { return charIDToTypeID(inVal);}
function sID (inVal) { return stringIDToTypeID(inVal);}

cTID = function(s) { return app.charIDToTypeID(s); };
sTID = function(s) { return app.stringIDToTypeID(s); };

var entryPrefix = "SB_Entry:"

var ToolPresets = new ToolPresetManager;





// Need to deprecate and replace this with CreateEntryThumbs
function createThumbs(inFolder)
{
    var inWidth = 256
    var inHeight = 64
    var inSize = 64
    
    var returnValue = {shortThumb:"", longThumb:""}
       

    createDoc("TMPBrush", inWidth, inHeight)
    setZoom(0)
    createCurve(inWidth,inHeight)
    setColor(0, 0, 100)     
    setBGColor(0, 0, 15)
    setBrushSize(Math.floor(0.9 * inHeight/2))
    strokePath (true);
    
    SavePNGDest(inFolder + "/" + "ThumbLong.png" )
  
    //Delete Path
    var desc79 = new ActionDescriptor();
    var ref19 = new ActionReference();
    ref19.putEnumerated( cID( "Path" ), cID( "Ordn" ), cID( "Trgt" ) );
    desc79.putReference( cID( "null" ), ref19 );
    executeAction( cID( "Dlt " ), desc79, DialogModes.NO );

    // Delete Layer contents
    var desc80 = new ActionDescriptor();
    var ref20 = new ActionReference();
    ref20.putProperty( cID( "Chnl" ), cID( "fsel" ) );
    desc80.putReference( cID( "null" ), ref20 );
    desc80.putEnumerated( cID( "T   " ), cID( "Ordn" ), cID( "Al  " ) );
    executeAction(  cID( "setd" ), desc80, DialogModes.NO );
    executeAction(cID( "Dlt " ), undefined, DialogModes.NO );

    //  ResizeCanvas
    var desc86 = new ActionDescriptor();
    desc86.putUnitDouble( cID( "Wdth" ), cID( "#Pxl" ), inSize );
    executeAction( cID( "CnvS" ), desc86, DialogModes.NO );

    createPoint(inSize/2,inSize/2)
    setBrushSize(inSize*0.8)
    resetBrush();
    strokePath (false);
            
            
    SavePNGDest(inFolder + "/" + "ThumbShort.png" )

    activeDocument.close(SaveOptions.DONOTSAVECHANGES);
}



function createEntryThumbs (inEntryList, inFolder_Entries)
{

    //store current tool/brush settings

    try
    {           
        var shortThumbSize = {width: 64, height: 64}
        var longThumbSize =  {width: 256, height: 64}
        var size = 64;
        
        createDoc("TMPBrush", longThumbSize.width, longThumbSize.height)
        setZoom(0);
        var longPathName = "curvePath"
        var shortPathName = "myPoint"

        createPoint(shortThumbSize.width /2 , shortThumbSize.height/2)
        createCurve(longThumbSize.width, longThumbSize.height)

        
        var longThumbs = [] 
        var shortThumbs = [] 
        
        for (var i = 0; i < inEntryList.length; i++)
        {
            setToolPreset(entryPrefix + inEntryList[i])            

            setColor(0, 0, 100)     
            setBGColor(0, 0, 15)

            var curLong = inEntryList[i]+"_long"
            var curShort = inEntryList[i]
            
            createLayer(curLong)
            selectPath("curvePath")
            setBrushSize(Math.floor(0.9 * size/2))      
            strokePath (true)
            longThumbs.push(curLong)
            
            createLayer(curShort)
            selectPath("myPoint")
            setBrushSize(size*0.8)
            resetBrush();        
            strokePath (false)
            shortThumbs.push(curShort)
            
            //report progress
        }


        for (var i = 0; i< longThumbs.length; i++)
        {
            isolateLayer (longThumbs[i])
            SavePNGDest (inFolder_Entries + "/"+ inEntryList[i] +"/ThumbLong.png")
            
        }

        cropLeft()

        for (var i = 0; i< shortThumbs.length; i++)
        {
        isolateLayer (shortThumbs[i])
        SavePNGDest (inFolder_Entries + "/"+ inEntryList[i] +"/ThumbShort.png")

        } 
           
        activeDocument.close(SaveOptions.DONOTSAVECHANGES);
    }
    catch(e)
    {alert(e)}
        //restore values
 
}

//returns a new entry ID with an incremented number from that highest existing one
function getEntryInc(inPath_Entries)
{
    var curFolder = Folder(inPath_Entries)
    var curEntries = curFolder.getFiles(function(f) { return (f instanceof Folder )}).sort();
   
    var newEntry;
      
    if (curEntries.length == 0)
    {
        newEntry = padZeroes(0,8);
    }
    else
    {
        newEntry =  padZeroes ( Number(curEntries[curEntries.length-1].name) + 1 , 8)  
    }

    return newEntry;
}


// Simplify TPL ceation/removal
function entriesFromABR (inPath_ABR, inPath_Entries)
{
    //store current colors
    var tmpFG = app.foregroundColor.rgb
    var tmpBG = app.backgroundColor.rgb


    setToolToBrush()
    var oldList =  getBrushPresetNames()
    loadABR(inPath_ABR)
    
    var newList =  getBrushPresetNames()   
    var toolList = ToolPresets.getPresetList()

    listNames = []
    listIDs = []
    listBrushFiles = []


    for (var i = oldList.length; i<newList.length;i++)
    {
        ToolPresets.removePresetByName("SB_Entry")

        var curEntry = getEntryInc(inPath_Entries)
        listIDs.push(curEntry)      
  
        //Create folder
        var curFolder =  Folder(inPath_Entries + "/" + curEntry)
        curFolder.create();      

        //Write metadata file
        var curBrushEntry = {entry:curEntry, name:newList[i], type:"BrushTool", colorFG:tmpFG, colorBG:tmpBG}    
        var entryFile = File(curFolder.fullName + "/Entry.json");      
        entryFile.open("w")
        entryFile.write(JSON.stringify(curBrushEntry))
        entryFile.close()

        //Create Tool Preset entry
        setBrushID(i+1)
        createTool(entryPrefix + curEntry);

    }

    createEntryThumbs(listIDs, inPath_Entries)

    //Export and remove Entries
    for (var i = listIDs.length-1; i >= 0 ; i--)
    {
        ToolPresets.renamePresetByName(entryPrefix + listIDs[i], "SB_Entry")
        var curIndex = ToolPresets.getLastIndexByName ("SB_Entry")    
        var curFolder =  Folder(inPath_Entries + "/" + listIDs[i])     
        ToolPresets.savePresetByIndex (curIndex, curFolder.fullName + "/Entry.tpl")    
        ToolPresets.removePresetByName("SB_Entry")
    }


    //Remove imported ABR
    for (var i = newList.length-1; i>=oldList.length;i--)
    {
        deleteBrush(i+1)
    }

    //restore current colors
    app.foregroundColor.rgb = tmpFG;
    app.backgroundColor.rgb = tmpBG

    return listIDs;
}

// Improvement TODO: Do brush loading without unloading first (new brushes are added after existing brush with duplicate name)
function entriesFromTPL (inPath_TPL,  inPath_Temp, inPath_Entries)
{
    //store current colors
    var tmpFG = app.foregroundColor.rgb
    var tmpBG = app.backgroundColor.rgb


    ToolPresets.removePresetByName("SB_Entry")    
    try
    {
        File(inPath_Temp + "/Temp.tpl").remove()
        ToolPresets.savePresets (inPath_Temp + "/Temp.tpl")
    }
    catch(e)
    {alert(e);}

    var mainPresetList = ToolPresets.getPresetList()
    ToolPresets.replacePresets (inPath_TPL)
    var importPresetList = ToolPresets.getPresetList()
    var importTypeList = ToolPresets.getTypeList();
 
    var listIDs = [];

   
   //reverse order because renaming is not updating tool preset properly
    for (var i = importPresetList.length-1; i >= 0; i--)
    {        
        //Skip non-brush presets
        if (importTypeList[i] != "Brush Tool") {continue;}

        //get new entry name
        var curEntry = getEntryInc(inPath_Entries)    
        listIDs.push(curEntry)      
  
        //Create folder
        var curFolder =  Folder(inPath_Entries + "/" + curEntry)
        curFolder.create();      

        //Sample color of tool preset
        ToolPresets.setPresetByName(importPresetList[i])
        var curFG = app.foregroundColor.rgb
        var curBG = app.backgroundColor.rgb


        //Write metadata file
        var curBrushEntry = {entry:curEntry, name:importPresetList[i], type:"BrushTool", colorFG:curFG, colorBG:curBG}    
        var entryFile = File(curFolder.fullName + "/Entry.json");      
        entryFile.open("w")
        entryFile.write(JSON.stringify(curBrushEntry))
        entryFile.close()

        var curIndex = ToolPresets.getIndexByName (importPresetList[i])   
        ToolPresets.renamePresetByIndex(curIndex, entryPrefix + curEntry)
    }

    createEntryThumbs(listIDs, inPath_Entries)
 

    //Export and remove Entries
    for (var i = listIDs.length-1; i >= 0 ; i--)
    {
        ToolPresets.renamePresetByName(entryPrefix + listIDs[i], "SB_Entry")
        var curIndex = ToolPresets.getLastIndexByName ("SB_Entry")    
        var curFolder =  Folder(inPath_Entries + "/" + listIDs[i])     
        ToolPresets.savePresetByIndex (curIndex, curFolder.fullName + "/Entry.tpl")    
        ToolPresets.removePresetByName("SB_Entry")
    }


    ToolPresets.replacePresets (inPath_Temp + "/Temp.tpl")

    //restore current colors
    app.foregroundColor.rgb = tmpFG;
    app.backgroundColor.rgb = tmpBG


    return listIDs.reverse();        
}


function createEntryFromExisting(inPath_Entries, inBrushID, inBrushName)
{
    //store current colors
    var tmpFG = app.foregroundColor.rgb
    var tmpBG = app.backgroundColor.rgb


    ToolPresets.removePresetByName("SB_Entry")
    var newEntry = getEntryInc(inPath_Entries);  
    var curFolder =  Folder(inPath_Entries +"/" + newEntry)
    curFolder.create();
    

    //if no brush name is supplied, generate from current
    if (inBrushName == undefined)
    {
        inBrushName = getCurrentBrushName()
    }

    //Write entry data
    var curBrushEntry = {entry:newEntry, name:inBrushName, type:"BrushTool", colorFG:tmpFG, colorBG:tmpBG}
    var entryFile = File(curFolder.fullName + "/Entry.json");      
    entryFile.open("w")
    entryFile.write(JSON.stringify(curBrushEntry))
    entryFile.close()

    //If no brush ID is supplied, use current selected brush
    if (inBrushID != undefined)
    {
        setBrushID (inBrushID)
    }

    createTool("SB_Entry");
   
    saveTool ("SB_Entry" ,curFolder.fullName + "/Entry.tpl");
    createThumbs(curFolder.fullName)    
 
    ToolPresets.removePresetByName("SB_Entry")


    //restore current colors
    app.foregroundColor.rgb = tmpFG;
    app.backgroundColor.rgb = tmpBG

    return newEntry;    
}







function ToolPresetManager()
{

    this.savePresets = function(inPath)
    {
        var desc1 = new ActionDescriptor();
        desc1.putPath( cID('null'), new File( inPath ) );
        var ref1 = new ActionReference();
        ref1.putProperty( cID('Prpr'), sID('toolPreset') );
        ref1.putEnumerated( cID('capp'), cID('Ordn'), cID('Trgt') );
        desc1.putReference( cID('T   '), ref1 );
        executeAction( cID('setd'), desc1, DialogModes.NO );
    }

    this.replacePresets = function(inPath)
    {
        var desc3 = new ActionDescriptor();
        var ref3 = new ActionReference();
        ref3.putProperty( cID('Prpr'), sID('toolPreset') );
        ref3.putEnumerated( cID('capp'), cID('Ordn'), cID('Trgt') );
        desc3.putReference( cID('null'), ref3 );
        desc3.putPath( cID('T   '), new File( inPath ) );
        executeAction( cID('setd'), desc3, DialogModes.NO );    
    }

    this.appendPresets = function (inPath)
    {
        var desc43 = new ActionDescriptor();
        var ref35 = new ActionReference();
        ref35.putProperty( cID('Prpr'), sID('toolPreset') );
        ref35.putEnumerated( cID('capp'), cID('Ordn'), cID('Trgt') );
        desc43.putReference( cID('null'), ref35 );
        desc43.putPath( cID('T   '), new File( inPath ) );
        desc43.putBoolean( cID('Appe'), true );
        executeAction( cID('setd'), desc43, DialogModes.NO );
    }

    this.getPresetList = function()
    {
        var ref = new ActionReference();    
        ref.putEnumerated( cID("capp"), cID("Ordn"), cID("Trgt") );    
        var appDesc = executeActionGet(ref);    
        var List = appDesc.getList(stringIDToTypeID('presetManager'));   
        var presetNames=[];   
        var list = List.getObjectValue(7).getList(cID('Nm  '));
        for (var i = 0; i < list.count; i++)
        {   
                var str = list.getString(i);
                presetNames.push(str);
        }
        return presetNames;    
    
    }

    this.getTypeList = function()
    {
        var ref = new ActionReference();    
        ref.putEnumerated( cID("capp"), cID("Ordn"), cID("Trgt") );    
        var appDesc = executeActionGet(ref);    
        var List = appDesc.getList(stringIDToTypeID('presetManager'));   
        var presetNames=[];   
        var list = List.getObjectValue(7).getList(cID('Ttl '));
        for (var i = 0; i < list.count; i++)
        {   
                var str = list.getString(i);
                presetNames.push(str);
        }
        return presetNames;    
    }

    this.setPresetByName = function (inName)
    {
        setToolToBrush();
        var desc3 = new ActionDescriptor();
        var ref1 = new ActionReference();
        var idtoolPreset = sID( "toolPreset" );
        ref1.putName( idtoolPreset, inName );
        desc3.putReference( cID( "null" ), ref1 );
        executeAction( cID( "slct" ), desc3, DialogModes.NO );
    }

    this.removePresetByName = function (name)
    {  
        var ref = new ActionReference();  
        ref.putEnumerated( cID("capp"), cID("Ordn"), cID("Trgt") );  
        var appDesc = executeActionGet(ref);  
      
        var pmList = appDesc.getList(sID("presetManager"));  
        var nameList = pmList.getObjectValue(7).getList(cID('Nm  '));  
      
        for (var index = 0; index < nameList.count; index++)
        {  
            if (nameList.getString(index) == name)
            {  
                index++;  
                var desc2 = new ActionDescriptor();  
                var list1 = new ActionList();  
                var ref2 = new ActionReference();  
                ref2.putIndex( sID( "toolPreset" ), index );  
                list1.putReference( ref2 );  
                desc2.putList( cID( "null" ), list1 );  
                executeAction( cID( "Dlt " ), desc2, DialogModes.NO );  
                break;  
            }  
        }  
    }  

    this.createPresetFromCurrent = function (inName)
    {
        var desc147 = new ActionDescriptor();
        var ref50 = new ActionReference();
        ref50.putClass( sID( "toolPreset" ) );
        desc147.putReference( cID( "null" ), ref50 );
        var ref51 = new ActionReference();
        ref51.putProperty( cID( "Prpr" ), cID( "CrnT" ) );
        ref51.putEnumerated( cID( "capp" ), cID( "Ordn" ), cID( "Trgt" ) );
        desc147.putReference( cID( "Usng" ), ref51 );
        desc147.putString(cID( "Nm  " ), inName );
        executeAction(cID( "Mk  " ), desc147, DialogModes.NO );
    }

    this.getIndexByName = function (inName)
    {
        var nameList = this.getPresetList ()
        
        for (var i = 0; i < nameList.length; i++)
        {
            if (nameList[i] == inName)
            { return i+1 }
        }
        return -1;
    }

    this.getLastIndexByName = function (inName)
    {
        var curIndex = -1
        var nameList = this.getPresetList ()
        
        for (var i = 0; i < nameList.length; i++)
        {
            if (nameList[i] == inName)
            {curIndex = i+1 }
        }
        return curIndex;
    }

    this.savePresetByIndex = function (index, filePath)
    {

        var file = new File(filePath)

        if (file.exists)
        {
            file.remove();
        }

        var desc = new ActionDescriptor();
        desc.putPath(cID('null'), file);
        var list = new ActionList();
        var ref = new ActionReference();
        ref.putIndex(sID('toolPreset'), index);
        list.putReference(ref);
        desc.putList(cID('T   '), list);
        executeAction(cID('setd'), desc, DialogModes.NO );
    }
    
    this.renamePresetByIndex = function(index, name)
    {
          var ref = new ActionReference();
          ref.putIndex(sID( "toolPreset" ), index);
          var desc = new ActionDescriptor();
          desc.putReference(cID('null'), ref);
          desc.putString(cID('T   '), name);
          executeAction(cID('Rnm '), desc, DialogModes.NO );
    }

    this.renamePresetByName = function(inName, inNewName)
    {
        var curIndex = this.getIndexByName(inName)
        this.renamePresetByIndex(curIndex, inNewName)
    }

    this.savePresetByName = function (inName, filePath)
    {
        var index = this.getIndexByName (inName);
        this.savePresetByIndex(index, filePath)
    }
    
    this.deleteToolPresets = function(toolPresets)
    { 
        var ref = new ActionReference(); 
        ref.putEnumerated( cID("capp"), cID("Ordn"), cID("Trgt") ); 
        var appDesc = executeActionGet(ref); 
        var pmList = appDesc.getList(sID("presetManager")); 
        var nameList = pmList.getObjectValue(7).getList(cID('Nm  ')); 
     
         for (var index = nameList.count-1; index >0 ; index--)
        { 
            var toolPreset = nameList.getString(index);
      
            for(var i = 0; i< toolPresets.length; i++)    
            {
                    if (toolPreset == toolPresets[i])
                    { 
                        var desc2 = new ActionDescriptor(); 
                        var list1 = new ActionList(); 
                        var ref2 = new ActionReference(); 
                        ref2.putIndex( sID( "toolPreset" ), index+1 ); 
                        list1.putReference( ref2 ); 
                        desc2.putList( cID( "null" ), list1 ); 
                        try   {executeAction( cID( "Dlt " ), desc2, DialogModes.NO ) }
                        catch (e) {}
                        break;
                    } 
                    else {} 
            }
        }
    }

}

function appendPreset (inFile)
{
    var desc322 = new ActionDescriptor();
    var ref231 = new ActionReference();
    ref231.putProperty( cID( "Prpr" ), sID( "toolPreset" ) );
    ref231.putEnumerated( cID( "capp" ), cID( "Ordn" ), cID( "Trgt" ) );
    desc322.putReference( cID( "null" ), ref231 );
    desc322.putPath( cID( "T   " ), new File( inFile ) );
    desc322.putBoolean( cID( "Appe" ), true );
    executeAction( cID( "setd" ), desc322, DialogModes.NO );
}




function getTPLFileList (inPath)
{
     /// INCLUDE .ABR
    var tmp = Folder(inPath).getFiles ("*.tpl")
    var fileList = []
    for (var i = 0; i < tmp.length; i++)
    {
        fileList.push(tmp[i].name.substring (0, tmp[i].name.toLowerCase().indexOf ('.tpl'))); 
    }
    return fileList
}



function padZeroes(num, size)
{
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}


// REMOVE
function setToolPreset(inName)
{
    setToolToBrush()
    var desc3 = new ActionDescriptor();
    var ref1 = new ActionReference();
    var idtoolPreset = sID( "toolPreset" );
    ref1.putName( idtoolPreset, inName );
    desc3.putReference( cID( "null" ), ref1 );
    executeAction( cID( "slct" ), desc3, DialogModes.NO );
}


function setEntryPath(inEntryPath, inColorFG, inColorBG)
{
    var tmpFG = app.foregroundColor.rgb
    var tmpBG = app.backgroundColor.rgb

    ToolPresets.removePresetByName("SB_Entry")
    ToolPresets.appendPresets(inEntryPath)
    setToolPreset("SB_Entry")
     
    if ((inColorFG != undefined) && (inColorFG != 'undefined'))
    {
         var curColorFG = JSON.parse(inColorFG)
         app.foregroundColor.rgb.red = curColorFG.red
         app.foregroundColor.rgb.green = curColorFG.green
         app.foregroundColor.rgb.blue = curColorFG.blue
    }
    else
    {
        app.foregroundColor.rgb = tmpFG
    }

    if ((inColorBG != undefined) && (inColorBG != 'undefined'))
    {
         var curColorBG = JSON.parse(inColorBG)
         app.backgroundColor.rgb.red = curColorBG.red
         app.backgroundColor.rgb.green = curColorBG.green
         app.backgroundColor.rgb.blue = curColorBG.blue
    }
    else
    {
        app.backgroundColor.rgb = tmpBG
    }


    ToolPresets.removePresetByName("SB_Entry")       
}


function setToolKeepPreset(inToolID)
{
    var createdPreset = false;
    try
    {
        saveBrushPreset("tmpSB")
        createdPreset = true;
    }
    catch(e){}


    setTool(inToolID)

    if (createdPreset)
    {
        var curIndex = getBrushPresetNames().length
        setBrushID(curIndex) 
        deleteBrush(curIndex)

    }



}


function saveBrushPreset(inName)
{
    var desc3163 = new ActionDescriptor();
    var ref609 = new ActionReference();
    ref609.putClass( cID( "Brsh" ) );
    desc3163.putReference( cID( "null" ), ref609 );
    desc3163.putString( cID( "Nm  " ), inName );
    var ref610 = new ActionReference();
    ref610.putProperty( cID( "Prpr" ), cID( "CrnT" ) );
    ref610.putEnumerated( cID( "capp" ), cID( "Ordn" ), cID( "Trgt" ) );
    desc3163.putReference( cID( "Usng" ), ref610 );
    executeAction( cID( "Mk  " ), desc3163, DialogModes.NO );
}


function setTool(inToolID)
{
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass( cID( inToolID ) );
    desc.putReference( cID( "null" ), ref );
    executeAction( cID( "slct" ), desc, DialogModes.NO );  
}

//REMOVE
function setToolToBrush()
{
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass( cID( "PbTl" ) );
    desc.putReference( cID( "null" ), ref );
    executeAction( cID( "slct" ), desc, DialogModes.NO );
}

function saveTool(inName, inFile)
{                   
    var curIndex = ToolPresets.getIndexByName (inName)   
    savePresetByIndex (curIndex, inFile)
}



function savePresetByIndex(inIndex, inPath)
{
    var desc248 = new ActionDescriptor();
    desc248.putPath( cID( "null" ), new File(inPath) );
    var list20 = new ActionList();
    var ref180 = new ActionReference();
    ref180.putIndex( sID( "toolPreset" ), inIndex );
    list20.putReference( ref180 );
    desc248.putList( cID( "T   " ), list20 );
    executeAction( cID( "setd" ), desc248, DialogModes.NO );
}


function setBrushByName(inName)
{
    var desc66532 = new ActionDescriptor();
    var ref4752 = new ActionReference();
    ref4752.putName( cID( "Brsh" ), inName );
    desc66532.putReference( cID( "null" ), ref4752 );
    executeAction( cID( "slct" ), desc66532, DialogModes.NO );
}


function setBrushID(inID)
{
    var desc66532 = new ActionDescriptor();
    var ref4752 = new ActionReference();
    ref4752.putIndex( cID( "Brsh" ), inID );
    desc66532.putReference( cID( "null" ), ref4752 );
    executeAction( cID( "slct" ), desc66532, DialogModes.NO );   
}

//REMOVE
function createTool(inName)
{
    var desc147 = new ActionDescriptor();
    var ref50 = new ActionReference();
    ref50.putClass( sID( "toolPreset" ) );
    desc147.putReference( cID( "null" ), ref50 );
    var ref51 = new ActionReference();
    ref51.putProperty( cID( "Prpr" ), cID( "CrnT" ) );
    ref51.putEnumerated( cID( "capp" ), cID( "Ordn" ), cID( "Trgt" ) );
    desc147.putReference( cID( "Usng" ), ref51 );
    desc147.putString(cID( "Nm  " ), inName );
    executeAction(cID( "Mk  " ), desc147, DialogModes.NO );

}

function getCurrentBrushName() 
{  
    var brsh = {};  
    var ref = new ActionReference();  
    ref.putEnumerated(charIDToTypeID("capp"), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));  
    var currentBrush = executeActionGet(ref).getObjectValue(stringIDToTypeID("currentToolOptions")).getObjectValue(charIDToTypeID('Brsh'));  

    try{return currentBrush.getString(charIDToTypeID("Nm  "));}
    catch(e)
    {return "unknown"}
}  

function getCurrentTool()
{  
    var ref = new ActionReference();  
    ref.putEnumerated( cID( "capp" ),  cID( "Ordn" ), cID( "Trgt" ) );  
    var desc1 = executeActionGet(ref);  
    desc1 = desc1.getList(sID("tool"));  
    desc1 = desc1.getEnumerationType(0);  
    desc1 = typeIDToStringID(desc1);  
    return desc1;  
}  


function SavePNGDest(inDestPath)
{    
    if (!File(inDestPath).parent.exists) {File(inDestPath).parent.create();} 
    
    pngFile = new File(inDestPath);
    pngSaveOptions = new PNGSaveOptions();
    pngSaveOptions.compression = 0;
    pngSaveOptions.interlaced = false;

    activeDocument.saveAs(pngFile, pngSaveOptions, true,Extension.LOWERCASE)
}




function selectPath(inName)
{
    var desc119 = new ActionDescriptor();
    var ref4 = new ActionReference();
    ref4.putName( cID( "Path" ), inName );
    desc119.putReference( cID( "null" ), ref4 );
    executeAction( cID( "slct" ), desc119, DialogModes.NO );
}

function createGroup(inName) 
{
    var desc151 = new ActionDescriptor();
    var ref26 = new ActionReference();
    ref26.putClass( sID('layerSection') );
    desc151.putReference( cID('null'), ref26 );
    var desc152 = new ActionDescriptor();
    desc152.putString( cID('Nm  '), inName );
    desc151.putObject( cID('Usng'), sID('layerSection'), desc152 );
    executeAction( cID('Mk  '), desc151, DialogModes.NO );
}


function createLayer(inName)
{
    var idMk = charIDToTypeID( "Mk  " );
    var desc161 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
    var ref29 = new ActionReference();
    var idLyr = charIDToTypeID( "Lyr " );
    ref29.putClass( idLyr );
    desc161.putReference( idnull, ref29 );
    var idUsng = charIDToTypeID( "Usng" );
    var desc162 = new ActionDescriptor();
    var idNm = charIDToTypeID( "Nm  " );
    desc162.putString( idNm, inName );
    var idLyr = charIDToTypeID( "Lyr " );
    desc161.putObject( idUsng, idLyr, desc162 );
    var idLyrI = charIDToTypeID( "LyrI" );
    desc161.putInteger( idLyrI, 7 );
    executeAction( idMk, desc161, DialogModes.NO );
}

function isolateLayer(inName)
{
    var idShw = charIDToTypeID( "Shw " );
    var desc322 = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
    var list41 = new ActionList();
    var ref156 = new ActionReference();
    var idLyr = charIDToTypeID( "Lyr " );
    ref156.putName( idLyr, inName );
    list41.putReference( ref156 );
    desc322.putList( idnull, list41 );
    var idTglO = charIDToTypeID( "TglO" );
    desc322.putBoolean( idTglO, true );
    executeAction( idShw, desc322, DialogModes.NO );
}

function cropLeft()
{
    var desc328 = new ActionDescriptor();
    desc328.putUnitDouble( cID( "Wdth" ), cID( "#Pxl" ), 64.000000 );
    desc328.putEnumerated( cID( "Hrzn" ), cID( "HrzL" ), cID( "Left" ) );
    executeAction( cID( "CnvS" ), desc328, DialogModes.NO );    
}

function resetBrush()
{
   SetPaintBrush("normal",100,100);

    function SetPaintBrush(mode,opacity,flow) 
    {  
        var desc1 = new ActionDescriptor();  
        var ref = new ActionReference();   
        ref.putClass( sID( "paintbrushTool" ) );  
        desc1.putReference( sID( "null" ), ref );  
        var desc2 = new ActionDescriptor();  
        desc2.putUnitDouble( sID( "opacity" ), sID( "percentUnit" ), opacity );  
        desc2.putEnumerated( sID( "mode" ), sID( "blendModel" ), sID( mode ) );  
        desc2.putUnitDouble( sID( "flow" ), sID( "percentUnit" ), flow );  
        desc2.putBoolean( sID( "useColorDynamics" ), false );  
        desc2.putBoolean( sID( "useTipDynamics" ), false );  
        desc2.putBoolean( sID( "useScatter" ), false );  
        desc2.putBoolean( sID( "usePressureOverridesOpacity" ), false );  
        desc2.putBoolean( sID( "usePressureOverridesSize" ), false );  
        desc2.putBoolean( sID( "repeat" ), false );  
        desc1.putObject( sID( "to" ), sID( "null" ), desc2 );  
        executeAction( sID( "set" ), desc1, DialogModes.NO );  
    }  
}

function strokePath(inSimPressure)
{
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( cID( "Path" ),  cID( "Ordn" ), cID( "Trgt" ));
    desc.putReference( cID( "null" ), ref );
    desc.putClass( cID( "Usng" ), cID( "PbTl" ) );
    desc.putBoolean( cID( "Prs " ), inSimPressure );
    executeAction(  cID( "Strk" ), desc, DialogModes.NO );
}

function createDoc(inName, inWidth, inHeight)
{
    var desc1 = new ActionDescriptor();
    var desc2 = new ActionDescriptor();
    desc2.putBoolean(sID("artboard"), false);
    desc2.putString(cID('Nm  '), inName);
    desc2.putClass(cID('Md  '), sID("RGBColorMode"));
    desc2.putUnitDouble(cID('Wdth'), cID('#Rlt'), inWidth);
    desc2.putUnitDouble(cID('Hght'), cID('#Rlt'), inHeight);
    desc2.putUnitDouble(cID('Rslt'), cID('#Rsl'), 72);
    desc2.putDouble(sID("pixelScaleFactor"), 1);
    desc2.putEnumerated(cID('Fl  '), cID('Fl  '), cID('Trns'));
    desc2.putInteger(cID('Dpth'), 8);
    desc2.putString(sID("profile"), "none");
    desc1.putObject(cID('Nw  '), cID('Dcmn'), desc2);
    executeAction(cID('Mk  '), desc1, DialogModes.NO);
}

function setColor(inH, inS, inB)
{
    var desc1 = new ActionDescriptor();
    var ref1 = new ActionReference();
    ref1.putProperty(cID('Clr '), cID('FrgC'));
    desc1.putReference(cID('null'), ref1);
    var desc2 = new ActionDescriptor();
    desc2.putUnitDouble(cID('H   '), cID('#Ang'), inH);
    desc2.putDouble(cID('Strt'), inS);
    desc2.putDouble(cID('Brgh'), inB);
    desc1.putObject(cID('T   '), cID('HSBC'), desc2);
    desc1.putString(cID('Srce'), "colorPickerPanel");
    executeAction(cID('setd'), desc1, DialogModes.NO);
}

function setBGColor(inH, inS, inB)
{
    var desc1 = new ActionDescriptor();
    var ref1 = new ActionReference();
    ref1.putProperty(cID('Clr '), sID('backgroundColor'));
    desc1.putReference(cID('null'), ref1);
    var desc2 = new ActionDescriptor();
    desc2.putUnitDouble(cID('H   '), cID('#Ang'), inH);
    desc2.putDouble(cID('Strt'), inS);
    desc2.putDouble(cID('Brgh'), inB);
    desc1.putObject(cID('T   '), cID('HSBC'), desc2);
    desc1.putString(cID('Srce'), "colorPickerPanel");
    executeAction(cID('setd'), desc1, DialogModes.NO);
}

function setZoom(inZoom)
{
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putProperty( cID('Prpr'), sID("zoom") );
    ref.putEnumerated( cID('Dcmn'), cID('Ordn'), cID('Trgt') );
    desc.putReference( cID('null'), ref );
    var toDesc = new ActionDescriptor();
    toDesc.putUnitDouble(cID('Zm  '), cID('#Prc'), inZoom);
    desc.putObject( cID('T   '), cID('Zm  '), toDesc );
    executeAction( cID('setd'), desc, DialogModes.NO );
}

function setBrushSize(inSize)
{
    var desc1 = new ActionDescriptor();
    var ref1 = new ActionReference();
    ref1.putEnumerated(cID('Brsh'), cID('Ordn'), cID('Trgt'));
    desc1.putReference(cID('null'), ref1);
    var desc2 = new ActionDescriptor();
    desc2.putUnitDouble(sID("masterDiameter"), cID('#Pxl'), inSize);
    desc1.putObject(cID('T   '), cID('Brsh'), desc2);
     executeAction(cID('setd'), desc1, DialogModes.NO);
}

function createCurve(inWidth, inHeight)
{    
    var lineArray = new Array();
    lineArray[0] = new PathPointInfo;
    lineArray[0].kind = PointKind.CORNERPOINT;
    lineArray[0].anchor = [inWidth/16, inHeight/2];//top left
    lineArray[0].leftDirection = lineArray[0].anchor;
    lineArray[0].rightDirection = lineArray[0].anchor;
    
    
    lineArray[1] = new PathPointInfo;
    lineArray[1].kind = PointKind.CORNERPOINT;
    lineArray[1].anchor = [inWidth/4,inHeight/4];//top left
    lineArray[1].leftDirection = [inWidth/4 + inWidth/8, inHeight/4];
    lineArray[1].rightDirection = [inWidth/4 - inWidth/8, inHeight/4];

    lineArray[2] = new PathPointInfo;
    lineArray[2].kind = PointKind.CORNERPOINT;
    lineArray[2].anchor = [inWidth/4*3, inHeight/4 * 3];//top left
    lineArray[2].leftDirection = [inWidth/4*3 + inWidth/8, inHeight/4 * 3];
    lineArray[2].rightDirection = [inWidth/4*3 - inWidth/8,  inHeight/4 *3 ];

    lineArray[3] = new PathPointInfo;
    lineArray[3].kind = PointKind.CORNERPOINT;
    lineArray[3].anchor = [inWidth /16 * 15 , inHeight/2];//top left
    lineArray[3].leftDirection = lineArray[3].anchor;
    lineArray[3].rightDirection = lineArray[3].anchor;

    var lineSubPathArray = new Array();
    lineSubPathArray[0] = new SubPathInfo();
    lineSubPathArray[0].operation = ShapeOperation.SHAPEXOR;
    lineSubPathArray[0].closed = false;
    lineSubPathArray[0].entireSubPath = lineArray;
    // now make the path
    return activeDocument.pathItems.add("curvePath", lineSubPathArray);
}

function createPoint(inX, inY)
{
    inX = inX/(app.activeDocument.resolution/72)
    inY = inY/(app.activeDocument.resolution/72)
    
    var lineArray = new Array();
    lineArray[0] = new PathPointInfo;
    lineArray[0].kind = PointKind.CORNERPOINT;
    lineArray[0].anchor = [inX,inY];//top left
    lineArray[0].leftDirection = lineArray[0].anchor;
    lineArray[0].rightDirection = lineArray[0].anchor;

    var lineSubPathArray = new Array();
    lineSubPathArray[0] = new SubPathInfo();
    lineSubPathArray[0].operation = ShapeOperation.SHAPEXOR;
    lineSubPathArray[0].closed = false;
    lineSubPathArray[0].entireSubPath = lineArray;
    // now make the path
    return activeDocument.pathItems.add("myPoint", lineSubPathArray);
}

function loadABR(inPath)
{
    var desc1 = new ActionDescriptor();
    var ref1 = new ActionReference();
    ref1.putProperty( cID('Prpr'), cID('Brsh') );
    ref1.putEnumerated( cID('capp'), cID('Ordn'), cID('Trgt') );
    desc1.putReference( cID('null'), ref1 );
    desc1.putPath( cID('T   '), new File( inPath ) );
    desc1.putBoolean( cID('Appe'), true );
    executeAction( cID('setd'), desc1, DialogModes.NO );
};

function getBrushPresetNames() 
{
    var ref = new ActionReference();    
    ref.putEnumerated( cID("capp"), cID("Ordn"), cID("Trgt") );    
    var appDesc = executeActionGet(ref);    
    var List = appDesc.getList(stringIDToTypeID('presetManager'));   
    var presetNames=[];   
    var list = List.getObjectValue(0).getList(cID('Nm  '));
    for (var i = 0; i < list.count; i++)

    {   
        var str = list.getString(i);
        presetNames.push(str);
    }
    return presetNames;
}

function deleteBrush(inID)
{
    var desc1 = new ActionDescriptor();
    var ref1 = new ActionReference();
    ref1.putIndex( cID('Brsh'), inID );
    desc1.putReference( cID('null'), ref1 );
    executeAction( cID('Dlt '), desc1, DialogModes.NO );
}

 function pickColor()
 {
    tmpColor =  app.foregroundColor.rgb
    var cP = showColorPicker()  
    if(!cP) return null;
    outColor = foregroundColor.rgb;
    app.foregroundColor.rgb = tmpColor
    return {red:outColor.red, green:outColor.green ,blue:outColor.blue }
}  


function setToolToBrush()
{
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass( cID( "PbTl" ) );
    desc.putReference( cID( "null" ), ref );
    executeAction( cID( "slct" ), desc, DialogModes.NO );
}