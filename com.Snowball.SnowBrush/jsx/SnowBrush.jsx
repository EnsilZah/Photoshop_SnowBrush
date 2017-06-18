#include "json2.js"

function cID (inVal) { return charIDToTypeID(inVal);}
function sID (inVal) { return stringIDToTypeID(inVal);}

cTID = function(s) { return app.charIDToTypeID(s); };
sTID = function(s) { return app.stringIDToTypeID(s); };

var ToolPresets = new ToolPresetManager;


function RunFromJSON(inCommand, inJSONData)
{
    return JSON.stringify(eval(inCommand)(JSON.parse(inJSONData)))
}

//returns a new entry ID with an incremented number from that highest existing one
function getEntryInc(inPath_Entries)
{
    var curFolder = Folder(inPath_Entries)
    var curEntries = curFolder.getFiles(function(f) { return (f instanceof Folder )}).sort();
   
    var newEntry;
      
    if (curEntries.length == 0)
    { newEntry = padZeroes(0,8); }
    else
    { newEntry =  padZeroes ( Number(curEntries[curEntries.length-1].name) + 1 , 8) }

    return newEntry;
}


/**********************************************************
************************NEW********************************
**********************************************************/
function entriesFromTPL (inData)
{
    //store current colors
    var tmpFG = app.foregroundColor.rgb
    var tmpBG = app.backgroundColor.rgb   
    
    var listOld = getBrushPresetNames()


    var reloadTemp = false;
    try
    {
        File(inData.pathTemp + "/Temp.tpl").remove()
        ToolPresets.savePresets (inData.pathTemp + "/Temp.tpl")
        reloadTemp = true;

    }catch(e) {/*List is empty*/}


    var mainPresetList = ToolPresets.getPresetList()
    ToolPresets.replacePresets (inData.pathSource)
    var importPresetList = ToolPresets.getPresetList()

    var listEntries = []
    for (var i = 0; i < importPresetList.length; i++)
    {    
        ToolPresets.setPresetByName(importPresetList[i])

        try{
            var curEntry = {name: importPresetList[i], FG: app.foregroundColor.rgb, BG:app.backgroundColor.rgb}
            createBrushPreset(importPresetList[i])
            listEntries.push(curEntry)
        }catch(e){/*In case tool is not convertible to brush*/}
    }

    if (reloadTemp) {ToolPresets.replacePresets (inData.pathTemp + "/Temp.tpl")}
    else {/*Remove all tools*/}





    var listNew =  getBrushPresetNames()
    var listOut = []
    var listIDs = []

    for (var i = listOld.length; i < listNew.length; i++)
    {
        var curEntry = {name:listNew[i], index:i+1}

        renameBrushPreset(i+1, "SB_Entry")


        var newEntry = getEntryInc(inData.pathEntries);  
        var curFolder =  Folder(inData.pathEntries +"/" + newEntry)
        curFolder.create();
        curEntry.pathDest = curFolder;
        curEntry.id = newEntry;
        listIDs.push(newEntry)

        //Write entry data
        var curBrushEntry = {entry:newEntry, name:listNew[i], type:"BrushTool", colorFG:tmpFG, colorBG:tmpBG}
        var entryFile = File(curFolder.fullName + "/Entry.json");      
        entryFile.open("w")
        entryFile.write(JSON.stringify(curBrushEntry))
        entryFile.close()
 
        var brushIndex = getBrushPresetNames().length
        var pathDest = curFolder.fullName + "/Entry.abr"
        saveABR (i+1, pathDest) 
        
        listOut.push(curEntry)
    }
   createEntryThumbs(listOut)  

    for (var i = listNew.length - listOld.length; i > 0; i--)
    {
            deleteBrush(listOld.length+1)
    }
    
    return(listIDs)
}




