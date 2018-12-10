
apogeeapp.app.importworkspace = {};

//=====================================
// UI Entry Point
//=====================================

/** Call this withthe appropriate generator - folder or folder function, for the given import type. */
apogeeapp.app.importworkspace.getImportCallback = function(app,fileAccessObject,componentGenerator) {
    return function() {
    
        //make sure there is not an open workspace
        if(!app.getWorkspaceUI()) {
            alert("There must be an open workspace to import a workspace.");
            return;
        }    
        
        var onOpen = function(err,app,workspaceData,fileMetadata) {
            if(err) {
                var actionResponse = new apogee.ActionResponse();
                var actionError = apogee.ActionError.processException(err,apogee.ActionError.ERROR_TYPE_USER,false);
                actionResponse.addError(actionError);
                apogeeapp.app.errorHandling.handleActionError(actionResponse);
            }
            else {
                //open workspace
                apogeeapp.app.importworkspace.openWorkspace(app,componentGenerator,workspaceData,fileMetadata);
            }
        }
        
        //use open file from open workspace
        fileAccessObject.openFile(app,onOpen);
    }
}

//=====================================
// Action
//=====================================


/** This method opens an workspace, from the text file. 
 * The result is returnd through the callback function rather than a return value,
 * since the function runs (or may run) asynchronously. */
apogeeapp.app.importworkspace.openWorkspace = function(app,componentGenerator,workspaceText,fileMetadata) {
    var actionResponse = new apogee.ActionResponse();
    var name;
    
    try {
        //make sure there is not an open workspace
        var workspaceUI = app.getWorkspaceUI();
        
        //parse the workspace json
        var workspaceJson = JSON.parse(workspaceText);

//I should verify the file type and format!  

        var referencesJson = workspaceJson.references;
        var loadReferencesPromise = workspaceUI.getLoadReferencesPromise(referencesJson);
    	
		//if we have to load links wait for them to load
        var newParentOptionsJson = {};
        newParentOptionsJson.name = workspaceJson.workspace.data.name;
        componentGenerator.appendWorkspaceChildren(newParentOptionsJson,workspaceJson.workspace.data.children);
        var serializedComponentsJson = workspaceJson.components;
		var workspaceImportDialogFunction = apogeeapp.app.addcomponent.getAddComponentCallback(app,componentGenerator,newParentOptionsJson,serializedComponentsJson);
        
        var linkLoadError = function(errorMsg) {
            alert("Error loading links: " + errorMsg);
        }
        
        var workspaceImportError2 = function(errorMsg) {
            var actionError = new apogee.ActionError(errorMsg,apogee.ActionError.ERROR_TYPE_USER,false);
            actionResponse.addError(actionError);
            apogeeapp.app.errorHandling.handleActionError(actionResponse);
        }
        
        //load links then import the workspace. On a link load error, continue with importing the workspace
        //we should not have a workspace import error from the workspaceImportDialogFunction since it should 
        //capture its own errors 
        loadReferencesPromise.catch(linkLoadError).then(workspaceImportDialogFunction).catch(workspaceImportError2);
    }
    catch(error) {
        var actionError = apogee.ActionError.processException(error,apogee.ActionError.ERROR_TYPE_APP,false);
        actionResponse.addError(actionError);
        apogeeapp.app.errorHandling.handleActionError(actionResponse);
    }
    
    return true;
}
//------------------------
// open from url
//------------------------

/** This method opens an workspace by getting the workspace file from the url. */
apogeeapp.app.importworkspace.openWorkspaceFromUrl = function(app,url) {
    var actionCompletedCallback = function(actionResponse) {
        if(!actionResponse.getSuccess()) {
            apogeeapp.app.errorHandling.handleActionError(actionResponse);
        }
    };
    
    apogeeapp.app.importworkspace.openWorkspaceFromUrlImpl(app,url,actionCompletedCallback);
}

/** This method opens an workspace by getting the workspace file from the url. */
apogeeapp.app.importworkspace.openWorkspaceFromUrlImpl = function(app,url,actionCompletedCallback) {
    var onDownload = function(workspaceText) {
        apogeeapp.app.importworkspace.openWorkspace(app,workspaceText,url,actionCompletedCallback);
    }
    
    var onFailure = function(msg) {
        var actionError = new apogee.ActionError(msg,apogee.ActionError.ERROR_TYPE_APP,null);
        var actionResponse = new apogee.ActionResponse();
        actionResponse.addError(actionError);
        actionCompletedCallback(actionResponse);
    }   
    apogeeapp.app.importworkspace.doRequest(url,onDownload,onFailure);   
}

/**
 * This is an http request for the worksheet data
 */
apogeeapp.app.importworkspace.doRequest= function(url,onDownload,onFailure) {
	var xmlhttp=new XMLHttpRequest();

    xmlhttp.onreadystatechange=function() {
        var msg;
        if (xmlhttp.readyState==4 && xmlhttp.status==200) {
            onDownload(xmlhttp.responseText);
        }
        else if(xmlhttp.readyState==4  && xmlhttp.status >= 400)  {
            msg = "Error in http request. Status: " + xmlhttp.status;
            onFailure(msg);
        }
    }
	
	xmlhttp.open("GET",url,true);
    xmlhttp.send();
}