// inData = {pathSource:"", pathEntries:""}
function entriesFromABR (inData)
{
    //store current colors
    var tmpFG = app.foregroundColor.rgb
    var tmpBG = app.backgroundColor.rgb   
    
    var listOld = getBrushPresetNames()
    loadABR(inData.pathSource)
    var listNew =  getBrushPresetNames()
    var listOut = []
    var listIDs = []

    for (var i = listOld.length; i < listNew.length; i++)
    {
        var curEntry = {name:listNew[i], index:i+1}

        renameBrushPreset(i+1, "SB_Entry")


        var newEntry = getEntryInc(inData.pathEntries);  
        var curFolder =  Folder(inData.pathEntries +"/" + newEntry)
        curFolder.create();
        curEntry.pathDest = curFolder;
        curEntry.id = newEntry;
        listIDs.push(newEntry)

        //Write entry data
        var curBrushEntry = {entry:newEntry, name:listNew[i], type:"BrushTool", colorFG:tmpFG, colorBG:tmpBG}
        var entryFile = File(curFolder.fullName + "/Entry.json");      
        entryFile.open("w")
        entryFile.write(JSON.stringify(curBrushEntry))
        entryFile.close()
 
        var brushIndex = getBrushPresetNames().length
        var pathDest = curFolder.fullName + "/Entry.abr"
        saveABR (i+1, pathDest) 
        
        listOut.push(curEntry)
    }
   createEntryThumbs(listOut)  

    for (var i = listNew.length - listOld.length; i > 0; i--)
    {
            deleteBrush(listOld.length+1)
    }
    
    return(listIDs)
}

//inPath_Entries, inBrushID, inBrushName
function createEntryFromExisting(inData)
{
    //store current colors
    var tmpFG = app.foregroundColor.rgb
    var tmpBG = app.backgroundColor.rgb

    var newEntry = getEntryInc(inData.pathEntries);  
    var curFolder =  Folder(inData.pathEntries +"/" + newEntry)
    curFolder.create();
    
    //if no brush name is supplied, generate from current
    if (inData.brushName == undefined)
    { inData.brushName = getCurrentBrushName(); }

    //Write entry data
    var curBrushEntry = {entry:newEntry, name:inData.brushName, type:"BrushTool", colorFG:tmpFG, colorBG:tmpBG}
    var entryFile = File(curFolder.fullName + "/Entry.json");      
    entryFile.open("w")
    entryFile.write(JSON.stringify(curBrushEntry))
    entryFile.close()

    //If no brush ID is supplied, use current selected brush
    if (inData.brushID != undefined)
    { setBrushID (inData.brushID) }

    createBrushPreset("SB_Entry")
    var brushIndex = getBrushPresetNames().length
    var pathDest = curFolder.fullName + "/Entry.abr"
    saveABR (brushIndex, pathDest)

    curEntry = [{index:brushIndex, pathDest:inData.pathEntries + "/" + newEntry + "/"}]
    createEntryThumbs(curEntry)    

    deleteBrush(brushIndex)

    //restore current colors
    app.foregroundColor.rgb = tmpFG;
    app.backgroundColor.rgb = tmpBG

    return [newEntry]; 
}



// entryList[i] = {index:..., id:..., pathDest:..., }
function createEntryThumbs (inEntryList)
{
    //store current tool/brush settings
    var shortThumbSize = {width: 64, height: 64}
    var longThumbSize =  {width: 256, height: 64}
    var size = 64;
    
    createDoc("TMPBrush", longThumbSize.width, longThumbSize.height)
    setZoom(0);
    var longPathName = "curvePath"
    var shortPathName = "myPoint"

    createPoint(shortThumbSize.width /2 , shortThumbSize.height/2)
    createCurve(longThumbSize.width, longThumbSize.height)
 
    thumbList = []
    setToolToBrush();

    for (var i = 0; i < inEntryList.length; i++)
    {
        var curEntry = {data: inEntryList[i]}
        setBrushID(inEntryList[i].index)        

        setColor(0, 0, 100)     
        setBGColor(0, 0, 15)
       

        var layerLongName = inEntryList[i].index+"_ThumbLong"
        createLayer(layerLongName)
        selectPath("curvePath")
        setBrushSize(Math.floor(0.9 * size/2))      
        strokePath (true)
        curEntry.layerLongName = layerLongName;

        var layerShortName = inEntryList[i].index+"_ThumbShort"
        createLayer(layerShortName)
        selectPath("myPoint")
        setBrushSize(size*0.8)
        resetBrush();        
        strokePath (false)
        curEntry.layerShortName = layerShortName;

        thumbList.push(curEntry)
        //report to progress bar
    }

    for (var i = 0; i< thumbList.length; i++)
    {
        isolateLayer (thumbList[i].layerLongName)
        SavePNGDest (thumbList[i].data.pathDest +"/ThumbLong.png")
    }

    cropLeft()

    for (var i = 0; i< thumbList.length; i++)
    {
        isolateLayer (thumbList[i].layerShortName)
        SavePNGDest (thumbList[i].data.pathDest +"/ThumbShort.png")
    } 
       
    activeDocument.close(SaveOptions.DONOTSAVECHANGES);
    //restore values
}


function setEntryPath(inEntryPath, inColorFG, inColorBG)
{

    var tmpFG = app.foregroundColor.rgb
    var tmpBG = app.backgroundColor.rgb


    loadABR(inEntryPath)
    var listBrushes = getBrushPresetNames()  
    // add test for which tool is currently selected and select brush if it's a non-brushable tool
    setBrushID(listBrushes.length)

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

    deleteBrush(listBrushes.length)
    //remove previous "SB_Entry" brushes in case of crash while running or something
}

function setToolKeepPreset(inToolID)
{
    var createdPreset = false;
    try
    {
        createBrushPreset("tmpSB")
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




/**********************************************************
************************END OF NEW*************************
**********************************************************/



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


/************************** GENERAL **************************/
/*************************************************************/

function padZeroes(num, size)
{
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

/************************** END GENERAL **********************/



/************************** PS FUNCTIONS **************************/
/******************************************************************/

function createBrushPreset(inName)
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

function saveABR (inIndex, inPath)
{
    var desc758 = new ActionDescriptor();
    desc758.putPath( cID( "null" ), new File( inPath ) );
    var list81 = new ActionList();
    var ref366 = new ActionReference();
    ref366.putIndex( cID( "Brsh" ), inIndex );
    list81.putReference( ref366 );
    desc758.putList( cID( "T   " ), list81 );
    executeAction( cID( "setd" ), desc758, DialogModes.NO );
}    


function renameBrushPreset(inIndex, inName)
{
    var desc21 = new ActionDescriptor();
    var ref4 = new ActionReference();
    ref4.putIndex( cID( "Brsh" ), inIndex );
    desc21.putReference( cID( "null" ), ref4 );
    desc21.putString( cID( "T   " ), inName );
    executeAction( cID( "Rnm " ), desc21, DialogModes.NO );
}


function setTool(inToolID)
{
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass( cID( inToolID ) );
    desc.putReference( cID( "null" ), ref );
    executeAction( cID( "slct" ), desc, DialogModes.NO );  
}

function setBrushID(inID)
{
    var desc66532 = new ActionDescriptor();
    var ref4752 = new ActionReference();
    ref4752.putIndex( cID( "Brsh" ), inID );
    desc66532.putReference( cID( "null" ), ref4752 );
    executeAction( cID( "slct" ), desc66532, DialogModes.NO );   
}

function setToolToBrush()
{
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putClass( cID( "PbTl" ) );
    desc.putReference( cID( "null" ), ref );
    executeAction( cID( "slct" ), desc, DialogModes.NO );
}

/************************** END PS FUNCTIONS **********************/





/************************** CLEANUP **************************/
/*************************************************************/


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

 function pickColor(inData)
 {
    tmpColor =  app.foregroundColor.rgb

    try
    {
        var curColor = inData.isFG?inData.colorFG:inData.colorBG
         app.foregroundColor.rgb.red = curColor.red
         app.foregroundColor.rgb.green = curColor.green
         app.foregroundColor.rgb.blue = curColor.blue
    }
    catch(e){}

    var cP = showColorPicker()
    outColor = foregroundColor.rgb;
    app.foregroundColor.rgb = tmpColor  
    if(!cP) return null;

    return outColor
}  

/************************** END CLEANUP **********************/
